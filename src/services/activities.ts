import type { Activity, Profile, TrackPoint, Visibility, Discipline } from "@/types/trako";
import { supabase } from "@/integrations/supabase/client";

/** Data layer backed by Lovable Cloud (RLS scoped to the signed-in rider). */

function mapActivity(row: Record<string, unknown>): Activity {
  return {
    ...(row as unknown as Activity),
    track: Array.isArray(row['track']) ? (row['track'] as TrackPoint[]) : [],
  };
}

export async function listMyActivities(userId: string): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("user_id", userId)
    .order("started_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapActivity);
}

export async function getActivity(id: string): Promise<Activity | null> {
  const { data, error } = await supabase.from("activities").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapActivity(data) : null;
}

export async function listPublicActivities(limit = 50): Promise<Activity[]> {
  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("visibility", "public")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapActivity);
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
  const { data, error } = await supabase
    .from("activities")
    .insert({ ...input, track: input.track as unknown as never })
    .select("*")
    .single();
  if (error) throw error;
  return mapActivity(data);
}

export async function deleteActivity(id: string) {
  const { error } = await supabase.from("activities").delete().eq("id", id);
  if (error) throw error;
}

export async function updateActivity(id: string, patch: Record<string, unknown>) {
  const { error } = await supabase
    .from("activities")
    .update(patch as never)
    .eq("id", id);
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile | null) ?? null;
}

export async function upsertProfile(profile: Partial<Profile> & { id: string }) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() } as never);
  if (error) throw error;
}

export async function getProfilesByIds(ids: string[]): Promise<Record<string, Profile>> {
  if (ids.length === 0) return {};
  const { data, error } = await supabase.from("profiles").select("*").in("id", ids);
  if (error) throw error;
  const map: Record<string, Profile> = {};
  for (const p of (data ?? []) as Profile[]) map[p.id] = p;
  return map;
}

export async function toggleFavorite(userId: string, activityId: string, on: boolean) {
  if (on) {
    const { error } = await supabase
      .from("favorites")
      .upsert({ user_id: userId, activity_id: activityId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", userId)
      .eq("activity_id", activityId);
    if (error) throw error;
  }
}

export async function listFavorites(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("favorites")
    .select("activity_id")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.activity_id);
}

export async function toggleLike(userId: string, activityId: string, on: boolean) {
  if (on) {
    const { error } = await supabase
      .from("activity_likes")
      .upsert({ user_id: userId, activity_id: activityId });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("activity_likes")
      .delete()
      .eq("user_id", userId)
      .eq("activity_id", activityId);
    if (error) throw error;
  }
}

export async function listLikes(activityIds: string[]) {
  if (activityIds.length === 0) return [];
  const { data, error } = await supabase
    .from("activity_likes")
    .select("activity_id,user_id")
    .in("activity_id", activityIds);
  if (error) throw error;
  return data ?? [];
}
