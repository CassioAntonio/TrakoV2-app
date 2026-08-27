import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import type RideMap from "./RideMap";

const LazyRideMap = lazy(() => import("./RideMap"));

type Props = ComponentProps<typeof RideMap>;

function MapSkeleton({ className }: { className?: string | undefined }) {
  return (
    <div className={className}>
      <div className="h-full w-full animate-pulse bg-surface-2" />
    </div>
  );
}

/** SSR-safe wrapper: MapLibre only ever loads in the browser. */
export function MapSurface(props: Props) {
  return (
    <ClientOnly fallback={<MapSkeleton className={props.className} />}>
      <Suspense fallback={<MapSkeleton className={props.className} />}>
        <LazyRideMap {...props} />
      </Suspense>
    </ClientOnly>
  );
}
