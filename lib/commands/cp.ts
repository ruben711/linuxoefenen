import { parseArgs, type CommandHandler } from "./types";

/** cp — kopieer bestanden/directories. -r voor mappen. */
export const cp: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  const recursive = p.has("r") || p.has("R") || p.has("recursive");
  if (p.pos.length < 2) return { stderr: "cp: missing file operand", code: 1 };
  const dst = p.pos[p.pos.length - 1];
  const srcs = p.pos.slice(0, -1);
  if (srcs.length > 1) {
    const d = vfs.getNode(dst);
    if (!d || d.type !== "dir") return { stderr: `cp: target '${dst}' is not a directory`, code: 1 };
  }
  const errs: string[] = [];
  for (const s of srcs) { const r = vfs.cp(s, dst, { recursive }); if (!r.ok) errs.push(r.err!); }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
