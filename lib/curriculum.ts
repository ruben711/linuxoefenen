/**
 * Curriculum-ruggengraat, afgeleid uit de VIVES "IntroToLinux"-cursus (12 lessen).
 * Onafhankelijk van de oefendata zodat dashboard/oefeningen-overzicht structuur tonen.
 */
export type ChapterMeta = {
  id: string;        // "H5"
  label: string;     // "H5 Echo, alias & operatoren"
  title: string;     // "Echo, alias & operatoren"
  icon: string;
  blurb: string;
  commands: string[];
};

export const CURRICULUM: ChapterMeta[] = [
  { id: "H1", label: "H1 Intro & geschiedenis", title: "Intro & geschiedenis", icon: "🐧",
    blurb: "De oorsprong van Unix & Linux, kernel vs. besturingssysteem, het GNU-project, de GPL en distributies.",
    commands: [] },
  { id: "H2", label: "H2 Shell & navigatie", title: "Shell & navigatie", icon: "🧭",
    blurb: "Terminal, shell en het Linux-bestandssysteem (FHS). Navigeren en bestanden beheren, en hulp vinden.",
    commands: ["pwd", "cd", "ls", "touch", "mkdir", "cp", "mv", "rm", "cat", "less", "head", "tail", "man"] },
  { id: "H3", label: "H3 History & variabelen", title: "History & variabelen", icon: "🕰️",
    blurb: "Omgevingsvariabelen aanmaken en exporteren, de PATH, command-history en je shell configureren via ~/.bashrc.",
    commands: ["env", "printenv", "export", "set", "echo", "history", "which", "type"] },
  { id: "H4", label: "H4 Redirects & pipes", title: "Redirects & pipes", icon: "🔀",
    blurb: "De drie standaardstromen (stdin/stdout/stderr) omleiden met > >> 2> &> en commando's koppelen met pipes.",
    commands: ["echo", "tee", "sort", "uniq", "wc", "grep", "cut", "tac", "head", "tail"] },
  { id: "H5", label: "H5 Echo, alias & operatoren", title: "Echo, alias & operatoren", icon: "⌨️",
    blurb: "Quotes en escape-tekens, aliassen als snelkoppelingen, en controle-operatoren (&& || ; &).",
    commands: ["echo", "alias", "unalias", "type", "which", "command"] },
  { id: "H6", label: "H6 Globbing, archiveren & links", title: "Globbing, archiveren & links", icon: "📦",
    blurb: "Bestanden selecteren met globs (* ? [] {}), archiveren met tar/gzip/zip, en hard- en softlinks en inodes.",
    commands: ["tar", "gzip", "gunzip", "zip", "unzip", "ln", "stat", "find", "dd"] },
  { id: "H7", label: "H7 Filters & pipelines", title: "Filters & pipelines", icon: "✂️",
    blurb: "De krachtige tekstfilters: grep, cut, tr, wc, sort, uniq, sed, comm en tee, gekoppeld via pipes.",
    commands: ["grep", "cut", "tr", "wc", "sort", "uniq", "sed", "comm", "cat", "tee"] },
  { id: "H8", label: "H8 Shell scripting", title: "Shell scripting", icon: "📜",
    blurb: "Scripts schrijven: variabelen, invoer, conditionele statements (if/case), lussen (for/while) en functies.",
    commands: ["bash", "chmod", "read", "echo", "test", "if", "for", "while", "case", "exit"] },
  { id: "H9", label: "H9 Gebruikers & groepen", title: "Gebruikers & groepen", icon: "👥",
    blurb: "Gebruikers en groepen beheren, het sudo-systeem en /etc/passwd, /etc/shadow en /etc/group.",
    commands: ["id", "whoami", "groups", "useradd", "passwd", "usermod", "userdel", "groupadd", "sudo"] },
  { id: "H10", label: "H10 Permissies", title: "Permissies", icon: "🔐",
    blurb: "Lees/schrijf/uitvoer-rechten voor user/group/other, chmod (symbolisch & octaal), chown/chgrp, umask en find.",
    commands: ["chmod", "chown", "chgrp", "umask", "find", "stat", "ls"] },
  { id: "H11", label: "H11 Serverbeheer", title: "Serverbeheer", icon: "🖥️",
    blurb: "Processen, systemd-services, cron, netwerk en monitoring. Informatief — niet getoetst op het examen.",
    commands: ["ps", "top", "kill", "systemctl", "crontab", "ip", "ss", "ping", "df", "free"] },
  { id: "H12", label: "H12 Examenrecap", title: "Examenrecap", icon: "🎯",
    blurb: "Gerichte herhaling van de examrelevante commando's uit lessen 1–10. Snelheid door te weten wat je combineert.",
    commands: ["ls", "find", "grep", "cut", "tr", "sort", "uniq", "comm", "wc", "awk", "ln", "chmod"] },
];

export function chapterMeta(label: string): ChapterMeta | undefined {
  const id = (/^H\d+/i.exec(label.trim()) || [])[0]?.toUpperCase();
  return CURRICULUM.find((c) => c.id === id) ?? CURRICULUM.find((c) => c.label === label);
}
