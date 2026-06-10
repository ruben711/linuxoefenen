"use client";
import { useMemo, useState } from "react";
import { getTheory, theoryByChapter, theoryChapters } from "@/lib/theorie";
import { chapterMeta } from "@/lib/curriculum";
import TheoryQuiz from "@/components/TheoryQuiz";
import Reveal from "@/components/motion/Reveal";

export default function TheoriePage() {
  const chapters = useMemo(() => theoryChapters(), []);
  const [active, setActive] = useState<string | null>(chapters[0] ?? null);
  const questions = active ? theoryByChapter(active) : [];
  const total = getTheory().length;

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 py-8 sm:py-10">
      <Reveal>
        <span className="kicker">study-mode · geen XP</span>
        <div className="mt-3 flex items-end justify-between gap-4 flex-wrap">
          <h1 className="text-4xl font-bold tracking-tight">Theo<span className="text-gradient">rie</span></h1>
          <span className="text-[13px] font-mono text-fg-dim">{total} vragen</span>
        </div>
        <p className="mt-3 max-w-2xl text-[15px] text-fg-muted">
          Toets je begrip met meerkeuze- en open vragen per hoofdstuk. Geen punten, geen tijdsdruk —
          puur om de concepten te laten landen.
        </p>
      </Reveal>

      {chapters.length === 0 ? (
        <div className="mt-10 text-center text-fg-dim">Nog geen theorievragen geladen.</div>
      ) : (
        <div className="mt-8 grid lg:grid-cols-[240px_minmax(0,1fr)] gap-7">
          {/* Hoofdstuk-navigatie */}
          <aside>
            <div className="lg:sticky lg:top-20 flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0">
              {chapters.map((ch) => {
                const meta = chapterMeta(ch);
                const n = theoryByChapter(ch).length;
                const on = active === ch;
                return (
                  <button
                    key={ch}
                    onClick={() => setActive(ch)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left whitespace-nowrap transition-all ${
                      on ? "border-brand/50 bg-brand/10 text-fg" : "border-line bg-panel/40 text-fg-dim hover:text-fg hover:border-line-strong"
                    }`}
                  >
                    <span className="text-base shrink-0">{meta?.icon ?? "📘"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[13px] font-medium truncate">{meta?.title ?? ch}</span>
                      <span className="block text-[10.5px] font-mono opacity-70">{n} vragen</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Vragen */}
          <div className="min-w-0">
            {active && (
              <Reveal key={active}>
                <h2 className="text-[15px] font-semibold mb-4 flex items-center gap-2">
                  <span>{chapterMeta(active)?.icon}</span> {active}
                </h2>
                <TheoryQuiz questions={questions} />
              </Reveal>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
