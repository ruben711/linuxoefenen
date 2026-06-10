import { parseArgs, type CommandHandler } from "./types";

/** echo — schrijft zijn argumenten, gescheiden door een spatie. */
export const echo: CommandHandler = ({ args }) => {
  const p = parseArgs(args);
  // -n onderdrukt de newline; voor onze regelsplitsing maakt dat niets uit.
  const text = p.pos.join(" ");
  return { stdout: text };
};
