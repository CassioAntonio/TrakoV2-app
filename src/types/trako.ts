export type Discipline =
  | "offroad"
  | "trail"
  | "enduro"
  | "hard_enduro"
  | "rally"
  | "adventure"
  | "dual_sport"
  | "motocross"
  | "touring";

export const DISCIPLINES: { id: Discipline; label: string }[] = [
  { id: "trail", label: "Trilha" },
  { id: "offroad", label: "Off-road" },
  { id: "enduro", label: "Enduro" },
  { id: "hard_enduro", label: "Hard Enduro" },
  { id: "rally", label: "Rally" },
  { id: "adventure", label: "Adventure" },
  { id: "dual_sport", label: "Dual Sport" },
  { id: "motocross", label: "Motocross" },
  { id: "touring", label: "Passeio" },
];

export type Difficulty = "easy" | "moderate" | "hard" | "extreme";

export const DIFFICULTIES: { id: Difficulty; label: string; token: string }[] = [
  { id: "easy", label: "Fácil", token: "easy" },
  { id: "moderate", label: "Moderada", token: "moderate" },
  { id: "hard", label: "Difícil", token: "hard" },
  { id: "extreme", label: "Extrema", token: "extreme" },
];

export type Visibility = "private" | "followers" | "public";

/** A single GPS sample recorded during an activity. */
export interface TrackPoint {
  lat: number;
  lng: number;
  /** epoch ms */
  t: number;
  /** m/s */
  speed?: number | null;
  /** meters above sea level */
  alt?: number | null;
  /** degrees */
  heading?: number | null;
  /** meters */
  accuracy?: number | null;
}

export interface Activity {
  id: string;
  user_id: string;
  title: string;
  notes: string | null;
  sport: Discipline;
  visibility: Visibility;
  distance_m: number;
  duration_s: number;
  moving_time_s: number;
  avg_speed_kmh: number;
  max_speed_kmh: number;
  elevation_gain_m: number;
  min_altitude_m: number | null;
  max_altitude_m: number | null;
  started_at: string;
  ended_at: string;
  start_lat: number | null;
  start_lng: number | null;
  place_label: string | null;
  track: TrackPoint[];
  created_at: string;
}

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  bike: string | null;
  disciplines: string[];
  avatar_url: string | null;
  is_private: boolean;
}

export interface RiderStats {
  activities: number;
  distanceM: number;
  durationS: number;
  elevationM: number;
  maxSpeedKmh: number;
  xp: number;
  level: number;
}

export const EMPTY_STATS: RiderStats = {
  activities: 0,
  distanceM: 0,
  durationS: 0,
  elevationM: 0,
  maxSpeedKmh: 0,
  xp: 0,
  level: 1,
};
