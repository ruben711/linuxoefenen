import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/** awk — subset: veld-extractie met {print $N, ...}, -F scheidingsteken, optioneel /patroon/. */
export const awk: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args, ["F"]);
  const fsRaw = p.has("F") ? (p.val("F") || " ") : null;
  const program = p.pos[0] ?? "";
  const files = p.pos.slice(1);
  const content = files.length ? files.map((f) => vfs.readFile(f).content ?? "").join("") : stdin;
  const lines = toLines(content);

  const printMatch = /\{\s*print\s*([^}]*)\}/.exec(program);
  const condMatch = /^\/(.*?)\/\s*(\{|$)/.exec(program);
  const splitter: string | RegExp = fsRaw !== null ? (fsRaw === "\\t" ? "\t" : fsRaw) : /\s+/;

  const out: string[] = [];
  for (const line of lines) {
    if (condMatch) { try { if (!new RegExp(condMatch[1]).test(line)) continue; } catch { /* */ } }
    const fields = typeof splitter === "string"
      ? line.split(splitter)
      : (line.trim() === "" ? [] : line.trim().split(splitter));
    const get = (n: number) => (n === 0 ? line : fields[n - 1] ?? "");

    if (printMatch) {
      const spec = printMatch[1].trim();
      if (spec === "" || spec === "$0") { out.push(line); continue; }
      const parts = spec.split(",").map((s) => s.trim());
      const vals = parts.map((part) => {
        const fm = /^\$(\d+)$/.exec(part);
        if (fm) return get(+fm[1]);
        const sm = /^"(.*)"$/.exec(part);
        if (sm) return sm[1];
        return part;
      });
      out.push(vals.join(" "));
    } else {
      out.push(line);
    }
  }
  return { stdout: out.join("\n") };
};
