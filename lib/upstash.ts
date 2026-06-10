/**
 * Minimale Upstash Redis REST-client (edge-compatibel, via fetch).
 * Zonder env-vars draait alles lokaal (demo-modus) — geen leaderboard-server.
 */
const URL = process.env.UPSTASH_REDIS_REST_URL;
const TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

export function upstashConfigured(): boolean {
  return !!(URL && TOKEN);
}

async function cmd<T = unknown>(args: (string | number)[]): Promise<T> {
  if (!URL || !TOKEN) throw new Error("upstash-not-configured");
  const res = await fetch(URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(args),
    cache: "no-store",
  });
  const data = await res.json();
  if (data.error) throw new Error(String(data.error));
  return data.result as T;
}

export const redis = {
  zadd: (key: string, score: number, member: string) => cmd(["ZADD", key, score, member]),
  zrevrangeWithScores: (key: string, start: number, stop: number) =>
    cmd<string[]>(["ZREVRANGE", key, start, stop, "WITHSCORES"]),
  zcard: (key: string) => cmd<number>(["ZCARD", key]),
  hset: (key: string, field: string, value: string) => cmd(["HSET", key, field, value]),
  hmget: (key: string, fields: string[]) => cmd<(string | null)[]>(["HMGET", key, ...fields]),
};
