import { type CommandHandler } from "./types";

/** seq — genereer een reeks getallen. seq [first [incr]] last */
export const seq: CommandHandler = ({ args }) => {
  const nums = args.filter((a) => !a.startsWith("-") || /^-?\d/.test(a)).map(Number).filter((n) => !isNaN(n));
  let first = 1, incr = 1, last: number;
  if (nums.length === 1) last = nums[0];
  else if (nums.length === 2) { first = nums[0]; last = nums[1]; }
  else if (nums.length >= 3) { first = nums[0]; incr = nums[1]; last = nums[2]; }
  else return { stderr: "seq: missing operand", code: 1 };

  const out: string[] = [];
  if (incr > 0) for (let i = first; i <= last; i += incr) out.push(String(i));
  else if (incr < 0) for (let i = first; i >= last; i += incr) out.push(String(i));
  return { stdout: out.join("\n") };
};
