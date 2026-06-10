import { type CommandHandler } from "./types";

/** printf — geformatteerde uitvoer (basis: %s %d %i %f, \n \t). */
export const printf: CommandHandler = ({ args }) => {
  if (args.length === 0) return { stdout: "" };
  let fmt = args[0].replace(/\\n/g, "\n").replace(/\\t/g, "\t").replace(/\\\\/g, "\\");
  const rest = args.slice(1);
  let ri = 0;
  const out = fmt.replace(/%[sdif%]/g, (m) => {
    if (m === "%%") return "%";
    const v = rest[ri++] ?? "";
    if (m === "%d" || m === "%i") return String(parseInt(v, 10) || 0);
    if (m === "%f") return String(parseFloat(v) || 0);
    return v;
  });
  return { stdout: out };
};
