import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MapSurface } from "@/components/map/MapSurface";
import { StatTile } from "@/components/trako/Screen";
import { getActivity, deleteActivity } from "@/services/activities";
import { trackToGpx } from "@/lib/geo";
import {
  formatKm,
  formatDuration,
  formatNumber,
  formatSpeed,
  formatDateTime,
} from "@/lib/format";
import { DISCIPLINES } from "@/types/trako";

export const Route = createFileRoute("/_authenticated/activities/$id")({
  head: () => ({
    meta: [
      { title: "Detalhe da trilha — TRAKO" },
      { name: "description", content: "Traçado, métricas e detalhes da sua trilha registrada." },
      { property: "og:title", content: "Detalhe da trilha — TRAKO" },
      { property: "og:description", content: "Mapa e estatísticas completas da trilha." },
    ],
  }),
  component: ActivityDetail,
});

function ActivityDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: activity, isLoading } = useQuery({
    queryKey: ["activity", id],
    queryFn: () => getActivity(id),
  });

  async function remove() {
    try {
      await deleteActivity(id);
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Trilha excluída.");
      navigate({ to: "/activities" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível excluir.");
    }
  }

  function exportGpx() {
    if (!activity) return;
    const gpx = trackToGpx(activity.title, activity.track);
    const url = URL.createObjectURL(new Blob([gpx], { type: "application/gpx+xml" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activity.title.replace(/\s+/g, "-").toLowerCase()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (isLoading) {
    return <div className="app-scroll h-full p-4"><div className="surface-card h-48 animate-pulse" /></div>;
  }

  if (!activity) {
    return (
      <div className="app-scroll h-full space-y-4 p-4">
        <p className="text-sm text-muted-foreground">Trilha não encontrada.</p>
        <Button variant="surface" size="tap" onClick={() => navigate({ to: "/activities" })}>
          Voltar
        </Button>
      </div>
    );
  }

  const sport = DISCIPLINES.find((d) => d.id === activity.sport)?.label ?? "Trilha";

  return (
    <div className="app-scroll h-full space-y-4 px-4 pb-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
      <button
        type="button"
        onClick={() => navigate({ to: "/activities" })}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Atividades
      </button>

      <div>
        <h1 className="font-display text-xl font-bold">{activity.title}</h1>
        <p className="text-xs text-muted-foreground">
          {sport}
          {activity.place_label ? ` · ${activity.place_label}` : ""} ·{" "}
          {formatDateTime(activity.started_at)}
        </p>
      </div>

      <MapSurface
        className="h-56 w-full overflow-hidden rounded-2xl"
        track={activity.track}
        fitTrack
      />

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Distância" value={formatKm(activity.distance_m)} unit="km" accent />
        <StatTile label="Tempo" value={formatDuration(activity.duration_s)} />
        <StatTile label="Elevação" value={formatNumber(activity.elevation_gain_m)} unit="m" />
        <StatTile label="Vel. média" value={formatSpeed(activity.avg_speed_kmh)} unit="km/h" />
        <StatTile label="Vel. máxima" value={formatSpeed(activity.max_speed_kmh)} unit="km/h" />
        <StatTile label="Em movimento" value={formatDuration(activity.moving_time_s)} />
      </div>

      {activity.notes && (
        <div className="surface-card px-4 py-3">
          <p className="text-xs whitespace-pre-wrap text-muted-foreground">{activity.notes}</p>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <Button variant="surface" size="tap" className="w-full" onClick={exportGpx}>
          <Download className="h-4 w-4" /> Exportar GPX
        </Button>
        <Button variant="danger" size="tap" className="w-full" onClick={remove}>
          <Trash2 className="h-4 w-4" /> Excluir trilha
        </Button>
      </div>
    </div>
  );
}
