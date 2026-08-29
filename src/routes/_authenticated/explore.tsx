import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Compass, Crosshair } from "lucide-react";
import { Screen } from "@/components/trako/Screen";
import { MapSurface } from "@/components/map/MapSurface";
import { Button } from "@/components/ui/button";
import { useGeolocation } from "@/hooks/useGeolocation";
import { listPublicActivities } from "@/services/activities";
import { DISCIPLINES } from "@/types/trako";
import type { Discipline } from "@/types/trako";
import { formatKm } from "@/lib/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explorar — TRAKO" },
      { name: "description", content: "Descubra trilhas públicas perto da sua localização real." },
      { property: "og:title", content: "Explorar — TRAKO" },
      { property: "og:description", content: "Mapa de trilhas off-road ao seu redor." },
    ],
  }),
  component: Explore,
});

function Explore() {
  const { fix, status, retry } = useGeolocation({ auto: true });
  const [filter, setFilter] = useState<Discipline | "all">("all");

  const { data: activities = [] } = useQuery({
    queryKey: ["public-activities"],
    queryFn: () => listPublicActivities(60),
  });

  const filtered = useMemo(
    () => activities.filter((a) => filter === "all" || a.sport === filter),
    [activities, filter],
  );

  const tracks = useMemo(
    () => filtered.filter((a) => a.track.length > 1).map((a) => ({ id: a.id, points: a.track })),
    [filtered],
  );

  const markers = useMemo(
    () =>
      filtered
        .filter((a) => a.start_lat != null && a.start_lng != null)
        .map((a) => ({ id: a.id, lat: a.start_lat as number, lng: a.start_lng as number })),
    [filtered],
  );

  return (
    <Screen title="Explorar" subtitle="Trilhas públicas ao seu redor" padded={false}>
      <div className="relative h-full">
        <MapSurface
          className="h-full w-full"
          center={fix ? { lat: fix.lat, lng: fix.lng } : null}
          zoom={11}
          tracks={tracks}
          markers={markers}
          showUser
          interactive
        />

        <div className="pointer-events-none absolute inset-x-0 top-2 flex gap-2 overflow-x-auto px-3 pb-2 [scrollbar-width:none]">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            Todas
          </Chip>
          {DISCIPLINES.map((d) => (
            <Chip key={d.id} active={filter === d.id} onClick={() => setFilter(d.id)}>
              {d.label}
            </Chip>
          ))}
        </div>

        <div className="absolute bottom-4 left-3 right-3 flex items-center justify-between gap-3">
          <div className="surface-card px-3 py-2 text-xs">
            <span className="flex items-center gap-2">
              <Compass className="h-4 w-4 text-primary" />
              {filtered.length} trilha{filtered.length === 1 ? "" : "s"} ·{" "}
              {formatKm(filtered.reduce((s, a) => s + a.distance_m, 0), 0)} km
            </span>
          </div>
          {status !== "granted" && (
            <Button variant="surface" size="sm" onClick={retry}>
              <Crosshair className="h-4 w-4" /> Minha posição
            </Button>
          )}
        </div>
      </div>
    </Screen>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pointer-events-auto shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background/80 text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}
