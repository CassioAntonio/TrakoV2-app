import type { Activity, Profile, TrackPoint, Visibility, Discipline } from "@/types/trako";
import { newId, readTable, writeTable } from "@/lib/local-store";

/**
 * Local-only data layer (backend temporarily removed). Same API surface as
 * before so screens are untouched. Storage starts empty.
 */

const ACTIVITIES = "activities";
const PROFILES = "profiles";
const FAVORITES = "favorites";
const LIKES = "likes";

function allActivities(): Activity[] {
  return readTable<Activity>(ACTIVITIES).map((a) => ({
    ...a,
    track: Array.isArray(a.track) ? (a.track as TrackPoint[]) : [],
  }));
}

function byStartedDesc(a: Activity, b: Activity) {
  return (b.started_at ?? "").localeCompare(a.started_at ?? "");
}

export async function listMyActivities(userId: string): Promise<Activity[]> {
  return allActivities()
    .filter((a) => a.user_id === userId)
    .sort(byStartedDesc);
}

export async function getActivity(id: string): Promise<Activity | null> {
  return allActivities().find((a) => a.id === id) ?? null;
}

export async function listPublicActivities(limit = 50): Promise<Activity[]> {
  return allActivities()
    .filter((a) => a.visibility === "public")
    .sort(byStartedDesc)
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
  writeTable(ACTIVITIES, [row, ...readTable<Activity>(ACTIVITIES)]);
  return row;
}

export async function deleteActivity(id: string) {
  writeTable(
    ACTIVITIES,
    readTable<Activity>(ACTIVITIES).filter((a) => a.id !== id),
  );
}

export async function updateActivity(id: string, patch: Record<string, unknown>) {
  writeTable(
    ACTIVITIES,
    readTable<Activity>(ACTIVITIES).map((a) => (a.id === id ? { ...a, ...patch } : a)),
  );
}

export async function getProfile(userId: string): Promise<Profile | null> {
  return readTable<Profile>(PROFILES).find((p) => p.id === userId) ?? null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  const rows = readTable<Profile>(PROFILES);
  const idx = rows.findIndex((p) => p.id === profile.id);
  if (idx >= 0) rows[idx] = { ...rows[idx], ...profile } as Profile;
  else rows.push(profile as Profile);
  writeTable(PROFILES, rows);
}

export async function getProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  const map: Record<string, Profile> = {};
  for (const p of readTable<Profile>(PROFILES)) if (ids.includes(p.id)) map[p.id] = p;
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
  if (on) rows.push({ user_id: userId, activity_id: activityId });
  writeTable(table, rows);
}

export async function toggleFavorite(userId: string, activityId: string, on: boolean) {
  togglePair(FAVORITES, userId, activityId, on);
}

export async function listFavorites(userId: string): Promise<string[]> {
  return readTable<Pair>(FAVORITES)
    .filter((r) => r.user_id === userId)
    .map((r) => r.activity_id);
}

export async function toggleLike(userId: string, activityId: string, on: boolean) {
  togglePair(LIKES, userId, activityId, on);
}

export async function listLikes(activityIds: string[]) {
  return readTable<Pair>(LIKES).filter((r) => activityIds.includes(r.activity_id));
}
