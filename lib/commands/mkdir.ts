import { parseArgs, type CommandHandler } from "./types";

/** mkdir — maak één of meer directories aan. -p maakt ouderpaden mee. */
export const mkdir: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  if (p.pos.length === 0) return { stderr: "mkdir: missing operand", code: 1 };
  const parents = p.has("p") || p.has("parents");
  const errs: string[] = [];
  for (const dir of p.pos) {
    const r = vfs.mkdir(dir, { parents });
    if (!r.ok) errs.push(r.err!);
  }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
