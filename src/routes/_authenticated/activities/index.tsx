import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Route as RouteIcon } from "lucide-react";
import { Screen, StatTile, EmptyState } from "@/components/trako/Screen";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { listMyActivities } from "@/services/activities";
import { computeStats } from "@/lib/achievements";
import { formatKm, formatHours } from "@/lib/format";
import { ActivityRow } from "../home";

export const Route = createFileRoute("/_authenticated/activities/")({
  head: () => ({
    meta: [
      { title: "Atividades — TRAKO" },
      { name: "description", content: "Histórico completo das suas trilhas registradas no TRAKO." },
      { property: "og:title", content: "Atividades — TRAKO" },
      { property: "og:description", content: "Todas as suas trilhas em um só lugar." },
    ],
  }),
  component: ActivitiesList,
});

function ActivitiesList() {
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const [q, setQ] = useState("");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["activities", uid],
    queryFn: () => listMyActivities(uid),
    enabled: !!uid,
  });

  const stats = computeStats(activities);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return activities;
    return activities.filter(
      (a) =>
        a.title.toLowerCase().includes(term) ||
        (a.place_label ?? "").toLowerCase().includes(term),
    );
  }, [activities, q]);

  return (
    <Screen title="Atividades" subtitle={`${activities.length} trilha(s) registradas`}>
      <div className="grid grid-cols-3 gap-3">
        <StatTile label="Distância" value={formatKm(stats.distanceM)} unit="km" accent />
        <StatTile label="Tempo" value={formatHours(stats.durationS)} unit="h" />
        <StatTile label="Trilhas" value={String(stats.activities)} />
      </div>

      {activities.length > 0 && (
        <Input
          className="h-11"
          placeholder="Buscar por nome ou local"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      )}

      {isLoading ? (
        <div className="surface-card h-24 animate-pulse" />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<RouteIcon className="h-8 w-8" />}
          title={activities.length === 0 ? "Histórico vazio" : "Nada encontrado"}
          description={
            activities.length === 0
              ? "Grave sua primeira trilha e ela aparece aqui com mapa e estatísticas."
              : "Tente outro termo de busca."
          }
          action={
            activities.length === 0 ? (
              <Button asChild variant="action" size="tap">
                <Link to="/record">Gravar agora</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-3 pb-4">
          {filtered.map((a) => (
            <ActivityRow key={a.id} activity={a} />
          ))}
        </ul>
      )}
    </Screen>
  );
}
