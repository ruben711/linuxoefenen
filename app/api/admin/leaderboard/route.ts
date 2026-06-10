import { NextResponse } from "next/server";
import { redis, upstashConfigured } from "@/lib/upstash";
import { clampSolved, clampXp, deriveLevel } from "@/lib/leaderboardRules";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KEY_OPS = "lb:ops";
const KEY_RANK = "lb:rank";

/** Constante-tijd-vergelijking (lengte mag lekken — volstaat voor een verborgen admin). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
function authed(req: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false; // zonder secret is de admin uitgeschakeld
  return safeEqual(req.headers.get("x-admin-secret") || "", secret);
}

async function allRows(): Promise<{ keys: string[]; rows: Record<string, unknown>[] }> {
  const flat = await redis.zrevrangeWithScores(KEY_RANK, 0, -1);
  const keys: string[] = [];
  for (let i = 0; i < flat.length; i += 2) keys.push(flat[i]);
  const jsons = keys.length ? await redis.hmget(KEY_OPS, keys) : [];
  const rows = jsons.map((j) => { try { return JSON.parse(j as string); } catch { return null; } });
  return { keys, rows };
}

/** GET → alle ranglijst-rijen mét hun (IP-hash-)sleutel, voor moderatie. */
export async function GET(req: Request) {
  if (!process.env.ADMIN_SECRET) return NextResponse.json({ ok: false, adminConfigured: false });
  if (!authed(req)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!upstashConfigured()) return NextResponse.json({ ok: true, adminConfigured: true, upstash: false, board: [] });
  const { keys, rows } = await allRows();
  const board = rows
    .map((e, i) => (e ? { key: keys[i], name: (e as any).name, xp: (e as any).xp, level: (e as any).level, streak: (e as any).streak, solved: (e as any).solved, color: (e as any).color } : null))
    .filter(Boolean);
  return NextResponse.json({ ok: true, adminConfigured: true, upstash: true, board });
}

/** DELETE ?key=… → verwijder één inzending. */
export async function DELETE(req: Request) {
  if (!authed(req)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!upstashConfigured()) return NextResponse.json({ ok: false, upstash: false }, { status: 400 });
  const key = new URL(req.url).searchParams.get("key") || "";
  if (!key) return NextResponse.json({ ok: false, error: "geen key" }, { status: 400 });
  await redis.hdel(KEY_OPS, key);
  await redis.zrem(KEY_RANK, key);
  return NextResponse.json({ ok: true });
}

/** POST → herbereken: clamp XP + herleid level voor álle rijen (ruimt oude vervalsingen op). */
export async function POST(req: Request) {
  if (!authed(req)) return NextResponse.json({ ok: false }, { status: 401 });
  if (!upstashConfigured()) return NextResponse.json({ ok: false, upstash: false }, { status: 400 });
  const { keys, rows } = await allRows();
  let updated = 0;
  for (let i = 0; i < keys.length; i++) {
    const e = rows[i] as any;
    if (!e) continue;
    const solved = clampSolved(e.solved);
    const xp = clampXp(e.xp, solved);
    const level = deriveLevel(xp);
    if (xp !== e.xp || level !== e.level || solved !== e.solved) {
      await redis.hset(KEY_OPS, keys[i], JSON.stringify({ ...e, xp, solved, level }));
      await redis.zadd(KEY_RANK, xp, keys[i]);
      updated++;
    }
  }
  return NextResponse.json({ ok: true, updated, total: keys.length });
}
