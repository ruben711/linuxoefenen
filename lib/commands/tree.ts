import { type CommandHandler } from "./types";
import type { VNode } from "../vfs";

/** tree — toon de directory-structuur als boom. */
export const tree: CommandHandler = ({ args, vfs }) => {
  const all = args.includes("-a");
  const start = args.find((a) => !a.startsWith("-")) ?? ".";
  const root = vfs.getNode(start);
  if (!root) return { stderr: `${start}  [error opening dir]`, code: 1 };

  const lines: string[] = [start];
  let dirs = 0, files = 0;
  const walk = (node: VNode, prefix: string) => {
    if (node.type !== "dir") return;
    const names = Object.keys(node.children)
      .filter((n) => all || !n.startsWith("."))
      .sort((a, b) => a.localeCompare(b, "en"));
    names.forEach((name, i) => {
      const last = i === names.length - 1;
      const child = node.children[name];
      lines.push(`${prefix}${last ? "└── " : "├── "}${name}`);
      if (child.type === "dir") { dirs++; walk(child, prefix + (last ? "    " : "│   ")); }
      else files++;
    });
  };
  walk(root, "");
  lines.push("", `${dirs} directories, ${files} files`);
  return { stdout: lines.join("\n") };
};
