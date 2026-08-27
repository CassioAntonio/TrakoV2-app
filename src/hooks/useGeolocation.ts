import { useCallback, useEffect, useRef, useState } from "react";

export type GeoStatus = "idle" | "prompt" | "locating" | "granted" | "denied" | "unavailable";

export interface GeoFix {
  lat: number;
  lng: number;
  accuracy: number | null;
  altitude: number | null;
  speed: number | null;
  heading: number | null;
  timestamp: number;
}

interface Options {
  /** start watching as soon as the hook mounts */
  auto?: boolean;
  highAccuracy?: boolean;
}

/**
 * Device geolocation. Always the real position of the device — never a fixed city.
 * Uses a single watch so battery use stays controlled.
 */
export function useGeolocation({ auto = true, highAccuracy = false }: Options = {}) {
  const [status, setStatus] = useState<GeoStatus>("idle");
  const [fix, setFix] = useState<GeoFix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchId = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    if (watchId.current !== null) return;
    setStatus((s) => (s === "granted" ? s : "locating"));
    setError(null);
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("granted");
        setFix({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
          altitude: pos.coords.altitude ?? null,
          speed: pos.coords.speed ?? null,
          heading: pos.coords.heading ?? null,
          timestamp: pos.timestamp,
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
          setError("Permissão de localização negada.");
        } else {
          setStatus("unavailable");
          setError("Não foi possível obter sua localização.");
        }
        stop();
      },
      {
        enableHighAccuracy: highAccuracy,
        maximumAge: highAccuracy ? 1000 : 15000,
        timeout: 20000,
      },
    );
  }, [highAccuracy, stop]);

  useEffect(() => {
    if (auto) start();
    return stop;
  }, [auto, start, stop]);

  return { status, fix, error, start, stop, retry: start };
}
