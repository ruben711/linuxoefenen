import { parseArgs, type CommandHandler } from "./types";

/** rmdir — verwijder lege directories. */
export const rmdir: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  if (p.pos.length === 0) return { stderr: "rmdir: missing operand", code: 1 };
  const errs: string[] = [];
  for (const d of p.pos) { const r = vfs.rmdir(d); if (!r.ok) errs.push(r.err!); }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
