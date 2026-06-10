"use client";
import { useEffect } from "react";
import { useXpToast } from "@/lib/xpToast";

export default function XpToast() {
  const amount = useXpToast((s) => s.amount);
  const nonce = useXpToast((s) => s.nonce);
  const clear = useXpToast((s) => s.clear);

  useEffect(() => {
    if (amount == null) return;
    const t = setTimeout(clear, 2100);
    return () => clearTimeout(t);
  }, [amount, nonce, clear]);

  if (amount == null) return null;

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[70] pointer-events-none" key={nonce}>
      <div className="animate-xp-float flex items-center gap-2.5 rounded-full bg-brand-gradient text-on-brand font-bold px-5 py-2.5 shadow-glow-brand">
        <span className="text-lg">⚡</span>
        <span className="text-[15px] tabular">+{amount} XP</span>
      </div>
    </div>
  );
}
