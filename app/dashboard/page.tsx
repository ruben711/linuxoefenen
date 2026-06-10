"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { getExercises, DIFFICULTIES, type Difficulty } from "@/lib/exercises";
import { CURRICULUM, chapterMeta } from "@/lib/curriculum";
import Reveal from "@/components/motion/Reveal";

const DIFF_LABEL: Record<Difficulty, string> = {
  easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane",
};

export default function DashboardPage() {
  const mounted = useMounted();
  const xp = useProgress((s) => s.xp);
  const streakDays = useProgress((s) => s.streakDays);
  const solved = useProgress((s) => s.solved);
  const attempts = useProgress((s) => s.attempts);
  const levelFn = useProgress((s) => s.level);
  const badgesFn = useProgress((s) => s.badges);

  const level = useMemo(() => levelFn(), [levelFn, xp]);
  const badges = useMemo(() => badgesFn(), [badgesFn, xp, solved, streakDays, attempts]);

  const exercises = getExercises();
  const solvedIds = mounted ? Object.keys(solved) : [];
  const solvedSet = new Set(solvedIds);
  const solvedCount = solvedIds.length;

  // Voortgang per hoofdstuk (op basis van het vaste curriculum)
  const perChapter = CURRICULUM.map((c) => {
    const items = exercises.filter((e) => chapterMeta(e.chapter)?.id === c.id);
    const done = items.filter((e) => solvedSet.has(e.id)).length;
    return { ...c, total: items.length, done };
  });

  const perDiff = DIFFICULTIES.map((d) => {
    const items = exercises.filter((e) => e.difficulty === d);
    const done = items.filter((e) => solvedSet.has(e.id)).length;
    return { d, total: items.length, done };
  });

  // Suggesties: eerstvolgende onopgeloste oefeningen
  const suggestions = exercises.filter((e) => !solvedSet.has(e.id)).slice(0, 3);
  const recent = mounted ? attempts.slice(0, 6) : [];

  const greeting = mounted ? timeGreeting() : "Welkom terug";
  const pct = Math.round(Math.max(0, Math.min(1, level.progress)) * 100);
  const deg = Math.round((mounted ? Math.max(0, Math.min(1, level.progress)) : 0) * 360);
  const xpToNext = Math.max(0, level.nextAt - xp);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 py-8 sm:py-10">
      {/* ───────── HERO ───────── */}
      <div className="relative overflow-hidden rounded-[26px] border border-line bg-panel/60 p-6 sm:p-8">
        <div className="absolute inset-0 -z-10 bg-brand-gradient-soft opacity-50" />
        <div className="flex flex-col lg:flex-row lg:items-center gap-8">
          {/* Level-orb */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="relative grid place-items-center w-[124px] h-[124px]">
              <div
                className="absolute inset-0 rounded-full transition-all duration-700"
                style={{ background: `conic-gradient(from -90deg, rgb(var(--brand-glow)), rgb(var(--brand)) ${deg * 0.6}deg, rgb(var(--magenta)) ${deg}deg, rgb(var(--line-strong)) ${deg}deg)` }}
              />
              <div className="absolute inset-[7px] rounded-full bg-canvas/95 backdrop-blur" />
              <div className="absolute inset-0 rounded-full shadow-[0_0_40px_-6px_rgb(var(--brand)/0.5)]" />
              <div className="relative text-center">
                <div className="text-[10px] font-mono text-fg-dim -mb-1">LEVEL</div>
                <div className="text-4xl font-bold tabular text-gradient leading-none">{mounted ? level.level : "—"}</div>
              </div>
            </div>
            <div className="lg:hidden">
              <Flame streak={mounted ? streakDays : 0} />
            </div>
          </div>

          {/* Tekst + XP-bar */}
          <div className="flex-1 min-w-0">
            <span className="kicker">{greeting}</span>
            <h1 className="mt-2 text-2xl sm:text-[28px] font-bold tracking-tight">
              {mounted ? xp.toLocaleString("nl-BE") : 0} <span className="text-fg-dim text-xl font-semibold">XP</span>
            </h1>
            <div className="mt-4 max-w-md">
              <div className="flex justify-between text-[12px] text-fg-dim mb-1.5 font-mono">
                <span>level {mounted ? level.level : "—"}</span>
                <span>{mounted ? `nog ${xpToNext} XP → level ${level.level + 1}` : ""}</span>
              </div>
              <div className="relative h-2.5 rounded-full bg-sunken overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-brand-gradient transition-[width] duration-700 ease-out-expo"
                  style={{ width: `${pct}%` }}
                />
                <div className="absolute inset-0 animate-shimmer opacity-40"
                  style={{ background: "linear-gradient(90deg, transparent, rgb(255 255 255 / 0.4), transparent)", backgroundSize: "200% 100%" }} />
              </div>
            </div>
          </div>

          {/* Streak (desktop) */}
          <div className="hidden lg:block shrink-0">
            <Flame streak={mounted ? streakDays : 0} />
          </div>
        </div>
      </div>

      {/* ───────── STAT-TILES ───────── */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile icon="✅" label="Opgelost" value={mounted ? solvedCount : 0} sub={`van ${exercises.length || "…"}`} />
        <StatTile icon="⚡" label="Pogingen" value={mounted ? attempts.length : 0} sub="totaal" />
        <StatTile icon="🏅" label="Badges" value={mounted ? badges.length : 0} sub="verdiend" />
        <StatTile icon="🔥" label="Streak" value={mounted ? streakDays : 0} sub="dagen op rij" />
      </div>

      <div className="mt-8 grid lg:grid-cols-[1.4fr_1fr] gap-8">
        {/* ───────── VOORTGANG PER HOOFDSTUK ───────── */}
        <section>
          <SectionTitle title="Voortgang per hoofdstuk" hint="17 hoofdstukken" />
          <div className="mt-4 space-y-2.5">
            {perChapter.map((c, i) => (
              <Reveal key={c.id} delay={Math.min(i * 0.02, 0.25)}>
                <Link
                  href="/oefeningen"
                  className="group flex items-center gap-3 rounded-xl border border-line bg-panel/50 px-3.5 py-2.5 hover:border-brand/40 transition-colors"
                >
                  <span className="grid place-items-center w-9 h-9 rounded-lg bg-sunken text-base shrink-0">{c.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[13.5px] font-medium truncate">
                        <span className="font-mono text-[11px] text-brand-glow mr-1.5">{c.id}</span>{c.title}
                      </span>
                      <span className="text-[11px] font-mono text-fg-dim shrink-0">
                        {c.total ? `${c.done}/${c.total}` : "binnenkort"}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-sunken overflow-hidden">
                      <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-500"
                        style={{ width: c.total ? `${(c.done / c.total) * 100}%` : "0%" }} />
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ───────── RECHTERKOLOM ───────── */}
        <div className="space-y-8">
          {/* Vandaag te studeren */}
          <section>
            <SectionTitle title="Vandaag te studeren" />
            <div className="mt-4 space-y-3">
              {suggestions.length > 0 ? (
                suggestions.map((e) => (
                  <Link key={e.id} href={`/oefeningen/${e.id}`}
                    className="block rounded-xl border border-line bg-panel/50 p-4 hover:border-brand/40 lift">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`diff-pill diff-${e.difficulty}`}>{DIFF_LABEL[e.difficulty]}</span>
                      <span className="text-[11px] font-mono text-fg-dim">{e.chapter}</span>
                    </div>
                    <div className="mt-2 text-[14px] font-medium">{e.title}</div>
                  </Link>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-line bg-panel/40 p-5 text-center">
                  <div className="text-3xl mb-2">🌱</div>
                  <p className="text-[13.5px] text-fg-muted">
                    Nog geen oefeningen geladen. Warm op in de{" "}
                    <Link href="/sandbox" className="text-brand hover:underline">sandbox</Link> of verken de{" "}
                    <Link href="/cheatsheet" className="text-brand hover:underline">cheat-sheet</Link>.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Per moeilijkheid */}
          <section>
            <SectionTitle title="Per moeilijkheid" />
            <div className="mt-4 space-y-2">
              {perDiff.map(({ d, total, done }) => (
                <div key={d} className="flex items-center gap-3">
                  <span className={`diff-pill diff-${d} w-[104px] justify-center`}>{DIFF_LABEL[d]}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-sunken overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: total ? `${(done / total) * 100}%` : "0%", background: `rgb(var(--diff-${d}))` }} />
                  </div>
                  <span className="text-[11px] font-mono text-fg-dim w-12 text-right">{total ? `${done}/${total}` : "—"}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* ───────── BADGES ───────── */}
      <section className="mt-10">
        <SectionTitle title="Badges" hint={mounted ? `${badges.length} verdiend` : ""} />
        {mounted && badges.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2.5">
            {badges.map((b) => (
              <span key={b} className="chip h-9 px-4 text-[13px] bg-panel/60 animate-pop">{b}</span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[13.5px] text-fg-dim">
            Los je eerste oefening op om je eerste badge te verdienen. 🎯
          </p>
        )}
      </section>

      {/* ───────── RECENTE POGINGEN ───────── */}
      {recent.length > 0 && (
        <section className="mt-10">
          <SectionTitle title="Recente pogingen" />
          <div className="mt-4 overflow-hidden rounded-xl border border-line">
            {recent.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${i % 2 ? "bg-panel/30" : "bg-panel/50"}`}>
                <span className={a.correct ? "text-ok" : "text-err"}>{a.correct ? "✓" : "✗"}</span>
                <code className="text-[12.5px] font-mono text-fg-muted truncate flex-1">{a.command || "—"}</code>
                <span className="text-[11px] text-fg-faint font-mono shrink-0">{relTime(a.ts)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/* ───────── Subcomponenten ───────── */
function SectionTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="text-[15px] font-semibold tracking-tight">{title}</h2>
      {hint && <span className="text-[11px] font-mono text-fg-dim">{hint}</span>}
    </div>
  );
}

function StatTile({ icon, label, value, sub }: { icon: string; label: string; value: number; sub: string }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2.5">
        <span className="grid place-items-center w-9 h-9 rounded-lg bg-sunken text-base">{icon}</span>
        <span className="text-[12px] text-fg-dim font-medium">{label}</span>
      </div>
      <div className="mt-2.5 text-3xl font-bold tabular">{value}</div>
      <div className="text-[11px] text-fg-faint font-mono">{sub}</div>
    </div>
  );
}

function Flame({ streak }: { streak: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-line bg-sunken/60 px-5 py-3">
      <span className="text-3xl" style={{ filter: streak > 0 ? "saturate(1.3)" : "grayscale(1) opacity(0.5)" }}>🔥</span>
      <div className="leading-none">
        <div className="text-2xl font-bold tabular">{streak}</div>
        <div className="text-[11px] text-fg-dim font-mono mt-0.5">dag-streak</div>
      </div>
    </div>
  );
}

function timeGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "Nog wakker?";
  if (h < 12) return "Goeiemorgen";
  if (h < 18) return "Goeiemiddag";
  return "Goeieavond";
}

function relTime(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "net";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}u`;
  return `${Math.floor(s / 86400)}d`;
}
