"use client";
import { useState } from "react";
import Highlight from "./Highlight";
import { CATEGORY_ICON, getCommand, type CheatCommand } from "@/lib/cheatsheet";

type Props = {
  command: CheatCommand;
  onTry?: (cmd: string) => void;
  tryLabel?: string;
  onSelect?: (name: string) => void;
  compact?: boolean;
};

export default function CheatsheetEntry({ command: c, onTry, tryLabel = "Probeer", onSelect, compact }: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  function handleTry(cmd: string) {
    if (onTry) { onTry(cmd); return; }
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(cmd);
      setTimeout(() => setCopied((v) => (v === cmd ? null : v)), 1400);
    });
  }

  return (
    <div className="animate-fade-in">
      {/* Kop */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold font-mono flex items-center gap-2">
            {c.name}
            {c.danger && <span className="text-[11px] font-sans font-semibold text-err bg-err/12 border border-err/30 rounded px-2 py-0.5">⚠ voorzichtig</span>}
          </h2>
          <p className="mt-1.5 text-[14.5px] text-fg-muted leading-relaxed">{c.short}</p>
        </div>
        <span className="chip shrink-0">{CATEGORY_ICON[c.category] ?? "•"} {c.category}</span>
      </div>

      {/* Synopsis */}
      <div className="mt-5">
        <Label>Synopsis</Label>
        <div className="mt-1.5 rounded-lg bg-sunken border border-line px-3.5 py-2.5 font-mono text-[13.5px] overflow-x-auto">
          <Highlight text={c.synopsis} />
        </div>
      </div>

      {/* Vlaggen */}
      {c.flags && c.flags.length > 0 && (
        <div className="mt-5">
          <Label>Belangrijkste opties</Label>
          <div className="mt-2 overflow-hidden rounded-lg border border-line">
            {c.flags.map((f, i) => (
              <div key={i} className={`flex gap-3 px-3.5 py-2 ${i % 2 ? "bg-panel/30" : "bg-panel/50"}`}>
                <code className="font-mono text-[12.5px] text-brand-glow shrink-0 min-w-[88px]">{f.flag}</code>
                <span className="text-[13px] text-fg-muted">{f.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Voorbeelden */}
      {c.examples && c.examples.length > 0 && (
        <div className="mt-5">
          <Label>Voorbeelden</Label>
          <div className="mt-2 space-y-2">
            {c.examples.map((ex, i) => (
              <div key={i} className="group rounded-lg bg-sunken border border-line p-3">
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-[13px] overflow-x-auto">
                    <span className="text-fg-faint select-none">$ </span>
                    <Highlight text={ex.cmd} />
                  </code>
                  <button
                    onClick={() => handleTry(ex.cmd)}
                    className="btn-ghost btn btn-sm shrink-0 opacity-70 group-hover:opacity-100"
                    title={tryLabel}
                  >
                    {copied === ex.cmd ? "✓ gekopieerd" : onTry ? `↪ ${tryLabel}` : "⧉ kopieer"}
                  </button>
                </div>
                <p className="mt-1 text-[12.5px] text-fg-dim">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gerelateerd */}
      {c.related && c.related.length > 0 && (
        <div className="mt-5">
          <Label>Gerelateerd</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {c.related.map((r) => {
              const known = getCommand(r);
              return known && onSelect ? (
                <button key={r} onClick={() => onSelect(r)} className="chip font-mono hover:border-brand/50 hover:text-fg transition-colors">{r}</button>
              ) : (
                <span key={r} className="chip font-mono opacity-70">{r}</span>
              );
            })}
          </div>
        </div>
      )}

      {/* Bron */}
      {c.chapter && (
        <div className="mt-6 pt-4 border-t border-line/60 text-[12px] text-fg-faint font-mono">
          📖 bron: {c.chapter}
        </div>
      )}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-mono font-semibold uppercase tracking-wider text-fg-dim">{children}</div>;
}
