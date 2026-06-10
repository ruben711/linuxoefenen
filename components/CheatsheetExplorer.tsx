"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import CheatsheetEntry from "./CheatsheetEntry";
import {
  CATEGORY_ICON, byCategory, categories, getCommand, getCommands, search,
  type CheatCommand,
} from "@/lib/cheatsheet";

type Props = {
  initialSelected?: string | null;
  onTry?: (cmd: string) => void;
  tryLabel?: string;
  compact?: boolean; // sidebar-modus: één kolom met list↔detail-switch
};

export default function CheatsheetExplorer({ initialSelected = null, onTry, tryLabel, compact }: Props) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(initialSelected);
  const searchRef = useRef<HTMLInputElement>(null);

  // Ctrl/Cmd+K → focus zoekbalk
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.key === "K")) { e.preventDefault(); searchRef.current?.focus(); }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const cats = useMemo(() => categories(), []);
  const list: CheatCommand[] = useMemo(() => {
    if (query.trim()) return search(query);
    if (cat) return byCategory(cat);
    return getCommands().slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [query, cat]);

  const selectedCmd = selected ? getCommand(selected) : undefined;

  const pick = (name: string) => setSelected(name);

  const SearchBar = (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-dim text-sm pointer-events-none">⌕</span>
      <input
        ref={searchRef}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setCat(null); }}
        placeholder="Zoek een commando…"
        className="w-full h-10 pl-9 pr-14 rounded-xl bg-sunken border border-line text-[14px] outline-none focus:border-brand/50 transition-colors"
      />
      <kbd className="kbd absolute right-2.5 top-1/2 -translate-y-1/2">Ctrl K</kbd>
    </div>
  );

  const CatChips = (
    <div className="flex flex-wrap gap-1.5">
      <button onClick={() => { setCat(null); setQuery(""); }}
        className={`chip transition-colors ${!cat && !query ? "border-brand/50 text-fg bg-brand/10" : ""}`}>
        alles
      </button>
      {cats.map((c) => (
        <button key={c} onClick={() => { setCat(c); setQuery(""); }}
          className={`chip transition-colors ${cat === c ? "border-brand/50 text-fg bg-brand/10" : ""}`}>
          {CATEGORY_ICON[c]} {c}
        </button>
      ))}
    </div>
  );

  const List = (
    <div className="space-y-1.5">
      {list.length === 0 && <div className="text-[13px] text-fg-dim px-1 py-4">Geen commando&apos;s gevonden voor &ldquo;{query}&rdquo;.</div>}
      {list.map((c) => (
        <button
          key={c.name}
          onClick={() => pick(c.name)}
          className={`w-full text-left flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
            selected === c.name ? "border-brand/50 bg-brand/8" : "border-line bg-panel/40 hover:border-line-strong hover:bg-hover/60"
          }`}
        >
          <span className="grid place-items-center w-8 h-8 rounded-lg bg-sunken text-sm shrink-0">{CATEGORY_ICON[c.category] ?? "•"}</span>
          <span className="min-w-0 flex-1">
            <span className="font-mono text-[13.5px] font-semibold text-fg flex items-center gap-2">
              {c.name}
              {c.danger && <span className="text-err text-[11px]">⚠</span>}
            </span>
            <span className="block text-[12px] text-fg-dim truncate">{c.short}</span>
          </span>
        </button>
      ))}
    </div>
  );

  const Detail = selectedCmd ? (
    <CheatsheetEntry command={selectedCmd} onTry={onTry} tryLabel={tryLabel} onSelect={pick} compact={compact} />
  ) : (
    <div className="grid place-items-center h-full min-h-[280px] text-center px-6">
      <div>
        <div className="text-4xl mb-3 opacity-60">📖</div>
        <p className="text-[14px] text-fg-muted">Kies een commando om de details te zien.</p>
        <p className="mt-1 text-[12px] text-fg-dim">Tip: <kbd className="kbd">Ctrl K</kbd> om te zoeken.</p>
      </div>
    </div>
  );

  /* ── compacte (sidebar) modus: één kolom ── */
  if (compact) {
    return selected ? (
      <div>
        <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm mb-3 -ml-2">← terug naar lijst</button>
        {Detail}
      </div>
    ) : (
      <div className="space-y-3">
        {SearchBar}
        {CatChips}
        <div className="mt-1">{List}</div>
      </div>
    );
  }

  /* ── volledige (standalone) modus: twee kolommen op lg ── */
  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <div className={`lg:w-[340px] lg:shrink-0 space-y-3 ${selected ? "hidden lg:block" : "block"}`}>
        {SearchBar}
        {CatChips}
        <div className="max-h-[calc(100vh-220px)] overflow-y-auto pr-1 -mr-1" data-lenis-prevent>{List}</div>
      </div>
      <div className={`flex-1 min-w-0 ${selected ? "block" : "hidden lg:block"}`}>
        {selected && (
          <button onClick={() => setSelected(null)} className="btn btn-ghost btn-sm mb-3 -ml-2 lg:hidden">← terug</button>
        )}
        <div className="card p-5 sm:p-6 lg:sticky lg:top-20">{Detail}</div>
      </div>
    </div>
  );
}
