import { parseArgs, type CommandHandler } from "./types";

/** ln — maak een (sym)link. -s = symbolische link, anders een hardlink (kopie-referentie). */
export const ln: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  const sym = p.has("s") || p.has("symbolic");
  if (p.pos.length < 2) return { stderr: "ln: missing file operand", code: 1 };
  const target = p.pos[0], linkName = p.pos[1];

  if (sym) {
    const r = vfs.touch(linkName);
    if (!r.ok) return { stderr: `ln: ${r.err}`, code: 1 };
    const node = vfs.getFile(linkName);
    if (node) { node.symlink = target; node.content = ""; }
    return {};
  }
  const r = vfs.cp(target, linkName, {});
  if (!r.ok) return { stderr: `ln: ${r.err}`, code: 1 };
  return {};
};
