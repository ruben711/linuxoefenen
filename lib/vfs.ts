/**
 * Virtual File System voor BashAcademy.
 *
 * Een in-memory boom (Directory + File) met een mutatie-API die de
 * command-handlers gebruiken. De boom is volledig kloonbaar (`clone()`),
 * zodat we per oefening-stap een checkpoint kunnen nemen en de grader het
 * eindresultaat met de verwachte staat kan vergelijken — zonder echte
 * filesystem-toegang. 100% veilig, deterministisch.
 */

export type FileNode = {
  type: "file";
  name: string;
  content: string;
  mode: number; // octale permissies, bv. 0o644
  owner: string;
  group: string;
  mtime: number; // epoch ms
  symlink?: string; // doelpad indien symbolische link
};

export type DirNode = {
  type: "dir";
  name: string;
  mode: number; // bv. 0o755
  owner: string;
  group: string;
  mtime: number;
  children: Record<string, VNode>;
};

export type VNode = FileNode | DirNode;

/** Vaste mtime → deterministische `ls -l`-output (belangrijk voor grading). */
export const DEFAULT_MTIME = Date.UTC(2024, 5, 10, 9, 14, 0); // 10 jun 2024 09:14

const NL_MONTHS = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];

/* ───────────────────────── Spec → boom ───────────────────────── */
/** Compacte JSON-vorm voor voorgedefinieerde filesystems.
 *  - string            → bestand met die inhoud
 *  - { f, mode?, ... }  → bestand met metadata
 *  - { d, mode?, ... }  → directory met kinderen (d = sub-spec) */
export type SpecFile = { f: string; mode?: string; owner?: string; group?: string; mtime?: number; symlink?: string };
export type SpecDir = { d: VfsSpec; mode?: string; owner?: string; group?: string; mtime?: number };
export type SpecNode = string | SpecFile | SpecDir;
export type VfsSpec = { [name: string]: SpecNode };

export type VfsOptions = {
  cwd?: string;
  user?: string;
  home?: string;
  host?: string;
};

function octal(s: string | undefined, fallback: number): number {
  if (!s) return fallback;
  const n = parseInt(s, 8);
  return Number.isNaN(n) ? fallback : n;
}

function buildNode(name: string, spec: SpecNode, defOwner: string, defGroup: string): VNode {
  if (typeof spec === "string") {
    return { type: "file", name, content: spec, mode: 0o644, owner: defOwner, group: defGroup, mtime: DEFAULT_MTIME };
  }
  if ("d" in spec) {
    const children: Record<string, VNode> = {};
    for (const [childName, childSpec] of Object.entries(spec.d)) {
      children[childName] = buildNode(childName, childSpec, spec.owner ?? defOwner, spec.group ?? defGroup);
    }
    return {
      type: "dir", name, children,
      mode: octal(spec.mode, 0o755),
      owner: spec.owner ?? defOwner, group: spec.group ?? defGroup,
      mtime: spec.mtime ?? DEFAULT_MTIME,
    };
  }
  return {
    type: "file", name, content: spec.f,
    mode: octal(spec.mode, 0o644),
    owner: spec.owner ?? defOwner, group: spec.group ?? defGroup,
    mtime: spec.mtime ?? DEFAULT_MTIME,
    symlink: spec.symlink,
  };
}

/* ───────────────────────── permissie-helpers ───────────────────────── */
export function modeToRwx(mode: number): string {
  const bits = ["r", "w", "x"];
  let out = "";
  for (let g = 2; g >= 0; g--) {
    const triad = (mode >> (g * 3)) & 0b111;
    for (let b = 0; b < 3; b++) out += triad & (0b100 >> b) ? bits[b] : "-";
  }
  return out;
}

export function permString(node: VNode): string {
  const t = node.type === "dir" ? "d" : node.symlink ? "l" : "-";
  return t + modeToRwx(node.mode);
}

export function formatMtime(mtime: number): string {
  const d = new Date(mtime);
  const mon = NL_MONTHS[d.getUTCMonth()];
  const day = String(d.getUTCDate()).padStart(2, " ");
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${mon} ${day} ${hh}:${mm}`;
}

export function nodeSize(node: VNode): number {
  return node.type === "dir" ? 4096 : node.content.length;
}

export function isExecutable(node: VNode): boolean {
  return node.type === "file" && (node.mode & 0o111) !== 0;
}

/* ───────────────────────── path-helpers ───────────────────────── */
export function dirname(path: string): string {
  if (path === "/") return "/";
  const p = path.replace(/\/+$/, "");
  const i = p.lastIndexOf("/");
  return i <= 0 ? "/" : p.slice(0, i);
}
export function basename(path: string): string {
  if (path === "/") return "/";
  const p = path.replace(/\/+$/, "");
  return p.slice(p.lastIndexOf("/") + 1);
}

/* ───────────────────────── VFS-klasse ───────────────────────── */
export class VFS {
  root: DirNode;
  cwd: string;
  user: string;
  home: string;
  host: string;

  constructor(root: DirNode, opts: VfsOptions = {}) {
    this.root = root;
    this.user = opts.user ?? "student";
    this.host = opts.host ?? "bashacademy";
    this.home = opts.home ?? `/home/${this.user}`;
    this.cwd = opts.cwd ?? this.home;
  }

  /** Bouwt een VFS uit een compacte spec (kinderen van root `/`). */
  static fromSpec(spec: VfsSpec, opts: VfsOptions = {}): VFS {
    const owner = opts.user ?? "student";
    const root: DirNode = { type: "dir", name: "", mode: 0o755, owner: "root", group: "root", mtime: DEFAULT_MTIME, children: {} };
    for (const [name, node] of Object.entries(spec)) {
      root.children[name] = buildNode(name, node, owner, owner);
    }
    return new VFS(root, opts);
  }

  /** Diepe kopie — voor checkpoints, undo en grading. */
  clone(): VFS {
    const root = structuredClone(this.root) as DirNode;
    return new VFS(root, { cwd: this.cwd, user: this.user, home: this.home, host: this.host });
  }

  /* ── pad-resolutie ── */
  /** Normaliseert een pad naar absoluut (`~`, `.`, `..`, relatief, absoluut). */
  resolve(input: string): string {
    let p = input.trim();
    if (p === "" ) return this.cwd;
    if (p === "~") p = this.home;
    else if (p.startsWith("~/")) p = this.home + p.slice(1);
    if (!p.startsWith("/")) p = this.cwd + "/" + p;

    const stack: string[] = [];
    for (const seg of p.split("/")) {
      if (seg === "" || seg === ".") continue;
      if (seg === "..") { stack.pop(); continue; }
      stack.push(seg);
    }
    return "/" + stack.join("/");
  }

  /** Korte weergave van het cwd voor de prompt (~ voor home). */
  promptPath(path = this.cwd): string {
    if (path === this.home) return "~";
    if (path.startsWith(this.home + "/")) return "~" + path.slice(this.home.length);
    return path;
  }

  /* ── lookups ── */
  getNode(path: string): VNode | null {
    const abs = this.resolve(path);
    if (abs === "/") return this.root;
    const segs = abs.split("/").filter(Boolean);
    let cur: VNode = this.root;
    for (const seg of segs) {
      if (cur.type !== "dir") return null;
      const next: VNode | undefined = cur.children[seg];
      if (!next) return null;
      cur = next;
    }
    return cur;
  }
  getDir(path: string): DirNode | null {
    const n = this.getNode(path);
    return n && n.type === "dir" ? n : null;
  }
  getFile(path: string): FileNode | null {
    const n = this.getNode(path);
    return n && n.type === "file" ? n : null;
  }
  exists(path: string): boolean {
    return this.getNode(path) !== null;
  }

  private parentOf(path: string): { parent: DirNode | null; name: string } {
    const abs = this.resolve(path);
    const name = basename(abs);
    const parent = this.getDir(dirname(abs));
    return { parent, name };
  }

  /* ── mutaties ── */
  chdir(path: string): { ok: boolean; err?: string } {
    const abs = this.resolve(path);
    const n = this.getNode(abs);
    if (!n) return { ok: false, err: `cd: ${path}: No such file or directory` };
    if (n.type !== "dir") return { ok: false, err: `cd: ${path}: Not a directory` };
    this.cwd = abs;
    return { ok: true };
  }

  mkdir(path: string, opts: { parents?: boolean } = {}): { ok: boolean; err?: string } {
    const abs = this.resolve(path);
    if (abs === "/") return { ok: false, err: `mkdir: cannot create directory '/': File exists` };
    if (opts.parents) {
      const segs = abs.split("/").filter(Boolean);
      let cur = this.root;
      for (const seg of segs) {
        const next = cur.children[seg];
        if (next) {
          if (next.type !== "dir") return { ok: false, err: `mkdir: cannot create directory '${path}': Not a directory` };
          cur = next;
        } else {
          const d: DirNode = { type: "dir", name: seg, mode: 0o755, owner: this.user, group: this.user, mtime: DEFAULT_MTIME, children: {} };
          cur.children[seg] = d;
          cur = d;
        }
      }
      return { ok: true };
    }
    const { parent, name } = this.parentOf(abs);
    if (!parent) return { ok: false, err: `mkdir: cannot create directory '${path}': No such file or directory` };
    if (parent.children[name]) return { ok: false, err: `mkdir: cannot create directory '${path}': File exists` };
    parent.children[name] = { type: "dir", name, mode: 0o755, owner: this.user, group: this.user, mtime: DEFAULT_MTIME, children: {} };
    return { ok: true };
  }

  touch(path: string): { ok: boolean; err?: string } {
    const abs = this.resolve(path);
    const existing = this.getNode(abs);
    if (existing) { existing.mtime = DEFAULT_MTIME; return { ok: true }; }
    const { parent, name } = this.parentOf(abs);
    if (!parent) return { ok: false, err: `touch: cannot touch '${path}': No such file or directory` };
    parent.children[name] = { type: "file", name, content: "", mode: 0o644, owner: this.user, group: this.user, mtime: DEFAULT_MTIME };
    return { ok: true };
  }

  writeFile(path: string, content: string, opts: { append?: boolean } = {}): { ok: boolean; err?: string } {
    const abs = this.resolve(path);
    const existing = this.getNode(abs);
    if (existing && existing.type === "dir") return { ok: false, err: `${path}: Is a directory` };
    if (existing && existing.type === "file") {
      existing.content = opts.append ? existing.content + content : content;
      return { ok: true };
    }
    const { parent, name } = this.parentOf(abs);
    if (!parent) return { ok: false, err: `${path}: No such file or directory` };
    parent.children[name] = { type: "file", name, content, mode: 0o644, owner: this.user, group: this.user, mtime: DEFAULT_MTIME };
    return { ok: true };
  }

  readFile(path: string): { content?: string; err?: string } {
    const n = this.getNode(path);
    if (!n) return { err: `${path}: No such file or directory` };
    if (n.type === "dir") return { err: `${path}: Is a directory` };
    return { content: n.content };
  }

  rm(path: string, opts: { recursive?: boolean; force?: boolean } = {}): { ok: boolean; err?: string } {
    const abs = this.resolve(path);
    const n = this.getNode(abs);
    if (!n) return opts.force ? { ok: true } : { ok: false, err: `rm: cannot remove '${path}': No such file or directory` };
    if (n.type === "dir" && !opts.recursive) return { ok: false, err: `rm: cannot remove '${path}': Is a directory` };
    const { parent, name } = this.parentOf(abs);
    if (!parent) return { ok: false, err: `rm: cannot remove '${path}'` };
    delete parent.children[name];
    return { ok: true };
  }

  rmdir(path: string): { ok: boolean; err?: string } {
    const n = this.getNode(path);
    if (!n) return { ok: false, err: `rmdir: failed to remove '${path}': No such file or directory` };
    if (n.type !== "dir") return { ok: false, err: `rmdir: failed to remove '${path}': Not a directory` };
    if (Object.keys(n.children).length > 0) return { ok: false, err: `rmdir: failed to remove '${path}': Directory not empty` };
    const { parent, name } = this.parentOf(path);
    if (parent) delete parent.children[name];
    return { ok: true };
  }

  cp(src: string, dst: string, opts: { recursive?: boolean } = {}): { ok: boolean; err?: string } {
    const srcNode = this.getNode(src);
    if (!srcNode) return { ok: false, err: `cp: cannot stat '${src}': No such file or directory` };
    if (srcNode.type === "dir" && !opts.recursive) return { ok: false, err: `cp: -r not specified; omitting directory '${src}'` };

    const dstNode = this.getNode(dst);
    let targetParent: DirNode | null;
    let targetName: string;
    if (dstNode && dstNode.type === "dir") {
      targetParent = dstNode; targetName = basename(this.resolve(src));
    } else {
      const p = this.parentOf(dst); targetParent = p.parent; targetName = p.name;
    }
    if (!targetParent) return { ok: false, err: `cp: cannot create '${dst}': No such file or directory` };
    const copy = structuredClone(srcNode) as VNode;
    copy.name = targetName;
    targetParent.children[targetName] = copy;
    return { ok: true };
  }

  mv(src: string, dst: string): { ok: boolean; err?: string } {
    const srcNode = this.getNode(src);
    if (!srcNode) return { ok: false, err: `mv: cannot stat '${src}': No such file or directory` };
    const { parent: srcParent, name: srcName } = this.parentOf(src);
    if (!srcParent) return { ok: false, err: `mv: cannot move '${src}'` };

    const dstNode = this.getNode(dst);
    let targetParent: DirNode | null;
    let targetName: string;
    if (dstNode && dstNode.type === "dir") {
      targetParent = dstNode; targetName = srcName;
    } else {
      const p = this.parentOf(dst); targetParent = p.parent; targetName = p.name;
    }
    if (!targetParent) return { ok: false, err: `mv: cannot move '${src}' to '${dst}': No such file or directory` };
    const moved = srcParent.children[srcName];
    delete srcParent.children[srcName];
    moved.name = targetName;
    targetParent.children[targetName] = moved;
    return { ok: true };
  }

  /** Gesorteerde kindnamen van een directory (zoals `ls` ze toont). */
  listNames(path: string, opts: { all?: boolean } = {}): string[] | null {
    const d = this.getDir(path);
    if (!d) return null;
    let names = Object.keys(d.children);
    if (!opts.all) names = names.filter((n) => !n.startsWith("."));
    return names.sort((a, b) => a.replace(/^\./, "").localeCompare(b.replace(/^\./, ""), "en"));
  }

  listChildren(path: string, opts: { all?: boolean } = {}): VNode[] | null {
    const names = this.listNames(path, opts);
    const d = this.getDir(path);
    if (!names || !d) return null;
    return names.map((n) => d.children[n]);
  }
}
