import type { VFS } from "../vfs";

/** Gekleurd output-segment (voor rijke terminal-weergave). */
export type Seg = { text: string; cls?: string };

export type CmdContext = {
  argv0: string;                    // de commandonaam
  args: string[];                   // alle tokens erna (flags + operands)
  stdin: string;                    // input via pipe of <
  vfs: VFS;                         // gedeelde, muteerbare VFS-staat
  env: Record<string, string>;
};

export type CmdResult = {
  stdout?: string;                  // platte tekst (voor pipes + grading)
  stderr?: string;                  // foutmeldingen
  code?: number;                    // exit code (default 0)
  display?: Seg[][];                // optioneel: rijke gekleurde regels (overschrijft stdout-weergave)
  clear?: boolean;                  // scherm leegmaken
};

export type CommandHandler = (ctx: CmdContext) => CmdResult;

/* ───────────────────────── flag-parser ───────────────────────── */
export type ParsedArgs = {
  flags: Set<string>;               // korte letters + lange namen
  values: Record<string, string>;   // waarden van value-flags / --x=y
  pos: string[];                    // positionele operands
  has: (f: string) => boolean;
  val: (f: string) => string | undefined;
};

/** Parseert bash-stijl args. `valueFlags` = flags die een waarde verwachten
 *  (bv. `-n 5` of `-n5`). Gecombineerde korte flags (`-la`) worden gesplitst. */
export function parseArgs(args: string[], valueFlags: string[] = []): ParsedArgs {
  const flags = new Set<string>();
  const values: Record<string, string> = {};
  const pos: string[] = [];
  let noMore = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (noMore) { pos.push(a); continue; }
    if (a === "--") { noMore = true; continue; }

    if (a.startsWith("--")) {
      const eq = a.indexOf("=");
      if (eq >= 0) { const name = a.slice(2, eq); flags.add(name); values[name] = a.slice(eq + 1); }
      else { const name = a.slice(2); flags.add(name); if (valueFlags.includes(name)) values[name] = args[++i] ?? ""; }
    } else if (a.startsWith("-") && a.length > 1) {
      const chars = a.slice(1);
      for (let c = 0; c < chars.length; c++) {
        const ch = chars[c];
        flags.add(ch);
        if (valueFlags.includes(ch)) {
          const rest = chars.slice(c + 1);
          values[ch] = rest !== "" ? rest : args[++i] ?? "";
          break;
        }
      }
    } else {
      pos.push(a);
    }
  }

  return { flags, values, pos, has: (f) => flags.has(f), val: (f) => values[f] };
}
