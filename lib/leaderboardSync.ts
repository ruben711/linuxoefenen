"use client";

export type Operator = {
  uid?: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  solved: number;
  color?: string;
  ts?: number;
};

/** Linux-rang afgeleid van je level (geen invoer nodig). */
const RANKS: [number, string][] = [
  [12, "sudo-meester"], [9, "kernel-hacker"], [7, "pipe-smid"],
  [5, "shell-adept"], [3, "shell-leerling"], [1, "tty-rookie"],
];
export function rankTitle(level: number): string {
  for (const [min, t] of RANKS) if (level >= min) return t;
  return "tty-rookie";
}

export async function fetchBoard(): Promise<{ configured: boolean; board: Operator[] }> {
  try {
    const r = await fetch("/api/leaderboard", { cache: "no-store" });
    const d = await r.json();
    return { configured: !!d.configured, board: Array.isArray(d.board) ? d.board : [] };
  } catch {
    return { configured: false, board: [] };
  }
}

export async function syncMe(op: Operator & { uid: string }): Promise<boolean> {
  try {
    const r = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(op),
    });
    const d = await r.json();
    return !!d.ok;
  } catch {
    return false;
  }
}
