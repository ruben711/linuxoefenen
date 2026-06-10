"use client";
import Link from "next/link";
import { useProgress } from "@/lib/store";
import { useMounted } from "@/lib/useMounted";

/** Compacte level/XP-indicator in de topbar met een progressie-ring. */
export default function HeaderStats() {
  const mounted = useMounted();
  const xp = useProgress((s) => s.xp);
  const level = useProgress((s) => s.level());

  const r = 13;
  const c = 2 * Math.PI * r;
  const pct = mounted ? Math.max(0, Math.min(1, level.progress)) : 0;

  return (
    <Link
      href="/dashboard"
      className="group hidden sm:flex items-center gap-2.5 rounded-[11px] border border-line bg-panel/60 pl-1.5 pr-3 h-9 transition-all hover:border-brand/50 hover:bg-hover"
      title="Naar dashboard"
    >
      <span className="relative grid place-items-center w-7 h-7">
        <svg width="30" height="30" viewBox="0 0 30 30" className="-rotate-90">
          <circle cx="15" cy="15" r={r} fill="none" stroke="rgb(var(--line-strong))" strokeWidth="2.5" />
          <circle cx="15" cy="15" r={r} fill="none" stroke="rgb(var(--brand))" strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.6s cubic-bezier(0.16,1,0.3,1)" }} />
        </svg>
        <span className="absolute text-[10px] font-bold tabular">{mounted ? level.level : "—"}</span>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[12px] font-semibold tabular">{mounted ? xp : 0} XP</span>
        <span className="text-[9.5px] text-fg-dim font-mono">level {mounted ? level.level : "—"}</span>
      </span>
    </Link>
  );
}
