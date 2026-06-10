import { type CommandHandler } from "./types";
import { basename, type VNode } from "../vfs";

function globToRegex(glob: string, ci: boolean): RegExp {
  let re = "^";
  for (const c of glob) {
    if (c === "*") re += ".*";
    else if (c === "?") re += ".";
    else re += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(re + "$", ci ? "i" : "");
}

type Test = { k: "name" | "type" | "path" | "empty"; v?: string; ci?: boolean };

/** find — zoek bestanden/mappen recursief. -name -iname -type -maxdepth -path -empty. */
export const find: CommandHandler = ({ args, vfs }) => {
  const paths: string[] = [];
  let i = 0;
  while (i < args.length && !args[i].startsWith("-") && !["!", "(", ")"].includes(args[i])) { paths.push(args[i]); i++; }
  if (paths.length === 0) paths.push(".");

  const tests: Test[] = [];
  let maxdepth = Infinity, mindepth = 0;
  for (; i < args.length; i++) {
    const a = args[i];
    if (a === "-name") tests.push({ k: "name", v: args[++i] ?? "", ci: false });
    else if (a === "-iname") tests.push({ k: "name", v: args[++i] ?? "", ci: true });
    else if (a === "-type") tests.push({ k: "type", v: args[++i] ?? "" });
    else if (a === "-path" || a === "-wholename") tests.push({ k: "path", v: args[++i] ?? "" });
    else if (a === "-maxdepth") maxdepth = parseInt(args[++i] ?? "", 10);
    else if (a === "-mindepth") mindepth = parseInt(args[++i] ?? "", 10) || 0;
    else if (a === "-empty") tests.push({ k: "empty" });
    // -print / overige: standaardactie = printen
  }

  const matches = (node: VNode, disp: string): boolean => {
    for (const t of tests) {
      if (t.k === "name") { if (!globToRegex(t.v!, t.ci!).test(basename(disp))) return false; }
      else if (t.k === "type") { if (t.v === "f" && node.type !== "file") return false; if (t.v === "d" && node.type !== "dir") return false; }
      else if (t.k === "path") { if (!globToRegex(t.v!, false).test(disp)) return false; }
      else if (t.k === "empty") { if (node.type === "dir" ? Object.keys(node.children).length > 0 : node.content.length > 0) return false; }
    }
    return true;
  };

  const results: string[] = [];
  const errs: string[] = [];
  const walk = (node: VNode, disp: string, depth: number) => {
    if (depth <= maxdepth && depth >= mindepth && matches(node, disp)) results.push(disp);
    if (node.type === "dir" && depth < maxdepth) {
      for (const name of Object.keys(node.children).sort((a, b) => a.localeCompare(b, "en"))) {
        walk(node.children[name], disp === "/" ? "/" + name : disp.replace(/\/$/, "") + "/" + name, depth + 1);
      }
    }
  };

  for (const start of paths) {
    const node = vfs.getNode(start);
    if (!node) { errs.push(`find: '${start}': No such file or directory`); continue; }
    walk(node, start, 0);
  }

  return { stdout: results.join("\n"), stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
