"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Terminal, { type RunResult } from "./Terminal";
import ManpageOverlay from "./ManpageOverlay";
import { runCommand } from "@/lib/bashExecutor";
import { makeEnv } from "@/lib/vfsPresets";
import { buildExerciseWorld } from "@/lib/exerciseWorld";
import { COMMAND_NAMES } from "@/lib/commands";
import { gradeCommand, gradeStep } from "@/lib/bashGrader";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";
import { useXpToast } from "@/lib/xpToast";
import type { VFS } from "@/lib/vfs";
import type { Exercise } from "@/lib/exercises";

const DIFF_LABEL: Record<string, string> = { easy: "Makkelijk", medium: "Gemiddeld", hard: "Moeilijk", insane: "Insane" };

export default function ExerciseRunner({ exercise: ex }: { exercise: Exercise }) {
  const mounted = useMounted();
  const isMulti = ex.type === "multi-step" && !!ex.steps?.length;
  const steps = ex.steps ?? [];

  const recordAttempt = useProgress((s) => s.recordAttempt);
  const setSavedCommand = useProgress((s) => s.setSavedCommand);
  const getSavedCommand = useProgress((s) => s.getSavedCommand);
  const isFavorite = useProgress((s) => s.isFavorite);
  const toggleFavorite = useProgress((s) => s.toggleFavorite);
  const getNote = useProgress((s) => s.getNote);
  const setNote = useProgress((s) => s.setNote);
  const alreadySolved = useProgress((s) => !!s.solved[ex.id]);

  const vfsRef = useRef<VFS | null>(null);
  const envRef = useRef<Record<string, string> | null>(null);
  if (!vfsRef.current) { const v = buildExerciseWorld(ex); vfsRef.current = v; envRef.current = makeEnv(v); }

  const [step, setStep] = useState(0);
  const [solved, setSolved] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [inject, setInject] = useState({ value: "", nonce: 0 });
  const [manCmd, setManCmd] = useState<string | null>(null);
  const [hints, setHints] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [pulse, setPulse] = useState<"step" | "solved" | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [wrong, setWrong] = useState(false);

  // Antwoord-oefening: het juiste antwoord is géén commando (bv. een octaal getal,
  // een pad of een cron-regel) → tekstveld i.p.v. de terminal.
  const firstTok = (ex.solution ?? "").trim().split(/\s+/)[0] ?? "";
  const isAnswerType = !(ex.type === "multi-step" && ex.steps?.length) && !!ex.solution && (ex.type === "predict" || !COMMAND_NAMES.includes(firstTok));

  const fav = mounted && isFavorite(ex.id);
  const note = mounted ? getNote(ex.id) : "";

  const flash = (k: "step" | "solved") => { setPulse(k); setTimeout(() => setPulse(null), 1500); };

  function submitAnswer() {
    if (solved) return;
    const val = answerInput.trim();
    if (!val) return;
    const ok = gradeCommand(ex, val, "").correct;
    const gain = recordAttempt({ exerciseId: ex.id, correct: ok, command: val, difficulty: ex.difficulty });
    if (ok) { setSolved(true); setWrong(false); flash("solved"); if (gain > 0) useXpToast.getState().show(gain); }
    else setWrong(true);
  }

  const onRun = useCallback((cmd: string): RunResult => {
    const vfs = vfsRef.current!, env = envRef.current!;
    const r = runCommand(cmd, vfs, env);
    if (cmd.trim()) setSavedCommand(ex.id, cmd.trim());

    if (!solved && cmd.trim()) {
      if (isMulti) {
        const ok = gradeStep(steps[step], cmd, r.stdoutText).correct;
        if (ok) {
          if (step >= steps.length - 1) {
            const gain = recordAttempt({ exerciseId: ex.id, correct: true, command: cmd.trim(), difficulty: ex.difficulty });
            setSolved(true); flash("solved"); if (gain > 0) useXpToast.getState().show(gain);
          } else { setStep((s) => s + 1); flash("step"); }
        }
      } else {
        const ok = gradeCommand(ex, cmd, r.stdoutText).correct;
        const gain = recordAttempt({ exerciseId: ex.id, correct: ok, command: cmd.trim(), difficulty: ex.difficulty });
        if (ok) { setSolved(true); flash("solved"); if (gain > 0) useXpToast.getState().show(gain); }
      }
    }
    return { lines: r.lines, clear: r.clear, promptPath: vfs.promptPath(), root: vfs.user === "root" };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solved, step, isMulti]);

  const complete = useCallback((token: string): string[] => {
    const vfs = vfsRef.current!;
    const slash = token.lastIndexOf("/");
    const dirPart = slash >= 0 ? token.slice(0, slash + 1) : "";
    const base = slash >= 0 ? token.slice(slash + 1) : token;
    const names = vfs.listNames(dirPart || ".", { all: base.startsWith(".") }) ?? [];
    return names.filter((n) => n.startsWith(base)).map((n) => {
      const node = vfs.getNode(dirPart + n);
      return dirPart + n + (node?.type === "dir" ? "/" : "");
    });
  }, []);

  function restart() {
    const v = buildExerciseWorld(ex); vfsRef.current = v; envRef.current = makeEnv(v);
    setStep(0); setSolved(false); setResetKey((k) => k + 1);
  }

  const isDone = solved || (mounted && alreadySolved);
  const current = isMulti ? steps[step] : null;
  const prompt = isMulti ? current!.prompt : ex.prompt;
  const hintList = isMulti ? current?.hints ?? [] : ex.hints ?? [];
  const solution = isMulti ? steps.map((s, i) => `# stap ${i + 1}\n${s.solution}`).join("\n") : ex.solution;

  return (
    <div className="mx-auto max-w-3xl">
      <div>
        {/* Opgave-kaart */}
        <div className={`card p-5 sm:p-6 transition-shadow ${pulse === "solved" ? "shadow-glow-brand" : ""}`}>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <span className={`diff-pill diff-${ex.difficulty}`}>{DIFF_LABEL[ex.difficulty]}</span>
              <span className="text-[12px] font-mono text-fg-dim">{ex.chapter}</span>
              {isDone && <span className="chip text-ok border-ok/30 bg-ok/10">✓ opgelost</span>}
            </div>
            <button onClick={() => toggleFavorite(ex.id)} title="Favoriet"
              className={`grid place-items-center w-9 h-9 rounded-[11px] border transition-all ${fav ? "border-warn/50 bg-warn/10 text-warn" : "border-line text-fg-dim hover:text-fg hover:border-line-strong"}`}>
              {fav ? "★" : "☆"}
            </button>
          </div>

          <h1 className="mt-3 text-xl sm:text-2xl font-bold tracking-tight">{ex.title}</h1>

          {/* Multi-step tracker */}
          {isMulti && (
            <div className="mt-4 flex items-center gap-2">
              {steps.map((_, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`grid place-items-center w-7 h-7 rounded-full text-[12px] font-bold transition-all ${
                    i < step || solved ? "bg-ok/20 text-ok border border-ok/40" :
                    i === step ? "bg-brand text-on-brand" : "bg-sunken text-fg-dim border border-line"
                  }`}>
                    {i < step || solved ? "✓" : i + 1}
                  </div>
                  {i < steps.length - 1 && <div className={`w-6 h-px ${i < step || solved ? "bg-ok/50" : "bg-line"}`} />}
                </div>
              ))}
              <span className="ml-2 text-[12px] font-mono text-fg-dim">
                {solved ? "klaar!" : `stap ${step + 1}/${steps.length}`}
              </span>
            </div>
          )}

          <p className="mt-4 text-[15px] leading-relaxed text-fg-muted">{prompt}</p>

          {/* Succes-banner */}
          {isDone && (
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-ok/30 bg-ok/8 px-4 py-3 animate-pop">
              <span className="text-xl">🎉</span>
              <div className="text-[13.5px]">
                <span className="font-semibold text-ok">Correct opgelost!</span>
                <span className="text-fg-dim"> — Goed bezig. Op naar de volgende.</span>
              </div>
            </div>
          )}

          {/* Hints + oplossing */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {hints < hintList.length && (
              <button onClick={() => setHints((h) => h + 1)} className="btn btn-ghost btn-sm">
                💡 {hints === 0 ? "Hint" : "Nog een hint"}
              </button>
            )}
            {solution && (
              <button onClick={() => setShowSolution((s) => !s)} className="btn btn-ghost btn-sm">
                {showSolution ? "🙈 Verberg oplossing" : "👁️ Toon oplossing"}
              </button>
            )}
            <button onClick={restart} className="btn btn-ghost btn-sm">↺ Herstart</button>
            <button onClick={() => setShowNotes((s) => !s)} className="btn btn-ghost btn-sm">📝 Notitie</button>
          </div>

          {hintList.slice(0, hints).map((h, i) => (
            <div key={i} className="mt-2 flex gap-2.5 rounded-lg bg-sunken border border-line px-3.5 py-2.5 text-[13.5px] text-fg-muted animate-rise">
              <span className="text-warn shrink-0">💡</span><span>{h}</span>
            </div>
          ))}

          {showSolution && solution && (
            <div className="mt-3 rounded-lg bg-sunken border border-line p-3.5 animate-rise">
              <div className="text-[11px] font-mono uppercase tracking-wider text-fg-dim mb-1.5">Modeloplossing</div>
              <pre className="font-mono text-[13px] text-t-cmd whitespace-pre-wrap" style={{ color: "rgb(var(--t-cmd))" }}>{solution}</pre>
            </div>
          )}

          {showNotes && mounted && (
            <textarea
              value={note}
              onChange={(e) => setNote(ex.id, e.target.value)}
              placeholder="Je persoonlijke notitie bij deze oefening…"
              className="mt-3 w-full h-20 rounded-lg bg-sunken border border-line px-3 py-2 text-[13.5px] outline-none focus:border-brand/50 resize-none"
            />
          )}
        </div>

        {/* Werkbank: terminal (commando-oefening) of antwoordveld (kennisvraag) */}
        <div className="mt-5">
          {isAnswerType ? (
            <div className="card p-5">
              <label className="text-[11px] font-mono uppercase tracking-wider text-fg-dim">Jouw antwoord</label>
              <div className="mt-2 flex gap-2">
                <input
                  value={answerInput}
                  onChange={(e) => { setAnswerInput(e.target.value); setWrong(false); }}
                  onKeyDown={(e) => { if (e.key === "Enter") submitAnswer(); }}
                  disabled={isDone}
                  placeholder="typ je antwoord (bv. een octaal getal of pad)…"
                  className="flex-1 h-11 px-3.5 rounded-xl bg-sunken border border-line font-mono text-[14px] outline-none focus:border-brand/50 disabled:opacity-60"
                />
                <button onClick={submitAnswer} disabled={isDone} className="btn btn-brand shrink-0">Controleer</button>
              </div>
              {wrong && <p className="mt-2.5 text-[13px] text-err">Nog niet juist — probeer opnieuw of bekijk een hint.</p>}
              <p className="mt-2.5 text-[12px] text-fg-dim">Dit is een kennisvraag — typ het antwoord, geen commando.</p>
            </div>
          ) : (
            <>
              <Terminal
                key={resetKey}
                user="student" host="bashacademy" initialPath={vfsRef.current!.promptPath()}
                commandNames={COMMAND_NAMES}
                complete={complete}
                onRun={onRun}
                onMan={(c) => { setManCmd(c); return true; }}
                injectCmd={inject}
                initialInput={mounted ? getSavedCommand(ex.id) ?? "" : ""}
                bodyHeight={360}
                title={`oefening — student@bashacademy`}
              />
              <p className="mt-2.5 text-[12px] text-fg-dim">
                Typ je oplossing en druk <kbd className="kbd">Enter</kbd>. Vastgelopen? Open zelf de{" "}
                <Link href="/cheatsheet" className="text-brand hover:underline">cheat-sheet</Link>{" "}
                of typ <code className="font-mono text-brand-glow">man &lt;commando&gt;</code> — net als op het examen.
              </p>
            </>
          )}
        </div>
      </div>

      <ManpageOverlay
        cmd={manCmd}
        onClose={() => setManCmd(null)}
        onTry={(c) => { setManCmd(null); setInject((s) => ({ value: c, nonce: s.nonce + 1 })); }}
      />
    </div>
  );
}
