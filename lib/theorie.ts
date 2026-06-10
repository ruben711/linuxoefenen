import raw from "@/data/theorie.json";

export type TheoryType = "mc" | "open";
export type TheoryQuestion = {
  id: string;
  chapter: string;
  type: TheoryType;
  question: string;
  choices?: string[];
  answer: string;
  explanation?: string;
};

const ALL = (raw as unknown as TheoryQuestion[]) ?? [];

export function getTheory(): TheoryQuestion[] { return ALL; }

function chapterNum(ch: string): number {
  const m = /^H(\d+)/i.exec(ch.trim());
  return m ? parseInt(m[1], 10) : 999;
}

export function theoryChapters(): string[] {
  const seen = new Set<string>();
  for (const q of ALL) seen.add(q.chapter);
  return [...seen].sort((a, b) => chapterNum(a) - chapterNum(b) || a.localeCompare(b));
}

export function theoryByChapter(chapter: string): TheoryQuestion[] {
  return ALL.filter((q) => q.chapter === chapter);
}

/** Index van het juiste antwoord binnen choices (robuust voor tekst of letter A-D). */
export function correctIndex(q: TheoryQuestion): number {
  if (!q.choices || q.choices.length === 0) return -1;
  const ans = q.answer.trim();
  let i = q.choices.findIndex((c) => c.trim() === ans);
  if (i >= 0) return i;
  if (/^[A-Za-z]$/.test(ans)) { const idx = ans.toUpperCase().charCodeAt(0) - 65; if (idx >= 0 && idx < q.choices.length) return idx; }
  i = q.choices.findIndex((c) => c.trim().toLowerCase().startsWith(ans.toLowerCase()) || ans.toLowerCase().startsWith(c.trim().toLowerCase()));
  return i;
}
