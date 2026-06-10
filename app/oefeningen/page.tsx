"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { byChapter, DIFFICULTIES, getExercises, type Difficulty } from "@/lib/exercises";
import { chapterMeta } from "@/lib/curriculum";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import Reveal from "@/components/motion/Reveal";

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane" };

export default function OefeningenPage() {
  const mounted = useMounted();
  const solved = useProgress((s) => s.solved);
  const isFavorite = useProgress((s) => s.isFavorite);

  const [q, setQ] = useState("");
  const [diff, setDiff] = useState<Difficulty | null>(null);
  const [favOnly, setFavOnly] = useState(false);

  const groups = useMemo(() => byChapter(), []);
  const total = getExercises().length;
  const doneCount = mounted ? Object.keys(solved).length : 0;

  const match = (e: { title: string; difficulty: Difficulty; id: string; tags?: string[] }) => {
    if (diff && e.difficulty !== diff) return false;
    if (favOnly && !(mounted && isFavorite(e.id))) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!e.title.toLowerCase().includes(s) && !(e.tags ?? []).some((t) => t.includes(s))) return false;
    }
    return true;
  };

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 py-8 sm:py-10">
      <Reveal>
        <span className="kicker">oefenterrein</span>
        <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold tracking-tight">Oefe<span className="text-gradient">ningen</span></h1>
          <span className="text-[13px] font-mono text-fg-dim">{mounted ? doneCount : 0}/{total} opgelost</span>
        </div>
      </Reveal>

      {/* Filters */}
      <Reveal delay={0.06}>
        <div className="mt-6 flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim pointer-events-none">⌕</span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek een oefening…"
              className="w-full h-9 pl-9 pr-3 rounded-xl bg-sunken border border-line text-[13.5px] outline-none focus:border-brand/50" />
          </div>
          <button onClick={() => setDiff(null)} className={`chip ${!diff ? "border-brand/50 text-fg bg-brand/10" : ""}`}>alle niveaus</button>
          {DIFFICULTIES.map((d) => (
            <button key={d} onClick={() => setDiff(diff === d ? null : d)} className={`diff-pill diff-${d} transition-opacity ${diff === d ? "" : "opacity-55 hover:opacity-100"}`}>
              {DIFF_LABEL[d]}
            </button>
          ))}
          <button onClick={() => setFavOnly((v) => !v)} className={`chip ${favOnly ? "border-warn/50 text-warn bg-warn/10" : ""}`}>★ favorieten</button>
        </div>
      </Reveal>

      {/* Lijst per hoofdstuk */}
      <div className="mt-8 space-y-9">
        {groups.map((g) => {
          const items = g.items.filter(match);
          if (items.length === 0) return null;
          const meta = chapterMeta(g.chapter);
          const done = items.filter((e) => mounted && solved[e.id]).length;
          const pct = items.length ? Math.round((done / items.length) * 100) : 0;
          return (
            <section key={g.chapter}>
              <div className="flex items-center gap-3 mb-3">
                <span className="grid place-items-center w-11 h-11 rounded-xl bg-sunken border border-line text-xl shrink-0">{meta?.icon ?? "📂"}</span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-[16px] font-semibold flex items-center gap-2">
                    <span className="font-mono text-[11px] text-brand-glow">{meta?.id ?? ""}</span>
                    <span className="truncate">{meta?.title ?? g.chapter}</span>
                  </h2>
                  <div className="mt-1.5 flex items-center gap-2.5">
                    <div className="h-1.5 w-32 rounded-full bg-sunken overflow-hidden">
                      <div className="h-full rounded-full bg-brand-gradient transition-[width] duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] font-mono text-fg-dim tabular">{done}/{items.length}</span>
                  </div>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-line bg-panel/40 divide-y divide-line/60">
                {items.map((e, i) => {
                  const isDone = mounted && !!solved[e.id];
                  const fav = mounted && isFavorite(e.id);
                  return (
                    <Link key={e.id} href={`/oefeningen/${e.id}`}
                      className="group flex items-center gap-3.5 px-3.5 sm:px-4 py-3 hover:bg-hover/60 transition-colors">
                      <span className="font-mono text-[12px] text-fg-faint w-6 text-right tabular shrink-0">{i + 1}</span>
                      <span className={`diff-pill diff-${e.difficulty} shrink-0`}>{DIFF_LABEL[e.difficulty]}</span>
                      <span className="flex-1 min-w-0 text-[14.5px] font-medium truncate group-hover:text-brand transition-colors">{e.title}</span>
                      {e.type && e.type !== "command" && (
                        <span className="hidden md:inline text-[10px] font-mono text-fg-faint uppercase tracking-wider shrink-0">{e.type}</span>
                      )}
                      {fav && <span className="text-warn text-[13px] shrink-0" title="favoriet">★</span>}
                      {isDone
                        ? <span className="text-ok shrink-0" title="opgelost">✓</span>
                        : <span className="text-fg-faint group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0">→</span>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        {groups.every((g) => g.items.filter(match).length === 0) && (
          <div className="text-center py-16 text-fg-dim">Geen oefeningen gevonden met deze filters.</div>
        )}
      </div>
    </div>
  );
}
