import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Tailwind-bewuste classnames-helper (merge + conditioneel). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
