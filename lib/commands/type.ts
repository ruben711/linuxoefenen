import { type CommandHandler } from "./types";

const BUILTINS = new Set(["cd", "echo", "pwd", "export", "set", "alias", "unalias", "history", "type", "exit", "source", ".", "read", "test", "umask", "jobs", "fg", "bg"]);

/** type — toon hoe een commando wordt geïnterpreteerd (builtin of pad). */
export const type: CommandHandler = ({ args }) => {
  const names = args.filter((a) => !a.startsWith("-"));
  return {
    stdout: names.map((n) => (BUILTINS.has(n) ? `${n} is a shell builtin` : `${n} is /usr/bin/${n}`)).join("\n"),
  };
};
