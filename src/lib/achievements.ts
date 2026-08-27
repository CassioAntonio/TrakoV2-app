import type { Activity, RiderStats } from "@/types/trako";
import { EMPTY_STATS } from "@/types/trako";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  /** current progress 0..1, computed from real activities only */
  progress: number;
  unlocked: boolean;
}

/** Every stat is derived from the rider's own saved activities. A new account is all zeros. */
export function computeStats(activities: Activity[]): RiderStats {
  if (activities.length === 0) return { ...EMPTY_STATS };
  const stats = activities.reduce<RiderStats>(
    (acc, a) => ({
      activities: acc.activities + 1,
      distanceM: acc.distanceM + (a.distance_m || 0),
      durationS: acc.durationS + (a.duration_s || 0),
      elevationM: acc.elevationM + (a.elevation_gain_m || 0),
      maxSpeedKmh: Math.max(acc.maxSpeedKmh, a.max_speed_kmh || 0),
      xp: 0,
      level: 1,
    }),
    { ...EMPTY_STATS },
  );
  stats.xp = Math.round(stats.distanceM / 100 + stats.elevationM / 10 + stats.activities * 50);
  stats.level = Math.max(1, Math.floor(Math.sqrt(stats.xp / 250)) + 1);
  return stats;
}

export function xpForLevel(level: number): number {
  return Math.round((level - 1) ** 2 * 250);
}

export function computeAchievements(activities: Activity[], stats: RiderStats): Achievement[] {
  const km = stats.distanceM / 1000;
  const hardEnduro = activities.filter((a) => a.sport === "hard_enduro").length;
  const regions = new Set(activities.map((a) => a.place_label).filter(Boolean)).size;

  const def = (
    id: string,
    title: string,
    description: string,
    current: number,
    target: number,
  ): Achievement => ({
    id,
    title,
    description,
    progress: target > 0 ? Math.min(1, current / target) : 0,
    unlocked: current >= target,
  });

  return [
    def("first_ride", "Primeira trilha", "Registre sua primeira atividade", stats.activities, 1),
    def("km_100", "100 km Off-Road", "Acumule 100 km registrados", km, 100),
    def("km_500", "500 km na estrada de terra", "Acumule 500 km registrados", km, 500),
    def("elev_5000", "5.000 m de elevação", "Acumule 5.000 m de ganho", stats.elevationM, 5000),
    def("rides_10", "10 trilhas", "Complete 10 atividades", stats.activities, 10),
    def("explorer", "Explorador", "Pilote em 5 regiões diferentes", regions, 5),
    def("hard_enduro", "Hard Enduro", "Registre 3 atividades de Hard Enduro", hardEnduro, 3),
  ];
}
