import type { CommandHandler } from "./types";
import { ls } from "./ls";
import { cd } from "./cd";
import { pwd } from "./pwd";
import { cat } from "./cat";
import { mkdir } from "./mkdir";
import { touch } from "./touch";
import { echo } from "./echo";
import { cp } from "./cp";
import { mv } from "./mv";
import { rm } from "./rm";
import { rmdir } from "./rmdir";
import { head } from "./head";
import { tail } from "./tail";
import { tac } from "./tac";
import { wc } from "./wc";
import { sort } from "./sort";
import { uniq } from "./uniq";
import { tr } from "./tr";
import { cut } from "./cut";
import { tee } from "./tee";
import { grep } from "./grep";
import { find } from "./find";
import { chmod } from "./chmod";
import { chown } from "./chown";
import { chgrp } from "./chgrp";
import { date } from "./date";
import { which } from "./which";
import { type } from "./type";
import { id } from "./id";
import { env } from "./env";
import { set } from "./set";
import { exportCmd } from "./export";
import { tree } from "./tree";
import { ln } from "./ln";
import { less, more } from "./less";
import { seq } from "./seq";
import { comm } from "./comm";
import { printf } from "./printf";
import { basenameCmd } from "./basename";
import { umask, sleep, source, dirname } from "./misc";
import { stat } from "./stat";
import { file } from "./file";
import { readlink } from "./readlink";
import { sed } from "./sed";
import { awk } from "./awk";
import { MOCK_COMMANDS } from "./_mocks";

const clear: CommandHandler = () => ({ clear: true });
const whoami: CommandHandler = ({ vfs }) => ({ stdout: vfs.user });
const help: CommandHandler = () => ({
  stdout: "Beschikbare commando's: " + COMMAND_NAMES.slice(0, 60).join(", ") + " …\nGebruik `man <cmd>` of de cheat-sheet voor uitleg.",
});
const noop: CommandHandler = () => ({});

/** Registry: één handler per commando. Mocks eerst, echte handlers overschrijven ze. */
export const COMMANDS: Record<string, CommandHandler> = {
  ...MOCK_COMMANDS,
  // ── echte handlers (winnen bij naamconflict) ──
  ls, cd, pwd, cat, mkdir, touch, echo,
  cp, mv, rm, rmdir,
  head, tail, tac, wc, sort, uniq, tr, cut, tee, grep, find,
  chmod, chown, chgrp,
  date, which, type, id, env, set, export: exportCmd,
  tree, ln, less, more,
  seq, comm, printf, basename: basenameCmd, umask, sleep, source, dirname,
  stat, file, readlink, sed, awk,
  // ── ingebouwd ──
  clear, whoami, help,
  ":": noop, true: () => ({ code: 0 }), false: () => ({ code: 1 }),
};

export const COMMAND_NAMES = Object.keys(COMMANDS).filter((n) => /^[a-z]/.test(n)).sort();
