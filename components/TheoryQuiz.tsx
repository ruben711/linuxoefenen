"use client";
import { useState } from "react";
import { correctIndex, type TheoryQuestion } from "@/lib/theorie";
import { cn } from "@/lib/cn";

export default function TheoryQuiz({ questions }: { questions: TheoryQuestion[] }) {
  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <QuestionCard key={q.id} q={q} index={i} />
      ))}
      {questions.length === 0 && (
        <div className="text-center py-12 text-fg-dim">Geen theorievragen in dit hoofdstuk.</div>
      )}
    </div>
  );
}

function QuestionCard({ q, index }: { q: TheoryQuestion; index: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const correct = correctIndex(q);

  return (
    <div className="card p-5">
      <div className="flex gap-3">
        <span className="grid place-items-center w-7 h-7 rounded-lg bg-sunken text-[12px] font-mono font-bold text-brand-glow shrink-0">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-medium leading-relaxed">{q.question}</p>

          {q.type === "mc" && q.choices ? (
            <div className="mt-3 space-y-2">
              {q.choices.map((c, i) => {
                const isCorrect = i === correct;
                const isPicked = i === picked;
                const show = picked !== null;
                return (
                  <button
                    key={i}
                    disabled={show}
                    onClick={() => { setPicked(i); setRevealed(true); }}
                    className={cn(
                      "w-full text-left flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-[14px] transition-all",
                      !show && "border-line bg-panel/40 hover:border-brand/40 hover:bg-hover/60",
                      show && isCorrect && "border-ok/50 bg-ok/10 text-ok",
                      show && isPicked && !isCorrect && "border-err/50 bg-err/10 text-err",
                      show && !isCorrect && !isPicked && "border-line bg-panel/30 opacity-60"
                    )}
                  >
                    <span className="font-mono text-[12px] mt-0.5 shrink-0">{String.fromCharCode(65 + i)}</span>
                    <span className="flex-1">{c}</span>
                    {show && isCorrect && <span className="shrink-0">✓</span>}
                    {show && isPicked && !isCorrect && <span className="shrink-0">✗</span>}
                  </button>
                );
              })}
            </div>
          ) : (
            <button
              onClick={() => setRevealed((v) => !v)}
              className="btn btn-ghost btn-sm mt-3"
            >
              {revealed ? "🙈 Verberg antwoord" : "👁️ Toon antwoord"}
            </button>
          )}

          {revealed && (q.explanation || q.type === "open") && (
            <div className="mt-3 rounded-lg bg-sunken border border-line px-3.5 py-2.5 text-[13.5px] animate-rise">
              {q.type === "open" && <div className="font-medium text-ok mb-1">Antwoord: {q.answer}</div>}
              {q.explanation && <p className="text-fg-muted leading-relaxed">{q.explanation}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
