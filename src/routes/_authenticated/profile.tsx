import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Pencil, LogOut } from "lucide-react";
import { RiderAvatar } from "@/components/trako/RiderAvatar";
import { ProfileEditor } from "@/components/trako/ProfileEditor";
import { Button } from "@/components/ui/button";
import { Screen, StatTile, SectionTitle } from "@/components/trako/Screen";
import { useAuth } from "@/hooks/useAuth";
import { listMyActivities, getProfile } from "@/services/activities";
import { computeStats, computeAchievements } from "@/lib/achievements";
import { formatKm, formatHours, formatNumber, formatSpeed } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Perfil — TRAKO" },
      { name: "description", content: "Suas estatísticas totais, nível e conquistas no TRAKO." },
      { property: "og:title", content: "Perfil — TRAKO" },
      { property: "og:description", content: "Perfil do piloto, estatísticas e conquistas." },
    ],
  }),
  component: ProfileScreen,
});

function ProfileScreen() {
  const { user } = useAuth();
  const uid = user?.id ?? "";

  const { data: activities = [] } = useQuery({
    queryKey: ["activities", uid],
    queryFn: () => listMyActivities(uid),
    enabled: !!uid,
  });
  const { data: profile } = useQuery({
    queryKey: ["profile", uid],
    queryFn: () => getProfile(uid),
    enabled: !!uid,
  });

  const stats = computeStats(activities);
  const achievements = computeAchievements(activities, stats);
  const name = profile?.display_name || profile?.username || "Piloto";

  return (
    <Screen title={name} subtitle={user?.email ?? ""}>
      <div className="surface-card flex items-center gap-3 px-4 py-4">
        <RiderAvatar path={profile?.avatar_url} name={name} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm font-bold">Nível {stats.level}</p>
          <p className="text-xs text-muted-foreground">{formatNumber(stats.xp)} XP acumulado</p>
        </div>
        <ProfileEditor userId={uid} profile={profile}>
          <Button variant="surface" size="sm">
            <Pencil className="h-4 w-4" /> Editar
          </Button>
        </ProfileEditor>
      </div>


      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Distância" value={formatKm(stats.distanceM)} unit="km" accent />
        <StatTile label="Tempo" value={formatHours(stats.durationS)} unit="h" />
        <StatTile label="Elevação" value={formatNumber(stats.elevationM)} unit="m" />
        <StatTile label="Vel. máxima" value={formatSpeed(stats.maxSpeedKmh)} unit="km/h" />
      </div>

      <SectionTitle>Conquistas</SectionTitle>
      <ul className="space-y-2 pb-4">
        {achievements.map((a) => (
          <li
            key={a.id}
            className="surface-card flex items-center gap-3 px-4 py-3"
          >
            <Trophy
              className={a.unlocked ? "h-5 w-5 text-primary" : "h-5 w-5 text-muted-foreground"}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-sm font-bold">{a.title}</p>
              <p className="truncate text-[11px] text-muted-foreground">{a.description}</p>
              <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(a.progress * 100)}%` }}
                />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Screen>
  );
}
