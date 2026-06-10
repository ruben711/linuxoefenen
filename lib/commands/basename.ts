import { type CommandHandler } from "./types";

/** basename — strip het directorygedeelte (en optioneel een suffix) van een pad. */
export const basenameCmd: CommandHandler = ({ args }) => {
  const pos = args.filter((a) => !a.startsWith("-"));
  let b = (pos[0] ?? "").replace(/\/+$/, "");
  b = b.slice(b.lastIndexOf("/") + 1);
  const suffix = pos[1];
  if (suffix && b.endsWith(suffix) && b !== suffix) b = b.slice(0, -suffix.length);
  return { stdout: b };
};
