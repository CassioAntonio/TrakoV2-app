import { Link } from "@tanstack/react-router";
import { Mountain, Timer, Route as RouteIcon, ChevronRight } from "lucide-react";
import { TrackThumb } from "@/components/trako/TrackThumb";
import { formatKm, formatNumber, formatRelative, formatDuration } from "@/lib/format";
import { DISCIPLINES } from "@/types/trako";
import type { Activity } from "@/types/trako";

export function disciplineLabel(id: string) {
  return DISCIPLINES.find((d) => d.id === id)?.label ?? "Trilha";
}

/** Activity card: track preview + the three metrics a rider checks first. */
export function ActivityRow({ activity: a }: { activity: Activity }) {
  return (
    <li>
      <Link
        to="/activities/$id"
        params={{ id: a.id }}
        className="surface-card block px-3 py-3 active:scale-[0.99]"
      >
        <div className="flex items-center gap-3">
          <TrackThumb points={a.track ?? []} className="h-16 w-24 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-sm font-bold">{a.title}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {disciplineLabel(a.sport)}
              {a.place_label ? ` · ${a.place_label}` : ""} · {formatRelative(a.started_at)}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <RouteIcon className="h-3.5 w-3.5" /> {formatKm(a.distance_m)} km
              </span>
              <span className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> {formatDuration(a.duration_s)}
              </span>
              <span className="flex items-center gap-1">
                <Mountain className="h-3.5 w-3.5" /> {formatNumber(a.elevation_gain_m)} m
              </span>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </Link>
    </li>
  );
}
