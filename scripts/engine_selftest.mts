/* Snelle zelf-test van de simulatie-motor (VFS + tokenizer + executor + commands).
 * Run:  npx -y tsx scripts/engine_selftest.mts                                   */
import { runCommand } from "../lib/bashExecutor";
import { makeVfs, makeEnv } from "../lib/vfsPresets";

const vfs = makeVfs();
const env = makeEnv(vfs);

let pass = 0, fail = 0;

function out(cmd: string): string {
  const r = runCommand(cmd, vfs, env);
  return r.lines.map((l) => l.map((s) => s.text).join("")).join("\n");
}
function show(cmd: string) {
  const o = out(cmd);
  console.log(`\n\x1b[36m$ ${cmd}\x1b[0m`);
  if (o) console.log(o);
}
function expect(cmd: string, want: string) {
  const o = out(cmd);
  const ok = o.trim() === want.trim();
  console.log(`\x1b[36m$ ${cmd}\x1b[0m`);
  if (o) console.log(o);
  if (ok) { console.log("  \x1b[32m✓\x1b[0m"); pass++; }
  else { console.log(`  \x1b[31m✗ verwacht ${JSON.stringify(want)} | kreeg ${JSON.stringify(o)}\x1b[0m`); fail++; }
}
/** Assert tegen de platte stdout-tekst (= wat de grader gebruikt). */
function expectStdout(cmd: string, want: string) {
  const r = runCommand(cmd, vfs, env);
  const o = r.stdoutText;
  const ok = o.trim() === want.trim();
  console.log(`\x1b[36m$ ${cmd}\x1b[0m  \x1b[90m(stdout)\x1b[0m`);
  if (ok) { console.log("  \x1b[32m✓\x1b[0m"); pass++; }
  else { console.log(`  \x1b[31m✗ verwacht ${JSON.stringify(want)} | kreeg ${JSON.stringify(o)}\x1b[0m`); fail++; }
}

console.log("═══ BashAcademy engine self-test ═══");

expect("pwd", "/home/student");
expect("whoami", "student");
expect("echo hallo wereld", "hallo wereld");

// multi-step state-mutatie
show("ls");
expect("mkdir test", "");
show("ls");
expect("cd test && pwd", "/home/student/test");
expectStdout("touch a.txt b.txt && ls", "a.txt\nb.txt");
expect("echo 'hallo wereld' > a.txt", "");
expect("cat a.txt", "hallo wereld");
expect("echo regel2 >> a.txt && cat a.txt", "hallo wereld\nregel2");

// pipes + substitutie + variabelen
expect("echo hi | cat", "hi");
expect("echo $(whoami)", "student");
expect("echo $USER woont in $HOME", "student woont in /home/student");

// ketening met exit codes
expect("false && echo nee || echo ja", "ja");
expect("true && echo ok", "ok");

// terug naar home, globs + verborgen files
expect("cd ~ && pwd", "/home/student");
expectStdout("ls documenten", "budget.csv\ncv.txt\nnotities.md");
show("ls -la");
show("ls *.md documenten/*.csv");
expect("cat documenten/budget.csv | cat", "maand,bedrag\njan,1200\nfeb,1100\nmrt,1250");

// absolute paden + .. navigatie
expect("cd /etc && cat hostname", "bashacademy");
expect("cd /var/log && cd ../.. && pwd", "/");

// ── nieuwe handlers ──
console.log("\n— extra commando's —");
expectStdout("echo hoi > a.txt && cp a.txt b.txt && cat b.txt", "hoi");
expectStdout("mkdir map && mv b.txt map/ && ls map", "b.txt");
expectStdout("rm a.txt && ls a.txt 2>/dev/null", "");
expectStdout("printf 'r1\\nr2\\nr3\\nr4\\nr5\\n' > n.txt && head -3 n.txt", "r1\nr2\nr3");
expectStdout("tail -2 n.txt", "r4\nr5");
expectStdout("wc -l n.txt", "5 n.txt");
expectStdout("printf 'b\\na\\nb\\nc\\na\\n' > s.txt && sort s.txt | uniq", "a\nb\nc");
expectStdout("echo HELLO WERELD | tr '[:upper:]' '[:lower:]'", "hello wereld");
expectStdout("echo 'a:b:c' | cut -d: -f2", "b");
expectStdout("echo 'naam leeftijd stad' | awk '{print $2}'", "leeftijd");
expectStdout("awk -F: '{print $1}' /etc/passwd", "root\nstudent");
expectStdout("grep \"^r\" /etc/passwd | wc -l", "1");
expectStdout("printf 'appel\\nAppel\\npeer\\n' > f.txt && grep -i appel f.txt | wc -l", "2");
expectStdout("mkdir -p /tmp/ft && cd /tmp/ft && touch x.txt y.txt z.log && find . -maxdepth 1 -name '*.txt' | wc -l", "2");
expectStdout("echo een > t.txt && echo twee >> t.txt && cat t.txt", "een\ntwee");
expectStdout("seq 1 3", "1\n2\n3");
expect("export GROET=hallo && echo $GROET", "hallo");
expect("MIJN=waarde && echo $MIJN", "waarde");

console.log(`\n═══ ${pass} ✓  ${fail} ✗ ═══`);
if (fail > 0) process.exit(1);
