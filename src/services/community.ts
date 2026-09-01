import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/trako";

/* ------------------------------ follows ------------------------------ */

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", followerId)
    .eq("following_id", followingId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}

export async function setFollow(followerId: string, followingId: string, on: boolean) {
  if (on) {
    const { error } = await supabase
      .from("follows")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .insert({ follower_id: followerId, following_id: followingId } as any);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", followerId)
      .eq("following_id", followingId);
    if (error) throw error;
  }
}

export async function getFollowCounts(userId: string) {
  const [followers, following] = await Promise.all([
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
    supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
  ]);
  if (followers.error) throw followers.error;
  if (following.error) throw following.error;
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) throw error;
  return (data ?? []).map((r) => (r as { following_id: string }).following_id);
}

/* ------------------------------ comments ------------------------------ */

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

export async function listComments(activityId: string): Promise<ActivityComment[]> {
  const { data, error } = await supabase
    .from("activity_comments")
    .select("id,activity_id,user_id,body,created_at")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ActivityComment[];
}

export async function addComment(activityId: string, userId: string, body: string) {
  const { error } = await supabase
    .from("activity_comments")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({ activity_id: activityId, user_id: userId, body } as any);
  if (error) throw error;
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from("activity_comments").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------ riders ------------------------------ */

export async function searchRiders(term: string): Promise<Profile[]> {
  const q = term.trim();
  if (!q) return [];
  const { data, error } = await supabase
    .from("profiles")
    .select("id,username,display_name,bio,bike,disciplines,avatar_url,is_private")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/* ------------------------------ avatars ------------------------------ */

/** Uploads to the private `avatars` bucket under `<uid>/…` and returns the object path. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

const signedCache = new Map<string, { url: string; exp: number }>();

/** Signed URL for a stored avatar path (the bucket is private). */
export async function avatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const hit = signedCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  if (error || !data?.signedUrl) return null;
  signedCache.set(path, { url: data.signedUrl, exp: Date.now() + 50 * 60 * 1000 });
  return data.signedUrl;
}
