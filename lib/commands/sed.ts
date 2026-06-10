import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** sed — stream editor (subset): s/patroon/vervang/[gi] en 'Nd' (regel N verwijderen). */
export const sed: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args, ["e"]);
  const script = p.has("e") ? p.val("e")! : p.pos[0] ?? "";
  const files = p.has("e") ? p.pos : p.pos.slice(1);
  const content = files.length ? files.map((f) => vfs.readFile(f).content ?? "").join("") : stdin;
  let lines = toLines(content);

  const sub = /^s(.)(.*?)\1(.*?)\1([gip]*)$/.exec(script);
  if (sub) {
    const [, , pat, repl, flags] = sub;
    let f = "";
    if (flags.includes("g")) f += "g";
    if (flags.includes("i")) f += "i";
    let re: RegExp;
    try { re = new RegExp(pat, f); } catch { return { stderr: "sed: ongeldig patroon", code: 1 }; }
    const r = repl.replace(/&/g, "$$&").replace(/\\(\d)/g, "$$$1");
    lines = lines.map((l) => l.replace(re, r));
  } else {
    const del = /^(\d+)d$/.exec(script);
    if (del) { const n = +del[1]; lines = lines.filter((_, i) => i !== n - 1); }
  }
  return { stdout: lines.join("\n") };
};
