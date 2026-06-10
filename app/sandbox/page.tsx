"use client";
import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import Terminal, { type RunResult } from "@/components/Terminal";
import { runCommand } from "@/lib/bashExecutor";
import { makeVfs, makeEnv } from "@/lib/vfsPresets";
import { COMMAND_NAMES } from "@/lib/commands";
import type { VFS } from "@/lib/vfs";
import type { Seg } from "@/lib/commands/types";
import Reveal from "@/components/motion/Reveal";
import ManpageOverlay from "@/components/ManpageOverlay";

const GREETING: Seg[][] = [
  [{ text: "Welkom in de sandbox — een vrij Ubuntu-systeem om mee te spelen.", cls: "tok-comment" }],
  [
    { text: "Probeer ", cls: "tok-comment" }, { text: "ls -la", cls: "tok-cmd" },
    { text: ", ", cls: "tok-comment" }, { text: "mkdir test && cd test", cls: "tok-cmd" },
    { text: " of ", cls: "tok-comment" }, { text: "help", cls: "tok-cmd" },
    { text: ". ", cls: "tok-comment" },
  ],
  [{ text: "Tab vult aan · ↑/↓ doorloopt history · Ctrl+R zoekt · Ctrl+L wist het scherm.", cls: "tok-comment" }],
];

const EXAMPLES = [
  "ls -la",
  "cat /etc/os-release",
  "mkdir -p projecten/demo && cd projecten/demo",
  "echo 'hallo' > hi.txt && cat hi.txt",
  "ls documenten/*.csv",
  "echo $USER op $HOSTNAME",
];

export default function SandboxPage() {
  const vfsRef = useRef<VFS | null>(null);
  const envRef = useRef<Record<string, string> | null>(null);
  if (!vfsRef.current) { const v = makeVfs(); vfsRef.current = v; envRef.current = makeEnv(v); }

  const [resetKey, setResetKey] = useState(0);
  const [inject, setInject] = useState({ value: "", nonce: 0 });
  const [manCmd, setManCmd] = useState<string | null>(null);

  const runExample = (cmd: string) => setInject((s) => ({ value: cmd, nonce: s.nonce + 1 }));

  const onRun = useCallback((cmd: string): RunResult => {
    const vfs = vfsRef.current!, env = envRef.current!;
    const r = runCommand(cmd, vfs, env);
    return { lines: r.lines, clear: r.clear, promptPath: vfs.promptPath(), root: vfs.user === "root" };
  }, []);

  const complete = useCallback((token: string): string[] => {
    const vfs = vfsRef.current!;
    const slash = token.lastIndexOf("/");
    const dirPart = slash >= 0 ? token.slice(0, slash + 1) : "";
    const base = slash >= 0 ? token.slice(slash + 1) : token;
    const names = vfs.listNames(dirPart || ".", { all: base.startsWith(".") }) ?? [];
    return names
      .filter((n) => n.startsWith(base))
      .map((n) => { const node = vfs.getNode(dirPart + n); return dirPart + n + (node?.type === "dir" ? "/" : ""); });
  }, []);

  function reset() {
    const v = makeVfs(); vfsRef.current = v; envRef.current = makeEnv(v);
    setResetKey((k) => k + 1);
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-5 sm:px-7 py-8 sm:py-10">
      <Reveal>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="kicker">vrije speeltuin</span>
            <h1 className="mt-3 text-4xl font-bold tracking-tight">
              Sand<span className="text-gradient">box</span>
            </h1>
            <p className="mt-3 max-w-xl text-[15px] text-fg-muted">
              Geen oefening, geen score — gewoon een echt aanvoelend Ubuntu-systeem.
              Typ wat je wil; je wijzigingen blijven bewaard tot je reset.
            </p>
          </div>
          <button onClick={reset} className="btn btn-outline btn-sm shrink-0" title="Filesystem herstellen">
            ↺ Reset filesystem
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-7">
          <Terminal
            key={resetKey}
            user="student"
            host="bashacademy"
            initialPath="~"
            greeting={GREETING}
            commandNames={COMMAND_NAMES}
            complete={complete}
            onRun={onRun}
            onMan={(cmd) => { setManCmd(cmd); return true; }}
            injectCmd={inject}
            bodyHeight={440}
          />
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="mt-6">
          <div className="text-[12px] font-mono text-fg-dim mb-2.5 uppercase tracking-wider">Probeer dit</div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => runExample(ex)}
                className="chip font-mono hover:border-brand/50 hover:text-fg transition-colors"
                title="Voer uit in de terminal"
              >
                <span className="text-brand-glow">$</span> {ex}
              </button>
            ))}
          </div>
          <p className="mt-5 text-[13px] text-fg-dim">
            Tip: weet je een commando niet meer? De{" "}
            <Link href="/cheatsheet" className="text-brand hover:underline">cheat-sheet</Link>{" "}
            staat altijd voor je klaar — net als bij het examen.
          </p>
        </div>
      </Reveal>

      <ManpageOverlay
        cmd={manCmd}
        onClose={() => setManCmd(null)}
        onTry={(c) => { setManCmd(null); runExample(c); }}
      />
    </div>
  );
}
