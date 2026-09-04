import { xpForLevel } from "@/lib/achievements";

export interface LevelInfo {
  level: number;
  title: string;
  xpRequired: number;
}

/** Rider ranks. Progression is purely XP-driven — a new rider starts at level 1 with 0 XP. */
const TITLES = [
  "Iniciante",
  "Explorador",
  "Trilheiro",
  "Aventureiro",
  "Enduro",
  "Hard Enduro",
  "Rally",
  "Veterano",
  "Mestre da Trilha",
  "Lenda TRAKO",
];

export function levelTitle(level: number): string {
  return TITLES[Math.min(level, TITLES.length) - 1] ?? "Lenda TRAKO";
}

export function levelLadder(count = 10): LevelInfo[] {
  return Array.from({ length: count }, (_, i) => ({
    level: i + 1,
    title: levelTitle(i + 1),
    xpRequired: xpForLevel(i + 1),
  }));
}

export interface Progression {
  level: number;
  title: string;
  xp: number;
  xpIntoLevel: number;
  xpForNext: number;
  /** 0..1 */
  progress: number;
  nextLevel: number;
}

export function progressionFor(xp: number, level: number): Progression {
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const span = Math.max(1, next - base);
  const into = Math.max(0, xp - base);
  return {
    level,
    title: levelTitle(level),
    xp,
    xpIntoLevel: into,
    xpForNext: Math.max(0, next - xp),
    progress: Math.max(0, Math.min(1, into / span)),
    nextLevel: level + 1,
  };
}
