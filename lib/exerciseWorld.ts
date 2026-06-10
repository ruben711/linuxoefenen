import { VFS, dirname } from "./vfs";
import { makeVfs } from "./vfsPresets";
import { parse, wordRaw } from "./bashTokenizer";
import type { Exercise } from "./exercises";

/**
 * Bouwt per oefening een VFS-wereld die bij de opgave past:
 *  - de startmap uit de opgave ("je bent in /home/bob/…") wordt het cwd,
 *  - alle paden die de modeloplossing/acceptors/opgave noemen worden aangemaakt
 *    (mappen voor cd/ls/find, bestanden voor cat/head/…), zodat de oplossing
 *    écht uitvoerbaar is in plaats van "No such file or directory".
 */

const DIR_CONSUMERS = new Set(["cd", "ls", "find", "du", "tree", "pushd", "rmdir"]);
const FILE_CONSUMERS = new Set([
  "cat", "less", "more", "head", "tail", "wc", "file", "nl", "tac", "sort", "uniq",
  "cut", "tr", "sed", "awk", "od", "strings", "stat", "chmod", "chown", "chgrp", "gzip", "bzip2",
]);
const CREATORS = new Set(["mkdir", "touch", "cp", "mv", "rm", "ln"]);
const ALLOWED_ROOTS = ["/home", "/etc", "/var", "/tmp", "/srv", "/opt", "/usr", "/mnt", "/media", "/root"];

const FILLER = "regel 1\nregel 2\nregel 3\nregel 4\n";

function looksLikeFile(p: string): boolean {
  const base = p.replace(/\/+$/, "").split("/").pop() || "";
  return /\.[A-Za-z0-9]{1,6}$/.test(base);
}
function allowed(abs: string): boolean {
  return abs.length > 1 && ALLOWED_ROOTS.some((r) => abs === r || abs.startsWith(r + "/"));
}
function ensureDir(vfs: VFS, abs: string) {
  if (allowed(abs) && !vfs.exists(abs)) vfs.mkdir(abs, { parents: true });
}
function ensureFile(vfs: VFS, abs: string) {
  if (!allowed(abs) || vfs.exists(abs)) return;
  ensureDir(vfs, dirname(abs));
  vfs.writeFile(abs, FILLER, {});
}

/** Startmap uit de opgavetekst halen ("je bent/start/zit in /pad"). */
function parseStartDir(prompt?: string): string | null {
  if (!prompt) return null;
  const m =
    prompt.match(/(?:bent|start(?:en|t)?|zit|staat|werkt|vertrekt|bevindt\s+je)\b[^/]{0,18}(\/[A-Za-z0-9._/-]+)/i) ||
    prompt.match(/\bvanuit\s+(?:de\s+map\s+|map\s+)?`?(\/[A-Za-z0-9._/-]+)/i) ||
    prompt.match(/\bin\s+(?:de\s+map\s+|map\s+|directory\s+)`?(\/[A-Za-z0-9._/-]+)`?/i);
  return m ? m[1].replace(/[.,;:`)]+$/, "") : null;
}

/** Ketens (cd a && cat b) doorlopen met cwd-tracking; paden aanmaken. */
function ensurePathsForCmd(vfs: VFS, cmdStr: string) {
  let list;
  try { list = parse(cmdStr); } catch { return; }
  for (const item of list) {
    for (const sc of item.pipeline.commands) {
      const argv = sc.words.map(wordRaw).filter(Boolean);
      if (!argv.length) continue;
      const name = argv[0];
      let operands = argv.slice(1).filter((a) => !a.startsWith("-"));
      if (name === "grep" && operands.length) operands = operands.slice(1); // 1e operand = patroon

      if (name === "cd") {
        const t = operands[0];
        if (t && t !== "-" && t !== "~") { const abs = vfs.resolve(t); ensureDir(vfs, abs); vfs.cwd = abs; }
        continue;
      }
      if (CREATORS.has(name)) {
        if ((name === "cp" || name === "mv" || name === "ln") && operands.length >= 2) {
          for (const s of operands.slice(0, -1)) {
            const abs = vfs.resolve(s);
            looksLikeFile(s) ? ensureFile(vfs, abs) : ensureDir(vfs, abs);
          }
        }
        continue; // doel niet vooraf aanmaken — dat doet het commando zelf
      }
      for (const op of operands) {
        const abs = vfs.resolve(op);
        if (DIR_CONSUMERS.has(name)) ensureDir(vfs, abs);
        else if (FILE_CONSUMERS.has(name)) ensureFile(vfs, abs);
        else looksLikeFile(op) ? ensureFile(vfs, abs) : ensureDir(vfs, abs);
      }
      for (const r of sc.redirects) if (r.op === "<") ensureFile(vfs, vfs.resolve(wordRaw(r.target)));
    }
  }
}

function ensureAbsFromText(vfs: VFS, text?: string) {
  if (!text) return;
  const paths = (text.match(/\/[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*/g) || []).slice(0, 14);
  for (const p of paths) {
    if (!allowed(p)) continue;
    looksLikeFile(p) ? ensureFile(vfs, p) : ensureDir(vfs, p);
  }
}

export function buildExerciseWorld(ex: Exercise): VFS {
  const vfs = makeVfs();
  const start = parseStartDir(ex.prompt) || vfs.home;
  ensureDir(vfs, start);
  vfs.cwd = start;

  if (Array.isArray(ex.steps) && ex.steps.length) {
    // meerdere stappen lopen sequentieel; cwd blijft doorlopen tussen stappen
    for (const s of ex.steps) {
      const cmd = s.solution || s.acceptors?.[0] || "";
      if (cmd) ensurePathsForCmd(vfs, cmd);
    }
  } else {
    const cmds = [ex.solution, ...(ex.acceptors ?? [])].filter(Boolean) as string[];
    for (const c of cmds) { ensurePathsForCmd(vfs, c); vfs.cwd = start; }
  }

  ensureAbsFromText(vfs, ex.prompt);
  (ex.expectedOutput ?? []).forEach((l) => ensureAbsFromText(vfs, l));

  vfs.cwd = start;
  return vfs;
}
