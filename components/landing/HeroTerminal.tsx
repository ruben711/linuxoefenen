"use client";
import { useEffect, useRef, useState } from "react";

type Seg = { text: string; cls?: string };
type Step = { cmd: string; out: Seg[][] };

const D = (text: string): Seg => ({ text, cls: "ls-dir" });
const F = (text: string): Seg => ({ text, cls: "ls-file" });
const P = (text: string): Seg => ({ text });

const SESSION: Step[] = [
  { cmd: "whoami", out: [[P("student")]] },
  {
    cmd: "ls -l",
    out: [
      [P("drwxr-xr-x  2 student student  4096 jun 10 09:14 "), D("documenten")],
      [P("drwxr-xr-x  2 student student  4096 jun 10 09:14 "), D("projecten")],
      [P("-rw-r--r--  1 student student   220 jun 10 09:02 "), F(".bashrc")],
    ],
  },
  { cmd: "mkdir -p projecten/web && cd projecten/web", out: [] },
  { cmd: 'echo "hallo wereld" > index.txt', out: [] },
  { cmd: "cat index.txt", out: [[P("hallo wereld")]] },
  { cmd: "wc -w index.txt", out: [[P("2 index.txt")]] },
];

/** Eenvoudige display-highlighter voor de hero (de echte engine zit in lib/). */
function highlight(cmd: string): Seg[] {
  const segs: Seg[] = [];
  const re = /(\s+)|("[^"]*"|'[^']*')|(\|\||&&|>>|>|<|\|)|(-{1,2}[A-Za-z0-9-]+)|([^\s]+)/g;
  let first = true;
  let m: RegExpExecArray | null;
  while ((m = re.exec(cmd))) {
    if (m[1]) segs.push({ text: m[1] });
    else if (m[2]) segs.push({ text: m[2], cls: "tok-str" });
    else if (m[3]) { segs.push({ text: m[3], cls: "tok-op" }); first = true; continue; }
    else if (m[4]) segs.push({ text: m[4], cls: "tok-flag" });
    else if (m[5]) {
      segs.push({ text: m[5], cls: first ? "tok-cmd" : m[5].includes("/") ? "tok-path" : "tok-plain" });
    }
    if (m[5]) first = false;
  }
  return segs;
}

function Prompt({ path }: { path: string }) {
  return (
    <span className="select-none">
      <span style={{ color: "rgb(var(--t-cmd))" }}>student@bashacademy</span>
      <span style={{ color: "rgb(var(--term-fg) / 0.6)" }}>:</span>
      <span style={{ color: "rgb(var(--t-path))" }}>{path}</span>
      <span style={{ color: "rgb(var(--term-fg) / 0.85)" }}>$ </span>
    </span>
  );
}

function CmdLine({ path, segs }: { path: string; segs: Seg[] }) {
  return (
    <div className="whitespace-pre-wrap break-words">
      <Prompt path={path} />
      {segs.map((s, i) => (
        <span key={i} className={s.cls}>{s.text}</span>
      ))}
    </div>
  );
}

const PATHS = ["~", "~", "~", "~/projecten/web", "~/projecten/web", "~/projecten/web", "~/projecten/web"];

export default function HeroTerminal() {
  const [done, setDone] = useState<number>(0);
  const [current, setCurrent] = useState<Step | null>(SESSION[0]);
  const [typed, setTyped] = useState("");
  const [showOut, setShowOut] = useState(false);
  const [live, setLive] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((res) => { timers.push(window.setTimeout(res, ms)); });

    async function play() {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) { setDone(SESSION.length); setCurrent(null); return; }

      for (let i = 0; i < SESSION.length; i++) {
        if (cancelled) return;
        const step = SESSION[i];
        setCurrent(step); setTyped(""); setShowOut(false); setLive(true);
        await wait(420);
        for (let c = 1; c <= step.cmd.length; c++) {
          if (cancelled) return;
          setTyped(step.cmd.slice(0, c));
          await wait(step.cmd[c - 1] === " " ? 46 : 30 + (c % 3) * 8);
        }
        setLive(false);
        await wait(260);
        if (cancelled) return;
        setShowOut(true);
        await wait(420 + step.out.length * 110);
        if (cancelled) return;
        setDone(i + 1);
      }
      setCurrent(null);
    }
    void play();
    return () => { cancelled = true; timers.forEach((t) => clearTimeout(t)); };
  }, []);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [done, typed, showOut]);

  return (
    <div className="terminal w-full" data-live={live} aria-hidden>
      <div className="terminal-bar">
        <span className="terminal-dot" style={{ background: "#ff5f57" }} />
        <span className="terminal-dot" style={{ background: "#febc2e" }} />
        <span className="terminal-dot" style={{ background: "#28c840" }} />
        <span className="terminal-tab ml-2">student@bashacademy: ~</span>
      </div>

      <div ref={bodyRef} className="terminal-body" style={{ height: 320 }}>
        {SESSION.slice(0, done).map((step, i) => (
          <div key={i} className="mb-1">
            <CmdLine path={PATHS[i]} segs={highlight(step.cmd)} />
            {step.out.map((line, j) => (
              <div key={j} className="term-output">
                {line.map((s, k) => (
                  <span key={k} className={s.cls}>{s.text}</span>
                ))}
              </div>
            ))}
          </div>
        ))}

        {current && (
          <div className="mb-1">
            <div className="whitespace-pre-wrap break-words">
              <Prompt path={PATHS[done]} />
              {highlight(typed).map((s, i) => (
                <span key={i} className={s.cls}>{s.text}</span>
              ))}
              <span className="inline-block w-[8px] h-[1.05em] -mb-[0.18em] bg-[rgb(var(--t-cmd))] animate-caret" />
            </div>
            {showOut &&
              current.out.map((line, j) => (
                <div key={j} className="term-output animate-rise" style={{ animationDelay: `${j * 70}ms` }}>
                  {line.map((s, k) => (
                    <span key={k} className={s.cls}>{s.text}</span>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
