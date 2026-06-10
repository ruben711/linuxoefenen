import { type CommandHandler } from "./types";

/** umask — toon (of zet) de standaardmasker-permissies. */
export const umask: CommandHandler = ({ args }) => {
  const pos = args.filter((a) => !a.startsWith("-"));
  if (pos.length === 0) return { stdout: "0022" };
  return {}; // zetten heeft geen effect in de simulatie
};

/** sleep — wacht (no-op in de simulatie). */
export const sleep: CommandHandler = () => ({});

/** source / . — voer een scriptbestand uit (no-op in de simulatie). */
export const source: CommandHandler = () => ({});

/** dirname — strip het laatste padcomponent. */
export const dirname: CommandHandler = ({ args }) => {
  const pos = args.filter((a) => !a.startsWith("-"));
  const path = (pos[0] ?? "").replace(/\/+$/, "");
  const i = path.lastIndexOf("/");
  return { stdout: i <= 0 ? (path.startsWith("/") ? "/" : ".") : path.slice(0, i) };
};
