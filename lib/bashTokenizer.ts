/**
 * Bash-tokenizer: splitst een commandoregel in een uitvoerbare structuur.
 *
 *   commandoregel  →  lijst van pipelines, gescheiden door ; && ||
 *   pipeline       →  simpele commando's, gescheiden door |
 *   simpel commando →  woorden (argv) + redirects
 *
 * Woorden behouden hun quote-info per segment, zodat de executor weet welke
 * expansie (variabelen, globs, $()) op welk stuk mag worden toegepast.
 * Whitespace binnen quotes en binnen $(...) / `...` breekt geen woorden.
 */

export type QuoteKind = "none" | "single" | "double";
export type WordSeg = { text: string; q: QuoteKind };
export type Word = WordSeg[];

export type RedirOp = ">" | ">>" | "<" | "2>" | "2>>" | "&>";
export type Redirect = { op: RedirOp; target: Word };

export type SimpleCommand = { words: Word[]; redirects: Redirect[] };
export type Pipeline = { commands: SimpleCommand[] };
export type Connector = "&&" | "||" | ";";
export type ListItem = { pipeline: Pipeline; connector: Connector };
export type CommandLine = ListItem[];

type Token =
  | { kind: "word"; word: Word }
  | { kind: "op"; value: "|" | "&&" | "||" | ";" }
  | { kind: "redir"; op: RedirOp };

const META = new Set(["|", "&", ";", "<", ">"]);

/* ───────────────────────── Lexer ───────────────────────── */
function lex(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  const matchOp = (): { op: Token; len: number } | null => {
    const two = input.slice(i, i + 2);
    const three = input.slice(i, i + 3);
    if (three === "2>>") return { op: { kind: "redir", op: "2>>" }, len: 3 };
    if (two === "&&") return { op: { kind: "op", value: "&&" }, len: 2 };
    if (two === "||") return { op: { kind: "op", value: "||" }, len: 2 };
    if (two === "2>") return { op: { kind: "redir", op: "2>" }, len: 2 };
    if (two === "&>") return { op: { kind: "redir", op: "&>" }, len: 2 };
    if (two === "1>" && input[i + 2] === ">") return { op: { kind: "redir", op: ">>" }, len: 3 };
    if (two === "1>") return { op: { kind: "redir", op: ">" }, len: 2 };
    if (two === ">>") return { op: { kind: "redir", op: ">>" }, len: 2 };
    if (input[i] === ">") return { op: { kind: "redir", op: ">" }, len: 1 };
    if (input[i] === "<") return { op: { kind: "redir", op: "<" }, len: 1 };
    if (input[i] === ";") return { op: { kind: "op", value: ";" }, len: 1 };
    if (input[i] === "|") return { op: { kind: "op", value: "|" }, len: 1 };
    if (input[i] === "&") return { op: { kind: "op", value: ";" }, len: 1 }; // achtergrond → behandel als scheidingsteken
    return null;
  };

  while (i < n) {
    const c = input[i];
    if (c === " " || c === "\t" || c === "\n") { i++; continue; }
    if (c === "#") break; // commentaar tot einde regel

    const op = matchOp();
    if (op) { tokens.push(op.op); i += op.len; continue; }

    // ── Woord lezen ──
    const word: Word = [];
    let cur: WordSeg | null = null;
    const pushText = (t: string, q: QuoteKind) => {
      if (cur && cur.q === q) cur.text += t;
      else { cur = { text: t, q }; word.push(cur); }
    };

    while (i < n) {
      const ch = input[i];
      if (ch === " " || ch === "\t" || ch === "\n") break;
      if (META.has(ch)) break;

      if (ch === "'") {
        let j = i + 1;
        while (j < n && input[j] !== "'") j++;
        pushText(input.slice(i + 1, j), "single");
        i = j < n ? j + 1 : j;
        continue;
      }
      if (ch === '"') {
        let j = i + 1;
        let buf = "";
        while (j < n && input[j] !== '"') {
          if (input[j] === "\\" && j + 1 < n && '"\\$`'.includes(input[j + 1])) { buf += input[j + 1]; j += 2; continue; }
          buf += input[j]; j++;
        }
        pushText(buf, "double");
        i = j < n ? j + 1 : j;
        continue;
      }
      if (ch === "\\" && i + 1 < n) {
        pushText(input[i + 1], "single"); // escaped char → letterlijk
        i += 2;
        continue;
      }
      if (ch === "$" && input[i + 1] === "(") {
        // $( ... ) met gebalanceerde haakjes (command-substitutie)
        let j = i + 2, depth = 1;
        while (j < n && depth > 0) { if (input[j] === "(") depth++; else if (input[j] === ")") depth--; if (depth > 0) j++; }
        pushText(input.slice(i, j + 1), "none");
        i = j + 1;
        continue;
      }
      if (ch === "`") {
        let j = i + 1;
        while (j < n && input[j] !== "`") j++;
        pushText("$(" + input.slice(i + 1, j) + ")", "none"); // normaliseer backticks → $()
        i = j < n ? j + 1 : j;
        continue;
      }
      pushText(ch, "none");
      i++;
    }
    tokens.push({ kind: "word", word });
  }
  return tokens;
}

/* ───────────────────────── Parser ───────────────────────── */
export function parse(input: string): CommandLine {
  const tokens = lex(input);
  const list: CommandLine = [];
  let cmds: SimpleCommand[] = [];
  let cur: SimpleCommand = { words: [], redirects: [] };

  const flushPipeline = (connector: Connector) => {
    if (cur.words.length || cur.redirects.length) cmds.push(cur);
    if (cmds.length) list.push({ pipeline: { commands: cmds }, connector });
    cmds = [];
    cur = { words: [], redirects: [] };
  };

  for (let k = 0; k < tokens.length; k++) {
    const t = tokens[k];
    if (t.kind === "word") {
      cur.words.push(t.word);
    } else if (t.kind === "redir") {
      const next = tokens[k + 1];
      const target: Word = next && next.kind === "word" ? next.word : [];
      cur.redirects.push({ op: t.op, target });
      if (next && next.kind === "word") k++;
    } else if (t.value === "|") {
      cmds.push(cur);
      cur = { words: [], redirects: [] };
    } else if (t.value === "&&") {
      flushPipeline("&&");
    } else if (t.value === "||") {
      flushPipeline("||");
    } else if (t.value === ";") {
      flushPipeline(";");
    }
  }
  flushPipeline(";");
  return list;
}

/* ───────────────────────── Helpers ───────────────────────── */
/** Platte tekst van een woord (alle segmenten samengevoegd, zonder expansie). */
export function wordRaw(word: Word): string {
  return word.map((s) => s.text).join("");
}

/** Heeft dit woord een unquoted glob-metateken (* ? [) ? */
export function wordHasGlob(word: Word): boolean {
  return word.some((s) => s.q === "none" && /[*?[]/.test(s.text));
}
