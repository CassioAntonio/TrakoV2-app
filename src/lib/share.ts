import type { Activity } from "@/types/trako";
import { BRANDING, bodyFont, displayFont } from "@/lib/branding";
import { formatKm, formatDuration, formatNumber, formatDate } from "@/lib/format";

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  activity: Activity,
  box: { x: number; y: number; w: number; h: number },
) {
  const pts = activity.track.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
  if (pts.length < 2) return;
  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLng = Math.max(maxLng - minLng, 1e-6);
  const scale = Math.min(box.w / spanLng, box.h / spanLat);
  const offX = box.x + (box.w - spanLng * scale) / 2;
  const offY = box.y + (box.h - spanLat * scale) / 2;
  const px = (p: { lat: number; lng: number }) => ({
    x: offX + (p.lng - minLng) * scale,
    y: offY + (maxLat - p.lat) * scale,
  });

  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.strokeStyle = BRANDING.colors.accentSoft;
  ctx.lineWidth = 34;
  ctx.beginPath();
  pts.forEach((p, i) => {
    const c = px(p);
    if (i === 0) ctx.moveTo(c.x, c.y);
    else ctx.lineTo(c.x, c.y);
  });
  ctx.stroke();

  ctx.strokeStyle = BRANDING.colors.accent;
  ctx.lineWidth = 12;
  ctx.stroke();

  const first = px(pts[0]!);
  const last = px(pts[pts.length - 1]!);
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(first.x, first.y, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = BRANDING.colors.accent;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 20, 0, Math.PI * 2);
  ctx.fill();
}

export interface ShareRider {
  name: string;
  avatarUrl?: string | null;
}

/** Renders a 1080x1920 story card for an activity. */
export async function renderStoryCard(activity: Activity, rider: ShareRider): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, BRANDING.colors.surface);
  bg.addColorStop(0.55, BRANDING.colors.background);
  bg.addColorStop(1, "#0a0d0b");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // subtle accent glow
  const glow = ctx.createRadialGradient(W * 0.8, H * 0.18, 20, W * 0.8, H * 0.18, 700);
  glow.addColorStop(0, "rgba(163,230,53,0.18)");
  glow.addColorStop(1, "rgba(163,230,53,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // header: logo + wordmark
  const mark = await loadImage(BRANDING.markSrc);
  if (mark) ctx.drawImage(mark, 80, 96, 120, 120);
  ctx.fillStyle = BRANDING.colors.text;
  ctx.font = displayFont(72);
  ctx.textBaseline = "alphabetic";
  ctx.fillText(BRANDING.name, 224, 172);
  ctx.fillStyle = BRANDING.colors.accent;
  ctx.font = bodyFont(26);
  ctx.fillText(BRANDING.tagline, 226, 208);

  // title
  ctx.fillStyle = BRANDING.colors.text;
  ctx.font = displayFont(64);
  const title = activity.title.length > 24 ? `${activity.title.slice(0, 24)}…` : activity.title;
  ctx.fillText(title, 80, 340);
  ctx.fillStyle = BRANDING.colors.muted;
  ctx.font = bodyFont(30);
  ctx.fillText(
    `${formatDate(activity.started_at)}${activity.place_label ? ` · ${activity.place_label}` : ""}`,
    80,
    386,
  );

  // map panel
  const panel = { x: 80, y: 440, w: W - 160, h: 780 };
  ctx.fillStyle = "rgba(255,255,255,0.04)";
  ctx.strokeStyle = "rgba(163,230,53,0.25)";
  ctx.lineWidth = 3;
  const r = 44;
  ctx.beginPath();
  ctx.moveTo(panel.x + r, panel.y);
  ctx.arcTo(panel.x + panel.w, panel.y, panel.x + panel.w, panel.y + panel.h, r);
  ctx.arcTo(panel.x + panel.w, panel.y + panel.h, panel.x, panel.y + panel.h, r);
  ctx.arcTo(panel.x, panel.y + panel.h, panel.x, panel.y, r);
  ctx.arcTo(panel.x, panel.y, panel.x + panel.w, panel.y, r);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  drawTrack(ctx, activity, {
    x: panel.x + 70,
    y: panel.y + 70,
    w: panel.w - 140,
    h: panel.h - 140,
  });

  // stats
  const stats: [string, string][] = [
    ["DISTÂNCIA", `${formatKm(activity.distance_m)} km`],
    ["TEMPO", formatDuration(activity.duration_s)],
    ["ELEVAÇÃO", `${formatNumber(activity.elevation_gain_m)} m`],
    ["VEL. MÉDIA", `${activity.avg_speed_kmh.toFixed(1)} km/h`],
  ];
  stats.forEach(([label, value], i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 80 + col * ((W - 160) / 2);
    const y = 1330 + row * 190;
    ctx.fillStyle = BRANDING.colors.muted;
    ctx.font = bodyFont(26);
    ctx.fillText(label, x, y);
    ctx.fillStyle = i === 0 ? BRANDING.colors.accent : BRANDING.colors.text;
    ctx.font = displayFont(80);
    ctx.fillText(value, x, y + 86);
  });

  // rider footer
  const footY = 1740;
  const avatar = rider.avatarUrl ? await loadImage(rider.avatarUrl) : null;
  ctx.save();
  ctx.beginPath();
  ctx.arc(126, footY, 46, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  if (avatar) ctx.drawImage(avatar, 80, footY - 46, 92, 92);
  else {
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fillRect(80, footY - 46, 92, 92);
  }
  ctx.restore();
  ctx.strokeStyle = BRANDING.colors.accent;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(126, footY, 46, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = BRANDING.colors.text;
  ctx.font = displayFont(40);
  ctx.fillText(rider.name, 200, footY + 4);
  ctx.fillStyle = BRANDING.colors.muted;
  ctx.font = bodyFont(26);
  ctx.fillText("trako.app", 200, footY + 42);

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png", 0.95));
}

/** Native share when available, download otherwise. */
export async function shareActivity(activity: Activity, rider: ShareRider) {
  const blob = await renderStoryCard(activity, rider);
  if (!blob) throw new Error("Não foi possível gerar a imagem.");
  const file = new File([blob], `trako-${activity.id}.png`, { type: "image/png" });
  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
  };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    await nav.share({
      files: [file],
      title: activity.title,
      text: `${formatKm(activity.distance_m)} km de trilha registrados no TRAKO.`,
    });
    return "shared" as const;
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded" as const;
}
