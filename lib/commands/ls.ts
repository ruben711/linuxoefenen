import { parseArgs, type CommandHandler, type Seg } from "./types";
import {
  type VNode, type VFS, permString, formatMtime, nodeSize, isExecutable,
  dirname,
} from "../vfs";

function humanSize(n: number): string {
  if (n < 1024) return String(n);
  const units = ["K", "M", "G", "T"];
  let v = n, u = -1;
  do { v /= 1024; u++; } while (v >= 1024 && u < units.length - 1);
  return (v < 10 ? v.toFixed(1) : Math.round(v).toString()) + units[u];
}

function nameClass(node: VNode): string {
  if (node.type === "dir") return "ls-dir";
  if (node.symlink) return "ls-link";
  if (isExecutable(node)) return "ls-exec";
  return "ls-file";
}

function plainName(node: VNode): string {
  // Net als `ls --color` (Ubuntu-default): geen trailing slash — kleur is de dir-cue.
  return node.name;
}

type Entry = { node: VNode; label: string };

/** Eén directory listen → platte regels + gekleurde weergave. */
function listDir(
  vfs: VFS, path: string,
  o: { long: boolean; all: boolean; human: boolean },
): { lines: string[]; display: Seg[][] } {
  const dir = vfs.getDir(path)!;
  const entries: Entry[] = [];

  if (o.all) {
    entries.push({ node: dir, label: "." });
    const parent = vfs.getDir(dirname(path)) ?? dir;
    entries.push({ node: parent, label: ".." });
  }
  const names = Object.keys(dir.children)
    .filter((n) => o.all || !n.startsWith("."))
    .sort((a, b) => a.replace(/^\./, "").localeCompare(b.replace(/^\./, ""), "en"));
  for (const n of names) entries.push({ node: dir.children[n], label: n });

  const lines: string[] = [];
  const display: Seg[][] = [];

  if (o.long) {
    const total = entries.reduce((a, e) => a + (e.node.type === "dir" ? 4 : Math.max(4, Math.ceil(nodeSize(e.node) / 1024) * 4)), 0);
    lines.push(`total ${total}`);
    display.push([{ text: `total ${total}` }]);

    // kolombreedtes
    const sizes = entries.map((e) => (o.human ? humanSize(nodeSize(e.node)) : String(nodeSize(e.node))));
    const owW = Math.max(...entries.map((e) => e.node.owner.length));
    const grW = Math.max(...entries.map((e) => e.node.group.length));
    const szW = Math.max(...sizes.map((s) => s.length));

    entries.forEach((e, idx) => {
      const perms = permString(e.node);
      const links = e.node.type === "dir" ? "2" : "1";
      const meta = `${perms} ${links.padStart(2)} ${e.node.owner.padEnd(owW)} ${e.node.group.padEnd(grW)} ${sizes[idx].padStart(szW)} ${formatMtime(e.node.mtime)} `;
      const label = e.label === "." || e.label === ".." ? e.label : plainName(e.node);
      lines.push(meta + label);
      const seg: Seg[] = [{ text: meta }, { text: label, cls: nameClass(e.node) }];
      if (e.node.type === "file" && e.node.symlink) seg.push({ text: ` -> ${e.node.symlink}`, cls: "ls-file" });
      display.push(seg);
    });
  } else {
    for (const e of entries) {
      lines.push(e.label === "." || e.label === ".." ? e.label : e.node.name);
    }
    // gekleurde, gespatieerde enkele regel (CSS laat wrappen)
    const seg: Seg[] = [];
    entries.forEach((e, i) => {
      if (i > 0) seg.push({ text: "  " });
      const label = e.label === "." || e.label === ".." ? e.label : plainName(e.node);
      seg.push({ text: label, cls: nameClass(e.node) });
    });
    if (seg.length) display.push(seg);
  }

  return { lines, display };
}

/** ls — toon directory-inhoud. Vlaggen: -l -a -h -R (en combinaties). */
export const ls: CommandHandler = ({ args, vfs }) => {
  const p = parseArgs(args);
  const o = {
    long: p.has("l"),
    all: p.has("a") || p.has("all"),
    human: p.has("h") || p.has("human-readable"),
    recursive: p.has("R") || p.has("recursive"),
  };

  const operands = p.pos.length ? p.pos : ["."];
  const lines: string[] = [];
  const display: Seg[][] = [];
  const errs: string[] = [];

  // Scheid bestaande files / dirs / ontbrekend
  const fileTargets: { path: string; node: VNode }[] = [];
  const dirTargets: string[] = [];
  for (const op of operands) {
    const node = vfs.getNode(op);
    if (!node) { errs.push(`ls: cannot access '${op}': No such file or directory`); continue; }
    if (node.type === "dir") dirTargets.push(vfs.resolve(op));
    else fileTargets.push({ path: op, node });
  }

  // Eerst losse files (zoals bash)
  if (fileTargets.length) {
    const seg: Seg[] = [];
    fileTargets.forEach((f, i) => {
      if (i > 0) seg.push({ text: "  " });
      lines.push(f.path);
      seg.push({ text: f.node.name, cls: nameClass(f.node) });
    });
    display.push(seg);
  }

  const multi = dirTargets.length + fileTargets.length > 1 || o.recursive;

  const visit = (path: string, depth: number) => {
    if (multi) {
      const header = `${path}:`;
      if (lines.length) { lines.push(""); display.push([{ text: "" }]); }
      lines.push(header);
      display.push([{ text: header, cls: "ls-dir" }]);
    }
    const r = listDir(vfs, path, o);
    lines.push(...r.lines);
    display.push(...r.display);

    if (o.recursive) {
      const dir = vfs.getDir(path)!;
      const subs = Object.keys(dir.children)
        .filter((n) => dir.children[n].type === "dir" && (o.all || !n.startsWith(".")))
        .sort((a, b) => a.localeCompare(b, "en"));
      for (const s of subs) visit(path === "/" ? "/" + s : path + "/" + s, depth + 1);
    }
  };

  for (const d of dirTargets) visit(d, 0);

  return {
    stdout: lines.join("\n"),
    display: display.length ? display : undefined,
    stderr: errs.length ? errs.join("\n") : undefined,
    code: errs.length ? 1 : 0,
  };
};
