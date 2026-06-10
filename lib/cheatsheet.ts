import raw from "@/data/cheatsheet.json";

export type CheatFlag = { flag: string; desc: string };
export type CheatExample = { cmd: string; desc: string };
export type CheatCommand = {
  name: string;
  category: string;
  short: string;        // 1 zin
  synopsis: string;     // bv. "ls [OPTIE]... [BESTAND]..."
  flags?: CheatFlag[];
  examples?: CheatExample[];
  related?: string[];
  chapter?: string;     // bron-vermelding
  tags?: string[];
  danger?: boolean;     // gevaarlijk commando (bv. rm -rf)
};

const ALL = raw as CheatCommand[];

export const CATEGORY_ORDER = [
  "Basis", "Navigatie", "Bestanden", "Bekijken", "Zoeken",
  "Tekst", "Permissies", "Gebruikers", "Processen", "I/O & pipes",
  "Archieven", "Netwerk", "Systeem", "Pakketten", "Shell scripting",
];

export const CATEGORY_ICON: Record<string, string> = {
  Basis: "⌨️", Navigatie: "🧭", Bestanden: "📁", Bekijken: "👁️", Zoeken: "🔍",
  Tekst: "✂️", Permissies: "🔐", Gebruikers: "👥", Processen: "⚙️", "I/O & pipes": "🔗",
  Archieven: "📦", Netwerk: "🌐", Systeem: "📊", Pakketten: "📥", "Shell scripting": "📜",
};

export function getCommands(): CheatCommand[] { return ALL; }
export function getCommand(name: string): CheatCommand | undefined {
  return ALL.find((c) => c.name === name);
}
export function categories(): string[] {
  const present = new Set(ALL.map((c) => c.category));
  return CATEGORY_ORDER.filter((c) => present.has(c));
}
export function byCategory(cat: string): CheatCommand[] {
  return ALL.filter((c) => c.category === cat).sort((a, b) => a.name.localeCompare(b.name));
}

/** Subsequence-fuzzy score: lager = beter, -1 = geen match. */
function fuzzyName(q: string, target: string): number {
  q = q.toLowerCase(); target = target.toLowerCase();
  if (target === q) return 0;
  if (target.startsWith(q)) return 1;
  if (target.includes(q)) return 2 + target.indexOf(q) / 100;
  let ti = 0, qi = 0, gaps = 0;
  while (ti < target.length && qi < q.length) {
    if (target[ti] === q[qi]) qi++; else gaps++;
    ti++;
  }
  return qi === q.length ? 40 + gaps : -1;
}

export function search(query: string): CheatCommand[] {
  const q = query.trim().toLowerCase();
  if (!q) return ALL;
  const scored: { c: CheatCommand; s: number }[] = [];
  for (const c of ALL) {
    const cand = [
      fuzzyName(q, c.name),
      c.short.toLowerCase().includes(q) ? 6 : -1,
      (c.tags ?? []).some((t) => t.toLowerCase().includes(q)) ? 7 : -1,
      (c.flags ?? []).some((f) => f.desc.toLowerCase().includes(q)) ? 12 : -1,
    ].filter((s) => s >= 0);
    if (cand.length) scored.push({ c, s: Math.min(...cand) });
  }
  return scored.sort((a, b) => a.s - b.s || a.c.name.localeCompare(b.c.name)).map((x) => x.c);
}
