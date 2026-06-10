import { type CommandHandler } from "./types";

/** file — raad het type van een bestand. */
export const file: CommandHandler = ({ args, vfs }) => {
  const pos = args.filter((a) => !a.startsWith("-"));
  const out: string[] = [];
  for (const f of pos) {
    const n = vfs.getNode(f);
    if (!n) { out.push(`${f}: cannot open \`${f}' (No such file or directory)`); continue; }
    if (n.type === "dir") out.push(`${f}: directory`);
    else if (n.symlink) out.push(`${f}: symbolic link to ${n.symlink}`);
    else {
      const c = n.content;
      const type = c === "" ? "empty" : /[\x00-\x08\x0e-\x1f]/.test(c) ? "data" : "ASCII text";
      out.push(`${f}: ${type}`);
    }
  }
  return { stdout: out.join("\n") };
};
