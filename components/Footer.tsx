import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-line">
      <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 py-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="grid place-items-center w-8 h-8 rounded-lg bg-brand-gradient font-mono text-[13px] font-bold text-on-brand shadow-glow-soft">
              ~$
            </span>
            <div className="leading-tight">
              <div className="text-sm font-semibold">BashAcademy</div>
              <div className="text-[11px] text-fg-dim font-mono">leer Linux door te dóen — openboek</div>
            </div>
          </div>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-fg-dim">
            <Link href="/oefeningen" className="hover:text-fg transition-colors">Oefeningen</Link>
            <Link href="/cheatsheet" className="hover:text-fg transition-colors">Cheat-sheet</Link>
            <Link href="/sandbox" className="hover:text-fg transition-colors">Sandbox</Link>
            <Link href="/leaderboard" className="hover:text-fg transition-colors">Leaderboard</Link>
          </nav>
        </div>
        <div className="mt-8 pt-6 border-t border-line/60 flex flex-col sm:flex-row justify-between gap-2 text-[11px] text-fg-faint font-mono">
          <span>© {new Date().getFullYear()} BashAcademy · gesimuleerde shell, 100% veilig in de browser</span>
          <span>geen echte commando&apos;s — alles draait virtueel</span>
        </div>
      </div>
    </footer>
  );
}
