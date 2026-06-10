/**
 * Bash-executor: voert een geparste commandoregel uit tegen een VFS.
 *
 * Verantwoordelijk voor:
 *  - expansie: variabelen ($VAR, ${VAR}, $?), command-substitutie $(...), globs (* ? [])
 *  - redirects: > >> < 2> 2>> &>  (schrijven naar de VFS)
 *  - pipes: stdout van het ene commando → stdin van het volgende
 *  - ketening: && (bij succes), || (bij fout), ; (altijd)
 *
 * Levert zowel een platte stdout-tekst (voor substitutie + grading) als
 * gekleurde display-regels (voor de terminal-UI).
 */
import {
  parse, type SimpleCommand, type Word, type Redirect,
} from "./bashTokenizer";
import { VFS } from "./vfs";
import { COMMANDS } from "./commands";
import type { Seg, CmdResult, CmdContext } from "./commands/types";

export type ExecResult = {
  lines: Seg[][];      // gekleurde regels voor de terminal
  stdoutText: string;  // platte stdout (voor $() en grading)
  code: number;        // exit code
  clear: boolean;      // scherm leegmaken
};

type Ctx = { vfs: VFS; env: Record<string, string> };

/* ───────────────────────── Expansie ───────────────────────── */
function expandText(text: string, ctx: Ctx, splitNewlines: boolean): string {
  // 1) command-substitutie $( ... )  (gebalanceerd)
  let out = "";
  let i = 0;
  while (i < text.length) {
    if (text[i] === "$" && text[i + 1] === "(") {
      let j = i + 2, depth = 1;
      while (j < text.length && depth > 0) {
        if (text[j] === "(") depth++;
        else if (text[j] === ")") depth--;
        if (depth > 0) j++;
      }
      const inner = text.slice(i + 2, j);
      const sub = execLine(inner, ctx);
      let captured = sub.stdoutText.replace(/\n+$/,"");
      if (splitNewlines) captured = captured.replace(/\n+/g, " ");
      out += captured;
      i = j + 1;
    } else {
      out += text[i];
      i++;
    }
  }
  // 2) variabelen ${NAME} en $NAME en $?
  out = out.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_, n) => ctx.env[n] ?? "");
  out = out.replace(/\$([A-Za-z_][A-Za-z0-9_]*|\?|#|@)/g, (_, n) => ctx.env[n] ?? "");
  return out;
}

function expandSegmentText(seg: { text: string; q: "none" | "single" | "double" }, ctx: Ctx): string {
  if (seg.q === "single") return seg.text;
  return expandText(seg.text, ctx, seg.q === "none");
}

/** Eén woord → nul of meer argv-strings (glob kan er meerdere maken). */
function expandWord(word: Word, ctx: Ctx): string[] {
  const assembled = word.map((s) => expandSegmentText(s, ctx)).join("");
  const globEligible = word.some((s) => s.q === "none" && /[*?[]/.test(s.text));
  if (globEligible) return expandGlob(ctx.vfs, assembled);
  if (assembled === "" && word.every((s) => s.q === "none")) return [];
  return [assembled];
}

/* ───────────────────────── Glob ───────────────────────── */
function segToRegex(seg: string): RegExp {
  let re = "^";
  for (let i = 0; i < seg.length; i++) {
    const c = seg[i];
    if (c === "*") re += "[^/]*";
    else if (c === "?") re += "[^/]";
    else if (c === "[") {
      let j = i + 1;
      let neg = false;
      if (seg[j] === "!" || seg[j] === "^") { neg = true; j++; }
      let cls = "";
      while (j < seg.length && seg[j] !== "]") { cls += seg[j]; j++; }
      re += "[" + (neg ? "^" : "") + cls.replace(/\\/g, "\\\\") + "]";
      i = j;
    } else {
      re += c.replace(/[.+^${}()|\\]/g, "\\$&");
    }
  }
  return new RegExp(re + "$");
}

function expandGlob(vfs: VFS, pattern: string): string[] {
  if (!/[*?[]/.test(pattern)) return [pattern];
  const absolute = pattern.startsWith("/");
  const parts = pattern.split("/");
  let frontier: { abs: string; disp: string[] }[] = [{ abs: absolute ? "/" : vfs.cwd, disp: [] }];

  for (let pi = absolute ? 1 : 0; pi < parts.length; pi++) {
    const seg = parts[pi];
    if (seg === "") continue;
    const hasMeta = /[*?[]/.test(seg);
    const next: typeof frontier = [];
    for (const f of frontier) {
      if (!hasMeta) {
        const childAbs = f.abs === "/" ? "/" + seg : f.abs + "/" + seg;
        if (vfs.exists(childAbs)) next.push({ abs: childAbs, disp: [...f.disp, seg] });
        continue;
      }
      const dir = vfs.getDir(f.abs);
      if (!dir) continue;
      const re = segToRegex(seg);
      const includeHidden = seg.startsWith(".");
      const names = Object.keys(dir.children)
        .filter((nm) => (includeHidden || !nm.startsWith(".")) && re.test(nm))
        .sort((a, b) => a.localeCompare(b, "en"));
      for (const nm of names) {
        const childAbs = f.abs === "/" ? "/" + nm : f.abs + "/" + nm;
        next.push({ abs: childAbs, disp: [...f.disp, nm] });
      }
    }
    frontier = next;
    if (!frontier.length) break;
  }
  if (!frontier.length) return [pattern]; // nullglob uit → letterlijk
  const prefix = absolute ? "/" : "";
  return frontier.map((f) => prefix + f.disp.join("/")).sort((a, b) => a.localeCompare(b, "en"));
}

/* ───────────────────────── Uitvoering ───────────────────────── */
function ensureNl(s: string): string {
  return s === "" ? "" : s.endsWith("\n") ? s : s + "\n";
}

function runSimple(cmd: SimpleCommand, stdin: string, ctx: Ctx): CmdResult {
  let argv: string[] = [];
  for (const w of cmd.words) argv.push(...expandWord(w, ctx));

  // Variabele-toekenningen vooraan peelen: NAME=value (export-loos) → in env zetten.
  let assignIdx = 0;
  while (assignIdx < argv.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(argv[assignIdx])) {
    const eq = argv[assignIdx].indexOf("=");
    ctx.env[argv[assignIdx].slice(0, eq)] = argv[assignIdx].slice(eq + 1);
    assignIdx++;
  }
  argv = argv.slice(assignIdx);
  // sudo: voer gewoon de rest uit (gesimuleerd als geprivilegieerd).
  while (argv[0] === "sudo") argv = argv.slice(1);

  // input-redirect (<)
  let inputData = stdin;
  for (const r of cmd.redirects) {
    if (r.op === "<") {
      const tgt = expandWord(r.target, ctx)[0] ?? "";
      const rr = ctx.vfs.readFile(tgt);
      if (rr.err) return { stderr: `bash: ${tgt}: No such file or directory`, code: 1 };
      inputData = rr.content!;
    }
  }

  let res: CmdResult;
  if (argv.length === 0) {
    res = {}; // enkel redirects (bv. `> leeg.txt`)
  } else {
    const name = argv[0];
    const handler = COMMANDS[name];
    if (!handler) res = { stderr: `bash: ${name}: command not found`, code: 127 };
    else {
      const c: CmdContext = { argv0: name, args: argv.slice(1), stdin: inputData, vfs: ctx.vfs, env: ctx.env };
      res = handler(c) || {};
    }
  }
  if (res.clear) return res;

  // output-redirects toepassen
  let stdout = res.stdout ?? "";
  let stderr = res.stderr ?? "";
  let display = res.display;
  for (const r of cmd.redirects) {
    if (r.op === "<") continue;
    const tgt = expandWord(r.target, ctx)[0] ?? "";
    if (r.op === ">" || r.op === ">>") {
      ctx.vfs.writeFile(tgt, ensureNl(stdout), { append: r.op === ">>" });
      stdout = ""; display = undefined;
    } else if (r.op === "2>" || r.op === "2>>") {
      ctx.vfs.writeFile(tgt, ensureNl(stderr), { append: r.op === "2>>" });
      stderr = "";
    } else if (r.op === "&>") {
      ctx.vfs.writeFile(tgt, ensureNl(stdout) + ensureNl(stderr), {});
      stdout = ""; stderr = ""; display = undefined;
    }
  }
  return { stdout, stderr, display, code: res.code ?? 0 };
}

function runPipeline(commands: SimpleCommand[], ctx: Ctx): {
  stdout: string; display?: Seg[][]; stderr: string[]; code: number; clear: boolean;
} {
  let stdin = "";
  let last: CmdResult = {};
  const stderrAll: string[] = [];
  for (const cmd of commands) {
    const res = runSimple(cmd, stdin, ctx);
    if (res.clear) return { stdout: "", stderr: [], code: 0, clear: true };
    if (res.stderr) stderrAll.push(res.stderr);
    // Lijn-georiënteerde commando's eindigen elke regel met \n; zorg dat de volgende
    // command in de pipe die afsluitende newline ziet (anders telt `wc -l` één te weinig).
    stdin = res.stdout ?? "";
    if (stdin && !stdin.endsWith("\n")) stdin += "\n";
    last = res;
  }
  return { stdout: last.stdout ?? "", display: last.display, stderr: stderrAll, code: last.code ?? 0, clear: false };
}

function splitToSegs(text: string): Seg[][] {
  if (text === "") return [];
  const lines = text.split("\n");
  if (lines[lines.length - 1] === "") lines.pop();
  return lines.map((l) => [{ text: l }]);
}

/** Voert een volledige commandoregel uit (incl. ketening). */
export function execLine(input: string, ctx: Ctx): ExecResult {
  const list = parse(input);
  const lines: Seg[][] = [];
  const stdoutParts: string[] = [];
  let status = parseInt(ctx.env["?"] ?? "0", 10) || 0;
  let clear = false;
  let skip = false;

  for (let i = 0; i < list.length; i++) {
    if (!skip) {
      const r = runPipeline(list[i].pipeline.commands, ctx);
      if (r.clear) {
        clear = true; lines.length = 0; stdoutParts.length = 0;
      } else {
        const outLines = r.display ?? splitToSegs(r.stdout);
        for (const l of outLines) lines.push(l);
        for (const e of r.stderr) for (const el of e.split("\n")) lines.push([{ text: el, cls: "term-error" }]);
        if (r.stdout) stdoutParts.push(r.stdout);
        status = r.code;
        ctx.env["?"] = String(status);
      }
    }
    const conn = list[i].connector;
    if (conn === "&&") skip = status !== 0;
    else if (conn === "||") skip = status === 0;
    else skip = false;
  }

  return { lines, stdoutText: stdoutParts.join("\n"), code: status, clear };
}

/** Publieke entry voor de terminal: voert uit en muteert de gedeelde VFS/env. */
export function runCommand(input: string, vfs: VFS, env: Record<string, string>): ExecResult {
  return execLine(input, { vfs, env });
}
