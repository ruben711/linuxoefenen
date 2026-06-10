const fs = require('fs');

const chapters = {
  '01': 'H1 Intro & geschiedenis',
  '02': 'H2 Shell & navigatie',
  '03': 'H3 History & variabelen',
  '04': 'H4 Redirects & pipes',
  '05': 'H5 Echo, alias & operatoren',
  '06': 'H6 Globbing, archiveren & links',
  '07': 'H7 Filters & pipelines',
  '08': 'H8 Shell scripting',
  '09': 'H9 Gebruikers & groepen',
  '10': 'H10 Permissies',
  '11': 'H11 Serverbeheer',
  '12': 'H12 Examenrecap'
};

const VALID_CATEGORIES = [
  'Basis','Navigatie','Bestanden','Bekijken','Zoeken','Tekst',
  'Permissies','Gebruikers','Processen','I/O & pipes','Archieven',
  'Netwerk','Systeem','Pakketten','Shell scripting'
];

function mapCategory(cat) {
  if (VALID_CATEGORIES.includes(cat)) return cat;
  const c = (cat || '').toLowerCase();
  if (c.includes('navigat')) return 'Navigatie';
  if (c.includes('bestand') || c.includes('file')) return 'Bestanden';
  if (c.includes('bekijk') || c.includes('pager')) return 'Bekijken';
  if (c.includes('zoek') || c.includes('search')) return 'Zoeken';
  if (c.includes('tekst') || c.includes('text')) return 'Tekst';
  if (c.includes('permiss') || c.includes('chmod')) return 'Permissies';
  if (c.includes('gebruiker') || c.includes('user') || c.includes('group')) return 'Gebruikers';
  if (c.includes('proces') || c.includes('process')) return 'Processen';
  if (c.includes('i/o') || c.includes('pipe') || c.includes('redirect')) return 'I/O & pipes';
  if (c.includes('archief') || c.includes('archiv') || c.includes('compress')) return 'Archieven';
  if (c.includes('netwerk') || c.includes('network')) return 'Netwerk';
  if (c.includes('systeem') || c.includes('system')) return 'Systeem';
  if (c.includes('pakket') || c.includes('package')) return 'Pakketten';
  if (c.includes('script') || c.includes('shell')) return 'Shell scripting';
  return 'Basis';
}

const chFiles = ['01','02','03','04','05','06','07','08','09','10','11','12'];
const allCommands = {}; // name -> {cmd, chapterId}

for (const id of chFiles) {
  const data = JSON.parse(fs.readFileSync('C:/Users/ruben/Linux/_cursus/extracted/ch-' + id + '.json', 'utf8'));
  for (const cmd of (data.commands || [])) {
    const name = cmd.name;
    if (!allCommands[name]) {
      allCommands[name] = { cmd: { ...cmd, flags: [...(cmd.flags||[])], examples: [...(cmd.examples||[])], related: [...(cmd.related||[])] }, chapterId: id };
    } else {
      const existing = allCommands[name].cmd;
      // Merge flags
      const existFlags = new Map((existing.flags||[]).map(f => [f.flag, f]));
      for (const f of (cmd.flags||[])) if (!existFlags.has(f.flag)) existFlags.set(f.flag, f);
      existing.flags = [...existFlags.values()];
      // Merge examples
      const existEx = new Map((existing.examples||[]).map(e => [e.cmd, e]));
      for (const e of (cmd.examples||[])) if (!existEx.has(e.cmd)) existEx.set(e.cmd, e);
      existing.examples = [...existEx.values()];
      // Merge related
      const existRel = new Set(existing.related||[]);
      for (const r of (cmd.related||[])) existRel.add(r);
      existing.related = [...existRel];
      // Use longer/better short + synopsis
      if ((cmd.short||'').length > (existing.short||'').length) existing.short = cmd.short;
      if ((cmd.synopsis||'').length > (existing.synopsis||'').length) existing.synopsis = cmd.synopsis;
    }
  }
}

// Operator/concept entries for I/O & pipes
const operatorEntries = [
  {
    name: '>',
    category: 'I/O & pipes',
    short: 'Leidt stdout van een commando om naar een bestand (overschrijft).',
    synopsis: 'commando > bestand',
    flags: [],
    examples: [
      { cmd: 'ls > lijst.txt', desc: 'Schrijft de uitvoer van ls naar lijst.txt.' },
      { cmd: 'echo "hallo" > bestand.txt', desc: 'Maakt bestand.txt aan met de tekst hallo.' }
    ],
    related: ['>>', '2>', '&>'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '>>',
    category: 'I/O & pipes',
    short: 'Voegt stdout toe aan een bestand (append) zonder te overschrijven.',
    synopsis: 'commando >> bestand',
    flags: [],
    examples: [
      { cmd: 'echo "regel" >> log.txt', desc: 'Voegt een regel toe aan log.txt.' },
      { cmd: 'date >> log.txt', desc: 'Voegt de huidige datum/tijd toe aan log.txt.' }
    ],
    related: ['>', '2>>'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '2>',
    category: 'I/O & pipes',
    short: 'Leidt stderr (bestandsdescriptor 2) om naar een bestand.',
    synopsis: 'commando 2> foutbestand',
    flags: [],
    examples: [
      { cmd: 'ls /bestaat_niet 2> errors.txt', desc: 'Stuurt de foutmelding naar errors.txt.' },
      { cmd: 'find / -name x 2> /dev/null', desc: 'Negeert alle foutmeldingen van find.' }
    ],
    related: ['>', '&>', '2>>'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '2>>',
    category: 'I/O & pipes',
    short: 'Voegt stderr toe aan een bestand (append).',
    synopsis: 'commando 2>> foutbestand',
    flags: [],
    examples: [
      { cmd: 'ls /bestaat_niet 2>> errors.txt', desc: 'Voegt de foutmelding toe aan het bestaande errors.txt.' }
    ],
    related: ['2>', '>>'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '&>',
    category: 'I/O & pipes',
    short: 'Leidt zowel stdout als stderr tegelijk om naar een bestand.',
    synopsis: 'commando &> bestand',
    flags: [],
    examples: [
      { cmd: 'commando &> alles.txt', desc: 'Schrijft zowel normale uitvoer als foutmeldingen naar alles.txt.' },
      { cmd: 'commando &> /dev/null', desc: 'Gooit alle uitvoer weg.' }
    ],
    related: ['>', '2>', '2>&1'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '2>&1',
    category: 'I/O & pipes',
    short: 'Stuurt stderr naar dezelfde bestemming als stdout.',
    synopsis: 'commando > bestand 2>&1',
    flags: [],
    examples: [
      { cmd: 'ls /x > out.txt 2>&1', desc: 'Schrijft stdout en stderr naar out.txt.' },
      { cmd: 'commando > /dev/null 2>&1', desc: 'Gooit alle uitvoer weg.' }
    ],
    related: ['&>', '>'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '<',
    category: 'I/O & pipes',
    short: 'Leidt de inhoud van een bestand om als stdin voor een commando.',
    synopsis: 'commando < invoerbestand',
    flags: [],
    examples: [
      { cmd: 'sort < namen.txt', desc: 'Geeft de inhoud van namen.txt als invoer aan sort.' },
      { cmd: 'tr a-z A-Z < bestand.txt', desc: 'Leest bestand.txt als invoer voor tr.' }
    ],
    related: ['<<', '<<<', '|'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '|',
    category: 'I/O & pipes',
    short: 'Koppelt de stdout van het ene commando aan de stdin van het volgende.',
    synopsis: 'commando1 | commando2 [| commando3 ...]',
    flags: [],
    examples: [
      { cmd: 'ls | wc -l', desc: 'Telt het aantal bestanden in de huidige map.' },
      { cmd: 'ps aux | grep firefox', desc: 'Zoekt naar Firefox-processen.' },
      { cmd: 'history | tail -10', desc: 'Toont de laatste 10 commando\'s uit de geschiedenis.' }
    ],
    related: ['>', 'tee'],
    chapter: 'H4 Redirects & pipes'
  },
  {
    name: '/dev/null',
    category: 'I/O & pipes',
    short: 'Speciale bestemming die alle uitvoer weggooit (zwart gat).',
    synopsis: 'commando > /dev/null',
    flags: [],
    examples: [
      { cmd: 'commando > /dev/null', desc: 'Gooit stdout weg.' },
      { cmd: 'commando 2> /dev/null', desc: 'Negeert foutmeldingen.' },
      { cmd: 'commando &> /dev/null', desc: 'Gooit alle uitvoer weg.' }
    ],
    related: ['>', '2>', '&>'],
    chapter: 'H4 Redirects & pipes'
  }
];

// Shell scripting keywords
const scriptingKeywords = [
  {
    name: 'if',
    category: 'Shell scripting',
    short: 'Voert een blok commando\'s uit als een conditie waar is.',
    synopsis: 'if CONDITIE; then COMMANDO\'s [elif CONDITIE; then ...] [else ...] fi',
    flags: [],
    examples: [
      { cmd: 'if [ -f "$f" ]; then echo "bestaat"; fi', desc: 'Controleert of een bestand bestaat.' },
      { cmd: 'if [ "$#" -lt 2 ]; then echo "Te weinig args"; exit 1; fi', desc: 'Valideert scriptargumenten.' }
    ],
    related: ['test', 'case', 'while'],
    chapter: 'H8 Shell scripting'
  },
  {
    name: 'for',
    category: 'Shell scripting',
    short: 'Herhaalt commando\'s voor elk element in een lijst of reeks.',
    synopsis: 'for VAR in LIJST; do COMMANDO\'s; done',
    flags: [],
    examples: [
      { cmd: 'for i in {1..5}; do echo $i; done', desc: 'Telt van 1 tot 5.' },
      { cmd: 'for f in *.txt; do wc -l "$f"; done', desc: 'Telt regels in alle tekstbestanden.' },
      { cmd: 'for ((i=1;i<=10;i++)); do echo $i; done', desc: 'C-stijl for-lus.' }
    ],
    related: ['while', 'until', 'break', 'continue'],
    chapter: 'H8 Shell scripting'
  },
  {
    name: 'while',
    category: 'Shell scripting',
    short: 'Herhaalt commando\'s zolang een conditie waar is.',
    synopsis: 'while CONDITIE; do COMMANDO\'s; done',
    flags: [],
    examples: [
      { cmd: 'while [ $t -le 5 ]; do echo $t; t=$((t+1)); done', desc: 'Telt van 1 tot 5.' },
      { cmd: 'while read -r line; do echo "$line"; done < bestand.txt', desc: 'Leest een bestand regel voor regel.' }
    ],
    related: ['for', 'until', 'break'],
    chapter: 'H8 Shell scripting'
  },
  {
    name: 'case',
    category: 'Shell scripting',
    short: 'Vergelijkt een waarde met meerdere patronen en voert het overeenkomende blok uit.',
    synopsis: 'case WAARDE in PATROON) COMMANDO\'s ;; ... esac',
    flags: [],
    examples: [
      { cmd: 'case $keuze in 1) date ;; 2) who ;; *) echo ongeldig ;; esac', desc: 'Menustructuur via case.' },
      { cmd: 'case $ext in txt|doc) echo document ;; jpg|png) echo afbeelding ;; esac', desc: 'Matcht meerdere extensies per patroon.' }
    ],
    related: ['if', 'getopts'],
    chapter: 'H8 Shell scripting'
  },
  {
    name: 'test',
    category: 'Shell scripting',
    short: 'Evalueert een conditie; geeft exitcode 0 (waar) of 1 (onwaar) terug.',
    synopsis: 'test EXPRESSIE   of   [ EXPRESSIE ]',
    flags: [
      { flag: '-f BESTAND', desc: 'Waar als het een gewoon bestand is.' },
      { flag: '-d MAP', desc: 'Waar als het een map is.' },
      { flag: '-e PAD', desc: 'Waar als het pad bestaat.' },
      { flag: '-z STRING', desc: 'Waar als de string leeg is.' },
      { flag: '-n STRING', desc: 'Waar als de string niet leeg is.' },
      { flag: '-eq', desc: 'Getallen: gelijk aan.' },
      { flag: '-lt', desc: 'Getallen: kleiner dan.' },
      { flag: '-gt', desc: 'Getallen: groter dan.' }
    ],
    examples: [
      { cmd: '[ -f /etc/passwd ]', desc: 'Test of /etc/passwd een bestand is.' },
      { cmd: '[ "$leeftijd" -ge 18 ]', desc: 'Test of leeftijd 18 of ouder is.' }
    ],
    related: ['if', 'bash'],
    chapter: 'H8 Shell scripting'
  }
];

// Build final array
const result = [];
const seen = new Set();

// Operator entries first
for (const entry of operatorEntries) {
  if (!seen.has(entry.name)) {
    seen.add(entry.name);
    result.push(entry);
  }
}

// Commands from chapters
for (const [name, { cmd, chapterId }] of Object.entries(allCommands)) {
  if (seen.has(name)) continue;
  seen.add(name);
  const entry = {
    name: cmd.name,
    category: mapCategory(cmd.category),
    short: cmd.short || '',
    synopsis: cmd.synopsis || cmd.name,
    chapter: chapters[chapterId]
  };
  if (cmd.flags && cmd.flags.length > 0) entry.flags = cmd.flags;
  if (cmd.examples && cmd.examples.length > 0) entry.examples = cmd.examples;
  if (cmd.related && cmd.related.length > 0) entry.related = cmd.related;
  if (cmd.tags && cmd.tags.length > 0) entry.tags = cmd.tags;
  if (cmd.danger) entry.danger = cmd.danger;
  result.push(entry);
}

// Scripting keywords
for (const kw of scriptingKeywords) {
  if (!seen.has(kw.name)) {
    seen.add(kw.name);
    result.push(kw);
  }
}

// Mark dangerous commands
const dangerous = ['rm', 'dd', 'mkfs', 'fdisk'];
for (const e of result) {
  if (dangerous.includes(e.name)) e.danger = true;
}

// Ensure all have chapter
for (const e of result) {
  if (!e.chapter) e.chapter = 'H2 Shell & navigatie';
}

fs.writeFileSync('C:/Users/ruben/Linux/data/cheatsheet.json', JSON.stringify(result, null, 2), 'utf8');
console.log('Written ' + result.length + ' entries');
