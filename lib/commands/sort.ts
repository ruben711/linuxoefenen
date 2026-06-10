import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** sort — sorteer regels. -n numeriek, -r omgekeerd, -u uniek, -f case-ongevoelig, -o naar bestand. */
export const sort: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args, ["o", "k"]);
  const numeric = p.has("n"), reverse = p.has("r"), uniq = p.has("u"), fold = p.has("f");

  const errs: string[] = [];
  let all: string[] = [];
  if (p.pos.length === 0) all = toLines(stdin);
  else for (const f of p.pos) { const r = vfs.readFile(f); if (r.err) { errs.push(`sort: ${r.err}`); continue; } all.push(...toLines(r.content!)); }

  all.sort((a, b) => {
    let x = a, y = b;
    if (fold) { x = x.toLowerCase(); y = y.toLowerCase(); }
    if (numeric) return (parseFloat(x) || 0) - (parseFloat(y) || 0);
    return x < y ? -1 : x > y ? 1 : 0;
  });
  if (reverse) all.reverse();
  if (uniq) all = all.filter((l, i) => i === 0 || l !== all[i - 1]);

  const text = all.join("\n");
  if (p.has("o")) {
    vfs.writeFile(p.val("o") || "", text + (text ? "\n" : ""), {});
    return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
  }
  return { stdout: text, stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
