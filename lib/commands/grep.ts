import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";
import type { VNode } from "../vfs";

type Inp = { name?: string; content: string };

function collectFiles(node: VNode, disp: string, out: Inp[]) {
  if (node.type === "file") { out.push({ name: disp, content: node.content }); return; }
  for (const name of Object.keys(node.children).sort((a, b) => a.localeCompare(b, "en"))) {
    collectFiles(node.children[name], disp === "/" ? "/" + name : disp.replace(/\/$/, "") + "/" + name, out);
  }
}

/** grep — filter regels op een patroon. -i -v -n -c -r -w -l. */
export const grep: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args);
  const ignoreCase = p.has("i"), invert = p.has("v"), number = p.has("n");
  const countOnly = p.has("c"), recursive = p.has("r") || p.has("R");
  const word = p.has("w"), filesOnly = p.has("l");

  if (p.pos.length === 0) return { stderr: "grep: geen patroon opgegeven", code: 2 };
  const patternStr = p.pos[0];
  const files = p.pos.slice(1);

  let rx: RegExp;
  try { rx = new RegExp(word ? `\\b(?:${patternStr})\\b` : patternStr, ignoreCase ? "i" : ""); }
  catch { return { stderr: "grep: ongeldig patroon", code: 2 }; }

  const inputs: Inp[] = [];
  if (recursive) {
    for (const root of files.length ? files : ["."]) {
      const node = vfs.getNode(root);
      if (node) collectFiles(node, root, inputs);
    }
  } else if (files.length) {
    for (const f of files) {
      const node = vfs.getNode(f);
      if (node && node.type === "file") inputs.push({ name: f, content: node.content });
    }
  } else {
    inputs.push({ content: stdin });
  }

  const multi = inputs.length > 1 || recursive;
  const out: string[] = [];
  const matchedFiles: string[] = [];
  let total = 0;

  for (const inp of inputs) {
    let fileCount = 0;
    toLines(inp.content).forEach((line, i) => {
      if (rx.test(line) !== invert) {
        fileCount++;
        if (inp.name && !matchedFiles.includes(inp.name)) matchedFiles.push(inp.name);
        if (!countOnly && !filesOnly) {
          const prefix = (multi && inp.name ? `${inp.name}:` : "") + (number ? `${i + 1}:` : "");
          out.push(prefix + line);
        }
      }
    });
    total += fileCount;
    if (countOnly) out.push((multi && inp.name ? `${inp.name}:` : "") + fileCount);
  }

  if (filesOnly) return { stdout: matchedFiles.join("\n"), code: matchedFiles.length ? 0 : 1 };
  return { stdout: out.join("\n"), code: total > 0 ? 0 : 1 };
};
