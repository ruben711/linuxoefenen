"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type Identity = {
  uid: string;            // permanent, gegenereerd op eerste bezoek
  name: string | null;    // gekozen handle; null = nog niet ingesteld
  color: string;          // naam-kleur (hex) voor de ranglijst
  hasJoinedBoard: boolean;
  set: (n: string) => void;
  setColor: (c: string) => void;
  join: (n: string, c?: string) => void;
  ensure: () => void;
  randomName: () => string;
};

function genUid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const ADJ = ["snelle", "stille", "slimme", "dappere", "rauwe", "groene", "vurige", "kalme", "wijze", "gladde"];
const NOUN = ["pinguin", "kernel", "shell", "daemon", "sudo", "pipe", "octopus", "vos", "tux", "root"];
function genName(): string {
  const a = ADJ[Math.floor(Math.random() * ADJ.length)];
  const n = NOUN[Math.floor(Math.random() * NOUN.length)];
  return `${a}_${n}${Math.floor(10 + Math.random() * 90)}`;
}

export const useIdentity = create<Identity>()(
  persist(
    (set, get) => ({
      uid: "",
      name: null,
      color: "#E95420",
      hasJoinedBoard: false,
      randomName: genName,
      ensure: () => { if (!get().uid) set({ uid: genUid() }); },
      set: (n: string) => set({ name: n.trim().slice(0, 24), hasJoinedBoard: true }),
      setColor: (c: string) => set({ color: c }),
      join: (n: string, c?: string) =>
        set({
          uid: get().uid || genUid(),
          name: (n.trim() || genName()).slice(0, 24),
          color: c ?? get().color,
          hasJoinedBoard: true,
        }),
    }),
    { name: "bashacademy-identity" }
  )
);
