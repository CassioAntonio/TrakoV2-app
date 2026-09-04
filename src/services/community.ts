import type { Profile } from "@/types/trako";
import { readTable, writeTable, readValue, writeValue } from "@/lib/local-store";

/**
 * Temporary local community layer (authentication/backend disabled).
 * Follows, comments, rider search and avatars are stored in localStorage.
 */

interface Follow {
  follower_id: string;
  following_id: string;
}

function follows(): Follow[] {
  return readTable<Follow>("follows");
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  return follows().some((f) => f.follower_id === followerId && f.following_id === followingId);
}

export async function setFollow(followerId: string, followingId: string, on: boolean) {
  const rows = follows().filter(
    (f) => !(f.follower_id === followerId && f.following_id === followingId),
  );
  writeTable("follows", on ? [...rows, { follower_id: followerId, following_id: followingId }] : rows);
}

export async function getFollowCounts(userId: string) {
  const rows = follows();
  return {
    followers: rows.filter((f) => f.following_id === userId).length,
    following: rows.filter((f) => f.follower_id === userId).length,
  };
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  return follows()
    .filter((f) => f.follower_id === userId)
    .map((f) => f.following_id);
}

/* ------------------------------ comments ------------------------------ */

export interface ActivityComment {
  id: string;
  activity_id: string;
  user_id: string;
  body: string;
  created_at: string;
}

function comments(): ActivityComment[] {
  return readTable<ActivityComment>("comments");
}

export async function listComments(activityId: string): Promise<ActivityComment[]> {
  return comments()
    .filter((c) => c.activity_id === activityId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function addComment(activityId: string, userId: string, body: string) {
  const row: ActivityComment = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    activity_id: activityId,
    user_id: userId,
    body,
    created_at: new Date().toISOString(),
  };
  writeTable("comments", [...comments(), row]);
}

export async function deleteComment(id: string) {
  writeTable(
    "comments",
    comments().filter((c) => c.id !== id),
  );
}

/* ------------------------------ riders ------------------------------ */

export async function searchRiders(_term: string): Promise<Profile[]> {
  return [];
}

/* ------------------------------ avatars ------------------------------ */

/** Stores the picked image locally (data URL) and returns its reference. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Não foi possível ler a imagem."));
    reader.readAsDataURL(file);
  });
  const key = `avatar:${userId}`;
  writeValue(key, dataUrl);
  return key;
}

/** Resolves a stored avatar reference to a displayable URL. */
export async function avatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return readValue<string>(path);
}
