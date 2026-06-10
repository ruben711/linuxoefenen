"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import CheatsheetEntry from "./CheatsheetEntry";
import { getCommand } from "@/lib/cheatsheet";

/** Modale man-page overlay — opent bij `man <cmd>` in de terminal. Esc sluit.
 *  Via een portal naar <body> zodat hij altijd vrij over het scherm zweeft,
 *  ongeacht een getransformeerde/gefilterde voorouder (page-transitie). */
export default function ManpageOverlay({
  cmd, onClose, onTry,
}: {
  cmd: string | null;
  onClose: () => void;
  onTry?: (cmd: string) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!cmd) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [cmd, onClose]);

  if (!cmd || !mounted) return null;
  const command = getCommand(cmd);

  return createPortal(
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl border border-line bg-panel shadow-flyout animate-pop" data-lenis-prevent>
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 px-5 py-3 border-b border-line bg-panel/92 backdrop-blur">
          <span className="font-mono text-[13px] text-fg-dim">
            <span className="text-brand-glow">man</span> {cmd}
          </span>
          <button onClick={onClose} className="btn btn-ghost btn-sm" aria-label="Sluiten">
            <kbd className="kbd">Esc</kbd> sluiten
          </button>
        </div>
        <div className="p-5 sm:p-6">
          {command ? (
            <CheatsheetEntry command={command} onTry={onTry} tryLabel="Probeer" />
          ) : (
            <div className="text-center py-10">
              <div className="text-3xl mb-3 opacity-60">🤷</div>
              <p className="text-fg-muted">Geen man-page voor <code className="font-mono text-brand">{cmd}</code> in de cheat-sheet.</p>
              <p className="mt-1 text-[12.5px] text-fg-dim">Misschien komt dit commando nog in een latere lichting.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
