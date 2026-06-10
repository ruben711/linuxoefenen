import { type CommandHandler } from "./types";

/** set — toon alle variabelen (gesimuleerd: zelfde als env, gesorteerd). */
export const set: CommandHandler = ({ env }) => ({
  stdout: Object.entries(env).filter(([k]) => k !== "?").map(([k, v]) => `${k}=${v}`).sort().join("\n"),
});
