import { parseArgs, type CommandHandler } from "./types";

function expandSet(s: string): string {
  s = s
    .replace(/\[:upper:\]/g, "ABCDEFGHIJKLMNOPQRSTUVWXYZ")
    .replace(/\[:lower:\]/g, "abcdefghijklmnopqrstuvwxyz")
    .replace(/\[:digit:\]/g, "0123456789")
    .replace(/\[:space:\]/g, " \t\n\r");
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s[i + 1] === "-" && i + 2 < s.length) {
      const a = s.charCodeAt(i), b = s.charCodeAt(i + 2);
      for (let c = a; c <= b; c++) out += String.fromCharCode(c);
      i += 2;
    } else out += s[i];
  }
  return out;
}

/** tr — vertaal of verwijder tekens (werkt op stdin). bv. tr '[:upper:]' '[:lower:]'. */
export const tr: CommandHandler = ({ args, stdin }) => {
  const p = parseArgs(args);
  const del = p.has("d"), squeeze = p.has("s");
  const set1 = expandSet(p.pos[0] ?? "");
  const set2 = expandSet(p.pos[1] ?? "");
  let text = stdin;

  if (del) {
    const set = new Set(set1.split(""));
    text = text.split("").filter((c) => !set.has(c)).join("");
  } else if (set1) {
    const map: Record<string, string> = {};
    for (let i = 0; i < set1.length; i++) map[set1[i]] = set2[Math.min(i, set2.length - 1)] ?? set1[i];
    text = text.split("").map((c) => map[c] ?? c).join("");
  }
  if (squeeze) {
    const set = new Set((set2 || set1).split(""));
    let o = "", prev = "";
    for (const c of text) { if (set.has(c) && c === prev) continue; o += c; prev = c; }
    text = o;
  }
  return { stdout: text };
};
