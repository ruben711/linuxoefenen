import { parseArgs, type CommandHandler } from "./types";

/** rm — verwijder bestanden/directories. -r recursief, -f forceer. */
export const rm: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  const recursive = p.has("r") || p.has("R") || p.has("recursive");
  const force = p.has("f") || p.has("force");
  if (p.pos.length === 0 && !force) return { stderr: "rm: missing operand", code: 1 };
  const errs: string[] = [];
  for (const f of p.pos) { const r = vfs.rm(f, { recursive, force }); if (!r.ok) errs.push(r.err!); }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
