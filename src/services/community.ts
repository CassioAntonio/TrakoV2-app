import type { Profile } from "@/types/trako";
import { supabase } from "@/integrations/supabase/client";

/** Community layer (follows, comments, rider search, avatars) backed by Lovable Cloud. */

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
      .upsert({ follower_id: followerId, following_id: followingId });
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
    supabase
      .from("follows")
      .select("follower_id", { count: "exact", head: true })
      .eq("following_id", userId),
    supabase
      .from("follows")
      .select("following_id", { count: "exact", head: true })
      .eq("follower_id", userId),
  ]);
  return { followers: followers.count ?? 0, following: following.count ?? 0 };
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", userId);
  if (error) throw error;
  return (data ?? []).map((f) => f.following_id);
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
    .select("*")
    .eq("activity_id", activityId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ActivityComment[];
}

export async function addComment(activityId: string, userId: string, body: string) {
  const { error } = await supabase
    .from("activity_comments")
    .insert({ activity_id: activityId, user_id: userId, body });
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
    .select("*")
    .or(`username.ilike.%${q}%,display_name.ilike.%${q}%`)
    .limit(20);
  if (error) throw error;
  return (data ?? []) as Profile[];
}

/* ------------------------------ avatars ------------------------------ */

/** Uploads the picked image to private storage and returns its path. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
  if (error) throw error;
  return path;
}

/** Resolves a stored avatar path to a temporary displayable URL. */
export async function avatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const { data, error } = await supabase.storage.from("avatars").createSignedUrl(path, 3600);
  if (error) return null;
  return data?.signedUrl ?? null;
}
