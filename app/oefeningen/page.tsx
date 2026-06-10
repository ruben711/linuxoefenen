"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { byChapter, DIFFICULTIES, type Difficulty, type Exercise } from "@/lib/exercises";
import { chapterMeta } from "@/lib/curriculum";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";

const DIFF_LABEL: Record<Difficulty, string> = { easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane" };
const XP = 25;

export default function OefeningenPage() {
  const mounted = useMounted();
  const solved = useProgress((s) => s.solved);
  const isFavorite = useProgress((s) => s.isFavorite);

  const [q, setQ] = useState("");
  const [diffs, setDiffs] = useState<Set<Difficulty>>(() => new Set(DIFFICULTIES));
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [favOnly, setFavOnly] = useState(false);

  const groups = useMemo(() => byChapter(), []);

  function toggleDiff(d: Difficulty) {
    setDiffs((prev) => {
      const n = new Set(prev);
      if (n.has(d)) n.delete(d); else n.add(d);
      return n;
    });
  }

  const match = (e: Exercise) => {
    if (!diffs.has(e.difficulty)) return false;
    if (onlyOpen && mounted && solved[e.id]) return false;
    if (favOnly && !(mounted && isFavorite(e.id))) return false;
    if (q.trim()) {
      const s = q.toLowerCase();
      if (!e.title.toLowerCase().includes(s) && !e.id.toLowerCase().includes(s) && !(e.tags ?? []).some((t) => t.toLowerCase().includes(s))) return false;
    }
    return true;
  };

  const shownGroups = groups
    .map((g) => ({ chapter: g.chapter, items: g.items.filter(match) }))
    .filter((g) => g.items.length);
  const shown = shownGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-6 py-6 sm:py-8">
      {/* Titelbalk */}
      <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-fg-dim">
          Oefeningen — <span className="text-brand-glow">bash &amp; linux</span>
        </span>
        <span className="font-mono text-[12px] text-fg-dim tabular">{shown} resultaten</span>
      </div>

      {/* Werkbalk */}
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-panel/40 px-3 py-2.5">
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-fg-dim pointer-events-none text-[13px]">⌕</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Zoek op titel of ID…"
            className="w-full h-8 pl-8 pr-3 rounded-lg bg-sunken border border-line text-[13px] outline-none focus:border-brand/50" />
        </div>
        <span className="hidden sm:block w-px h-5 bg-line mx-0.5" />
        <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-fg-dim">Moeilijkheid:</span>
        {DIFFICULTIES.map((d) => (
          <button key={d} onClick={() => toggleDiff(d)} title={`+${XP} XP bij eerste correcte oplossing`}
            className={`diff-pill diff-${d} transition-opacity ${diffs.has(d) ? "" : "opacity-30 hover:opacity-60"}`}>
            {d === "insane" ? "💀 " : ""}{DIFF_LABEL[d]}<span className="ml-1 text-[10px] opacity-70">+{XP}</span>
          </button>
        ))}
        <span className="hidden sm:block w-px h-5 bg-line mx-0.5" />
        <label className="flex items-center gap-1.5 text-[11.5px] text-fg-muted cursor-pointer select-none">
          <input type="checkbox" checked={onlyOpen} onChange={(e) => setOnlyOpen(e.target.checked)} style={{ accentColor: "rgb(var(--brand))" }} />
          Enkel openstaande
        </label>
        <button onClick={() => setFavOnly((v) => !v)} className={`chip !h-7 ${favOnly ? "border-warn/50 text-warn bg-warn/10" : ""}`}>★ favorieten</button>
      </div>

      {/* Lijst per hoofdstuk */}
      <div className="mt-3 space-y-3">
        {shownGroups.map((g) => {
          const meta = chapterMeta(g.chapter);
          const done = g.items.filter((e) => mounted && solved[e.id]).length;
          const pct = g.items.length ? Math.round((done / g.items.length) * 100) : 0;
          return (
            <section key={g.chapter} className="overflow-hidden rounded-xl border border-line bg-panel/40">
              <div className="flex items-center justify-between gap-3 px-3 py-2 bg-sunken/60 border-b border-line">
                <span className="font-mono text-[11px] uppercase tracking-wider truncate flex items-center gap-2">
                  <span className="text-brand-glow">{meta?.id ?? ""}</span>
                  <span className="text-fg-muted">{meta?.title ?? g.chapter}</span>
                </span>
                <span className="flex items-center gap-2 shrink-0 text-[11px] font-mono text-fg-dim">
                  <span className="tabular">{done} / {g.items.length}</span>
                  <span className="block w-16 h-1 rounded-full bg-sunken overflow-hidden">
                    <span className="block h-full rounded-full bg-ok transition-[width] duration-500" style={{ width: `${pct}%` }} />
                  </span>
                </span>
              </div>
              <div className="divide-y divide-line/60">
                {g.items.map((e) => {
                  const isDone = mounted && !!solved[e.id];
                  const fav = mounted && isFavorite(e.id);
                  return (
                    <Link key={e.id} href={`/oefeningen/${e.id}`}
                      className={`group flex items-center gap-2.5 px-3 py-[7px] hover:bg-hover/70 transition-colors ${isDone ? "bg-ok/[0.04]" : ""}`}>
                      <span className={`w-4 text-center text-[12px] shrink-0 ${isDone ? "text-ok" : "text-fg-faint"}`}>{isDone ? "✓" : "○"}</span>
                      <code className="hidden sm:block font-mono text-[11px] text-fg-faint w-16 shrink-0 truncate">{e.id}</code>
                      <span className={`diff-dot diff-${e.difficulty} shrink-0`} />
                      <span className="flex-1 min-w-0 text-[13.5px] truncate group-hover:text-brand transition-colors">{e.title}</span>
                      <span className={`diff-pill diff-${e.difficulty} shrink-0 hidden sm:inline-flex`}>{DIFF_LABEL[e.difficulty]}</span>
                      <span className={`xp-chip diff-${e.difficulty} shrink-0`} title={`+${XP} XP`}>+{XP} XP</span>
                      <div className="hidden md:flex gap-1 shrink-0">
                        {(e.tags ?? []).slice(0, 2).map((t) => <span key={t} className="tag-chip">{t}</span>)}
                      </div>
                      {fav && <span className="text-warn text-[12px] shrink-0" title="favoriet">★</span>}
                      <span className="text-fg-faint group-hover:text-brand group-hover:translate-x-0.5 transition-all shrink-0">→</span>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
        {shownGroups.length === 0 && (
          <div className="rounded-xl border border-line bg-panel/40 p-6 text-center text-fg-dim text-[13px]">
            Geen oefeningen voldoen aan de filters.
          </div>
        )}
      </div>
    </div>
  );
}
