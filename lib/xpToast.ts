"use client";
import { create } from "zustand";

type S = {
  amount: number | null;
  nonce: number;
  show: (n: number) => void;
  clear: () => void;
};

/** Mini-store om een XP-toast te triggeren vanuit eender welke component. */
export const useXpToast = create<S>((set, get) => ({
  amount: null,
  nonce: 0,
  show: (n) => set({ amount: n, nonce: get().nonce + 1 }),
  clear: () => set({ amount: null }),
}));
