import Link from "next/link";

export default function ComingSoon({
  icon = "🚧",
  title,
  desc,
  cmd,
}: {
  icon?: string;
  title: string;
  desc: string;
  cmd?: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 py-24">
      <div className="mx-auto max-w-xl text-center">
        <div className="mx-auto grid place-items-center w-16 h-16 rounded-2xl bg-sunken border border-line text-3xl mb-6 animate-pop">
          {icon}
        </div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-3 text-[15px] text-fg-muted leading-relaxed">{desc}</p>
        {cmd && (
          <div className="terminal mt-8 text-left">
            <div className="terminal-bar">
              <span className="terminal-dot" style={{ background: "#ff5f57" }} />
              <span className="terminal-dot" style={{ background: "#febc2e" }} />
              <span className="terminal-dot" style={{ background: "#28c840" }} />
            </div>
            <div className="terminal-body">
              <span style={{ color: "rgb(var(--t-cmd))" }}>student@bashacademy</span>
              <span style={{ color: "rgb(var(--term-fg)/0.6)" }}>:~$ </span>
              <span className="tok-plain">{cmd}</span>
              <div className="term-dim mt-1"># binnenkort beschikbaar…</div>
            </div>
          </div>
        )}
        <div className="mt-8">
          <Link href="/dashboard" className="btn btn-outline">← Terug naar dashboard</Link>
        </div>
      </div>
    </div>
  );
}
