import { NextResponse } from "next/server";
import { redis, upstashConfigured } from "@/lib/upstash";
import exercises from "@/data/exercises.json";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KEY_OPS = "lb:ops";
const KEY_RANK = "lb:rank";
const XP_PER = 25;                                              // flat 25 XP per opgeloste oefening
const TOTAL = Array.isArray(exercises) ? (exercises as unknown[]).length : 400;
const MAX_XP = TOTAL * XP_PER;                                  // absolute bovengrens
const num = (v: unknown, max = 1e9) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** Level afgeleid van XP — zelfde curve als de client (need ×1.25). Server-bepaald, dus onvervalsbaar. */
function deriveLevel(xp: number): number {
  let lvl = 1, need = 100, acc = 0;
  while (xp >= acc + need) { acc += need; lvl++; need = Math.round(need * 1.25); }
  return lvl;
}

/** Eén ranglijst-rij per IP: we sleutelen op een hash van het IP (privacy + anti-misbruik). */
async function ipKey(req: Request): Promise<string> {
  const fwd = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "";
  const ip = fwd.split(",")[0].trim() || "0.0.0.0";
  const salt = process.env.LOG_SECRET || process.env.ADMIN_SECRET || "bashacademy-lb";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ip + "|" + salt));
  return "ip_" + [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 20);
}

/** GET → top 50 operatoren (op XP). De eigen rij krijgt you:true (op basis van IP). */
export async function GET(req: Request) {
  if (!upstashConfigured()) return NextResponse.json({ ok: true, configured: false, board: [] });
  try {
    const me = await ipKey(req);
    const flat = await redis.zrevrangeWithScores(KEY_RANK, 0, 49);
    const keys: string[] = [];
    for (let i = 0; i < flat.length; i += 2) keys.push(flat[i]);
    const jsons = keys.length ? await redis.hmget(KEY_OPS, keys) : [];
    const board = jsons
      .map((j, i) => { try { const e = JSON.parse(j as string); return { name: e.name, xp: e.xp, level: e.level, streak: e.streak, solved: e.solved, color: e.color, you: keys[i] === me }; } catch { return null; } })
      .filter(Boolean);
    return NextResponse.json({ ok: true, configured: true, board });
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, board: [], error: String(e).slice(0, 120) });
  }
}

/** POST → upsert van JOUW rij, gesleuteld op IP-hash (dus max. één account per IP). */
export async function POST(req: Request) {
  if (!upstashConfigured()) return NextResponse.json({ ok: false, configured: false });
  try {
    const b = await req.json();
    const key = await ipKey(req);
    // Server-side begrenzing: XP is niet te vervalsen tot miljoenen.
    const solved = num(b.solved, TOTAL);                       // ≤ aantal oefeningen
    const xp = Math.min(num(b.xp), solved * XP_PER, MAX_XP);   // ≤ 25 per oplossing, ≤ totaal
    const entry = {
      name: str(b.name, 24) || "anoniem",
      xp, level: deriveLevel(xp), streak: num(b.streak, 3650),
      solved, color: str(b.color, 9), ts: Date.now(),
    };
    await redis.hset(KEY_OPS, key, JSON.stringify(entry));
    await redis.zadd(KEY_RANK, xp, key);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e).slice(0, 120) }, { status: 500 });
  }
}
