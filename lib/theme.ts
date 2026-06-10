"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Theme = "dark" | "light" | "system";

type S = {
  theme: Theme;
  resolved: "dark" | "light";
  setTheme: (t: Theme) => void;
  cycle: () => void;
  apply: () => void;
};

function detect(): "dark" | "light" {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export const useTheme = create<S>()(
  persist(
    (set, get) => ({
      theme: "system",
      resolved: "dark",
      setTheme: (t) => { set({ theme: t }); get().apply(); },
      cycle: () => {
        const order: Theme[] = ["dark", "light", "system"];
        const next = order[(order.indexOf(get().theme) + 1) % order.length];
        set({ theme: next }); get().apply();
      },
      apply: () => {
        const t = get().theme;
        const r = t === "system" ? detect() : t;
        if (typeof document !== "undefined") {
          document.documentElement.classList.remove("dark", "light");
          document.documentElement.classList.add(r);
        }
        set({ resolved: r });
      },
    }),
    { name: "bashacademy-theme" }
  )
);
