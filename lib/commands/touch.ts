import { parseArgs, type CommandHandler } from "./types";

/** touch — maak lege bestanden aan of werk hun mtime bij. */
export const touch: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  if (p.pos.length === 0) return { stderr: "touch: missing file operand", code: 1 };
  const errs: string[] = [];
  for (const f of p.pos) {
    const r = vfs.touch(f);
    if (!r.ok) errs.push(r.err!);
  }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
