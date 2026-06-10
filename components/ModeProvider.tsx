"use client";
import { useEffect } from "react";
import { useTheme } from "@/lib/theme";
import { useProgress } from "@/lib/store";
import { useIdentity } from "@/lib/identity";

const JOIN_PALETTE = ["#E95420", "#56c16a", "#33c7de", "#c061cb", "#f5c211", "#62a0ea", "#ed5050"];

/** App-level provider: past het thema toe (anti-FOUC + systeemwissels) en
 *  triggert een XP-herrekening wanneer de XP-regels gewijzigd zijn. */
export default function ModeProvider({ children }: { children: React.ReactNode }) {
  const apply = useTheme((s) => s.apply);

  useEffect(() => {
    apply();
    const mq = window.matchMedia("(prefers-color-scheme: light)");
    const h = () => apply();
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, [apply]);

  // Eenmalig: als de XP-regels gewijzigd zijn → herbereken met de huidige tabel.
  useEffect(() => {
    const TARGET = 1; // moet overeenkomen met XP_RULES_VERSION in store.ts
    const cur = useProgress.getState().xpRulesVersion ?? 0;
    if (cur < TARGET) useProgress.getState().recalcXp();
  }, []);

  // Auto-join: iedereen krijgt meteen een willekeurige handle + kleur (aanpasbaar in de ranglijst).
  useEffect(() => {
    const id = useIdentity.getState();
    id.ensure();
    if (!id.name || !id.hasJoinedBoard) {
      id.join(id.randomName(), JOIN_PALETTE[Math.floor(Math.random() * JOIN_PALETTE.length)]);
    }
  }, []);

  return <>{children}</>;
}
