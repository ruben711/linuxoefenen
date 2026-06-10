import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** head — toon de eerste N regels (standaard 10). */
export const head: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args, ["n"]);
  let n = 10;
  for (const a of args) { const m = /^-(\d+)$/.exec(a); if (m) n = +m[1]; }
  if (p.has("n")) { const v = parseInt(p.val("n") || "", 10); if (!isNaN(v)) n = v; }

  const errs: string[] = [];
  const blocks: string[] = [];
  const multi = p.pos.length > 1;
  if (p.pos.length === 0) {
    blocks.push(toLines(stdin).slice(0, n).join("\n"));
  } else {
    for (const f of p.pos) {
      const r = vfs.readFile(f);
      if (r.err) { errs.push(`head: ${r.err}`); continue; }
      const body = toLines(r.content!).slice(0, n).join("\n");
      blocks.push(multi ? `==> ${f} <==\n${body}` : body);
    }
  }
  return { stdout: blocks.join("\n\n"), stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
