import { type CommandHandler } from "./types";

/** export — maak/markeer een omgevingsvariabele (export VAR=waarde). */
export const exportCmd: CommandHandler = ({ args, env }) => {
  if (args.length === 0) {
    return { stdout: Object.entries(env).filter(([k]) => k !== "?" && k !== "PS1").map(([k, v]) => `declare -x ${k}="${v}"`).join("\n") };
  }
  for (const a of args) {
    if (a.startsWith("-")) continue;
    const eq = a.indexOf("=");
    if (eq >= 0) env[a.slice(0, eq)] = a.slice(eq + 1);
  }
  return {};
};
