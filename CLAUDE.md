# BashAcademy — interactief Linux/Bash leerplatform (openboek)

Interactief oefenplatform voor **Linux-commando's** met het oog op een **openboek-examen**.
Studenten typen commando's in een **gesimuleerde terminal**; een **virtueel filesystem** voert ze
écht uit (pipes, redirects, globs, multi-step state) en een **pattern-matching grader** beoordeelt
het resultaat. De **cheat-sheet** staat altijd naast de oefening — leren = *opzoeken & toepassen*.

100% client-side, geen execution-backend → veilig, gratis, werkt op elk toestel.
Zustermap-kloon van `../WinCommander` (PowerShell-platform), met **dezelfde architectuur**.

UI-taal: **Nederlands (Vlaams, "je")**. Commando's blijven origineel (`ls`, niet "lijst").

## Vastgelegde keuzes (met de gebruiker)
- **Design:** Modern Ubuntu op award-niveau — aubergine `#772953` + Pop!_OS-oranje `#FAA41A`,
  eigen visuele taal (warm Yaru-palet, aurora-achtergrond, glas). Géén template-look.
- **Motion:** cinematisch overal (framer-motion + lenis), GPU-versneld op 60fps.
- **Distro:** Debian/Ubuntu-focus (apt/dpkg).
- **Geen** code-executie, geen sql.js/Monaco, geen file-tree-UI (de VFS muteert via commando's).

## Tech stack
Next.js 14 (App Router) · TS · Tailwind (CSS-var tokens als RGB-triples) · Zustand + persist
(localStorage) · framer-motion · lenis. Upstash/Discord/admin = later, optioneel.

## Architectuur
```
app/            page (landing) · dashboard · oefeningen/[id] (split-pane) · cheatsheet[/cmd]
                · sandbox · theorie/examen/leaderboard (placeholder) · layout/template
components/     Terminal (textarea-overlay highlight) · TerminalPrompt · Highlight ·
                CheatsheetExplorer · CheatsheetEntry · ManpageOverlay · ExerciseRunner ·
                NavTabs · ThemeToggle · ModeProvider · BackgroundField · SmoothScroll ·
                HeaderStats · XpToast · Footer · ComingSoon · motion/{Reveal,Magnetic,TiltCard}
lib/            store (XP/streak/badges/favorites/notes) · identity · theme · useMounted ·
                exercises · curriculum (H1–H17) · cheatsheet · cn · xpToast
  vfs.ts            Virtual File System (tree + clone-checkpoints + mutatie-API)
  bashTokenizer.ts  regel → pipelines (quotes, redirects, |, &&/||/;, $())
  bashExecutor.ts   expansie (var/$()/glob) + redirects + pipes + ketening → dispatch
  bashHighlight.ts  display-tokenizer voor de terminal-overlay
  commands/         één handler per commando (ls, cd, pwd, cat, mkdir, touch, echo, …)
  bashGrader.ts     canonieke normalisatie (ls -la ≡ -al) + acceptors + output/VFS-match
  vfsPresets.ts     DEFAULT_SPEC + makeVfs/makeVfsForExercise/makeEnv
data/           cheatsheet.json · exercises.json · (later: vfs/*.json, theorie/h*.json)
styles/         globals.css (design-system: tokens, aurora, terminal, componenten)
scripts/        engine_selftest.mts  (`npx -y tsx scripts/engine_selftest.mts`)
```

### De motor (kort)
`runCommand(input, vfs, env)` → `{ lines: Seg[][], stdoutText, code, clear }`.
`lines` = gekleurde regels voor de UI; `stdoutText` = platte tekst voor `$()` + grading.
De VFS muteert in-place; per oefening krijgt elke student een verse `makeVfsForExercise(vfsStart)`.

### De grader (3 strategieën, combineerbaar per oefening)
1. **acceptors** — `normalizeCommand()` brengt naar canonieke vorm (ongevoelig voor quotes,
   spaties, flag-volgorde) en vergelijkt met de geldige vormen.
2. **expectedOutput** + `outputMatch` (`exact` | `set` | `contains`).
3. **mustInclude/forbid** + `acceptRegex` als vangnet (script-stijl).
Multi-step: `steps[]`, elk met eigen acceptors; VFS erft mee tussen stappen.

## Content toevoegen
- **Oefening:** object in `data/exercises.json` (zie `lib/exercises.ts` voor het `Exercise`-type).
- **Cheat-sheet commando:** object in `data/cheatsheet.json` (zie `lib/cheatsheet.ts`).
- **Nieuw commando:** `lib/commands/<naam>.ts` + entry in `lib/commands/index.ts`.
- **VFS-preset:** registreer in `PRESETS` in `lib/vfsPresets.ts`.

## Status (2026-06-10)
✅ Fundering, theming, nav, landing, dashboard · ✅ VFS-engine + tokenizer + executor (self-test 19/19)
· ✅ 8 command-handlers · ✅ terminal (overlay-highlight, history, tab-completion, Ctrl+C/L/R, !!)
· ✅ cheat-sheet explorer + man-overlay · ✅ grader · ✅ oefeningen split-pane + XP + opslaan · ✅ sandbox.
⏳ Te doen (wacht op cursus-content): meer command-handlers, volledige oefen/cheatsheet-data,
theorie, examensimulatie, leaderboard, verborgen /admin, notificaties.

## Dev
- `npm run dev` (poort 3000). Preview via `.claude/launch.json` config "dev".
- **Nooit `next build` draaien terwijl `next dev` loopt** (gedeelde `.next`).
- Typecheck: `npx tsc --noEmit`. Engine-test: `npx -y tsx scripts/engine_selftest.mts`.
- Next is gepind op `14.2` (gepatcht — 14.2.15 had een security-advisory).
