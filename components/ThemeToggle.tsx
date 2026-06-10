"use client";
import { useTheme } from "@/lib/theme";
import { useMounted } from "@/lib/useMounted";
import { cn } from "@/lib/cn";

const ICON: Record<string, string> = { dark: "🌙", light: "☀️", system: "🖥️" };
const LABEL: Record<string, string> = { dark: "Donker", light: "Licht", system: "Systeem" };

export default function ThemeToggle() {
  const theme = useTheme((s) => s.theme);
  const cycle = useTheme((s) => s.cycle);
  const mounted = useMounted();
  const key = mounted ? theme : "system";

  return (
    <button
      type="button"
      onClick={cycle}
      title={`Thema: ${LABEL[key]} — klik om te wisselen`}
      aria-label={`Thema wisselen (huidig: ${LABEL[key]})`}
      className={cn(
        "group relative grid h-9 w-9 place-items-center rounded-[11px]",
        "border border-line bg-panel/60 text-[15px]",
        "transition-all duration-200 hover:border-brand/50 hover:bg-hover hover:-translate-y-px"
      )}
    >
      <span className="transition-transform duration-300 group-hover:rotate-[18deg] group-active:scale-90">
        {ICON[key]}
      </span>
    </button>
  );
}
