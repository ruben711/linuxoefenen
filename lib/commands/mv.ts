import { parseArgs, type CommandHandler } from "./types";

/** mv — verplaats of hernoem bestanden/directories. */
export const mv: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  if (p.pos.length < 2) return { stderr: "mv: missing file operand", code: 1 };
  const dst = p.pos[p.pos.length - 1];
  const srcs = p.pos.slice(0, -1);
  if (srcs.length > 1) {
    const d = vfs.getNode(dst);
    if (!d || d.type !== "dir") return { stderr: `mv: target '${dst}' is not a directory`, code: 1 };
  }
  const errs: string[] = [];
  for (const s of srcs) { const r = vfs.mv(s, dst); if (!r.ok) errs.push(r.err!); }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
