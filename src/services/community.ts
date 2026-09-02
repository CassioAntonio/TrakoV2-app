import type { Profile } from "@/types/trako";
import { newId, readTable, writeTable } from "@/lib/local-store";

/**
 * Local-only community layer (backend temporarily removed). Same API surface
 * as before; storage starts empty.
 */

const FOLLOWS = "follows";
const COMMENTS = "comments";
const PROFILES = "profiles";
const AVATARS = "avatars";

interface Follow {
  follower_id: string;
  following_id: string;
}

/* ------------------------------ follows ------------------------------ */

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  return readTable<Follow>(FOLLOWS).some(
    (f) => f.follower_id === followerId && f.following_id === followingId,
  );
}

export async function setFollow(followerId: string, followingId: string, on: boolean) {
  const rows = readTable<Follow>(FOLLOWS).filter(
    (f) => !(f.follower_id === followerId && f.following_id === followingId),
  );
  if (on) rows.push({ follower_id: followerId, following_id: followingId });
  writeTable(FOLLOWS, rows);
}

export async function getFollowCounts(userId: string) {
  const rows = readTable<Follow>(FOLLOWS);
  return {
    followers: rows.filter((f) => f.following_id === userId).length,
    following: rows.filter((f) => f.follower_id === userId).length,
  };
}

export async function listFollowingIds(userId: string): Promise<string[]> {
  return readTable<Follow>(FOLLOWS)
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

export async function listComments(activityId: string): Promise<ActivityComment[]> {
  return readTable<ActivityComment>(COMMENTS)
    .filter((c) => c.activity_id === activityId)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function addComment(activityId: string, userId: string, body: string) {
  const rows = readTable<ActivityComment>(COMMENTS);
  rows.push({
    id: newId(),
    activity_id: activityId,
    user_id: userId,
    body,
    created_at: new Date().toISOString(),
  });
  writeTable(COMMENTS, rows);
}

export async function deleteComment(id: string) {
  writeTable(
    COMMENTS,
    readTable<ActivityComment>(COMMENTS).filter((c) => c.id !== id),
  );
}

/* ------------------------------ riders ------------------------------ */

export async function searchRiders(term: string): Promise<Profile[]> {
  const q = term.trim().toLowerCase();
  if (!q) return [];
  return readTable<Profile>(PROFILES)
    .filter(
      (p) =>
        (p.username ?? "").toLowerCase().includes(q) ||
        (p.display_name ?? "").toLowerCase().includes(q),
    )
    .slice(0, 20);
}

/* ------------------------------ avatars ------------------------------ */

interface StoredAvatar {
  path: string;
  data: string;
}

/** Stores the picked image locally as a data URL and returns its local path. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const path = `${userId}/${Date.now()}`;
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const rows = readTable<StoredAvatar>(AVATARS).filter((a) => !a.path.startsWith(`${userId}/`));
  rows.push({ path, data });
  writeTable(AVATARS, rows);
  return path;
}

/** Resolves a stored avatar path to a displayable URL. */
export async function avatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  return readTable<StoredAvatar>(AVATARS).find((a) => a.path === path)?.data ?? null;
}
