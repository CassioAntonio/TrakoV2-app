/**
 * Temporary local persistence layer used while the backend is disconnected.
 * Stores everything in localStorage under the `trako:` prefix. Starts empty —
 * no seeded/fake data.
 */

const PREFIX = "trako:";

function isBrowser() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readTable<T>(name: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(PREFIX + name);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function writeTable<T>(name: string, rows: T[]) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PREFIX + name, JSON.stringify(rows));
  } catch {
    /* quota or private mode — ignore */
  }
}

export function readValue<T>(name: string): T | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(PREFIX + name);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function writeValue<T>(name: string, value: T) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(PREFIX + name, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/** Local rider identity used while authentication is disabled. */
export const LOCAL_USER_ID = "local-rider";
