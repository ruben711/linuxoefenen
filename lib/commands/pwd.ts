import type { CommandHandler } from "./types";

/** pwd — toont het huidige werkpad (absoluut). */
export const pwd: CommandHandler = ({ vfs }) => ({ stdout: vfs.cwd });
