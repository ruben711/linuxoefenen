"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Terminal, { type RunResult } from "./Terminal";
import CheatsheetExplorer from "./CheatsheetExplorer";
import { runCommand } from "@/lib/bashExecutor";
import { makeVfs, makeEnv } from "@/lib/vfsPresets";
import { buildExerciseWorld } from "@/lib/exerciseWorld";
import { COMMAND_NAMES } from "@/lib/commands";
import { gradeCommand, gradeStep } from "@/lib/bashGrader";
import { randomSample, chapters as allChapters, type Exercise } from "@/lib/exercises";
import { useProgress } from "@/lib/store";

const DIFF_LABEL: Record<string, string> = { easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane" };
const fmtTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

type Result = { correct: boolean; skipped: boolean };

export default function ExamRunner() {
  const recordAttempt = useProgress((s) => s.recordAttempt);
  const chapterList = useMemo(() => allChapters(), []);

  const [phase, setPhase] = useState<"config" | "running" | "done">("config");
  const [count, setCount] = useState(10);
  const [cheatAvailable, setCheatAvailable] = useState(true);
  const [scopeChapters, setScopeChapters] = useState<string[]>([]);

  const [pool, setPool] = useState<Exercise[]>([]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Record<string, Result>>({});
  const [step, setStep] = useState(0);
  const [solvedNow, setSolvedNow] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [cheatOpen, setCheatOpen] = useState(false);
  const [inject, setInject] = useState({ value: "", nonce: 0 });

  const vfsRef = useRef(makeVfs());
  const envRef = useRef(makeEnv(vfsRef.current));

  // timer
  useEffect(() => {
    if (phase !== "running") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [phase]);

  const current = pool[idx];
  const isMulti = current?.type === "multi-step" && !!current.steps?.length;

  function start() {
    const picked = randomSample(count, { chapters: scopeChapters.length ? scopeChapters : undefined });
    if (picked.length === 0) return;
    setPool(picked);
    setResults({});
    setIdx(0); setStep(0); setSolvedNow(false); setSeconds(0);
    resetVfs(picked[0]);
    setPhase("running");
  }
  function resetVfs(ex: Exercise) {
    vfsRef.current = buildExerciseWorld(ex);
    envRef.current = makeEnv(vfsRef.current);
  }

  const onRun = useCallback((cmd: string): RunResult => {
    const vfs = vfsRef.current, env = envRef.current;
    const r = runCommand(cmd, vfs, env);
    const ex = pool[idx];
    if (ex && !solvedNow && cmd.trim()) {
      if (isMulti) {
        if (gradeStep(ex.steps![step], cmd, r.stdoutText).correct) {
          if (step >= ex.steps!.length - 1) setSolvedNow(true);
          else setStep((s) => s + 1);
        }
      } else if (gradeCommand(ex, cmd, r.stdoutText).correct) {
        setSolvedNow(true);
      }
    }
    return { lines: r.lines, clear: r.clear, promptPath: vfs.promptPath(), root: vfs.user === "root" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, step, solvedNow, isMulti, pool]);

  const complete = useCallback((token: string): string[] => {
    const vfs = vfsRef.current;
    const slash = token.lastIndexOf("/");
    const dirPart = slash >= 0 ? token.slice(0, slash + 1) : "";
    const base = slash >= 0 ? token.slice(slash + 1) : token;
    const names = vfs.listNames(dirPart || ".", { all: base.startsWith(".") }) ?? [];
    return names.filter((n) => n.startsWith(base)).map((n) => { const node = vfs.getNode(dirPart + n); return dirPart + n + (node?.type === "dir" ? "/" : ""); });
  }, []);

  function advance(asCorrect: boolean) {
    const ex = pool[idx];
    if (ex) {
      setResults((r) => ({ ...r, [ex.id]: { correct: asCorrect, skipped: !asCorrect && !solvedNow } }));
      if (asCorrect) recordAttempt({ exerciseId: ex.id, correct: true, command: ex.solution ?? "", difficulty: ex.difficulty });
    }
    if (idx >= pool.length - 1) { setPhase("done"); return; }
    const next = idx + 1;
    setIdx(next); setStep(0); setSolvedNow(false); setCheatOpen(false);
    resetVfs(pool[next]);
  }

  /* ───────── CONFIG ───────── */
  if (phase === "config") {
    return (
      <div className="mx-auto max-w-xl">
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-bold">Stel je examen in</h2>
          <p className="mt-1.5 text-[14px] text-fg-muted">Willekeurige oefeningen, een timer, en een cheat-sheet die je wél of niet mag gebruiken — net als bij het echte examen.</p>

          <div className="mt-6">
            <div className="text-[12px] font-mono uppercase tracking-wider text-fg-dim mb-2">Aantal vragen</div>
            <div className="flex gap-2">
              {[5, 10, 15, 25].map((n) => (
                <button key={n} onClick={() => setCount(n)} className={`btn btn-sm ${count === n ? "btn-brand" : "btn-outline"}`}>{n}</button>
              ))}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[12px] font-mono uppercase tracking-wider text-fg-dim mb-2">Cheat-sheet</div>
            <div className="flex gap-2">
              <button onClick={() => setCheatAvailable(true)} className={`btn btn-sm ${cheatAvailable ? "btn-brand" : "btn-outline"}`}>📖 Beschikbaar</button>
              <button onClick={() => setCheatAvailable(false)} className={`btn btn-sm ${!cheatAvailable ? "btn-brand" : "btn-outline"}`}>🔒 Strict (verborgen)</button>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-[12px] font-mono uppercase tracking-wider text-fg-dim mb-2">Hoofdstukken (leeg = alles)</div>
            <div className="flex flex-wrap gap-1.5">
              {chapterList.map((ch) => {
                const on = scopeChapters.includes(ch);
                return (
                  <button key={ch} onClick={() => setScopeChapters((s) => on ? s.filter((x) => x !== ch) : [...s, ch])}
                    className={`chip ${on ? "border-brand/50 text-fg bg-brand/10" : ""}`}>{ch}</button>
                );
              })}
            </div>
          </div>

          <button onClick={start} className="btn btn-brand w-full mt-7 h-12">Start examen →</button>
        </div>
      </div>
    );
  }

  /* ───────── DONE ───────── */
  if (phase === "done") {
    const correct = Object.values(results).filter((r) => r.correct).length;
    const pct = pool.length ? Math.round((correct / pool.length) * 100) : 0;
    return (
      <div className="mx-auto max-w-2xl">
        <div className="card p-7 text-center">
          <div className="text-5xl mb-3">{pct >= 70 ? "🎉" : pct >= 50 ? "💪" : "📚"}</div>
          <h2 className="text-2xl font-bold">{correct}/{pool.length} correct — {pct}%</h2>
          <p className="mt-1 text-fg-dim font-mono">tijd: {fmtTime(seconds)}</p>
          <div className="mt-6 space-y-2 text-left">
            {pool.map((ex) => {
              const r = results[ex.id];
              return (
                <div key={ex.id} className="flex items-start gap-3 rounded-xl border border-line bg-panel/40 p-3.5">
                  <span className={r?.correct ? "text-ok" : "text-err"}>{r?.correct ? "✓" : "✗"}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-medium">{ex.title}</div>
                    <code className="text-[12.5px] font-mono text-brand-glow break-all">{ex.solution}</code>
                  </div>
                  <span className={`diff-pill diff-${ex.difficulty} shrink-0`}>{DIFF_LABEL[ex.difficulty]}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => setPhase("config")} className="btn btn-brand mt-7">Nieuw examen</button>
        </div>
      </div>
    );
  }

  /* ───────── RUNNING ───────── */
  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4 sticky top-16 z-20 bg-canvas/80 backdrop-blur py-2 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-mono text-fg-dim">vraag {idx + 1}/{pool.length}</span>
          <div className="h-1.5 w-32 rounded-full bg-sunken overflow-hidden">
            <div className="h-full bg-brand-gradient transition-[width]" style={{ width: `${((idx) / pool.length) * 100}%` }} />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="chip font-mono tabular">⏱ {fmtTime(seconds)}</span>
          {cheatAvailable && <button onClick={() => setCheatOpen((v) => !v)} className="btn btn-outline btn-sm">📖 Cheat-sheet</button>}
        </div>
      </div>

      {current && (
        <div className="card p-5 sm:p-6">
          <div className="flex items-center gap-2.5">
            <span className={`diff-pill diff-${current.difficulty}`}>{DIFF_LABEL[current.difficulty]}</span>
            <span className="text-[12px] font-mono text-fg-dim">{current.chapter}</span>
            {solvedNow && <span className="chip text-ok border-ok/30 bg-ok/10 ml-auto">✓ correct</span>}
          </div>
          <h2 className="mt-3 text-lg font-semibold">{current.title}</h2>
          {isMulti && <div className="mt-1 text-[12px] font-mono text-fg-dim">stap {Math.min(step + 1, current.steps!.length)}/{current.steps!.length}</div>}
          <p className="mt-3 text-[15px] text-fg-muted leading-relaxed">{isMulti ? current.steps![Math.min(step, current.steps!.length - 1)].prompt : current.prompt}</p>
        </div>
      )}

      <div className="mt-4">
        <Terminal
          key={idx}
          user="student" host="examen" initialPath={vfsRef.current.promptPath()}
          commandNames={COMMAND_NAMES}
          complete={complete}
          onRun={onRun}
          injectCmd={inject}
          bodyHeight={300}
          title="examen — student@bashacademy"
        />
      </div>

      <div className="mt-4 flex justify-between">
        <button onClick={() => advance(false)} className="btn btn-ghost btn-sm">Sla over →</button>
        <button onClick={() => advance(solvedNow)} className={`btn btn-sm ${solvedNow ? "btn-brand" : "btn-outline"}`}>
          {idx >= pool.length - 1 ? "Beëindig examen" : "Volgende vraag →"}
        </button>
      </div>

      {/* Cheat-sheet drawer */}
      {cheatAvailable && cheatOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCheatOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-panel border-l border-line shadow-flyout p-5 overflow-y-auto animate-rise" data-lenis-prevent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[14px] font-semibold">📖 Cheat-sheet</span>
              <button onClick={() => setCheatOpen(false)} className="btn btn-ghost btn-sm">sluiten ✕</button>
            </div>
            <CheatsheetExplorer compact onTry={(c) => { setInject((s) => ({ value: c, nonce: s.nonce + 1 })); setCheatOpen(false); }} tryLabel="in terminal" />
          </div>
        </div>
      )}
    </div>
  );
}
