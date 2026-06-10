"use client";
import { useCallback, useEffect, useState } from "react";

type Row = { key: string; name: string; xp: number; level: number; streak: number; solved: number; color?: string };
const SS_KEY = "bashacademy-admin-secret";

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [board, setBoard] = useState<Row[]>([]);
  const [upstash, setUpstash] = useState(true);
  const [adminConfigured, setAdminConfigured] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const load = useCallback(async (sec: string) => {
    setLoading(true); setError(""); setNotice("");
    try {
      const r = await fetch("/api/admin/leaderboard", { headers: { "x-admin-secret": sec }, cache: "no-store" });
      const d = await r.json();
      if (d.adminConfigured === false) { setAdminConfigured(false); return; }
      if (r.status === 401 || !d.ok) { setError("Fout wachtwoord."); return; }
      setAuthed(true); setUpstash(d.upstash !== false); setBoard(d.board ?? []);
      sessionStorage.setItem(SS_KEY, sec);
    } catch { setError("Kon de server niet bereiken."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(SS_KEY);
    if (saved) { setSecret(saved); load(saved); }
  }, [load]);

  async function del(key: string, name: string) {
    if (!window.confirm(`Inzending van "${name}" definitief verwijderen?`)) return;
    setBusy(key);
    try {
      await fetch(`/api/admin/leaderboard?key=${encodeURIComponent(key)}`, { method: "DELETE", headers: { "x-admin-secret": secret } });
      setBoard((b) => b.filter((r) => r.key !== key));
    } finally { setBusy(null); }
  }

  async function recalc() {
    setBusy("recalc"); setNotice("");
    try {
      const r = await fetch("/api/admin/leaderboard", { method: "POST", headers: { "x-admin-secret": secret } });
      const d = await r.json();
      if (d.ok) { setNotice(`${d.updated} van ${d.total} inzendingen herberekend.`); await load(secret); }
    } finally { setBusy(null); }
  }

  function logout() { sessionStorage.removeItem(SS_KEY); setAuthed(false); setSecret(""); setBoard([]); setError(""); }

  /* ── Login ── */
  if (!authed) {
    return (
      <div className="mx-auto w-full max-w-sm px-5 py-16 sm:py-24">
        <div className="card p-6">
          <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-fg-dim mb-1">root@bashacademy</div>
          <h1 className="text-xl font-bold mb-1 flex items-center gap-2">🔒 Adminconsole</h1>
          <p className="text-[12.5px] text-fg-dim mb-4">Ranglijst-moderatie. Toegang met het serverwachtwoord.</p>
          <form onSubmit={(e) => { e.preventDefault(); load(secret); }}>
            <input
              autoFocus type="password" value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(""); }}
              placeholder="sudo-wachtwoord…"
              className="w-full h-10 px-3 rounded-xl bg-sunken border border-line font-mono text-[14px] outline-none focus:border-brand/50"
            />
            <button type="submit" disabled={loading || !secret} className="btn btn-brand w-full mt-3 disabled:opacity-50">
              {loading ? "…" : "Inloggen"}
            </button>
          </form>
          {error && <p className="mt-3 text-[13px] text-err">{error}</p>}
          {!adminConfigured && (
            <p className="mt-3 text-[12px] text-fg-dim">
              Geen <code className="font-mono text-brand-glow">ADMIN_SECRET</code> ingesteld op de server. Zet die env-var om de admin te activeren.
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ── Console ── */
  return (
    <div className="mx-auto w-full max-w-[1320px] px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex items-center justify-between gap-4 border-b border-line pb-2.5">
        <span className="font-mono text-[12px] uppercase tracking-[0.18em] text-fg-dim">
          Admin — <span className="text-brand-glow">ranglijst-moderatie</span>
        </span>
        <button onClick={logout} className="btn btn-ghost btn-sm">uitloggen</button>
      </div>

      {!upstash ? (
        <div className="mt-4 card p-6 text-[13.5px] text-fg-muted">
          De ranglijst-server (Upstash) is niet gekoppeld, dus er zijn geen inzendingen om te modereren. Zet{" "}
          <code className="font-mono text-brand-glow">UPSTASH_REDIS_REST_URL</code> +{" "}
          <code className="font-mono text-brand-glow">UPSTASH_REDIS_REST_TOKEN</code> om live te gaan.
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-mono text-fg-dim tabular">{board.length} inzendingen</span>
            <span className="flex-1" />
            <button onClick={recalc} disabled={busy === "recalc"} className="btn btn-ghost btn-sm" title="Clamp XP + herleid levels voor alle rijen">
              {busy === "recalc" ? "…" : "↻ XP herberekenen"}
            </button>
            <button onClick={() => load(secret)} disabled={loading} className="btn btn-ghost btn-sm">⟳ vernieuwen</button>
          </div>
          {notice && <p className="mt-2 text-[12.5px] text-ok">{notice}</p>}

          <div className="mt-3 overflow-hidden rounded-xl border border-line bg-panel/40 divide-y divide-line/60">
            <div className="flex items-center gap-3 px-3 py-2 bg-sunken/60 text-[10.5px] font-mono uppercase tracking-wider text-fg-dim">
              <span className="w-6 text-right">#</span>
              <span className="flex-1">Operator</span>
              <span className="w-10 text-right">Lvl</span>
              <span className="w-16 text-right">XP</span>
              <span className="w-16 text-right hidden sm:block">Opgelost</span>
              <span className="w-14 text-right hidden sm:block">Streak</span>
              <span className="w-16" />
            </div>
            {board.map((r, i) => (
              <div key={r.key} className="flex items-center gap-3 px-3 py-2 hover:bg-hover/60 transition-colors">
                <span className="w-6 text-right font-mono text-[12px] text-fg-faint tabular">{i + 1}</span>
                <span className="flex-1 min-w-0 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: r.color ?? "#E95420", boxShadow: `0 0 8px ${(r.color ?? "#E95420")}aa` }} />
                  <span className="truncate font-medium text-[13.5px]" style={{ color: r.color }}>{r.name}</span>
                  <code className="hidden lg:inline font-mono text-[10px] text-fg-faint truncate" title={r.key}>{r.key}</code>
                </span>
                <span className="w-10 text-right font-mono text-[12px] tabular">{r.level}</span>
                <span className="w-16 text-right font-mono text-[12px] tabular">{r.xp}</span>
                <span className="w-16 text-right font-mono text-[12px] tabular hidden sm:block">{r.solved}</span>
                <span className="w-14 text-right font-mono text-[12px] tabular hidden sm:block">{r.streak}</span>
                <span className="w-16 text-right">
                  <button onClick={() => del(r.key, r.name)} disabled={busy === r.key} className="btn btn-ghost btn-sm text-err hover:bg-err/10">
                    {busy === r.key ? "…" : "✕ wis"}
                  </button>
                </span>
              </div>
            ))}
            {board.length === 0 && <div className="px-3 py-10 text-center text-fg-dim text-[13px]">Nog geen inzendingen.</div>}
          </div>
        </>
      )}
    </div>
  );
}
