import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeTrackStats, shouldKeepPoint, type TrackStats } from "@/lib/geo";
import type { Discipline, TrackPoint } from "@/types/trako";

export type RecorderState = "idle" | "recording" | "paused" | "finished";

interface PersistedSession {
  state: RecorderState;
  sport: Discipline;
  points: TrackPoint[];
  startedAt: number | null;
  pausedMs: number;
  lastPauseAt: number | null;
}

const STORAGE_KEY = "trako.recording.v1";

function load(): PersistedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

function save(session: PersistedSession | null) {
  if (typeof window === "undefined") return;
  try {
    if (!session) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    /* storage full or unavailable — recording continues in memory */
  }
}

/**
 * GPS recorder. Points are buffered locally (localStorage) so a ride survives
 * a reload or a total loss of connectivity; the upload happens only on finish.
 */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [sport, setSport] = useState<Discipline>("trail");
  const [points, setPoints] = useState<TrackPoint[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [pausedMs, setPausedMs] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const lastPauseAt = useRef<number | null>(null);
  const watchId = useRef<number | null>(null);
  const restored = useRef(false);

  // Restore an interrupted ride
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const s = load();
    if (s && (s.state === "recording" || s.state === "paused") && s.points.length >= 0) {
      setSport(s.sport);
      setPoints(s.points);
      setStartedAt(s.startedAt);
      setPausedMs(s.pausedMs);
      lastPauseAt.current = s.lastPauseAt;
      setState("paused"); // resume is always an explicit rider action
    }
  }, []);

  const persist = useCallback(
    (next: Partial<PersistedSession>) => {
      save({
        state,
        sport,
        points,
        startedAt,
        pausedMs,
        lastPauseAt: lastPauseAt.current,
        ...next,
      });
    },
    [state, sport, points, startedAt, pausedMs],
  );

  const stopWatch = useCallback(() => {
    if (watchId.current !== null && typeof navigator !== "undefined") {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  const startWatch = useCallback(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setGpsError("GPS indisponível neste dispositivo.");
      return;
    }
    if (watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setGpsError(null);
        setGpsAccuracy(pos.coords.accuracy ?? null);
        const point: TrackPoint = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          t: pos.timestamp,
          speed: pos.coords.speed,
          alt: pos.coords.altitude,
          heading: pos.coords.heading,
          accuracy: pos.coords.accuracy,
        };
        setPoints((prev) => {
          if (!shouldKeepPoint(prev[prev.length - 1], point)) return prev;
          const next = [...prev, point];
          save({
            state: "recording",
            sport,
            points: next,
            startedAt: startedAt ?? point.t,
            pausedMs,
            lastPauseAt: null,
          });
          return next;
        });
      },
      (err) => {
        setGpsError(
          err.code === err.PERMISSION_DENIED
            ? "Permissão de localização negada."
            : "Sinal de GPS fraco.",
        );
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
    );
  }, [pausedMs, sport, startedAt]);

  // ticking clock while recording
  useEffect(() => {
    if (state !== "recording") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [state]);

  useEffect(() => stopWatch, [stopWatch]);

  const start = useCallback(() => {
    const t = Date.now();
    setStartedAt(t);
    setPoints([]);
    setPausedMs(0);
    lastPauseAt.current = null;
    setState("recording");
    setNow(t);
    save({ state: "recording", sport, points: [], startedAt: t, pausedMs: 0, lastPauseAt: null });
    startWatch();
  }, [sport, startWatch]);

  const pause = useCallback(() => {
    lastPauseAt.current = Date.now();
    setState("paused");
    stopWatch();
    persist({ state: "paused", lastPauseAt: lastPauseAt.current });
  }, [persist, stopWatch]);

  const resume = useCallback(() => {
    if (lastPauseAt.current) {
      setPausedMs((p) => p + (Date.now() - (lastPauseAt.current ?? Date.now())));
      lastPauseAt.current = null;
    }
    setState("recording");
    startWatch();
    persist({ state: "recording", lastPauseAt: null });
  }, [persist, startWatch]);

  const discard = useCallback(() => {
    stopWatch();
    setState("idle");
    setPoints([]);
    setStartedAt(null);
    setPausedMs(0);
    lastPauseAt.current = null;
    save(null);
  }, [stopWatch]);

  const finish = useCallback(() => {
    stopWatch();
    setState("finished");
    persist({ state: "finished" });
  }, [persist, stopWatch]);

  const stats: TrackStats = useMemo(() => computeTrackStats(points), [points]);

  const elapsedS = useMemo(() => {
    if (!startedAt) return 0;
    const end = state === "paused" && lastPauseAt.current ? lastPauseAt.current : now;
    return Math.max(0, (end - startedAt - pausedMs) / 1000);
  }, [startedAt, state, now, pausedMs]);

  const currentSpeedKmh = useMemo(() => {
    const last = points[points.length - 1];
    if (!last || state !== "recording") return 0;
    if (Date.now() - last.t > 10000) return 0;
    return Math.max(0, (last.speed ?? 0) * 3.6);
  }, [points, state]);

  return {
    state,
    sport,
    setSport,
    points,
    stats,
    elapsedS,
    currentSpeedKmh,
    gpsAccuracy,
    gpsError,
    startedAt,
    start,
    pause,
    resume,
    finish,
    discard,
  };
}
