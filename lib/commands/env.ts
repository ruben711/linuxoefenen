import { type CommandHandler } from "./types";

const hidden = (k: string) => k === "?" || k === "PS1";

/** env / printenv — toon de omgevingsvariabelen. */
export const env: CommandHandler = ({ env, args }) => {
  const names = args.filter((a) => !a.startsWith("-"));
  if (names.length) return { stdout: names.map((n) => env[n] ?? "").join("\n") };
  return { stdout: Object.entries(env).filter(([k]) => !hidden(k)).map(([k, v]) => `${k}=${v}`).join("\n") };
};
