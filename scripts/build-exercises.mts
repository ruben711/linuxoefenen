/* Bouwt data/exercises.json deterministisch uit _cursus/extracted/ch-*.json.
 * Run: npx -y tsx scripts/build-exercises.mts                                  */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const exDir = join(here, "../_cursus/extracted");

const CHMAP: Record<string, string> = {
  "01": "H1 Intro & geschiedenis", "02": "H2 Shell & navigatie", "03": "H3 History & variabelen",
  "04": "H4 Redirects & pipes", "05": "H5 Echo, alias & operatoren", "06": "H6 Globbing, archiveren & links",
  "07": "H7 Filters & pipelines", "08": "H8 Shell scripting", "09": "H9 Gebruikers & groepen",
  "10": "H10 Permissies", "11": "H11 Serverbeheer", "12": "H12 Examenrecap",
};
const DIFFS = ["easy", "medium", "hard", "insane"];
const EDITOR = /^\s*(nano|vim|vi|emacs|gedit)\b/;

const uniq = (a: string[]) => [...new Set(a.filter(Boolean))];

const out: any[] = [];
let skipped = 0;

for (const id of Object.keys(CHMAP)) {
  let data: any;
  try { data = JSON.parse(readFileSync(join(exDir, `ch-${id}.json`), "utf8")); }
  catch { console.warn(`! ch-${id}.json onleesbaar`); continue; }

  const exs: any[] = Array.isArray(data.exercises) ? data.exercises : [];
  let seq = 0;
  for (const e of exs) {
    if (!e || !e.prompt) { skipped++; continue; }
    if (typeof e.solution === "string" && EDITOR.test(e.solution)) { skipped++; continue; } // interactieve editor

    seq++;
    const acceptors = uniq(Array.isArray(e.acceptors) ? e.acceptors : []);
    if (typeof e.solution === "string" && e.solution && !acceptors.includes(e.solution)) acceptors.unshift(e.solution);

    const ex: any = {
      id: `lin-${id}-${seq}`,
      chapter: CHMAP[id],
      title: String(e.title ?? "Oefening"),
      difficulty: DIFFS.includes(e.difficulty) ? e.difficulty : "medium",
      shell: "bash",
      type: e.type || "command",
      tags: Array.isArray(e.tags) ? e.tags : [],
      prompt: String(e.prompt),
      vfsStart: "default",
    };
    if (acceptors.length) ex.acceptors = acceptors;
    if (Array.isArray(e.expectedOutput) && e.expectedOutput.length) ex.expectedOutput = e.expectedOutput;
    if (e.outputMatch) ex.outputMatch = e.outputMatch;
    if (Array.isArray(e.hints) && e.hints.length) ex.hints = e.hints;
    if (typeof e.solution === "string") ex.solution = e.solution;
    const related = uniq((Array.isArray(e.commandsUsed) ? e.commandsUsed : []).filter((c: string) => /^[a-z]/.test(c))).slice(0, 5);
    if (related.length) ex.relatedCheatsheet = related;

    if (Array.isArray(e.steps) && e.steps.length) {
      ex.type = "multi-step";
      ex.steps = e.steps.map((s: any) => {
        const acc = uniq(Array.isArray(s.acceptors) ? s.acceptors : []);
        if (typeof s.solution === "string" && s.solution && !acc.includes(s.solution)) acc.unshift(s.solution);
        const step: any = { prompt: String(s.prompt ?? ""), acceptors: acc, solution: String(s.solution ?? "") };
        if (Array.isArray(s.expectedOutput) && s.expectedOutput.length) step.expectedOutput = s.expectedOutput;
        if (Array.isArray(s.hints) && s.hints.length) step.hints = s.hints;
        return step;
      });
    }
    out.push(ex);
  }
}

writeFileSync(join(here, "../data/exercises.json"), JSON.stringify(out, null, 2) + "\n");
console.log(`✓ ${out.length} oefeningen geschreven (${skipped} overgeslagen) → data/exercises.json`);
const byCh: Record<string, number> = {};
for (const e of out) byCh[e.chapter] = (byCh[e.chapter] ?? 0) + 1;
for (const [c, n] of Object.entries(byCh)) console.log(`   ${c}: ${n}`);
