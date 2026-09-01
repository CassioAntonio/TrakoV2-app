import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Heart, MessageCircle, Users, Search } from "lucide-react";
import { Screen, EmptyState, SectionTitle } from "@/components/trako/Screen";
import { RiderAvatar } from "@/components/trako/RiderAvatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import {
  listPublicActivities,
  getProfilesByIds,
  listLikes,
  toggleLike,
} from "@/services/activities";
import { searchRiders } from "@/services/community";
import { formatKm, formatDuration, formatRelative, formatNumber } from "@/lib/format";
import { DISCIPLINES } from "@/types/trako";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/feed")({
  head: () => ({
    meta: [
      { title: "Comunidade — TRAKO" },
      { name: "description", content: "Feed de trilhas públicas dos pilotos TRAKO." },
      { property: "og:title", content: "Comunidade — TRAKO" },
      { property: "og:description", content: "Curta, comente e siga outros pilotos off-road." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Feed,
});

function Feed() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const qc = useQueryClient();
  const [term, setTerm] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["public-activities"],
    queryFn: () => listPublicActivities(50),
  });

  const ids = useMemo(() => [...new Set(activities.map((a) => a.user_id))], [activities]);
  const { data: profiles = {} } = useQuery({
    queryKey: ["profiles", ids],
    queryFn: () => getProfilesByIds(ids),
    enabled: ids.length > 0,
  });

  const activityIds = useMemo(() => activities.map((a) => a.id), [activities]);
  const { data: likes = [] } = useQuery({
    queryKey: ["likes", activityIds],
    queryFn: () => listLikes(activityIds),
    enabled: activityIds.length > 0,
  });

  const { data: riders = [] } = useQuery({
    queryKey: ["riders", term],
    queryFn: () => searchRiders(term),
    enabled: term.trim().length >= 2,
  });

  async function like(activityId: string, on: boolean) {
    if (!uid) return;
    await toggleLike(uid, activityId, on);
    await qc.invalidateQueries({ queryKey: ["likes"] });
  }

  return (
    <Screen title="Comunidade" subtitle="Trilhas públicas dos pilotos">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar pilotos"
          className="pl-9"
        />
      </div>

      {riders.length > 0 && (
        <ul className="space-y-2">
          {riders.map((r) => (
            <li key={r.id}>
              <Link
                to="/riders/$id"
                params={{ id: r.id }}
                className="surface-card flex items-center gap-3 px-4 py-3"
              >
                <RiderAvatar path={r.avatar_url} name={r.display_name} />
                <div className="min-w-0">
                  <p className="truncate font-display text-sm font-bold">
                    {r.display_name || r.username || "Piloto"}
                  </p>
                  {r.username && (
                    <p className="truncate text-[11px] text-muted-foreground">@{r.username}</p>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <SectionTitle>Feed</SectionTitle>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Feed vazio"
          description="Quando pilotos publicarem trilhas públicas, elas aparecem aqui."
        />
      ) : (
        <ul className="space-y-3 pb-4">
          {activities.map((a) => {
            const p = profiles[a.user_id];
            const count = likes.filter((l) => l.activity_id === a.id).length;
            const mine = likes.some((l) => l.activity_id === a.id && l.user_id === uid);
            return (
              <li key={a.id} className="surface-card animate-rise px-4 py-3">
                <div className="flex items-center gap-3">
                  <Link to="/riders/$id" params={{ id: a.user_id }}>
                    <RiderAvatar path={p?.avatar_url} name={p?.display_name} className="h-9 w-9" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">
                      {p?.display_name || p?.username || "Piloto"}
                    </p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {DISCIPLINES.find((d) => d.id === a.sport)?.label ?? "Trilha"} ·{" "}
                      {formatRelative(a.started_at)}
                    </p>
                  </div>
                </div>

                <Link
                  to="/activities/$id"
                  params={{ id: a.id }}
                  className="mt-3 block active:scale-[0.99]"
                >
                  <p className="font-display text-sm font-bold">{a.title}</p>
                  <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                    <span>{formatKm(a.distance_m)} km</span>
                    <span>{formatDuration(a.duration_s)}</span>
                    <span>{formatNumber(a.elevation_gain_m)} m</span>
                  </div>
                </Link>

                <div className="mt-3 flex items-center gap-4 border-t border-border/60 pt-2">
                  <button
                    type="button"
                    onClick={() => void like(a.id, !mine)}
                    className={cn(
                      "flex items-center gap-1.5 text-xs transition-colors active:scale-95",
                      mine ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    <Heart className={cn("h-4 w-4", mine && "fill-current")} /> {count}
                  </button>
                  <Link
                    to="/activities/$id"
                    params={{ id: a.id }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <MessageCircle className="h-4 w-4" /> Comentar
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
