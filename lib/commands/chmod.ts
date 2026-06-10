import { type CommandHandler } from "./types";
import type { VNode } from "../vfs";

/** Bereken de nieuwe mode op basis van een octale (755) of symbolische (u+x, g-w, a=) spec. */
function parseMode(cur: number, spec: string): number {
  if (/^[0-7]{3,4}$/.test(spec)) return parseInt(spec, 8) & 0o777;
  let mode = cur;
  for (const clause of spec.split(",")) {
    const m = /^([ugoa]*)([+\-=])([rwxX]*)$/.exec(clause.trim());
    if (!m) continue;
    const who = m[1] || "a", op = m[2], perms = m[3];
    let val = 0;
    if (perms.includes("r")) val |= 4;
    if (perms.includes("w")) val |= 2;
    if (perms.includes("x") || perms.includes("X")) val |= 1;
    const whos = (who === "a" ? "ugo" : who).split("").flatMap((c) => (c === "a" ? ["u", "g", "o"] : [c]));
    for (const w of whos) {
      const shift = w === "u" ? 6 : w === "g" ? 3 : 0;
      if (op === "+") mode |= val << shift;
      else if (op === "-") mode &= ~(val << shift);
      else mode = (mode & ~(0b111 << shift)) | (val << shift);
    }
  }
  return mode & 0o777;
}

/** chmod — wijzig permissies (octaal of symbolisch). -R recursief. */
export const chmod: CommandHandler = ({ args, vfs }) => {
  let mode: string | null = null;
  let recursive = false;
  const files: string[] = [];
  for (const a of args) {
    if (mode === null) {
      if (a === "-R" || a === "--recursive") { recursive = true; continue; }
      if (a === "-v" || a === "-c" || a === "-f" || a === "--verbose" || a === "--changes" || a === "--silent") continue;
      mode = a; continue;
    }
    files.push(a);
  }
  if (mode === null || files.length === 0) return { stderr: "chmod: missing operand", code: 1 };

  const errs: string[] = [];
  const apply = (node: VNode) => {
    node.mode = parseMode(node.mode, mode!);
    if (recursive && node.type === "dir") for (const c of Object.values(node.children)) apply(c);
  };
  for (const f of files) {
    const node = vfs.getNode(f);
    if (!node) { errs.push(`chmod: cannot access '${f}': No such file or directory`); continue; }
    apply(node);
  }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
