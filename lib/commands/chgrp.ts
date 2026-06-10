import { type CommandHandler } from "./types";
import type { VNode } from "../vfs";

/** chgrp — wijzig de groep van bestanden. -R recursief. */
export const chgrp: CommandHandler = ({ args, vfs }) => {
  let group: string | null = null;
  let recursive = false;
  const files: string[] = [];
  for (const a of args) {
    if (group === null) {
      if (a === "-R" || a === "--recursive") { recursive = true; continue; }
      if (a === "-v" || a === "-c") continue;
      group = a; continue;
    }
    files.push(a);
  }
  if (group === null || files.length === 0) return { stderr: "chgrp: missing operand", code: 1 };

  const errs: string[] = [];
  const apply = (node: VNode) => {
    node.group = group!;
    if (recursive && node.type === "dir") for (const c of Object.values(node.children)) apply(c);
  };
  for (const f of files) {
    const node = vfs.getNode(f);
    if (!node) { errs.push(`chgrp: cannot access '${f}': No such file or directory`); continue; }
    apply(node);
  }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
