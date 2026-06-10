import { parseArgs, type CommandHandler } from "./types";

function numberLines(text: string): string {
  const lines = text.split("\n");
  const trailing = lines.length > 0 && lines[lines.length - 1] === "";
  const body = trailing ? lines.slice(0, -1) : lines;
  return body.map((l, i) => `${String(i + 1).padStart(6, " ")}\t${l}`).join("\n") + (trailing ? "\n" : "");
}

/** cat — toon bestandsinhoud (of stdin). -n nummert de regels. */
export const cat: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args);
  const number = p.has("n") || p.has("number");

  if (p.pos.length === 0) {
    return { stdout: number ? numberLines(stdin) : stdin };
  }

  const parts: string[] = [];
  const errs: string[] = [];
  for (const f of p.pos) {
    const r = vfs.readFile(f);
    if (r.err) { errs.push(`cat: ${r.err}`); continue; }
    parts.push(r.content!);
  }
  let text = parts.join("");
  if (number) text = numberLines(text);
  return {
    stdout: text,
    stderr: errs.length ? errs.join("\n") : undefined,
    code: errs.length ? 1 : 0,
  };
};
