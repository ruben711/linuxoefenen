import type { Config } from "tailwindcss";

/**
 * BashAcademy — Modern Ubuntu design tokens.
 * Alle kleuren zijn CSS-variabelen als RGB-triples (zie styles/globals.css),
 * zodat Tailwind's /alpha-modifiers blijven werken (bg-panel/60, text-fg/80, …).
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        canvas:        "rgb(var(--canvas) / <alpha-value>)",
        panel:         "rgb(var(--panel) / <alpha-value>)",
        pane:          "rgb(var(--pane) / <alpha-value>)",
        sunken:        "rgb(var(--sunken) / <alpha-value>)",
        elevated:      "rgb(var(--elevated) / <alpha-value>)",
        hover:         "rgb(var(--hover) / <alpha-value>)",
        line:          "rgb(var(--line) / <alpha-value>)",
        "line-strong": "rgb(var(--line-strong) / <alpha-value>)",
        fg:            "rgb(var(--fg) / <alpha-value>)",
        "fg-muted":    "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-dim":      "rgb(var(--fg-dim) / <alpha-value>)",
        "fg-faint":    "rgb(var(--fg-faint) / <alpha-value>)",
        brand:         "rgb(var(--brand) / <alpha-value>)",
        "brand-glow":  "rgb(var(--brand-glow) / <alpha-value>)",
        aubergine:     "rgb(var(--aubergine) / <alpha-value>)",
        "aubergine-lt":"rgb(var(--aubergine-lt) / <alpha-value>)",
        magenta:       "rgb(var(--magenta) / <alpha-value>)",
        "on-brand":    "rgb(var(--on-brand) / <alpha-value>)",
        ok:            "rgb(var(--ok) / <alpha-value>)",
        warn:          "rgb(var(--warn) / <alpha-value>)",
        err:           "rgb(var(--err) / <alpha-value>)",
        info:          "rgb(var(--info) / <alpha-value>)",
        "diff-easy":   "rgb(var(--diff-easy) / <alpha-value>)",
        "diff-medium": "rgb(var(--diff-medium) / <alpha-value>)",
        "diff-hard":   "rgb(var(--diff-hard) / <alpha-value>)",
        "diff-insane": "rgb(var(--diff-insane) / <alpha-value>)",
        term:          "rgb(var(--term-bg) / <alpha-value>)",
        "term-bar":    "rgb(var(--term-bar) / <alpha-value>)",
        "term-fg":     "rgb(var(--term-fg) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "ui-sans-serif", "sans-serif"],
        mono: ["var(--font-mono)", '"JetBrains Mono"', "ui-monospace", "Consolas", "monospace"],
        display: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
      },
      borderRadius: {
        none: "0px", sm: "6px", DEFAULT: "9px", md: "11px", lg: "14px", xl: "18px", "2xl": "24px", "3xl": "32px",
      },
      boxShadow: {
        soft:     "0 1px 2px rgb(40 20 30 / 0.06), 0 2px 6px rgb(40 20 30 / 0.05)",
        "soft-md":"0 4px 14px rgb(40 20 30 / 0.10), 0 2px 6px rgb(40 20 30 / 0.06)",
        "soft-lg":"0 12px 34px rgb(30 14 22 / 0.16), 0 6px 12px rgb(30 14 22 / 0.08)",
        "soft-xl":"0 28px 64px rgb(20 10 16 / 0.24), 0 10px 24px rgb(20 10 16 / 0.12)",
        flyout:   "0 16px 50px rgb(10 6 12 / 0.38)",
        "glow-brand": "0 0 0 1px rgb(var(--brand) / 0.35), 0 8px 30px rgb(var(--brand) / 0.28)",
        "glow-soft":  "0 0 40px -8px rgb(var(--brand-glow) / 0.45)",
        "inset-line": "inset 0 0 0 1px rgb(var(--line) / 1)",
      },
      fontSize: { "2xs": ["11px", "15px"] },
      letterSpacing: { tightest: "-0.04em" },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, rgb(var(--brand-glow)) 0%, rgb(var(--brand)) 45%, rgb(var(--magenta)) 78%, rgb(var(--aubergine)) 100%)",
        "brand-gradient-soft":
          "linear-gradient(135deg, rgb(var(--brand-glow) / 0.16), rgb(var(--magenta) / 0.12) 55%, rgb(var(--aubergine) / 0.14))",
      },
      transitionTimingFunction: {
        "out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-back": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        spring: "cubic-bezier(0.5, 1.4, 0.5, 1)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "rise": { from: { opacity: "0", transform: "translateY(10px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "pop": { "0%": { opacity: "0", transform: "scale(0.92)" }, "60%": { opacity: "1", transform: "scale(1.02)" }, "100%": { transform: "scale(1)" } },
        "caret-blink": { "0%,55%": { opacity: "1" }, "56%,100%": { opacity: "0" } },
        "drift-a": { "0%,100%": { transform: "translate3d(0,0,0) scale(1)" }, "50%": { transform: "translate3d(6%,-4%,0) scale(1.12)" } },
        "drift-b": { "0%,100%": { transform: "translate3d(0,0,0) scale(1.05)" }, "50%": { transform: "translate3d(-7%,5%,0) scale(0.95)" } },
        "shimmer": { from: { backgroundPosition: "200% 0" }, to: { backgroundPosition: "-200% 0" } },
        "spin-slow": { to: { transform: "rotate(360deg)" } },
        "xp-float": {
          "0%": { opacity: "0", transform: "translateY(8px) scale(0.9)" },
          "12%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "82%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-14px) scale(0.96)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
        "rise": "rise 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "pop": "pop 0.34s cubic-bezier(0.34,1.56,0.64,1) both",
        "caret": "caret-blink 1.05s steps(1) infinite",
        "drift-a": "drift-a 18s ease-in-out infinite",
        "drift-b": "drift-b 22s ease-in-out infinite",
        "shimmer": "shimmer 2.4s linear infinite",
        "spin-slow": "spin-slow 14s linear infinite",
        "xp-float": "xp-float 2.1s cubic-bezier(0.16,1,0.3,1) both",
      },
    },
  },
  plugins: [],
};
export default config;
