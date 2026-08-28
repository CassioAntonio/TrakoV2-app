import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ChevronLeft, Pause, Play, Square, Satellite } from "lucide-react";
import { MapSurface } from "@/components/map/MapSurface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useRecorder } from "@/hooks/useRecorder";
import { createActivity } from "@/services/activities";
import { reverseGeocode } from "@/lib/geo";
import { formatDuration, formatKm, formatSpeed } from "@/lib/format";
import { DISCIPLINES, type Discipline, type Visibility } from "@/types/trako";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/record")({
  head: () => ({
    meta: [
      { title: "Gravar trilha — TRAKO" },
      {
        name: "description",
        content: "Grave sua trilha com GPS em tempo real: distância, velocidade e altitude.",
      },
      { property: "og:title", content: "Gravar trilha — TRAKO" },
      { property: "og:description", content: "Gravação GPS em tempo real da sua trilha." },
    ],
  }),
  component: RecordScreen,
});

function RecordScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();
  const rec = useRecorder();
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("private");
  const [saving, setSaving] = useState(false);

  const last = rec.points[rec.points.length - 1];
  const center = last ? { lat: last.lat, lng: last.lng } : null;
  const altitude = useMemo(() => (typeof last?.alt === "number" ? Math.round(last.alt) : null), [last]);

  const save = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const first = rec.points[0];
      const place = first ? await reverseGeocode(first.lat, first.lng) : null;
      const startedAt = new Date(rec.startedAt ?? Date.now()).toISOString();
      const activity = await createActivity({
        user_id: user.id,
        title: title.trim() || "Trilha",
        notes: notes.trim() || null,
        sport: rec.sport,
        visibility,
        distance_m: rec.stats.distanceM,
        duration_s: Math.round(rec.elapsedS),
        moving_time_s: Math.round(rec.stats.movingTimeS),
        avg_speed_kmh: rec.stats.avgSpeedKmh,
        max_speed_kmh: rec.stats.maxSpeedKmh,
        elevation_gain_m: rec.stats.elevationGainM,
        min_altitude_m: rec.stats.minAltitudeM,
        max_altitude_m: rec.stats.maxAltitudeM,
        started_at: startedAt,
        ended_at: new Date().toISOString(),
        start_lat: first?.lat ?? null,
        start_lng: first?.lng ?? null,
        place_label: place,
        track: rec.points,
      });
      rec.discard();
      await qc.invalidateQueries({ queryKey: ["my-activities"] });
      await qc.invalidateQueries({ queryKey: ["public-activities"] });
      toast.success("Trilha salva!");
      navigate({ to: "/activities/$id", params: { id: activity.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar a trilha.");
    } finally {
      setSaving(false);
    }
  };

  if (rec.state === "finished") {
    return (
      <div className="app-scroll h-full bg-background px-4 pb-8 pt-[calc(env(safe-area-inset-top,0px)+1rem)]">
        <h1 className="font-display text-2xl font-bold">Finalizar trilha</h1>
        <p className="text-xs text-muted-foreground">Confira os números antes de salvar.</p>

        <div className="mt-4 h-44 overflow-hidden rounded-2xl border border-border">
          <MapSurface className="h-full w-full" track={rec.points} fitTrack interactive={false} showUser={false} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <Big label="Distância" value={formatKm(rec.stats.distanceM)} unit="km" accent />
          <Big label="Tempo" value={formatDuration(rec.elapsedS)} />
          <Big label="Vel. média" value={formatSpeed(rec.stats.avgSpeedKmh)} unit="km/h" />
          <Big label="Vel. máxima" value={formatSpeed(rec.stats.maxSpeedKmh)} unit="km/h" />
          <Big label="Elevação" value={Math.round(rec.stats.elevationGainM).toString()} unit="m" />
          <Big
            label="Altitude máx"
            value={rec.stats.maxAltitudeM !== null ? Math.round(rec.stats.maxAltitudeM).toString() : "—"}
            unit="m"
          />
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              className="h-12"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Trilha da manhã"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Como foi o terreno, o clima, a galera…"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Visibilidade</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: "private", label: "Privada" },
                  { id: "followers", label: "Seguidores" },
                  { id: "public", label: "Pública" },
                ] as { id: Visibility; label: string }[]
              ).map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisibility(v.id)}
                  className={cn(
                    "rounded-xl border px-2 py-2.5 text-xs font-semibold",
                    visibility === v.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-surface-2 text-muted-foreground",
                  )}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Button variant="action" size="tap" className="w-full" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar trilha"}
          </Button>
          <Button
            variant="danger"
            size="tap"
            className="w-full"
            onClick={() => {
              rec.discard();
              navigate({ to: "/home" });
            }}
          >
            Descartar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <MapSurface
        className="absolute inset-0"
        center={center}
        track={rec.points}
        follow={rec.state === "recording"}
        zoom={16}
        interactive={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/10 to-background/95" />

      <div className="relative flex h-full flex-col px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-[calc(env(safe-area-inset-top,0px)+0.9rem)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate({ to: "/home" })}
            className="inline-flex items-center gap-1 text-sm text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4" /> Início
          </button>
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              rec.gpsError
                ? "border-destructive/50 text-destructive"
                : "border-primary/40 text-primary",
            )}
          >
            <Satellite className="h-3.5 w-3.5" />
            {rec.gpsError
              ? "GPS"
              : rec.gpsAccuracy
                ? `±${Math.round(rec.gpsAccuracy)} m`
                : "Buscando"}
          </span>
        </div>

        {rec.state === "idle" && (
          <div className="app-scroll mt-4 flex gap-2 overflow-x-auto pb-1">
            {DISCIPLINES.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => rec.setSport(d.id as Discipline)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold",
                  rec.sport === d.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface-2/80 text-muted-foreground",
                )}
              >
                {d.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Distância
          </p>
          <p className="flex items-baseline gap-2">
            <span className="metric-value text-7xl text-primary">
              {formatKm(rec.stats.distanceM, 2)}
            </span>
            <span className="text-lg text-muted-foreground">km</span>
          </p>
          <div className="mt-6 grid w-full grid-cols-3 gap-3 text-center">
            <Live label="Tempo" value={formatDuration(rec.elapsedS)} />
            <Live label="Vel." value={formatSpeed(rec.currentSpeedKmh)} unit="km/h" />
            <Live label="Altitude" value={altitude !== null ? String(altitude) : "—"} unit="m" />
          </div>
          {rec.gpsError && <p className="mt-4 text-xs text-destructive">{rec.gpsError}</p>}
        </div>

        <div className="flex items-center justify-center gap-4">
          {rec.state === "idle" && (
            <Button variant="action" size="hero" className="w-full" onClick={rec.start}>
              <Play className="h-5 w-5" /> Iniciar
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
    </div>
  );
}

function Live({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-surface-1/70 py-3 backdrop-blur">
      <p className="metric-value text-xl">
        {value}
        {unit && <span className="ml-1 text-[11px] text-muted-foreground">{unit}</span>}
      </p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

function Big({
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
    <div className="surface-card px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 flex items-baseline gap-1">
        <span className={cn("metric-value text-2xl", accent && "text-primary")}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </p>
    </div>
  );
}
