import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bike, Pencil, Gauge } from "lucide-react";
import { Screen, EmptyState, SectionTitle, StatTile } from "@/components/trako/Screen";
import { Button } from "@/components/ui/button";
import { ProfileEditor } from "@/components/trako/ProfileEditor";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, listMyActivities } from "@/services/activities";
import { computeStats } from "@/lib/achievements";
import { disciplineLabel } from "@/components/trako/ActivityCard";
import { formatKm, formatHours, formatNumber } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/garage")({
  head: () => ({
    meta: [
      { title: "Garagem — TRAKO" },
      { name: "description", content: "Sua moto, modalidades e uso acumulado no TRAKO." },
      { property: "og:title", content: "Garagem — TRAKO" },
      { property: "og:description", content: "Sua moto e seu uso registrado no TRAKO." },
    ],
  }),
  component: Garage,
});

function Garage() {
  const { user } = useAuth();
  const uid = user?.id ?? "";

  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => getProfile(uid),
    enabled: !!uid,
  });
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", uid],
    queryFn: () => listMyActivities(uid),
    enabled: !!uid,
  });

  const stats = computeStats(activities);
  const disciplines = profile?.disciplines ?? [];

  return (
    <Screen title="Garagem" subtitle="Sua moto e seu uso real">
      {profile?.bike ? (
        <section className="surface-card px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
              <Bike className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-bold">{profile.bike}</p>
              <p className="text-[11px] text-muted-foreground">Moto principal</p>
            </div>
            <ProfileEditor userId={uid} profile={profile}>
              <Button variant="outline" size="icon" aria-label="Editar moto">
                <Pencil className="h-4 w-4" />
              </Button>
            </ProfileEditor>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={<Bike className="h-8 w-8" />}
          title="Nenhuma moto cadastrada"
          description="Cadastre sua moto para acompanhar quilometragem, horas e modalidades."
          action={
            <ProfileEditor userId={uid} profile={profile}>
              <Button variant="action" size="tap">
                Cadastrar moto
              </Button>
            </ProfileEditor>
          }
        />
      )}

      <SectionTitle>Uso acumulado</SectionTitle>
      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Distância" value={formatKm(stats.distanceM)} unit="km" accent />
        <StatTile label="Horas" value={formatHours(stats.durationS)} unit="h" />
        <StatTile label="Trilhas" value={String(stats.activities)} />
        <StatTile label="Elevação" value={formatNumber(stats.elevationM)} unit="m" />
      </div>

      <SectionTitle>Modalidades</SectionTitle>
      {disciplines.length === 0 ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Gauge className="h-4 w-4" /> Escolha suas modalidades ao editar o perfil.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {disciplines.map((d) => (
            <span
              key={d}
              className="rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-muted-foreground"
            >
              {disciplineLabel(d)}
            </span>
          ))}
        </div>
      )}
    </Screen>
  );
}
