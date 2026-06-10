import { NextResponse } from "next/server";
import { redis, upstashConfigured } from "@/lib/upstash";

export const runtime = "edge";
export const dynamic = "force-dynamic";

const KEY_OPS = "lb:ops";
const KEY_RANK = "lb:rank";
const num = (v: unknown, max = 1e9) => Math.max(0, Math.min(max, Math.round(Number(v) || 0)));
const str = (v: unknown, n: number) => String(v ?? "").slice(0, n);

/** GET → top 50 operatoren (op XP), of {configured:false} in lokale modus. */
export async function GET() {
  if (!upstashConfigured()) return NextResponse.json({ ok: true, configured: false, board: [] });
  try {
    const flat = await redis.zrevrangeWithScores(KEY_RANK, 0, 49);
    const uids: string[] = [];
    for (let i = 0; i < flat.length; i += 2) uids.push(flat[i]);
    const jsons = uids.length ? await redis.hmget(KEY_OPS, uids) : [];
    const board = jsons
      .map((j, i) => { try { return { ...JSON.parse(j as string), uid: uids[i] }; } catch { return null; } })
      .filter(Boolean);
    return NextResponse.json({ ok: true, configured: true, board });
  } catch (e) {
    return NextResponse.json({ ok: false, configured: true, board: [], error: String(e).slice(0, 120) });
  }
}

/** POST → upsert van jouw eigen operator-rij. */
export async function POST(req: Request) {
  if (!upstashConfigured()) return NextResponse.json({ ok: false, configured: false });
  try {
    const b = await req.json();
    const uid = str(b.uid, 64);
    if (!uid) return NextResponse.json({ ok: false, error: "uid ontbreekt" }, { status: 400 });
    const xp = num(b.xp);
    const entry = {
      name: str(b.name, 24) || "anoniem",
      xp, level: num(b.level, 999), streak: num(b.streak, 9999),
      solved: num(b.solved, 99999), color: str(b.color, 9), ts: Date.now(),
    };
    await redis.hset(KEY_OPS, uid, JSON.stringify(entry));
    await redis.zadd(KEY_RANK, xp, uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e).slice(0, 120) }, { status: 500 });
  }
}
