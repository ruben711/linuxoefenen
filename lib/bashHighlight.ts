/**
 * Display-highlighter voor de terminal-overlay. Best-effort, géén parser —
 * splitst een bash-regel in gekleurde tokens (commando's, vlaggen, strings,
 * operatoren, variabelen, paden, globs, commentaar).
 */
export type HType =
  | "cmd" | "flag" | "str" | "op" | "var" | "num" | "path" | "glob" | "comment" | "plain";
export type HToken = { t: HType; v: string };

const isWS = (c: string) => c === " " || c === "\t" || c === "\n";
const BREAK = "|;&<>()'\"#$";

export function tokenizeBash(input: string): HToken[] {
  const out: HToken[] = [];
  let i = 0;
  const n = input.length;
  let cmdPos = true; // commandopositie: begin van de regel of net na | && || ; ( $(

  const push = (t: HType, v: string) => { if (v) out.push({ t, v }); };

  while (i < n) {
    const c = input[i];

    if (isWS(c)) { let j = i + 1; while (j < n && isWS(input[j])) j++; push("plain", input.slice(i, j)); i = j; continue; }
    if (c === "#") { push("comment", input.slice(i)); break; }

    if (c === "'") { let j = i + 1; while (j < n && input[j] !== "'") j++; if (j < n) j++; push("str", input.slice(i, j)); i = j; cmdPos = false; continue; }
    if (c === '"') {
      let j = i + 1;
      while (j < n) { if (input[j] === "\\") j += 2; else if (input[j] === '"') { j++; break; } else j++; }
      push("str", input.slice(i, j)); i = j; cmdPos = false; continue;
    }

    if (c === "$") {
      if (input[i + 1] === "(") { push("op", "$("); i += 2; cmdPos = true; continue; }
      let j = i + 1;
      if (input[j] === "{") { while (j < n && input[j] !== "}") j++; if (j < n) j++; }
      else if (j < n && "?#@*!$".includes(input[j])) j++;
      else while (j < n && /[A-Za-z0-9_]/.test(input[j])) j++;
      push("var", input.slice(i, j)); i = j; cmdPos = false; continue;
    }

    const three = input.slice(i, i + 3);
    const two = input.slice(i, i + 2);
    if (three === "2>>") { push("op", three); i += 3; cmdPos = true; continue; }
    if (["&&", "||", ">>", "2>", "&>"].includes(two)) { push("op", two); i += 2; cmdPos = true; continue; }
    if ("|;&<>()".includes(c)) { push("op", c); i++; if ("|;&<>(".includes(c)) cmdPos = true; continue; }

    // bareword
    let j = i;
    while (j < n && !isWS(input[j]) && !BREAK.includes(input[j])) j++;
    const w = input.slice(i, j);
    let t: HType;
    if (w.startsWith("-") && w.length > 1) t = "flag";
    else if (cmdPos) t = "cmd";
    else if (/[*?[\]]/.test(w)) t = "glob";
    else if (w.includes("/")) t = "path";
    else if (/^\d+$/.test(w)) t = "num";
    else t = "plain";
    push(t, w); i = j; cmdPos = false;
  }
  return out;
}
