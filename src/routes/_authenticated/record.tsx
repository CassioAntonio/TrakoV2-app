import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pause, Play, Square, Trash2, Satellite } from "lucide-react";
import { MapSurface } from "@/components/map/MapSurface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useRecorder } from "@/hooks/useRecorder";
import { useAuth } from "@/hooks/useAuth";
import { createActivity } from "@/services/activities";
import { reverseGeocode } from "@/lib/geo";
import { formatDuration, formatKm, formatSpeed, formatNumber } from "@/lib/format";
import { DISCIPLINES } from "@/types/trako";
import type { Discipline, Visibility } from "@/types/trako";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/record")({
  head: () => ({
    meta: [
      { title: "Gravar trilha — TRAKO" },
      { name: "description", content: "Gravação GPS ao vivo: distância, tempo, velocidade e altitude." },
      { property: "og:title", content: "Gravar trilha — TRAKO" },
      { property: "og:description", content: "Registre sua trilha com GPS em tempo real." },
    ],
  }),
  component: RecordScreen,
});

function RecordScreen() {
  const rec = useRecorder();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [saving, setSaving] = useState(false);

  const last = rec.points[rec.points.length - 1];
  const center = last ? { lat: last.lat, lng: last.lng } : null;

  async function save() {
    if (!user) return;
    if (rec.points.length < 2) {
      toast.error("Trilha muito curta para salvar.");
      return;
    }
    setSaving(true);
    try {
      const first = rec.points[0]!;
      const end = rec.points[rec.points.length - 1]!;
      const place = await reverseGeocode(first.lat, first.lng);
      const activity = await createActivity({
        user_id: user.id,
        title: title.trim() || "Trilha sem nome",
        notes: notes.trim() || null,
        sport: rec.sport,
        visibility,
        distance_m: Math.round(rec.stats.distanceM),
        duration_s: Math.round(rec.elapsedS),
        moving_time_s: Math.round(rec.stats.movingTimeS),
        avg_speed_kmh: Number(rec.stats.avgSpeedKmh.toFixed(2)),
        max_speed_kmh: Number(rec.stats.maxSpeedKmh.toFixed(2)),
        elevation_gain_m: Math.round(rec.stats.elevationGainM),
        min_altitude_m: rec.stats.minAltitudeM,
        max_altitude_m: rec.stats.maxAltitudeM,
        started_at: new Date(first.t).toISOString(),
        ended_at: new Date(end.t).toISOString(),
        start_lat: first.lat,
        start_lng: first.lng,
        place_label: place,
        track: rec.points,
      });
      rec.discard();
      await queryClient.invalidateQueries({ queryKey: ["activities"] });
      toast.success("Trilha salva!");
      navigate({ to: "/activities/$id", params: { id: activity.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a trilha.");
    } finally {
      setSaving(false);
    }
  }

  if (rec.state === "finished") {
    return (
      <div className="app-scroll h-full space-y-4 px-4 pb-6 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <h1 className="font-display text-xl font-bold">Finalizar trilha</h1>

        <div className="grid grid-cols-3 gap-3">
          <Metric label="Distância" value={formatKm(rec.stats.distanceM)} unit="km" accent />
          <Metric label="Tempo" value={formatDuration(rec.elapsedS)} />
          <Metric label="Elevação" value={formatNumber(rec.stats.elevationGainM)} unit="m" />
        </div>

        <MapSurface className="h-48 w-full overflow-hidden rounded-2xl" track={rec.points} fitTrack />

        <div className="space-y-1.5">
          <Label htmlFor="title">Nome da trilha</Label>
          <Input
            id="title"
            className="h-12"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Serra da Cantareira ao amanhecer"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notas</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Terreno, condições, companhia…"
          />
        </div>

        <div className="space-y-2">
          <Label>Visibilidade</Label>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["private", "Privada"],
                ["followers", "Seguidores"],
                ["public", "Pública"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setVisibility(id)}
                className={cn(
                  "rounded-xl border px-3 py-2.5 text-xs font-medium",
                  visibility === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-surface-2 text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button variant="action" size="tap" className="w-full" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar trilha"}
          </Button>
          <Button
            variant="danger"
            size="tap"
            className="w-full"
            onClick={() => {
              rec.discard();
              toast("Gravação descartada.");
            }}
          >
            <Trash2 className="h-4 w-4" /> Descartar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <MapSurface
        className="absolute inset-0 h-full w-full"
        center={center}
        zoom={16}
        track={rec.points}
        follow={rec.state === "recording"}
        showUser
      />

      <div className="absolute inset-x-0 top-0 space-y-3 bg-gradient-to-b from-background via-background/85 to-transparent px-4 pb-8 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            <Satellite className={cn("h-4 w-4", rec.gpsError ? "text-destructive" : "text-primary")} />
            {rec.gpsError
              ? rec.gpsError
              : rec.gpsAccuracy
                ? `GPS ±${Math.round(rec.gpsAccuracy)} m`
                : "Procurando sinal…"}
          </span>
          {rec.state === "idle" && (
            <select
              value={rec.sport}
              onChange={(e) => rec.setSport(e.target.value as Discipline)}
              className="rounded-lg border border-border bg-surface-2 px-2 py-1.5 text-xs"
              aria-label="Modalidade"
            >
              {DISCIPLINES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Metric label="Distância" value={formatKm(rec.stats.distanceM)} unit="km" accent />
          <Metric label="Tempo" value={formatDuration(rec.elapsedS)} />
          <Metric label="Vel." value={formatSpeed(rec.currentSpeedKmh)} unit="km/h" />
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-4 px-6">
        {rec.state === "idle" && (
          <Button variant="action" size="hero" className="w-full" onClick={rec.start}>
            Iniciar gravação
          </Button>
        )}
        {rec.state === "recording" && (
          <>
            <Button variant="surface" size="hero" className="flex-1" onClick={rec.pause}>
              <Pause className="h-5 w-5" /> Pausar
            </Button>
            <Button variant="action" size="hero" className="flex-1" onClick={rec.finish}>
              <Square className="h-5 w-5" /> Finalizar
            </Button>
          </>
        )}
        {rec.state === "paused" && (
          <>
            <Button variant="action" size="hero" className="flex-1" onClick={rec.resume}>
              <Play className="h-5 w-5" /> Retomar
            </Button>
            <Button variant="surface" size="hero" className="flex-1" onClick={rec.finish}>
              <Square className="h-5 w-5" /> Finalizar
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit?: string;
  accent?: boolean;
}) {
  return (
    <div className="surface-card px-3 py-2 text-center">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className={cn("metric-value text-xl", accent && "text-primary")}>
        {value}
        {unit && <span className="ml-1 text-[11px] text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
