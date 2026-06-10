import ComingSoon from "@/components/ComingSoon";

export default function LeaderboardPage() {
  return (
    <ComingSoon
      icon="🏆"
      title="Leaderboard"
      desc="Meet je XP tegen anderen, met naam-styling, tags en live updates. Server-side feature (Upstash) — volgt na de kern-leerervaring."
      cmd="sort -rn -k2 scores.txt | head"
    />
  );
}
