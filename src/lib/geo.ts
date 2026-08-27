import type { TrackPoint } from "@/types/trako";

const EARTH_RADIUS_M = 6371008.8;

export function haversine(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

export interface TrackStats {
  distanceM: number;
  durationS: number;
  movingTimeS: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  elevationGainM: number;
  minAltitudeM: number | null;
  maxAltitudeM: number | null;
}

const MOVING_SPEED_MS = 0.8;
const ELEVATION_NOISE_M = 2.5;

/** Derives every activity metric from the raw GPS track. No estimates, no mock values. */
export function computeTrackStats(points: TrackPoint[]): TrackStats {
  const stats: TrackStats = {
    distanceM: 0,
    durationS: 0,
    movingTimeS: 0,
    avgSpeedKmh: 0,
    maxSpeedKmh: 0,
    elevationGainM: 0,
    minAltitudeM: null,
    maxAltitudeM: null,
  };
  if (points.length === 0) return stats;

  let lastAlt: number | null = null;
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    if (typeof p.alt === "number" && Number.isFinite(p.alt)) {
      stats.minAltitudeM = stats.minAltitudeM === null ? p.alt : Math.min(stats.minAltitudeM, p.alt);
      stats.maxAltitudeM = stats.maxAltitudeM === null ? p.alt : Math.max(stats.maxAltitudeM, p.alt);
      if (lastAlt === null) lastAlt = p.alt;
      else if (p.alt - lastAlt > ELEVATION_NOISE_M) {
        stats.elevationGainM += p.alt - lastAlt;
        lastAlt = p.alt;
      } else if (lastAlt - p.alt > ELEVATION_NOISE_M) {
        lastAlt = p.alt;
      }
    }

    if (i === 0) continue;
    const prev = points[i - 1];
    const d = haversine(prev, p);
    const dt = (p.t - prev.t) / 1000;
    if (dt <= 0) continue;
    stats.distanceM += d;
    const segSpeed = typeof p.speed === "number" && p.speed >= 0 ? p.speed : d / dt;
    if (segSpeed > MOVING_SPEED_MS) stats.movingTimeS += dt;
    stats.maxSpeedKmh = Math.max(stats.maxSpeedKmh, segSpeed * 3.6);
  }

  stats.durationS = Math.max(0, (points[points.length - 1].t - points[0].t) / 1000);
  const base = stats.movingTimeS > 0 ? stats.movingTimeS : stats.durationS;
  stats.avgSpeedKmh = base > 0 ? (stats.distanceM / base) * 3.6 : 0;
  return stats;
}

export function boundsOf(points: { lat: number; lng: number }[]) {
  if (points.length === 0) return null;
  let minLat = points[0].lat;
  let maxLat = points[0].lat;
  let minLng = points[0].lng;
  let maxLng = points[0].lng;
  for (const p of points) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLng = Math.min(minLng, p.lng);
    maxLng = Math.max(maxLng, p.lng);
  }
  return { minLat, maxLat, minLng, maxLng };
}

/** Drops noisy fixes so the drawn track and the stats stay honest. */
export function shouldKeepPoint(prev: TrackPoint | undefined, next: TrackPoint): boolean {
  if (typeof next.accuracy === "number" && next.accuracy > 50) return false;
  if (!prev) return true;
  const dt = (next.t - prev.t) / 1000;
  if (dt < 1) return false;
  const d = haversine(prev, next);
  if (d < 3) return false;
  if (d / dt > 70) return false; // > 250 km/h → bad fix
  return true;
}

/** Reverse geocoding via OpenStreetMap Nominatim (real data, no fixed city). */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=12&accept-language=pt-BR`,
      { headers: { Accept: "application/json" } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { address?: Record<string, string> };
    const a = data.address ?? {};
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? null;
    const state = a.state_code ?? a.state ?? null;
    if (city && state) return `${city} - ${state}`;
    return city ?? state ?? null;
  } catch {
    return null;
  }
}

export async function searchPlaces(query: string) {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=8&accept-language=pt-BR&q=${encodeURIComponent(query)}`,
  );
  if (!res.ok) return [];
  const data = (await res.json()) as { display_name: string; lat: string; lon: string }[];
  return data.map((d) => ({ label: d.display_name, lat: Number(d.lat), lng: Number(d.lon) }));
}

/** Builds a GPX 1.1 document from a recorded track. */
export function trackToGpx(name: string, points: TrackPoint[]): string {
  const segs = points
    .map(
      (p) =>
        `      <trkpt lat="${p.lat.toFixed(6)}" lon="${p.lng.toFixed(6)}">${
          typeof p.alt === "number" ? `<ele>${p.alt.toFixed(1)}</ele>` : ""
        }<time>${new Date(p.t).toISOString()}</time></trkpt>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="TRAKO" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>${name.replace(/[<&>]/g, "")}</name>
    <trkseg>
${segs}
    </trkseg>
  </trk>
</gpx>`;
}
