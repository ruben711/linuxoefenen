import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** uniq — verwijder/tel OPEENVOLGENDE dubbele regels (sorteer eerst). */
export const uniq: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args);
  const count = p.has("c"), onlyDup = p.has("d"), onlyUniq = p.has("u");

  const r = p.pos.length ? vfs.readFile(p.pos[0]) : { content: stdin };
  if ("err" in r && r.err) return { stderr: `uniq: ${r.err}`, code: 1 };

  const lines = toLines(r.content ?? "");
  const groups: { line: string; n: number }[] = [];
  for (const l of lines) {
    const last = groups[groups.length - 1];
    if (last && last.line === l) last.n++;
    else groups.push({ line: l, n: 1 });
  }
  let out = groups;
  if (onlyDup) out = out.filter((g) => g.n > 1);
  if (onlyUniq) out = out.filter((g) => g.n === 1);

  return { stdout: out.map((g) => (count ? `${String(g.n).padStart(7, " ")} ${g.line}` : g.line)).join("\n") };
};
