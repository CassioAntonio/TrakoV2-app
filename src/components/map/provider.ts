export type MapProvider = "apple" | "maplibre";

/** Token JWT do MapKit JS (opcional). Sem ele, o iOS cai no provedor padrão. */
export const MAPKIT_TOKEN: string | undefined =
  (import.meta.env["VITE_MAPKIT_TOKEN"] as string | undefined) || undefined;

export function isAppleDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua);
  // iPadOS 13+ se apresenta como Mac com touch
  const iPadOS = ua.includes("Macintosh") && (navigator.maxTouchPoints ?? 0) > 1;
  return iOS || iPadOS;
}

/**
 * Escolhe o provedor de mapa:
 * - iOS/iPadOS com token MapKit configurado → Apple Maps (MapKit JS)
 * - qualquer outro caso (Android, web, sem token) → MapLibre + OpenStreetMap
 * A interface visual e a API interna são idênticas nos dois casos.
 */
export function resolveMapProvider(): MapProvider {
  return isAppleDevice() && MAPKIT_TOKEN ? "apple" : "maplibre";
}
