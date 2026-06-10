import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** tac — toon regels in omgekeerde volgorde (cat achterstevoren). */
export const tac: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args);
  const errs: string[] = [];
  let all: string[] = [];
  if (p.pos.length === 0) {
    all = toLines(stdin);
  } else {
    for (const f of p.pos) {
      const r = vfs.readFile(f);
      if (r.err) { errs.push(`tac: ${r.err}`); continue; }
      all.push(...toLines(r.content!));
    }
  }
  return { stdout: all.reverse().join("\n"), stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
