import { type CommandHandler } from "./types";
import type { VNode } from "../vfs";

/** chown — wijzig eigenaar (en optioneel groep): chown owner[:group] file. -R recursief. */
export const chown: CommandHandler = ({ args, vfs }) => {
  let spec: string | null = null;
  let recursive = false;
  const files: string[] = [];
  for (const a of args) {
    if (spec === null) {
      if (a === "-R" || a === "--recursive") { recursive = true; continue; }
      if (a === "-v" || a === "-c") continue;
      spec = a; continue;
    }
    files.push(a);
  }
  if (spec === null || files.length === 0) return { stderr: "chown: missing operand", code: 1 };
  const [owner, group] = spec.split(":");

  const errs: string[] = [];
  const apply = (node: VNode) => {
    if (owner) node.owner = owner;
    if (group) node.group = group;
    if (recursive && node.type === "dir") for (const c of Object.values(node.children)) apply(c);
  };
  for (const f of files) {
    const node = vfs.getNode(f);
    if (!node) { errs.push(`chown: cannot access '${f}': No such file or directory`); continue; }
    apply(node);
  }
  return errs.length ? { stderr: errs.join("\n"), code: 1 } : {};
};
