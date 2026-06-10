"use client";
import { useEffect, useMemo, useState } from "react";
import { useIdentity } from "@/lib/identity";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { fetchBoard, syncMe, rankTitle, type Operator } from "@/lib/leaderboardSync";
import StyledName from "@/components/StyledName";
import Reveal from "@/components/motion/Reveal";

const PALETTE = ["#E95420", "#56c16a", "#33c7de", "#c061cb", "#f5c211", "#62a0ea", "#ed5050", "#e8dcc6"];

const DEMO: Operator[] = [
  { uid: "d1", name: "tux", xp: 1180, level: 9, streak: 21, solved: 46, color: "#33c7de" },
  { uid: "d2", name: "neo_root", xp: 940, level: 8, streak: 9, solved: 38, color: "#56c16a" },
  { uid: "d3", name: "grep_goeroe", xp: 760, level: 7, streak: 5, solved: 31, color: "#c061cb" },
  { uid: "d4", name: "sudo_sara", xp: 610, level: 6, streak: 12, solved: 26, color: "#E95420" },
  { uid: "d5", name: "pipe_pieter", xp: 430, level: 5, streak: 3, solved: 19, color: "#f5c211" },
  { uid: "d6", name: "kernel_kim", xp: 295, level: 4, streak: 2, solved: 13, color: "#62a0ea" },
  { uid: "d7", name: "chmod_chiel", xp: 150, level: 3, streak: 1, solved: 7, color: "#ed5050" },
  { uid: "d8", name: "awk_anouk", xp: 75, level: 2, streak: 1, solved: 4, color: "#e8dcc6" },
];

const SEG = 14;
function bar(xp: number, max: number): string {
  const f = xp <= 0 ? 0 : Math.max(1, Math.round((xp / max) * SEG));
  return "▓".repeat(f) + "░".repeat(SEG - f);
}
const medal = (r: number) => (r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : `#${r}`);
const clock = () => { const d = new Date(); return [d.getHours(), d.getMinutes(), d.getSeconds()].map((n) => String(n).padStart(2, "0")).join(":"); };

export default function LeaderboardPage() {
  const mounted = useMounted();
  const uid = useIdentity((s) => s.uid);
  const name = useIdentity((s) => s.name);
  const color = useIdentity((s) => s.color);
  const hasJoined = useIdentity((s) => s.hasJoinedBoard);
  const setName = useIdentity((s) => s.set);
  const setColor = useIdentity((s) => s.setColor);
  const ensure = useIdentity((s) => s.ensure);

  const xp = useProgress((s) => s.xp);
  const levelFn = useProgress((s) => s.level);
  const streakDays = useProgress((s) => s.streakDays);
  const solved = useProgress((s) => s.solved);
  const level = useMemo(() => levelFn().level, [levelFn, xp]);
  const solvedCount = mounted ? Object.keys(solved).length : 0;

  const [board, setBoard] = useState<Operator[]>([]);
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState("");
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState("#E95420");

  const me = useMemo<Operator & { uid: string }>(
    () => ({ uid, name: name ?? "jij", xp, level, streak: streakDays, solved: solvedCount, color }),
    [uid, name, xp, level, streakDays, solvedCount, color],
  );

  useEffect(() => {
    ensure();
    setDraftName(useIdentity.getState().randomName());
    setDraftColor(useIdentity.getState().color);
    setNow(clock());
    const t = setInterval(() => setNow(clock()), 1000);
    return () => clearInterval(t);
  }, [ensure]);

  async function refresh() {
    setLoading(true);
    if (hasJoined && uid) await syncMe(me);
    const res = await fetchBoard();
    setConfigured(res.configured);
    setBoard(res.board);
    setLoading(false);
  }

  function startEdit() { setDraftName(name ?? ""); setDraftColor(color); setEditing(true); }
  function saveEdit() {
    const nm = (draftName.trim() || useIdentity.getState().randomName()).slice(0, 24);
    setName(nm); setColor(draftColor); setEditing(false);
    syncMe({ uid, name: nm, xp, level, streak: streakDays, solved: solvedCount, color: draftColor });
  }
  useEffect(() => { if (mounted) refresh(); /* eslint-disable-next-line */ }, [mounted, hasJoined]);
  useEffect(() => {
    if (!mounted || !configured) return;
    const t = setInterval(() => fetchBoard().then((r) => { setConfigured(r.configured); setBoard(r.board); }), 20000);
    return () => clearInterval(t);
  }, [mounted, configured]);

  const rows = useMemo(() => {
    let list = configured ? [...board] : [...DEMO];
    if (hasJoined) list = [...list.filter((o) => o.uid !== uid && o.name !== me.name), me];
    return list.sort((a, b) => b.xp - a.xp).slice(0, 50);
  }, [board, configured, hasJoined, me, uid]);

  const maxXp = Math.max(1, ...rows.map((r) => r.xp));
  const myRank = rows.findIndex((r) => r.uid === uid) + 1;
  const totalXp = rows.reduce((a, r) => a + r.xp, 0);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-7 py-8 sm:py-10">
      <Reveal>
        <span className="kicker">ranglijst · operator-monitor</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Leader<span className="text-gradient">board</span></h1>
        <p className="mt-3 max-w-2xl text-[15px] text-fg-muted">
          Een live <span className="font-mono text-brand">htop</span> van alle operators, gerangschikt op verdiende inkt (XP).
          {!configured && " — lokale demo; verbind Upstash voor de échte gedeelde ranglijst."}
        </p>
      </Reveal>

      {/* Jouw profiel — automatisch aangesloten, vrij aanpasbaar */}
      {mounted && (
        <Reveal delay={0.05}>
          <div className="card p-4 mt-6">
            {!editing ? (
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[12px] text-fg-dim font-mono shrink-0">jij verschijnt als</span>
                <StyledName name={name ?? "operator"} color={color} level={level} showTitle />
                <span className="text-[12px] text-fg-dim font-mono tabular">· {xp} XP</span>
                <button onClick={startEdit} className="btn btn-outline btn-sm ml-auto">✎ wijzig naam &amp; kleur</button>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[13px] font-semibold">Jouw profiel</span>
                  <span className="text-[11px] text-fg-dim font-mono">handle &amp; kleur</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value.slice(0, 24))}
                    onKeyDown={(e) => { if (e.key === "Enter") saveEdit(); }}
                    className="h-10 px-3.5 rounded-xl bg-sunken border border-line font-mono text-[14px] outline-none focus:border-brand/50 w-[200px]"
                    aria-label="Jouw handle"
                  />
                  <button onClick={() => setDraftName(useIdentity.getState().randomName())} className="btn btn-ghost btn-sm" title="Willekeurige naam">🎲</button>
                  <div className="flex items-center gap-1.5 ml-1">
                    {PALETTE.map((c) => (
                      <button key={c} onClick={() => setDraftColor(c)} aria-label={`kleur ${c}`}
                        className={`w-6 h-6 rounded-full transition-transform ${draftColor === c ? "ring-2 ring-offset-2 ring-offset-canvas scale-110" : "hover:scale-110"}`}
                        style={{ background: c, boxShadow: draftColor === c ? `0 0 12px ${c}` : undefined }} />
                    ))}
                  </div>
                  <div className="ml-auto flex gap-2">
                    <button onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">annuleer</button>
                    <button onClick={saveEdit} className="btn btn-brand btn-sm">Bewaar</button>
                  </div>
                </div>
                <div className="mt-3 text-[12px] text-fg-dim">Voorbeeld: <StyledName name={draftName || "operator"} color={draftColor} level={level} showTitle /></div>
              </div>
            )}
          </div>
        </Reveal>
      )}

      {/* htop-monitor */}
      <Reveal delay={0.1}>
        <div className="terminal mt-6" data-live={!loading}>
          <div className="terminal-bar">
            <span className="terminal-dot" style={{ background: "#ff5f57" }} />
            <span className="terminal-dot" style={{ background: "#febc2e" }} />
            <span className="terminal-dot" style={{ background: "#28c840" }} />
            <span className="terminal-tab ml-2">operators — htop @ bashacademy</span>
            <span className="ml-auto flex items-center gap-3 text-2xs text-[color:rgb(var(--term-fg)/0.6)]">
              <span className="font-mono tabular">{now}</span>
              <button onClick={refresh} className="px-2 py-0.5 rounded hover:bg-white/10" title="Vernieuwen">↻</button>
            </span>
          </div>

          <div className="terminal-body" style={{ maxHeight: 540 }}>
            {/* samenvatting zoals top */}
            <div className="mb-2 text-[color:rgb(var(--term-fg)/0.85)]">
              <span className="text-[color:rgb(var(--t-cmd))]">operators</span>: {rows.length}
              <span className="mx-2 opacity-40">·</span>
              totale inkt: <span className="text-[color:rgb(var(--t-flag))]">{totalXp.toLocaleString("nl-BE")}</span> XP
              <span className="mx-2 opacity-40">·</span>
              {hasJoined ? <>jouw rang: <span className="text-[color:rgb(var(--t-op))]">#{myRank || "—"}</span></> : <span className="opacity-60">nog niet aangesloten</span>}
              {!configured && <span className="ml-2 text-[color:rgb(var(--t-comment))]"># lokale demo</span>}
            </div>

            {/* kolomkoppen */}
            <div className="grid grid-cols-[2.6rem_1fr_auto] sm:grid-cols-[2.6rem_minmax(0,1fr)_2.6rem_auto_3rem_3rem] gap-x-3 text-2xs uppercase tracking-wider text-[color:rgb(var(--term-fg)/0.45)] border-b border-white/10 pb-1.5">
              <span>rang</span>
              <span>operator</span>
              <span className="hidden sm:block text-right">lvl</span>
              <span>inkt (xp)</span>
              <span className="hidden sm:block text-right">🔥</span>
              <span className="hidden sm:block text-right">✓</span>
            </div>

            {/* rijen */}
            <div className="divide-y divide-white/5">
              {rows.map((op, i) => {
                const isMe = hasJoined && op.uid === uid;
                const c = op.color || "#E95420";
                return (
                  <div key={op.uid ?? op.name + i}
                    className={`grid grid-cols-[2.6rem_1fr_auto] sm:grid-cols-[2.6rem_minmax(0,1fr)_2.6rem_auto_3rem_3rem] gap-x-3 items-center py-1.5 ${isMe ? "bg-[rgb(var(--brand)/0.14)] rounded" : ""}`}>
                    <span className="font-mono text-[13px] text-[color:rgb(var(--term-fg)/0.8)]">{medal(i + 1)}</span>
                    <span className="min-w-0 flex items-center gap-2">
                      <StyledName name={op.name} color={c} level={op.level} showTitle />
                      {isMe && <span className="text-2xs text-[color:rgb(var(--t-op))] font-mono shrink-0">← jij</span>}
                    </span>
                    <span className="hidden sm:block text-right font-mono text-[12px] text-[color:rgb(var(--term-fg)/0.7)]">{op.level}</span>
                    <span className="font-mono text-[12.5px] whitespace-nowrap">
                      <span style={{ color: c }}>{bar(op.xp, maxXp)}</span>
                      <span className="ml-2 tabular text-[color:rgb(var(--term-fg)/0.9)]">{op.xp}</span>
                    </span>
                    <span className="hidden sm:block text-right font-mono text-[12px] text-[color:rgb(var(--term-fg)/0.7)]">🔥{op.streak}</span>
                    <span className="hidden sm:block text-right font-mono text-[12px] text-[color:rgb(var(--t-exec))]">{op.solved}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Reveal>

      <p className="mt-4 text-[12px] text-fg-dim font-mono">
        ↻ ververst automatisch elke 20s {configured ? "· live via Upstash" : "· demo-modus (geen server gekoppeld)"}.
      </p>
    </div>
  );
}
