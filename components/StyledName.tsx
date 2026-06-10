import { rankTitle } from "@/lib/leaderboardSync";

/** Operator-naam met gekozen kleur (+ glow) en optioneel de afgeleide Linux-rang. */
export default function StyledName({
  name, color, level, showTitle = false,
}: {
  name: string;
  color?: string;
  level?: number;
  showTitle?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-2 min-w-0">
      <span
        className="font-mono font-semibold truncate"
        style={color ? { color, textShadow: `0 0 14px ${color}44` } : undefined}
      >
        {name}
      </span>
      {showTitle && level != null && (
        <span className="text-[9.5px] font-mono uppercase tracking-wider text-fg-faint shrink-0">{rankTitle(level)}</span>
      )}
    </span>
  );
}
