import type { Activity, Profile, TrackPoint, Visibility, Discipline } from "@/types/trako";
import { readTable, writeTable, readValue, writeValue, newId } from "@/lib/local-store";

/**
 * Temporary local data layer (authentication/backend disabled).
 * Everything lives in localStorage and starts empty — no fake data.
 */

const ACTIVITIES = "activities";

function allActivities(): Activity[] {
  return readTable<Activity>(ACTIVITIES);
}

function byRecent(a: Activity, b: Activity) {
  return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
}

export async function listMyActivities(userId: string): Promise<Activity[]> {
  return allActivities()
    .filter((a) => a.user_id === userId)
    .sort(byRecent);
}

export async function getActivity(id: string): Promise<Activity | null> {
  return allActivities().find((a) => a.id === id) ?? null;
}

export async function listPublicActivities(limit = 50): Promise<Activity[]> {
  return allActivities()
    .filter((a) => a.visibility === "public")
    .sort(byRecent)
    .slice(0, limit);
}

export interface NewActivityInput {
  user_id: string;
  title: string;
  notes?: string | null;
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
}

export async function createActivity(input: NewActivityInput): Promise<Activity> {
  const row = {
    ...input,
    id: newId(),
    created_at: new Date().toISOString(),
  } as unknown as Activity;
  writeTable(ACTIVITIES, [row, ...allActivities()]);
  return row;
}

export async function deleteActivity(id: string) {
  writeTable(
    ACTIVITIES,
    allActivities().filter((a) => a.id !== id),
  );
}

export async function updateActivity(id: string, patch: Record<string, unknown>) {
  writeTable(
    ACTIVITIES,
    allActivities().map((a) => (a.id === id ? ({ ...a, ...patch } as Activity) : a)),
  );
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return readValue<Profile>(`profile:${userId}`);
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  const current = readValue<Profile>(`profile:${profile.id}`) ?? ({ id: profile.id } as Profile);
  writeValue(`profile:${profile.id}`, {
    ...current,
    ...profile,
    updated_at: new Date().toISOString(),
  });
}

export async function getProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  const map: Record<string, Profile> = {};
  for (const id of ids) {
    const p = readValue<Profile>(`profile:${id}`);
    if (p) map[id] = p;
  }
  return map;
}

interface Pair {
  user_id: string;
  activity_id: string;
}

function togglePair(table: string, userId: string, activityId: string, on: boolean) {
  const rows = readTable<Pair>(table).filter(
    (r) => !(r.user_id === userId && r.activity_id === activityId),
  );
  writeTable(table, on ? [...rows, { user_id: userId, activity_id: activityId }] : rows);
}

export async function toggleFavorite(userId: string, activityId: string, on: boolean) {
  togglePair("favorites", userId, activityId, on);
}

export async function listFavorites(userId: string): Promise<string[]> {
  return readTable<Pair>("favorites")
    .filter((r) => r.user_id === userId)
    .map((r) => r.activity_id);
}

export async function toggleLike(userId: string, activityId: string, on: boolean) {
  togglePair("likes", userId, activityId, on);
}

export async function listLikes(activityIds: string[]) {
  return readTable<Pair>("likes").filter((r) => activityIds.includes(r.activity_id));
}
