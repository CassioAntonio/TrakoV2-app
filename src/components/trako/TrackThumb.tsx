import { useMemo } from "react";
import { Map as MapIcon } from "lucide-react";
import type { TrackPoint } from "@/types/trako";
import { boundsOf } from "@/lib/geo";
import { cn } from "@/lib/utils";

/**
 * Lightweight vector preview of a recorded track. Used in lists where mounting a
 * full interactive map per row would be wasteful.
 */
export function TrackThumb({
  points,
  className,
}: {
  points: TrackPoint[];
  className?: string | undefined;
}) {
  const path = useMemo(() => {
    if (points.length < 2) return null;
    const b = boundsOf(points);
    if (!b) return null;
    const w = Math.max(1e-6, b.maxLng - b.minLng);
    const h = Math.max(1e-6, b.maxLat - b.minLat);
    const scale = Math.min(96 / w, 56 / h);
    const ox = (100 - w * scale) / 2;
    const oy = (60 - h * scale) / 2;
    return points
      .map((p, i) => {
        const x = ox + (p.lng - b.minLng) * scale;
        const y = 60 - (oy + (p.lat - b.minLat) * scale);
        return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
      })
      .join(" ");
  }, [points]);

  return (
    <div
      className={cn(
        "flex items-center justify-center overflow-hidden rounded-xl border border-border bg-surface-2",
        className ?? "h-16 w-24",
      )}
    >
      {path ? (
        <svg viewBox="0 0 100 60" className="h-full w-full" role="img" aria-label="Traçado da trilha">
          <path
            d={path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={3}
            strokeOpacity={0.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={path}
            fill="none"
            stroke="var(--primary)"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <MapIcon className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
  );
}
