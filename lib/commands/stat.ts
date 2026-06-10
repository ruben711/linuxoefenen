import { type CommandHandler } from "./types";
import { permString, formatMtime, nodeSize } from "../vfs";

/** stat — toon metadata van een bestand/map. */
export const stat: CommandHandler = ({ args, vfs }) => {
  const pos = args.filter((a) => !a.startsWith("-"));
  if (pos.length === 0) return { stderr: "stat: missing operand", code: 1 };
  const out: string[] = [];
  const errs: string[] = [];
  for (const f of pos) {
    const n = vfs.getNode(f);
    if (!n) { errs.push(`stat: cannot stat '${f}': No such file or directory`); continue; }
    const octal = (n.mode & 0o777).toString(8);
    const kind = n.type === "dir" ? "directory" : n.type === "file" && n.symlink ? "symbolic link" : "regular file";
    out.push(`  File: ${f}`);
    out.push(`  Size: ${nodeSize(n)}\tBlocks: 8\t${kind}`);
    out.push(`Access: (0${octal}/${permString(n)})  Uid: ( 1000/${n.owner})   Gid: ( 1000/${n.group})`);
    out.push(`Modify: ${formatMtime(n.mtime)}`);
  }
  return { stdout: out.join("\n"), stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
