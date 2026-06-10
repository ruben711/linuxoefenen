import { type CommandHandler } from "./types";

const DAYS = ["zo", "ma", "di", "wo", "do", "vr", "za"];
const MON = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const pad = (n: number) => String(n).padStart(2, "0");

/** date — toon de huidige datum en tijd. */
export const date: CommandHandler = () => {
  const d = new Date();
  return {
    stdout: `${DAYS[d.getDay()]} ${pad(d.getDate())} ${MON[d.getMonth()]} ${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())} CET`,
  };
};
