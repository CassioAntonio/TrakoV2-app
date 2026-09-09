import { lazy, Suspense, useMemo } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { MapViewProps } from "./types";
import { resolveMapProvider } from "./provider";

const LazyRideMap = lazy(() => import("./RideMap"));
const LazyAppleMap = lazy(() => import("./AppleMap"));

function MapSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div className={className}>
      <div className="h-full w-full animate-pulse bg-surface-2" />
    </div>
  );
}

function MapImpl(props: MapViewProps) {
  const provider = useMemo(() => resolveMapProvider(), []);
  return provider === "apple" ? <LazyAppleMap {...props} /> : <LazyRideMap {...props} />;
}

/**
 * Camada de abstração de mapas do TRAKO.
 * iOS/iPadOS → Apple Maps (MapKit JS); Android e web → MapLibre + OpenStreetMap.
 * Só carrega no navegador, então o SSR nunca toca no SDK.
 */
export function MapSurface(props: MapViewProps) {
  return (
    <ClientOnly fallback={<MapSkeleton className={props.className} />}>
      <Suspense fallback={<MapSkeleton className={props.className} />}>
        <MapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}
