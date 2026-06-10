import { type CommandHandler } from "./types";

/** readlink — toon het doel van een symbolische link. */
export const readlink: CommandHandler = ({ args, vfs }) => {
  const pos = args.filter((a) => !a.startsWith("-"));
  const out: string[] = [];
  let code = 0;
  for (const f of pos) {
    const n = vfs.getNode(f);
    if (n && n.type === "file" && n.symlink) out.push(n.symlink);
    else code = 1;
  }
  return { stdout: out.join("\n"), code };
};
