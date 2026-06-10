import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

function listMatcher(spec: string): (i: number) => boolean {
  const ranges = spec.split(",").map((part) => {
    const m = /^(\d*)-(\d*)$/.exec(part);
    if (m) return [m[1] ? +m[1] : 1, m[2] ? +m[2] : Infinity] as [number, number];
    const n = +part; return [n, n] as [number, number];
  });
  return (i) => ranges.some(([a, b]) => i >= a && i <= b);
}

/** cut — knip velden (-d -f) of tekens (-c) uit elke regel. */
export const cut: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args, ["d", "f", "c"]);
  const delim = p.has("d") ? (p.val("d") || "\t") : "\t";
  const fieldSel = p.has("f") ? listMatcher(p.val("f") || "") : null;
  const charSel = p.has("c") ? listMatcher(p.val("c") || "") : null;

  const inputs: { name?: string; content?: string; err?: string }[] =
    p.pos.length ? p.pos.map((f) => ({ name: f, ...vfs.readFile(f) })) : [{ content: stdin }];

  const errs: string[] = [];
  const out: string[] = [];
  for (const inp of inputs) {
    if (inp.err) { errs.push(`cut: ${inp.err}`); continue; }
    for (const line of toLines(inp.content ?? "")) {
      if (charSel) out.push(line.split("").filter((_, i) => charSel(i + 1)).join(""));
      else if (fieldSel) {
        if (!line.includes(delim)) out.push(line);
        else out.push(line.split(delim).filter((_, i) => fieldSel(i + 1)).join(delim));
      } else out.push(line);
    }
  }
  return { stdout: out.join("\n"), stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
