/* Valideert elke oefening: (1) de grader keurt de modeloplossing goed, en
 * (2) de modeloplossing draait zónder "No such file"-fout (de wereld klopt).
 * Run: npx -y tsx scripts/grader_selftest.mts                                  */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runCommand } from "../lib/bashExecutor";
import { makeEnv } from "../lib/vfsPresets";
import { buildExerciseWorld } from "../lib/exerciseWorld";
import { gradeCommand, gradeStep } from "../lib/bashGrader";

const here = dirname(fileURLToPath(import.meta.url));
const exercises: any[] = JSON.parse(readFileSync(join(here, "../data/exercises.json"), "utf8"));
const ERR = /No such file or directory|command not found|Not a directory|cannot access|cannot stat/i;

let pass = 0, fail = 0;
const gradeFails: { id: string; detail: string }[] = [];
const execErrs: { id: string; detail: string }[] = [];

function run(vfs: any, env: any, cmd: string) {
  const r = runCommand(cmd, vfs, env);
  const text = r.lines.map((l: any) => l.map((s: any) => s.text).join("")).join("\n");
  return { r, text };
}

for (const ex of exercises) {
  try {
    if ((ex.type === "multi-step" || ex.steps) && Array.isArray(ex.steps)) {
      const vfs = buildExerciseWorld(ex); const env = makeEnv(vfs);
      let ok = true, bad = "";
      for (const step of ex.steps) {
        const { r, text } = run(vfs, env, step.solution ?? "");
        if (ERR.test(text)) execErrs.push({ id: ex.id, detail: `stap «${step.solution}» → ${(text.match(ERR) || [""])[0]}` });
        if (!gradeStep(step, step.solution ?? "", r.stdoutText).correct) { ok = false; bad = step.solution; }
      }
      ok ? pass++ : (fail++, gradeFails.push({ id: ex.id, detail: `stap-sol faalt: ${bad}` }));
    } else {
      if (!ex.solution) { fail++; gradeFails.push({ id: ex.id, detail: "geen solution" }); continue; }
      const vfs = buildExerciseWorld(ex); const env = makeEnv(vfs);
      const { r, text } = run(vfs, env, ex.solution);
      if (ERR.test(text)) execErrs.push({ id: ex.id, detail: `«${ex.solution}» → ${(text.match(ERR) || [""])[0]}` });
      if (gradeCommand(ex, ex.solution, r.stdoutText).correct) pass++;
      else { fail++; gradeFails.push({ id: ex.id, detail: `sol: ${ex.solution}` }); }
    }
  } catch (e) {
    fail++; gradeFails.push({ id: ex.id, detail: "EXCEPTION: " + String(e).slice(0, 120) });
  }
}

console.log(`\n═══ Grading: ${pass} ✓  ${fail} ✗  (van ${pass + fail}) ═══`);
for (const f of gradeFails.slice(0, 40)) console.log(`  ✗ ${f.id}  ${f.detail}`);
console.log(`\n═══ Uitvoeringsfouten (wereld klopt niet): ${execErrs.length}/${exercises.length} ═══`);
for (const f of execErrs.slice(0, 50)) console.log(`  ⚠ ${f.id}  ${f.detail}`);
if (fail > 0) process.exit(1);
