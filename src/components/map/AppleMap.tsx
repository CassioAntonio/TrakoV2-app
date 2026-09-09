import { useEffect, useRef } from "react";
import type { MapViewProps } from "./types";
import { MAPKIT_TOKEN } from "./provider";
import type { TrackPoint } from "@/types/trako";
import { boundsOf } from "@/lib/geo";

declare global {
  // eslint-disable-next-line no-var
  var mapkit: any;
}

const SRC = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";

let loader: Promise<void> | null = null;

function loadMapKit(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (loader) return loader;
  loader = new Promise<void>((resolve, reject) => {
    if (window.mapkit) return resolve();
    const s = document.createElement("script");
    s.src = SRC;
    s.crossOrigin = "anonymous";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("MapKit JS indisponível"));
    document.head.appendChild(s);
  }).then(() => {
    window.mapkit.init({
      authorizationCallback: (done: (t: string) => void) => done(MAPKIT_TOKEN as string),
      language: "pt-BR",
    });
  });
  return loader;
}

function polyline(points: TrackPoint[], color: string, width: number) {
  const coords = points.map((p) => new window.mapkit.Coordinate(p.lat, p.lng));
  return new window.mapkit.PolylineOverlay(coords, {
    style: new window.mapkit.Style({ lineWidth: width, strokeColor: color, lineJoin: "round" }),
  });
}

/** Provedor Apple Maps (MapKit JS) — mesma API interna do provedor MapLibre. */
export default function AppleMap({
  center,
  zoom = 14,
  track = [],
  tracks = [],
  markers = [],
  follow = false,
  fitTrack = false,
  interactive = true,
  showUser = true,
  className,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const didFit = useRef(false);

  useEffect(() => {
    let cancelled = false;
    loadMapKit()
      .then(() => {
        if (cancelled || !containerRef.current || mapRef.current) return;
        const map = new window.mapkit.Map(containerRef.current, {
          showsUserLocation: showUser,
          showsUserLocationControl: interactive,
          showsCompass: window.mapkit.FeatureVisibility.Hidden,
          showsZoomControl: interactive,
          isRotationEnabled: interactive,
          isScrollEnabled: interactive,
          isZoomEnabled: interactive,
          colorScheme: window.mapkit.Map.ColorSchemes.Dark,
        });
        mapRef.current = map;
      })
      .catch(() => {
        /* fallback silencioso: o container fica vazio e o MapSurface já mostra o esqueleto */
      });
    return () => {
      cancelled = true;
      mapRef.current?.destroy?.();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // percursos
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.removeOverlays(map.overlays);
    const overlays: unknown[] = [];
    if (track.length > 1) overlays.push(polyline(track, "#a3e635", 5));
    for (const t of tracks) if (t.points.length > 1) overlays.push(polyline(t.points, "#5eead4", 3));
    if (overlays.length) map.addOverlays(overlays);
  }, [track, tracks]);

  // pontos de interesse
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.removeAnnotations(map.annotations);
    const anns = markers.map((m) => {
      const a = new window.mapkit.MarkerAnnotation(new window.mapkit.Coordinate(m.lat, m.lng), {
        color: "#a3e635",
        title: m.label ?? "",
      });
      if (m.onClick) a.addEventListener("select", m.onClick);
      return a;
    });
    if (anns.length) map.addAnnotations(anns);
  }, [markers]);

  // posição real do piloto
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || fitTrack) return;
    const span = new window.mapkit.CoordinateSpan(0.36 / Math.pow(2, zoom - 11));
    if (!didFit.current || follow) {
      didFit.current = true;
      map.setRegionAnimated(
        new window.mapkit.CoordinateRegion(
          new window.mapkit.Coordinate(center.lat, center.lng),
          span,
        ),
        didFit.current,
      );
    }
  }, [center, zoom, follow, fitTrack]);

  // enquadrar um percurso salvo
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitTrack) return;
    const b = boundsOf([...track, ...tracks.flatMap((t) => t.points)]);
    if (!b) return;
    const region = new window.mapkit.CoordinateRegion(
      new window.mapkit.Coordinate((b.minLat + b.maxLat) / 2, (b.minLng + b.maxLng) / 2),
      new window.mapkit.CoordinateSpan(
        Math.max(b.maxLat - b.minLat, 0.002) * 1.3,
        Math.max(b.maxLng - b.minLng, 0.002) * 1.3,
      ),
    );
    map.setRegionAnimated(region, false);
  }, [fitTrack, track, tracks]);

  return <div ref={containerRef} className={className} />;
}
