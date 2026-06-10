/**
 * Pattern-matching grader.
 *
 * Drie complementaire strategieën (een oefening kan er één of meer gebruiken):
 *  1. acceptors      — vergelijk het commando in CANONIEKE vorm met geldige vormen
 *                      (ongevoelig voor quotes, spaties, flag-volgorde, -la vs -al)
 *  2. expectedOutput — vergelijk de werkelijke stdout met de verwachte regels
 *                      (exact | set (volgorde-onafhankelijk) | contains)
 *  3. mustInclude/forbid + acceptRegex — losse vangnetten voor vrije vormen
 */
import { parse, wordRaw } from "./bashTokenizer";
import type { Exercise, Step, OutputMatch } from "./exercises";

export type GradeResult = { correct: boolean; reason?: string };

/* ───────────────────────── canonicalisatie ───────────────────────── */
/** Brengt een commandoregel naar een canonieke vorm voor acceptor-vergelijking. */
export function normalizeCommand(input: string): string {
  const list = parse(input);
  const segments: string[] = [];

  for (const item of list) {
    const pipeParts: string[] = [];
    for (const cmd of item.pipeline.commands) {
      const argv = cmd.words.map(wordRaw).filter((s) => s !== "");
      if (argv.length === 0) continue;
      const name = argv[0];
      const shortFlags: string[] = [];
      const longFlags: string[] = [];
      const positionals: string[] = [];

      for (let i = 1; i < argv.length; i++) {
        const a = argv[i];
        if (a.startsWith("--")) longFlags.push(a);
        else if (/^-[A-Za-z]+$/.test(a)) {
          // gecombineerde korte flags → losse letters (ls -la ≡ -al ≡ -l -a)
          for (const ch of a.slice(1)) shortFlags.push("-" + ch);
        } else if (a.startsWith("-") && a.length > 1) {
          longFlags.push(a); // bv. -n5, -name (consistent op beide kanten)
        } else {
          positionals.push(stripSlash(a));
        }
      }
      shortFlags.sort();
      longFlags.sort();
      const redirs = cmd.redirects.map((r) => `${r.op}${stripSlash(wordRaw(r.target))}`).sort();
      pipeParts.push([name, ...shortFlags, ...longFlags, ...positionals, ...redirs].join(" "));
    }
    if (pipeParts.length) segments.push(pipeParts.join(" | "));
  }
  return segments.join(" ; ").replace(/\s+/g, " ").trim();
}

function stripSlash(s: string): string {
  return s.length > 1 && s.endsWith("/") ? s.replace(/\/+$/, "") : s;
}

/* ───────────────────────── output-vergelijking ───────────────────────── */
function toLines(text: string): string[] {
  return text.split("\n").map((l) => l.replace(/\s+$/, "")).filter((l, i, arr) => !(l === "" && i === arr.length - 1));
}

export function matchOutput(actual: string, expected: string[], mode: OutputMatch = "set"): boolean {
  const a = toLines(actual).map((l) => l.trim()).filter(Boolean);
  const e = expected.map((l) => l.trim()).filter(Boolean);
  if (mode === "exact") return a.length === e.length && a.every((l, i) => l === e[i]);
  if (mode === "contains") return e.every((line) => a.includes(line));
  // set: zelfde verzameling, volgorde-onafhankelijk
  const sa = [...a].sort(), se = [...e].sort();
  return sa.length === se.length && sa.every((l, i) => l === se[i]);
}

/* ───────────────────────── tokens ───────────────────────── */
function includesAll(cmd: string, tokens: string[]): boolean {
  const norm = normalizeCommand(cmd);
  return tokens.every((t) => norm.includes(normalizeCommand(t)) || cmd.includes(t));
}
function includesAny(cmd: string, tokens: string[]): boolean {
  return tokens.some((t) => cmd.includes(t));
}

/* ───────────────────────── grading ───────────────────────── */
type Gradeable = Pick<Exercise, "acceptors" | "acceptRegex" | "mustInclude" | "forbid" | "expectedOutput" | "outputMatch">;

function gradeAgainst(g: Gradeable, command: string, stdoutText: string): GradeResult {
  // hard fail op verboden tokens
  if (g.forbid && includesAny(command, g.forbid)) {
    return { correct: false, reason: "Dit gebruikt iets wat hier niet mag." };
  }
  // 1) acceptors (canoniek)
  if (g.acceptors && g.acceptors.length) {
    const sn = normalizeCommand(command);
    if (g.acceptors.some((a) => normalizeCommand(a) === sn)) return { correct: true };
  }
  // 2) regex-vangnet
  if (g.acceptRegex && g.acceptRegex.some((r) => safeRegex(r).test(command.trim()))) return { correct: true };
  // 3) output-vergelijking
  if (g.expectedOutput && g.expectedOutput.length) {
    if (matchOutput(stdoutText, g.expectedOutput, g.outputMatch ?? "set")) {
      // bij mustInclude: ook de tokens checken (anders kan een toevallige output matchen)
      if (!g.mustInclude || includesAll(command, g.mustInclude)) return { correct: true };
    }
  }
  // 4) enkel mustInclude (script-stijl, geen acceptors)
  if (g.mustInclude && g.mustInclude.length && !g.expectedOutput && !g.acceptors) {
    if (includesAll(command, g.mustInclude)) return { correct: true };
  }
  return { correct: false };
}

function safeRegex(src: string): RegExp {
  try { return new RegExp(src, "i"); } catch { return /$^/; }
}

/** Beoordeel een enkel commando (type command/pipeline/debug). */
export function gradeCommand(ex: Exercise, command: string, stdoutText: string): GradeResult {
  return gradeAgainst(ex, command, stdoutText);
}

/** Beoordeel één stap van een multi-step oefening. */
export function gradeStep(step: Step, command: string, stdoutText: string): GradeResult {
  return gradeAgainst(step, command, stdoutText);
}
