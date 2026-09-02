import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users } from "lucide-react";
import { Screen, StatTile, SectionTitle, EmptyState } from "@/components/trako/Screen";
import { RiderAvatar } from "@/components/trako/RiderAvatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/useAuth";
import { getProfile, listPublicActivities } from "@/services/activities";
import { getFollowCounts, isFollowing, setFollow } from "@/services/community";
import { computeStats } from "@/lib/achievements";
import { formatKm, formatHours, formatNumber, formatRelative, formatDuration } from "@/lib/format";
import { DISCIPLINES } from "@/types/trako";

export const Route = createFileRoute("/_authenticated/riders/$id")({
  head: () => ({
    meta: [
      { title: "Piloto — TRAKO" },
      { name: "description", content: "Perfil público do piloto: trilhas, estatísticas e seguidores." },
      { property: "og:title", content: "Piloto — TRAKO" },
      { property: "og:description", content: "Perfil público do piloto no TRAKO." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: RiderProfile,
});

function RiderProfile() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const uid = user?.id ?? "";
  const qc = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", id],
    queryFn: () => getProfile(id),
  });

  const { data: activities = [] } = useQuery({
    queryKey: ["public-activities"],
    queryFn: () => listPublicActivities(100),
  });

  const { data: counts } = useQuery({
    queryKey: ["follow-counts", id],
    queryFn: () => getFollowCounts(id),
  });

  const { data: following = false } = useQuery({
    queryKey: ["following", uid, id],
    queryFn: () => isFollowing(uid, id),
    enabled: !!uid && uid !== id,
  });

  const mine = activities.filter((a) => a.user_id === id);
  const stats = computeStats(mine);
  const name = profile?.display_name || profile?.username || "Piloto";

  async function toggle() {
    if (!uid || uid === id) return;
    await setFollow(uid, id, !following);
    await qc.invalidateQueries({ queryKey: ["following", uid, id] });
    await qc.invalidateQueries({ queryKey: ["follow-counts", id] });
  }

  if (isLoading) {
    return (
      <Screen title="Piloto">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
      </Screen>
    );
  }

  return (
    <Screen title={name} subtitle={profile?.username ? `@${profile.username}` : ""}>
      <div className="surface-card flex items-center gap-3 px-4 py-4">
        <RiderAvatar path={profile?.avatar_url} name={name} className="h-14 w-14" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-bold">{name}</p>
          <p className="text-[11px] text-muted-foreground">
            {formatNumber(counts?.followers ?? 0)} seguidores ·{" "}
            {formatNumber(counts?.following ?? 0)} seguindo
          </p>
          {profile?.bike && (
            <p className="truncate text-[11px] text-muted-foreground">{profile.bike}</p>
          )}
        </div>
        {uid !== id && (
          <Button
            variant={following ? "surface" : "action"}
            size="sm"
            onClick={() => void toggle()}
          >
            {following ? "Seguindo" : "Seguir"}
          </Button>
        )}
      </div>

      {profile?.bio && <p className="text-xs text-muted-foreground">{profile.bio}</p>}

      <div className="grid grid-cols-2 gap-3">
        <StatTile label="Distância" value={formatKm(stats.distanceM)} unit="km" accent />
        <StatTile label="Tempo" value={formatHours(stats.durationS)} unit="h" />
        <StatTile label="Elevação" value={formatNumber(stats.elevationM)} unit="m" />
        <StatTile label="Trilhas" value={String(mine.length)} unit="" />
      </div>

      <SectionTitle>Trilhas públicas</SectionTitle>
      {mine.length === 0 ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="Nenhuma trilha pública"
          description="Este piloto ainda não publicou trilhas."
        />
      ) : (
        <ul className="space-y-3 pb-4">
          {mine.map((a) => (
            <li key={a.id}>
              <Link
                to="/activities/$id"
                params={{ id: a.id }}
                className="surface-card block px-4 py-3"
              >
                <p className="font-display text-sm font-bold">{a.title}</p>
                <p className="text-[11px] text-muted-foreground">
                  {DISCIPLINES.find((d) => d.id === a.sport)?.label ?? "Trilha"} ·{" "}
                  {formatRelative(a.started_at)}
                </p>
                <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                  <span>{formatKm(a.distance_m)} km</span>
                  <span>{formatDuration(a.duration_s)}</span>
                  <span>{formatNumber(a.elevation_gain_m)} m</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
