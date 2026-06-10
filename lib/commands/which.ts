import { type CommandHandler } from "./types";

/** which — toon het pad van een commando (gesimuleerd: /usr/bin/<cmd>). */
export const which: CommandHandler = ({ args }) => {
  const names = args.filter((a) => !a.startsWith("-"));
  return { stdout: names.map((n) => `/usr/bin/${n}`).join("\n"), code: names.length ? 0 : 1 };
};
