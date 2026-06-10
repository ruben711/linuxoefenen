import Link from "next/link";
import HeroTerminal from "@/components/landing/HeroTerminal";
import Reveal from "@/components/motion/Reveal";
import Magnetic from "@/components/motion/Magnetic";
import TiltCard from "@/components/motion/TiltCard";
import { CURRICULUM } from "@/lib/curriculum";
import { getExercises } from "@/lib/exercises";
import { getCommands } from "@/lib/cheatsheet";

const FEATURES = [
  {
    icon: "📖",
    title: "Openboek by design",
    body: "Je traint het opzóeken en toepassen — precies de vaardigheid die je nodig hebt op een openboek-examen. De cheat-sheet is een snelle, doorzoekbare kennisbank.",
    accent: "from-brand-glow/20",
  },
  {
    icon: "🧪",
    title: "Een echte shell, virtueel",
    body: "Een volledig virtueel filesystem voert je commando's écht uit: pipes, redirects, globs en multi-step taken. Elke stap muteert de staat — veilig, gratis, op elk toestel.",
    accent: "from-magenta/20",
  },
  {
    icon: "🎮",
    title: "Voortgang die motiveert",
    body: "XP, levels, streaks en badges maken van oefenen een spel. Je ziet je groei per hoofdstuk en blijft terugkomen tot je het in de vingers hebt.",
    accent: "from-aubergine-lt/25",
  },
];

export default function Home() {
  const exCount = getExercises().length;
  const cmdCount = getCommands().length;
  const stats: [string, string][] = [
    [String(CURRICULUM.length), "hoofdstukken"],
    [String(exCount), "oefeningen"],
    [String(cmdCount), "commando's"],
  ];

  return (
    <div className="overflow-clip">
      {/* ══════════════ HERO ══════════════ */}
      <section className="relative">
        <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center">
            <div className="animate-rise">
              <span className="kicker">Linux · Bash · openboek</span>
              <h1 className="mt-5 text-[clamp(2.6rem,6vw,4.4rem)] font-bold leading-[0.98] tracking-tightest text-balance">
                Leer Linux <br className="hidden sm:block" />
                door te <span className="text-gradient">dóen</span>.
              </h1>
              <p className="mt-6 max-w-xl text-[17px] leading-relaxed text-fg-muted text-balance">
                Een gesimuleerde terminal met een echt virtueel filesystem en oefeningen die meegroeien
                met je niveau. Typ commando&apos;s, zie het live effect, beheers de shell.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3.5">
                <Magnetic>
                  <Link href="/oefeningen" className="btn btn-brand">Begin met oefenen <span aria-hidden>→</span></Link>
                </Magnetic>
                <Magnetic strength={0.25}>
                  <Link href="/sandbox" className="btn btn-outline font-mono"><span className="text-brand-glow">~$</span> open de sandbox</Link>
                </Magnetic>
              </div>

              <dl className="mt-12 flex flex-wrap gap-x-9 gap-y-4">
                {stats.map(([n, l]) => (
                  <div key={l}>
                    <dt className="text-2xl font-bold tabular text-gradient w-fit">{n}</dt>
                    <dd className="text-[12.5px] text-fg-dim font-mono mt-0.5">{l}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative animate-rise [animation-delay:140ms]">
              <div className="absolute -inset-6 -z-10 rounded-[28px] bg-brand-gradient-soft blur-2xl opacity-70" />
              <HeroTerminal />
              <div className="mt-3 text-center text-[11px] text-fg-faint font-mono">↑ een echte sessie — gesimuleerd, volledig veilig</div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════ FEATURES ══════════════ */}
      <section className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 py-10">
        <Reveal>
          <h2 className="text-[clamp(1.7rem,3.4vw,2.4rem)] font-bold tracking-tight text-balance">
            Niet nog een tutorial. <span className="text-fg-dim">Een oefenterrein.</span>
          </h2>
        </Reveal>
        <div className="mt-9 grid md:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <div className="group h-full">
                <TiltCard className="h-full">
                  <div className="card lift h-full p-6 overflow-hidden">
                    <div className={`absolute inset-0 -z-10 bg-gradient-to-br ${f.accent} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="grid place-items-center w-12 h-12 rounded-xl bg-sunken border border-line text-2xl mb-4">{f.icon}</div>
                    <h3 className="text-[17px] font-semibold">{f.title}</h3>
                    <p className="mt-2 text-[14px] leading-relaxed text-fg-muted">{f.body}</p>
                  </div>
                </TiltCard>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════ CURRICULUM ══════════════ */}
      <section className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 py-16">
        <Reveal>
          <span className="kicker">Het volledige pad</span>
          <h2 className="mt-4 text-[clamp(1.7rem,3.4vw,2.4rem)] font-bold tracking-tight">
            Van <span className="font-mono text-brand">pwd</span> tot <span className="font-mono text-brand">crontab</span>.
          </h2>
        </Reveal>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CURRICULUM.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i * 0.03, 0.3)}>
              <Link href="/oefeningen" className="group flex items-start gap-3.5 rounded-xl border border-line bg-panel/50 p-4 lift hover:border-brand/40">
                <span className="grid place-items-center w-10 h-10 rounded-lg bg-sunken text-lg shrink-0">{c.icon}</span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold text-brand-glow">{c.id}</span>
                    <span className="text-[14.5px] font-semibold truncate">{c.title}</span>
                  </span>
                  <span className="block text-[12.5px] text-fg-dim mt-0.5 leading-snug">{c.blurb}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ══════════════ CTA ══════════════ */}
      <section className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 pb-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] border border-line bg-panel/60 p-10 sm:p-14 text-center">
            <div className="absolute inset-0 -z-10 bg-brand-gradient-soft opacity-60" />
            <div className="bg-field__blob b1 !opacity-40" style={{ position: "absolute", width: 280, height: 280, top: -80, left: "60%" }} />
            <h2 className="text-[clamp(1.8rem,4vw,2.8rem)] font-bold tracking-tight text-balance">Klaar om je terminal-skills te bouwen?</h2>
            <p className="mt-4 max-w-lg mx-auto text-[15.5px] text-fg-muted">Geen installatie, geen risico. Open de terminal en typ je eerste commando.</p>
            <div className="mt-8 flex justify-center">
              <Magnetic>
                <Link href="/dashboard" className="btn btn-brand h-12 px-7 text-[15px]">Naar mijn dashboard <span aria-hidden>→</span></Link>
              </Magnetic>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
