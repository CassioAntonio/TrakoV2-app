export function formatDistance(meters: number): { value: string; unit: string } {
  if (!Number.isFinite(meters) || meters <= 0) return { value: "0,0", unit: "km" };
  if (meters < 1000) return { value: String(Math.round(meters)), unit: "m" };
  return { value: (meters / 1000).toFixed(meters / 1000 >= 100 ? 0 : 1).replace(".", ","), unit: "km" };
}

export function formatKm(meters: number, digits = 1): string {
  return (meters / 1000).toFixed(digits).replace(".", ",");
}

export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function formatHours(seconds: number): string {
  return (seconds / 3600).toFixed(1).replace(".", ",");
}

export function formatSpeed(kmh: number): string {
  if (!Number.isFinite(kmh) || kmh < 0) return "0,0";
  return kmh.toFixed(1).replace(".", ",");
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("pt-BR").format(Math.round(n));
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days} d`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(iso));
}
