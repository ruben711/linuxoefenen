import { parseArgs, type CommandHandler } from "./types";

/** tee — lees stdin, schrijf naar bestand(en) ÉN naar stdout. -a appendt. */
export const tee: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args);
  const append = p.has("a") || p.has("append");
  for (const f of p.pos) vfs.writeFile(f, stdin, { append });
  return { stdout: stdin };
};
