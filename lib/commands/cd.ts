import { parseArgs, type CommandHandler } from "./types";

/** cd — verander van directory. Zonder argument → home. `cd -` → vorige. */
export const cd: CommandHandler = ({ args, vfs, env }) => {
  const p = parseArgs(args);
  let target = p.pos[0];
  if (!target || target === "~") target = vfs.home;
  else if (target === "-") target = env.OLDPWD || vfs.cwd;

  const old = vfs.cwd;
  const r = vfs.chdir(target);
  if (!r.ok) return { stderr: r.err, code: 1 };
  env.OLDPWD = old;
  env.PWD = vfs.cwd;
  return {};
};
