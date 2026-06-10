import exercises from "@/data/exercises.json";

/** Eén plek voor de ranglijst-XP-regels — gedeeld door de live sync (/api/leaderboard)
 *  en de admin-recalc (/api/admin/leaderboard), zodat ze nooit uit elkaar lopen. */
export const XP_PER = 25; // flat 25 XP per opgeloste oefening
export const TOTAL = Array.isArray(exercises) ? (exercises as unknown[]).length : 400;
export const MAX_XP = TOTAL * XP_PER;

const n = (v: unknown, max = 1e9) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));

/** Aantal opgeloste oefeningen, begrensd op het werkelijke totaal. */
export function clampSolved(solved: unknown): number {
  return n(solved, TOTAL);
}

/** XP begrenzen: ≤ 25 per opgeloste oefening én ≤ totaal mogelijke XP — onvervalsbaar. */
export function clampXp(xp: unknown, solvedClamped: number): number {
  return Math.min(n(xp), solvedClamped * XP_PER, MAX_XP);
}

/** Level afgeleid van XP — zelfde curve als de client-store (need ×1.25). */
export function deriveLevel(xp: number): number {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.25); }
  return lvl;
}
