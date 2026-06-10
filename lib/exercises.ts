import raw from "@/data/exercises.json";

export type Difficulty = "easy" | "medium" | "hard" | "insane";
/** Voor BashAcademy is de shell altijd bash; veld behouden voor leaderboard/architectuur-pariteit. */
export type Shell = "bash";

/** Hoe de output van de student vergeleken wordt met expectedOutput. */
export type OutputMatch = "exact" | "set" | "contains";

/** Oefening-types (zie brief). "command" is de standaard. */
export type ExerciseType =
  | "command"      // typ het juiste commando
  | "multi-step"   // meerdere commando's, VFS erft mee
  | "pipeline"     // combineer commando's met pipes
  | "predict"      // output voorspellen (MC of kort antwoord)
  | "debug"        // fix de typo/bug
  | "script"       // schrijf een klein bash-script
  | "permissions"  // permissies-puzzel
  | "path";        // pad-navigatie

export type Step = {
  prompt: string;
  acceptors: string[];
  mustInclude?: string[];
  forbid?: string[];
  expectedOutput?: string[];
  outputMatch?: OutputMatch;
  outputMock?: string[];
  solution: string;
  hints?: string[];
};

export type Exercise = {
  id: string;
  chapter: string;            // bv. "H5 Zoeken"
  title: string;
  difficulty: Difficulty;
  shell: Shell;
  type?: ExerciseType;        // default "command"
  tags?: string[];
  prompt: string;

  /** Welke voorgedefinieerde VFS te laden (key in data/vfs/ of ingebouwd). */
  vfsStart?: string;

  /** command / debug / pipeline */
  acceptors?: string[];       // geldige (genormaliseerde) commando-vormen
  acceptRegex?: string[];     // vrije-vorm regex-fallback (case-insensitive)
  mustInclude?: string[];     // tokens die sowieso aanwezig moeten zijn
  forbid?: string[];          // tokens die NIET mogen voorkomen
  expectedOutput?: string[];  // verwachte uitvoer-regels
  outputMatch?: OutputMatch;  // default "set"
  outputMock?: string[];      // override voor gesimuleerde uitvoer
  hints?: string[];
  solution?: string;          // modeloplossing
  starter?: string;           // voorgevulde tekst (debug)

  /** multi-step / pipeline */
  steps?: Step[];

  /** predict-output / permissions / path */
  given?: string;             // het gegeven commando / de gegeven situatie
  choices?: string[];         // MC-opties
  answer?: string;            // correcte keuze / kort antwoord

  /** Gerelateerde cheat-sheet-commando's (openboek). */
  relatedCheatsheet?: string[];
};

const ALL = (raw as unknown as Exercise[]).map((e) => ({
  ...e,
  shell: "bash" as Shell,
  type: e.type ?? "command",
}));

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard", "insane"];

export function getExercises(): Exercise[] {
  return ALL;
}
export function getExercise(id: string): Exercise | undefined {
  return ALL.find((e) => e.id === id);
}

/** Nummer uit een hoofdstuk-label halen ("H12 Netwerk" -> 12) voor sortering. */
function chapterNum(ch: string): number {
  const m = /^H(\d+)/i.exec(ch.trim());
  return m ? parseInt(m[1], 10) : 999;
}

export function chapters(): string[] {
  const seen = new Set<string>();
  for (const e of ALL) seen.add(e.chapter);
  return [...seen].sort((a, b) => chapterNum(a) - chapterNum(b) || a.localeCompare(b));
}

export function byChapter(): { chapter: string; items: Exercise[] }[] {
  return chapters().map((chapter) => ({
    chapter,
    items: ALL.filter((e) => e.chapter === chapter),
  }));
}

export function allTags(): string[] {
  const s = new Set<string>();
  for (const e of ALL) (e.tags ?? []).forEach((t) => s.add(t));
  return [...s].sort();
}

export function nextExercise(id: string): Exercise | undefined {
  const i = ALL.findIndex((e) => e.id === id);
  return i >= 0 && i < ALL.length - 1 ? ALL[i + 1] : undefined;
}
export function prevExercise(id: string): Exercise | undefined {
  const i = ALL.findIndex((e) => e.id === id);
  return i > 0 ? ALL[i - 1] : undefined;
}

/** Willekeurige steekproef (examensimulatie). */
export function randomSample(
  n: number,
  opts?: { difficulty?: Difficulty; chapters?: string[] }
): Exercise[] {
  let pool = ALL.slice();
  if (opts?.difficulty) pool = pool.filter((e) => e.difficulty === opts.difficulty);
  if (opts?.chapters?.length) pool = pool.filter((e) => opts.chapters!.includes(e.chapter));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, n);
}
