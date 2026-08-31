import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import type { Feature, LineString } from "geojson";
import type { LngLatBoundsLike, Map as MLMap } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { TrackPoint } from "@/types/trako";
import { boundsOf } from "@/lib/geo";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label?: string;
  onClick?: () => void;
}

interface Props {
  center?: { lat: number; lng: number } | null;
  zoom?: number;
  track?: TrackPoint[];
  tracks?: { id: string; points: TrackPoint[] }[];
  markers?: MapMarker[];
  /** keep the camera locked on the live position */
  follow?: boolean;
  fitTrack?: boolean;
  interactive?: boolean;
  showUser?: boolean;
  className?: string;
}

/**
 * OpenStreetMap standard raster tiles — no API key, no token, no usage plan.
 * Darkened at render time (raster paint props) so it matches the TRAKO theme
 * without depending on a hosted dark style.
 */
const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: [
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      maxzoom: 19,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#12181a" } },
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-opacity": 0.92,
        "raster-brightness-min": 0.05,
        "raster-brightness-max": 0.72,
        "raster-saturation": -0.35,
        "raster-contrast": 0.12,
      },
    },
  ],
};


function lineFeature(points: TrackPoint[]): Feature<LineString> {
  return {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: points.map((p) => [p.lng, p.lat]) },
  };
}

export default function RideMap({
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
}: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MLMap | null>(null);
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const poiMarkers = useRef<maplibregl.Marker[]>([]);
  const readyRef = useRef(false);
  const didFit = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: STYLE,
      center: center ? [center.lng, center.lat] : [0, 0],
      zoom: center ? zoom : 1.4,
      attributionControl: { compact: true },
      interactive,
    });
    mapRef.current = map;

    map.on("load", () => {
      readyRef.current = true;
      map.addSource("track", { type: "geojson", data: lineFeature([]) });
      map.addLayer({
        id: "track-glow",
        type: "line",
        source: "track",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#9ae600", "line-width": 10, "line-opacity": 0.18 },
      });
      map.addLayer({
        id: "track-line",
        type: "line",
        source: "track",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#a3e635", "line-width": 4 },
      });
      map.addSource("others", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      map.addLayer({
        id: "others-line",
        type: "line",
        source: "others",
        layout: { "line-cap": "round", "line-join": "round" },
        paint: { "line-color": "#5eead4", "line-width": 3, "line-opacity": 0.75 },
      });
      map.resize();
    });

    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    }

    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      poiMarkers.current.forEach((m) => m.remove());
      poiMarkers.current = [];
      userMarker.current?.remove();
      userMarker.current = null;
      readyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // main track
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("track") as maplibregl.GeoJSONSource | undefined;
      src?.setData(lineFeature(track));
    };
    if (readyRef.current) apply();
    else map.once("load", apply);
  }, [track]);

  // secondary tracks (community rides)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const apply = () => {
      const src = map.getSource("others") as maplibregl.GeoJSONSource | undefined;
      src?.setData({
        type: "FeatureCollection",
        features: tracks.filter((t) => t.points.length > 1).map((t) => lineFeature(t.points)),
      });
    };
    if (readyRef.current) apply();
    else map.once("load", apply);
  }, [tracks]);

  // user position
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || !showUser) return;
    if (!userMarker.current) {
      const el = document.createElement("div");
      el.style.cssText =
        "width:18px;height:18px;border-radius:9999px;background:#a3e635;box-shadow:0 0 0 4px rgba(163,230,53,.25),0 0 12px rgba(163,230,53,.8);border:2px solid #0f1412";
      userMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([center.lng, center.lat])
        .addTo(map);
    } else {
      userMarker.current.setLngLat([center.lng, center.lat]);
    }
    if (follow) map.easeTo({ center: [center.lng, center.lat], duration: 700 });
  }, [center, follow, showUser]);

  // initial centering when the first fix arrives
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center || didFit.current || fitTrack) return;
    didFit.current = true;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center, zoom, fitTrack]);

  // fit a saved track
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !fitTrack) return;
    const all = [...track, ...tracks.flatMap((t) => t.points)];
    const b = boundsOf(all);
    if (!b) return;
    const bounds: LngLatBoundsLike = [
      [b.minLng, b.minLat],
      [b.maxLng, b.maxLat],
    ];
    const run = () => map.fitBounds(bounds, { padding: 48, duration: 0, maxZoom: 16 });
    if (readyRef.current) run();
    else map.once("load", run);
  }, [fitTrack, track, tracks]);

  // POI markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    poiMarkers.current.forEach((m) => m.remove());
    poiMarkers.current = markers.map((m) => {
      const el = document.createElement("button");
      el.type = "button";
      el.setAttribute("aria-label", m.label ?? "Ponto");
      el.style.cssText =
        "width:26px;height:26px;border-radius:9999px;background:#12181a;border:2px solid #a3e635;display:grid;place-items:center;color:#a3e635;font:700 11px/1 monospace;cursor:pointer";
      el.textContent = "▲";
      if (m.onClick) el.addEventListener("click", m.onClick);
      return new maplibregl.Marker({ element: el }).setLngLat([m.lng, m.lat]).addTo(map);
    });
  }, [markers]);

  return <div ref={containerRef} className={className} />;
}
