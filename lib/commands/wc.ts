import { parseArgs, type CommandHandler } from "./types";

/** wc — tel regels (-l), woorden (-w), bytes (-c) of tekens (-m). */
export const wc: CommandHandler = ({ args, vfs, stdin }) => {
  const p = parseArgs(args);
  const showL = p.has("l"), showW = p.has("w"), showC = p.has("c") || p.has("m");
  const any = showL || showW || showC;

  const inputs: { name?: string; content?: string; err?: string }[] =
    p.pos.length ? p.pos.map((f) => ({ name: f, ...vfs.readFile(f) })) : [{ content: stdin }];

  const errs: string[] = [];
  const out: string[] = [];
  let tl = 0, tw = 0, tc = 0, okCount = 0;

  const fmt = (l: number, w: number, c: number, name?: string) => {
    const parts: string[] = [];
    if (!any || showL) parts.push(String(l));
    if (!any || showW) parts.push(String(w));
    if (!any || showC) parts.push(String(c));
    return parts.join(" ") + (name ? ` ${name}` : "");
  };

  for (const inp of inputs) {
    if (inp.err) { errs.push(`wc: ${inp.err}`); continue; }
    const c = inp.content ?? "";
    const l = (c.match(/\n/g) || []).length;
    const w = c.split(/\s+/).filter(Boolean).length;
    const b = c.length;
    tl += l; tw += w; tc += b; okCount++;
    out.push(fmt(l, w, b, inp.name));
  }
  if (okCount > 1) out.push(fmt(tl, tw, tc, "total"));

  return { stdout: out.join("\n"), stderr: errs.length ? errs.join("\n") : undefined, code: errs.length ? 1 : 0 };
};
