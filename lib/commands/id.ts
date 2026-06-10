import { type CommandHandler } from "./types";

/** id — toon uid/gid/groepen van de huidige gebruiker. */
export const id: CommandHandler = ({ vfs }) => ({
  stdout: vfs.user === "root"
    ? "uid=0(root) gid=0(root) groups=0(root)"
    : `uid=1000(${vfs.user}) gid=1000(${vfs.user}) groups=1000(${vfs.user}),27(sudo)`,
});
