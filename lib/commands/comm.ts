import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** comm — vergelijk twee GESORTEERDE bestanden (3 kolommen: alleen-1, alleen-2, gemeenschappelijk). */
export const comm: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  const c1 = !p.has("1"), c2 = !p.has("2"), c3 = !p.has("3");
  if (p.pos.length < 2) return { stderr: "comm: missing operand", code: 1 };
  const a = vfs.readFile(p.pos[0]), b = vfs.readFile(p.pos[1]);
  if (a.err) return { stderr: `comm: ${a.err}`, code: 1 };
  if (b.err) return { stderr: `comm: ${b.err}`, code: 1 };

  const la = toLines(a.content!), lb = toLines(b.content!);
  const out: string[] = [];
  let i = 0, j = 0;
  const tab1 = c1 ? "" : null, tab2 = c2 ? "\t" : null, tab3 = c3 ? "\t\t" : null;
  while (i < la.length || j < lb.length) {
    if (j >= lb.length || (i < la.length && la[i] < lb[j])) { if (tab1 !== null) out.push(tab1 + la[i]); i++; }
    else if (i >= la.length || lb[j] < la[i]) { if (tab2 !== null) out.push(tab2 + lb[j]); j++; }
    else { if (tab3 !== null) out.push(tab3 + la[i]); i++; j++; }
  }
  return { stdout: out.join("\n") };
};
