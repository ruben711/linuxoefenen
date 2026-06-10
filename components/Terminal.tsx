"use client";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Highlight from "./Highlight";
import TerminalPrompt from "./TerminalPrompt";
import type { Seg } from "@/lib/commands/types";

export type RunResult = { lines: Seg[][]; clear?: boolean; promptPath: string; root?: boolean };

type Block = { id: number; command: string | null; path: string; root: boolean; lines: Seg[][] };

type Props = {
  initialPath?: string;
  user?: string;
  host?: string;
  greeting?: Seg[][];
  commandNames?: string[];
  /** Pad-completion tegen de huidige VFS (geeft volledige token-vervangingen terug). */
  complete?: (token: string) => string[];
  onRun: (command: string) => RunResult;
  onAfterRun?: (command: string, result: RunResult) => void;
  /** `man <cmd>` → open overlay (cheat-sheet). Return true als afgehandeld. */
  onMan?: (cmd: string) => boolean;
  /** Voer een commando uit van buitenaf (bv. voorbeeldknop). Verhoog nonce per run. */
  injectCmd?: { value: string; nonce: number };
  /** Voorgevulde invoer (bv. herstel van een opgeslagen sessie). */
  initialInput?: string;
  placeholder?: string;
  bodyHeight?: number | string;
  title?: string;
  className?: string;
};

const commonPrefix = (strs: string[]): string => {
  if (!strs.length) return "";
  let p = strs[0];
  for (const s of strs) { let i = 0; while (i < p.length && i < s.length && p[i] === s[i]) i++; p = p.slice(0, i); }
  return p;
};
const baseLabel = (s: string) => {
  const t = s.replace(/\/$/, "");
  return t.slice(t.lastIndexOf("/") + 1) + (s.endsWith("/") ? "/" : "");
};

export default function Terminal({
  initialPath = "~",
  user = "student",
  host = "bashacademy",
  greeting,
  commandNames = [],
  complete,
  onRun,
  onAfterRun,
  onMan,
  injectCmd,
  initialInput = "",
  placeholder = "typ een commando…",
  bodyHeight = 380,
  title,
  className,
}: Props) {
  const seed = useMemo<Block[]>(
    () => (greeting && greeting.length ? [{ id: 0, command: null, path: initialPath, root: false, lines: greeting }] : []),
    [greeting, initialPath],
  );
  const [blocks, setBlocks] = useState<Block[]>(seed);
  const [input, setInput] = useState(initialInput);
  const [path, setPath] = useState(initialPath);

  const [history, setHistory] = useState<string[]>([]);
  const histIdx = useRef<number | null>(null);

  // tab-completion dropdown
  const [sugOpen, setSugOpen] = useState(false);
  const [sugItems, setSugItems] = useState<string[]>([]);
  const sugFull = useRef<string[]>([]);
  const [sugActive, setSugActive] = useState(0);

  // reverse-search (Ctrl+R)
  const [rActive, setRActive] = useState(false);
  const [rQuery, setRQuery] = useState("");
  const rIdx = useRef<number>(-1);
  const rMatch = rActive ? searchFrom(history, rQuery, rIdx.current) : "";

  const taRef = useRef<HTMLTextAreaElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(1);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${ta.scrollHeight}px`;
    if (pendingCaret.current != null) {
      ta.selectionStart = ta.selectionEnd = pendingCaret.current;
      pendingCaret.current = null;
    }
  }, [input, rQuery]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [blocks]);

  // Extern geïnjecteerd commando (voorbeeldknoppen).
  useEffect(() => {
    if (injectCmd && injectCmd.nonce > 0) { setInput(""); execute(injectCmd.value); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [injectCmd?.nonce]);

  /* ── token onder de cursor ── */
  function currentToken() {
    const ta = taRef.current;
    const caret = ta ? ta.selectionStart : input.length;
    let s = caret;
    while (s > 0 && !/\s/.test(input[s - 1])) s--;
    const token = input.slice(s, caret);
    const before = input.slice(0, s).trimEnd();
    const isCmd = before === "" || /[|;&]$/.test(before);
    return { token, start: s, caret, isCmd };
  }

  function applyCompletion(start: number, caret: number, full: string, finalize: boolean) {
    const suffix = finalize && !full.endsWith("/") ? " " : "";
    const next = input.slice(0, start) + full + suffix + input.slice(caret);
    pendingCaret.current = start + full.length + suffix.length;
    setInput(next);
    setSugOpen(false);
    taRef.current?.focus();
  }

  function doTab() {
    const { token, start, caret, isCmd } = currentToken();
    let candidates = isCmd
      ? commandNames.filter((c) => c.startsWith(token))
      : (complete?.(token) ?? []);
    candidates = Array.from(new Set(candidates));
    if (candidates.length === 0) return;
    if (candidates.length === 1) { applyCompletion(start, caret, candidates[0], true); return; }
    const cp = commonPrefix(candidates);
    if (cp.length > token.length) { applyCompletion(start, caret, cp, false); return; }
    sugFull.current = candidates;
    setSugItems(candidates.map(baseLabel));
    setSugActive(0);
    setSugOpen(true);
  }

  /* ── uitvoeren ── */
  function pushBlock(command: string | null, lines: Seg[][], atPath: string, root: boolean) {
    setBlocks((b) => [...b, { id: nextId.current++, command, path: atPath, root, lines }]);
  }

  function execute(raw: string) {
    let command = raw;
    const trimmed = command.trim();

    // history-expansie !!
    if (/^\s*!!/.test(command)) {
      const last = history[history.length - 1];
      if (last) command = command.replace(/!!/, last);
    }
    if (trimmed) setHistory((h) => [...h, raw.trim() === "!!" ? command.trim() : raw]);
    histIdx.current = null;

    if (!trimmed) { pushBlock("", [], path, false); setInput(""); return; }

    // ingebouwd: history-lijst
    if (trimmed === "history") {
      const lines: Seg[][] = history.map((h, i) => [
        { text: `${String(i + 1).padStart(5, " ")}  `, cls: "tok-comment" },
        { text: h },
      ]);
      pushBlock(command, lines, path, false);
      setInput("");
      return;
    }
    // man <cmd> → overlay
    const man = /^man\s+(\S+)/.exec(trimmed);
    if (man && onMan) {
      const handled = onMan(man[1]);
      if (handled) {
        pushBlock(command, [[{ text: `man-page voor `, cls: "tok-comment" }, { text: man[1], cls: "tok-cmd" }, { text: " geopend →", cls: "tok-comment" }]], path, false);
        setInput("");
        return;
      }
    }

    const result = onRun(command);
    if (result.clear) {
      setBlocks(result.lines.length ? [{ id: nextId.current++, command: null, path: result.promptPath, root: !!result.root, lines: result.lines }] : []);
    } else {
      pushBlock(command, result.lines, path, !!result.root);
    }
    setPath(result.promptPath);
    setInput("");
    onAfterRun?.(command, result);
  }

  /* ── reverse-search ── */
  function startOrCycleSearch() {
    if (!rActive) { setRActive(true); setRQuery(""); rIdx.current = history.length; }
    else { rIdx.current = searchIdxFrom(history, rQuery, rIdx.current - 1); setRQuery((q) => q); }
  }
  function endSearch(accept: boolean) {
    if (accept && rMatch) { setInput(rMatch); pendingCaret.current = rMatch.length; }
    setRActive(false); setRQuery("");
    setTimeout(() => taRef.current?.focus(), 0);
  }

  /* ── toetsen ── */
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // reverse-search modus
    if (rActive) {
      if (e.key === "Enter") { e.preventDefault(); endSearch(true); return; }
      if (e.key === "Escape" || (e.ctrlKey && (e.key === "c" || e.key === "g"))) { e.preventDefault(); endSearch(false); return; }
      if (e.ctrlKey && (e.key === "r" || e.key === "R")) { e.preventDefault(); startOrCycleSearch(); return; }
      return; // typen wordt via onChange → rQuery afgehandeld
    }

    if (e.ctrlKey && (e.key === "r" || e.key === "R")) { e.preventDefault(); startOrCycleSearch(); return; }
    if (e.ctrlKey && (e.key === "l" || e.key === "L")) { e.preventDefault(); setBlocks([]); return; }
    if (e.ctrlKey && (e.key === "c" || e.key === "C") && !window.getSelection()?.toString()) {
      e.preventDefault();
      pushBlock(input + "^C", [], path, false);
      setInput(""); setSugOpen(false); histIdx.current = null;
      return;
    }

    if (sugOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); setSugActive((i) => (i + 1) % sugItems.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSugActive((i) => (i - 1 + sugItems.length) % sugItems.length); return; }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        const { token, start, caret } = currentToken();
        applyCompletion(start, caret, sugFull.current[sugActive] ?? token, true);
        return;
      }
      if (e.key === "Escape") { e.preventDefault(); setSugOpen(false); return; }
    }

    if (e.key === "Tab") { e.preventDefault(); doTab(); return; }
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); execute(input); return; }

    if (e.key === "ArrowUp" && !e.shiftKey) {
      if (history.length === 0) return;
      e.preventDefault();
      const idx = histIdx.current === null ? history.length - 1 : Math.max(0, histIdx.current - 1);
      histIdx.current = idx;
      const v = history[idx]; setInput(v); pendingCaret.current = v.length;
      return;
    }
    if (e.key === "ArrowDown" && !e.shiftKey) {
      if (histIdx.current === null) return;
      e.preventDefault();
      const idx = histIdx.current + 1;
      if (idx > history.length - 1) { histIdx.current = null; setInput(""); }
      else { histIdx.current = idx; const v = history[idx]; setInput(v); pendingCaret.current = v.length; }
      return;
    }
  }

  return (
    <div
      className={`terminal select-text ${className ?? ""}`}
      data-live={input.length > 0}
      onMouseDown={() => { if (!window.getSelection()?.toString()) taRef.current?.focus(); }}
    >
      <div className="terminal-bar">
        <span className="terminal-dot" style={{ background: "#ff5f57" }} />
        <span className="terminal-dot" style={{ background: "#febc2e" }} />
        <span className="terminal-dot" style={{ background: "#28c840" }} />
        <span className="terminal-tab ml-2">{title ?? `${user}@${host}: ${path}`}</span>
        <button
          type="button"
          className="ml-auto text-2xs px-2 py-0.5 rounded hover:bg-white/10 text-[color:rgb(var(--term-fg)/0.7)]"
          onClick={(e) => { e.stopPropagation(); setBlocks([]); }}
          title="Scherm leegmaken (Ctrl+L)"
        >
          clear
        </button>
      </div>

      <div ref={bodyRef} className="terminal-body" style={{ height: bodyHeight }} data-lenis-prevent>
        {blocks.map((b) => (
          <div key={b.id} className="mb-0.5">
            {b.command !== null && (
              <div className="whitespace-pre-wrap break-words">
                <TerminalPrompt user={user} host={host} path={b.path} root={b.root} />
                <Highlight text={b.command} />
              </div>
            )}
            {b.lines.map((line, i) => (
              <div key={i} className="term-output">
                {line.length ? line.map((s, k) => <span key={k} className={s.cls}>{s.text}</span>) : " "}
              </div>
            ))}
          </div>
        ))}

        {/* actieve invoer */}
        <div className="relative flex items-start">
          <span className="shrink-0">
            {rActive
              ? <span className="term-dim whitespace-pre">{`(reverse-i-search)\`${rQuery}': `}</span>
              : <TerminalPrompt user={user} host={host} path={path} />}
          </span>
          <div className="term-input-wrap flex-1 min-w-0">
            <pre className="highlight" aria-hidden>
              {rActive
                ? (rMatch ? <Highlight text={rMatch} /> : <span className="term-dim">…</span>)
                : input ? <Highlight text={input} /> : <span className="term-dim">{placeholder}</span>}
              {"\n"}
            </pre>
            <textarea
              ref={taRef}
              value={rActive ? rQuery : input}
              rows={1}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              aria-label="Typ je commando"
              onChange={(e) => {
                if (rActive) { setRQuery(e.target.value); rIdx.current = history.length; }
                else { setInput(e.target.value); setSugOpen(false); histIdx.current = null; }
              }}
              onKeyDown={onKeyDown}
              onBlur={() => setTimeout(() => setSugOpen(false), 120)}
            />

            {sugOpen && sugItems.length > 0 && (
              <div className="term-suggest" style={{ bottom: "100%", left: 0, marginBottom: 4 }}>
                {sugItems.map((s, i) => (
                  <div
                    key={i}
                    className={`term-suggest-item ${i === sugActive ? "active" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const { token, start, caret } = currentToken();
                      applyCompletion(start, caret, sugFull.current[i] ?? token, true);
                    }}
                    onMouseEnter={() => setSugActive(i)}
                  >
                    <span className={s.endsWith("/") ? "tok-path" : "tok-plain"}>{s}</span>
                    <span className="hint">↹</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── reverse-search helpers ── */
function searchIdxFrom(history: string[], query: string, from: number): number {
  if (!query) return from;
  for (let k = Math.min(from, history.length - 1); k >= 0; k--) if (history[k].includes(query)) return k;
  return from < 0 ? -1 : -1;
}
function searchFrom(history: string[], query: string, from: number): string {
  if (!query) return history[Math.min(from, history.length - 1)] ?? "";
  const idx = searchIdxFrom(history, query, from);
  return idx >= 0 ? history[idx] : "";
}
