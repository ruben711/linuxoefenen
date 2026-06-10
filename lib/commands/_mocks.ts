import { parseArgs, type CommandHandler } from "./types";
import { toLines } from "./_lines";

/**
 * Gesimuleerde handlers voor systeem-/gebruikers-/netwerkcommando's. De output is
 * representatief (geen echte effecten); oefeningen worden via acceptors beoordeeld.
 * Een paar (gzip/tar/locate/…) hebben wel een licht VFS-effect zodat `ls` het resultaat toont.
 */
const ok = (stdout = ""): CommandHandler => () => ({ stdout });

const apt: CommandHandler = ({ args }) => {
  const sub = args.find((a) => !a.startsWith("-")) ?? "";
  const pkgs = args.slice(args.indexOf(sub) + 1).filter((a) => !a.startsWith("-")).join(" ") || "pakket";
  if (sub === "update") return { stdout: "Hit:1 http://archive.ubuntu.com/ubuntu noble InRelease\nReading package lists... Done\nAll packages are up to date." };
  if (sub === "upgrade" || sub === "full-upgrade") return { stdout: "Reading package lists... Done\nBuilding dependency tree... Done\n0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded." };
  if (sub === "install") return { stdout: `Reading package lists... Done\nBuilding dependency tree... Done\nThe following NEW packages will be installed:\n  ${pkgs}\n0 upgraded, 1 newly installed, 0 to remove.\nSetting up ${pkgs} ...\nProcessing triggers ... done.` };
  if (sub === "remove" || sub === "purge") return { stdout: `Reading package lists... Done\nThe following packages will be REMOVED:\n  ${pkgs}\nRemoving ${pkgs} ...\ndone.` };
  if (sub === "search") return { stdout: `${pkgs} - beschrijving van het pakket (gesimuleerd)` };
  if (sub === "list") return { stdout: "Listing... Done\nbash/now 5.2-1 amd64 [installed]\ncoreutils/now 9.4-1 amd64 [installed]" };
  return { stdout: "apt 2.7 (gesimuleerd) — gebruik update/upgrade/install/remove/search" };
};

const ps: CommandHandler = ({ args }) => {
  const aux = args.some((a) => a.includes("a") || a.includes("e"));
  if (aux) return { stdout: "USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.1 168400 11200 ?        Ss   09:00   0:01 /sbin/init\nroot         420  0.0  0.2  90000  8800 ?        Ss   09:00   0:00 /usr/sbin/sshd\nstudent     1024  0.0  0.2  22000  5400 pts/0    Ss   09:05   0:00 -bash\nstudent     1099  0.0  0.1  18000  3200 pts/0    R+   09:10   0:00 ps aux" };
  return { stdout: "    PID TTY          TIME CMD\n   1024 pts/0    00:00:00 bash\n   1099 pts/0    00:00:00 ps" };
};

const df: CommandHandler = () => ({ stdout: "Filesystem      Size  Used Avail Use% Mounted on\n/dev/sda1        40G   12G   26G  32% /\ntmpfs           2.0G  1.2M  2.0G   1% /run\n/dev/sda2       100G   45G   50G  48% /home" });
const du: CommandHandler = ({ args }) => { const t = args.find((a) => !a.startsWith("-")) ?? "."; return { stdout: `124K\t${t}` }; };
const free: CommandHandler = () => ({ stdout: "               total        used        free      shared  buff/cache   available\nMem:         8039132     2104500     3920100      210400     2014532     5512300\nSwap:        2097148           0     2097148" });

const SYS: Record<string, CommandHandler> = {
  apt, "apt-get": apt, ps, df, du, free,
  uptime: ok(" 09:10:42 up  1:23,  1 user,  load average: 0.04, 0.08, 0.05"),
  w: ok("USER     TTY      FROM             LOGIN@   IDLE   JCPU   PCPU WHAT\nstudent  pts/0    192.168.1.5      09:05    0.00s  0.10s  0.00s w"),
  who: ok("student  pts/0        2024-06-10 09:05 (192.168.1.5)"),
  whoami: ({ vfs }) => ({ stdout: vfs.user }),
  last: ok("student  pts/0   192.168.1.5  Mon Jun 10 09:05   still logged in\nreboot   system boot 5.15.0-91        Mon Jun 10 09:00"),
  lastlog: ok("Username         Port     From             Latest\nstudent          pts/0    192.168.1.5      Mon Jun 10 09:05:00 +0200 2024"),
  uname: ({ args }) => args.includes("-a")
    ? { stdout: "Linux bashacademy 5.15.0-91-generic #101-Ubuntu SMP x86_64 GNU/Linux" }
    : { stdout: "Linux" },
  hostname: ({ vfs }) => ({ stdout: vfs.host }),
  top: ok("top - 09:10:42 up 1:23, 1 user, load average: 0.04, 0.08, 0.05\nTasks: 102 total, 1 running, 101 sleeping\n%Cpu(s):  1.2 us,  0.3 sy\nMiB Mem:   7850.0 total,  3828.0 free\n  PID USER  %CPU %MEM    TIME+ COMMAND\n 1024 student 0.3  0.2  0:00.10 bash"),
  htop: ok("htop 3.x — interactieve procesviewer (gesimuleerd; gebruik ps voor een snapshot)"),
  vmstat: ok("procs -----------memory---------- ---swap-- -----io----\n r  b   swpd   free   buff  cache\n 1  0      0 3920100 102400 1912132"),
  iostat: ok("avg-cpu:  %user   %nice %system %iowait  %steal   %idle\n           1.20    0.00    0.30    0.05    0.00   98.45"),
  systemctl: ({ args }) => {
    const sub = args.find((a) => !a.startsWith("-")) ?? "";
    const svc = args[args.indexOf(sub) + 1] ?? "service";
    if (sub === "status") return { stdout: `● ${svc} - ${svc} daemon\n     Loaded: loaded (/lib/systemd/system/${svc}.service; enabled)\n     Active: active (running) since Mon 2024-06-10 09:00:00` };
    if (["start", "stop", "restart", "enable", "disable", "reload"].includes(sub)) return {};
    return { stdout: "systemctl (gesimuleerd)" };
  },
  journalctl: ok("Jun 10 09:00:00 bashacademy systemd[1]: Started Daily apt download.\nJun 10 09:05:00 bashacademy sshd[420]: Accepted password for student"),
  crontab: ({ args }) => args.includes("-l") ? { stdout: "# m h  dom mon dow   command\n0 2 * * * /home/student/backup.sh" } : { stdout: "crontab: gebruik -l om te tonen, -e om te bewerken (gesimuleerd)" },
  ip: ok("1: lo: <LOOPBACK,UP> mtu 65536\n    inet 127.0.0.1/8 scope host lo\n2: eth0: <BROADCAST,MULTICAST,UP> mtu 1500\n    inet 192.168.1.20/24 brd 192.168.1.255 scope global eth0"),
  ss: ok("Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:Port\ntcp   LISTEN 0      128    0.0.0.0:22         0.0.0.0:*\ntcp   ESTAB  0      0      192.168.1.20:22    192.168.1.5:51234"),
  netstat: ok("Active Internet connections (servers)\nProto Recv-Q Send-Q Local Address  Foreign Address  State\ntcp        0      0 0.0.0.0:22     0.0.0.0:*        LISTEN"),
  ping: ({ args }) => { const host = args.find((a) => !a.startsWith("-")) ?? "localhost"; return { stdout: `PING ${host} (93.184.216.34) 56(84) bytes of data.\n64 bytes from ${host}: icmp_seq=1 ttl=56 time=12.3 ms\n64 bytes from ${host}: icmp_seq=2 ttl=56 time=11.9 ms\n\n--- ${host} ping statistics ---\n2 packets transmitted, 2 received, 0% packet loss` }; },
  traceroute: ({ args }) => ({ stdout: `traceroute to ${args.find((a) => !a.startsWith("-")) ?? "host"}, 30 hops max\n 1  router (192.168.1.1)  1.2 ms\n 2  isp-gw (10.0.0.1)  8.4 ms` }),
  nslookup: ok("Server:\t\t127.0.0.53\nAddress:\t127.0.0.53#53\n\nNon-authoritative answer:\nName:\texample.com\nAddress: 93.184.216.34"),
  dig: ok(";; ANSWER SECTION:\nexample.com.\t3600\tIN\tA\t93.184.216.34"),
  ufw: ({ args }) => args.includes("status") ? { stdout: "Status: active\n\nTo                         Action      From\n--                         ------      ----\n22/tcp                     ALLOW       Anywhere" } : {},
  wget: ({ args }) => { const url = args.find((a) => a.startsWith("http")) ?? "bestand"; return { stdout: `--2024-06-10 09:10:00--  ${url}\nResolving host... 93.184.216.34\nHTTP request sent, awaiting response... 200 OK\nSaving to: 'index.html'\n'index.html' saved` }; },
  rsync: ok("sending incremental file list\n./\nbestand.txt\n\nsent 1,024 bytes  received 35 bytes  2,118.00 bytes/sec"),
  dd: ok("1+0 records in\n1+0 records out\n1048576 bytes (1.0 MB) copied, 0.003 s, 349 MB/s"),
  lsblk: ok("NAME   MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS\nsda      8:0    0  140G  0 disk\n├─sda1   8:1    0   40G  0 part /\n└─sda2   8:2    0  100G  0 part /home"),
  lsof: ok("COMMAND  PID    USER   FD   TYPE DEVICE SIZE/OFF NODE NAME\nbash    1024 student  cwd    DIR  8,1    4096    2 /home/student"),
  cal: ok("     juni 2024\nma di wo do vr za zo\n                1  2\n 3  4  5  6  7  8  9\n10 11 12 13 14 15 16\n17 18 19 20 21 22 23\n24 25 26 27 28 29 30"),
};

// Stille of korte succes-handlers (acties zonder zinvolle stdout)
const SILENT: Record<string, CommandHandler> = {
  su: ok(), kill: ok(), killall: ok(), pkill: ok(), pgrep: ok("1024"),
  jobs: ok(), fg: ok(), bg: ok(), nohup: ok(), nice: ok(), renice: ok(),
  useradd: ok(), adduser: ({ args }) => ({ stdout: `Adding user '${args.find((a) => !a.startsWith("-")) ?? "user"}' ...\ndone.` }),
  usermod: ok(), userdel: ok(), groupadd: ok(), groupmod: ok(), groupdel: ok(),
  gpasswd: ok(), passwd: ok("passwd: password updated successfully"),
  chsh: ok(), chfn: ok(), chage: ok(), newgrp: ok(), visudo: ok(),
  groups: ({ vfs }) => ({ stdout: `${vfs.user} sudo` }),
  getent: ({ args, vfs }) => { if (args.includes("passwd")) { const r = vfs.readFile("/etc/passwd"); return { stdout: r.content ?? "" }; } return {}; },
  alias: ok(), unalias: ok(), shopt: ok(), readonly: ok(), trap: ok(), getopts: ok(),
  test: () => ({ code: 0 }), read: ok(), exit: ok(), sync: ok(), source: ok(),
  apropos: ({ args }) => ({ stdout: `${args.find((a) => !a.startsWith("-")) ?? ""} (1) - commando (gesimuleerd)` }),
  whereis: ({ args }) => ({ stdout: args.filter((a) => !a.startsWith("-")).map((c) => `${c}: /usr/bin/${c} /usr/share/man/man1/${c}.1.gz`).join("\n") }),
  command: ({ args }) => args.includes("-v") ? { stdout: `/usr/bin/${args.filter((a) => !a.startsWith("-")).slice(-1)[0] ?? ""}` } : {},
  strings: ({ args, vfs }) => { const f = args.find((a) => !a.startsWith("-")); const r = f ? vfs.readFile(f) : { content: "" }; return { stdout: (r.content ?? "").split(/[^\x20-\x7e]+/).filter((s) => s.length >= 4).join("\n") }; },
  xargs: ({ args, stdin }) => { const items = stdin.split(/\s+/).filter(Boolean); if (args.length === 0) return { stdout: items.join(" ") }; return { stdout: `${args.join(" ")} ${items.join(" ")}` }; },
  locate: ({ args, vfs }) => {
    const pat = args.find((a) => !a.startsWith("-")) ?? "";
    const hits: string[] = [];
    const walk = (node: import("../vfs").VNode, disp: string) => {
      if (disp.includes(pat)) hits.push(disp);
      if (node.type === "dir") for (const n of Object.keys(node.children)) walk(node.children[n], disp === "/" ? "/" + n : disp + "/" + n);
    };
    walk(vfs.root, "");
    return { stdout: hits.slice(0, 50).join("\n") };
  },
};

// Archief-commando's met een licht VFS-effect
const ARCHIVE: Record<string, CommandHandler> = {
  gzip: ({ args, vfs }) => { const f = args.find((a) => !a.startsWith("-")); if (!f) return {}; const r = vfs.readFile(f); if (r.err) return { stderr: `gzip: ${r.err}`, code: 1 }; vfs.writeFile(f + ".gz", "" + (r.content ?? ""), {}); vfs.rm(f, {}); return {}; },
  gunzip: ({ args, vfs }) => { const f = args.find((a) => !a.startsWith("-")); if (!f) return {}; const r = vfs.readFile(f); if (r.err) return { stderr: `gunzip: ${r.err}`, code: 1 }; vfs.writeFile(f.replace(/\.gz$/, ""), (r.content ?? "").replace(/^/, ""), {}); vfs.rm(f, {}); return {}; },
  bzip2: ({ args, vfs }) => { const f = args.find((a) => !a.startsWith("-")); if (f) { vfs.writeFile(f + ".bz2", "BZ", {}); vfs.rm(f, {}); } return {}; },
  tar: ({ args, vfs }) => {
    const p = parseArgs(args, ["f"]);
    const out = p.val("f") ?? p.pos.find((x) => /\.(tar|tgz)/.test(x));
    const create = p.has("c"), extract = p.has("x"), list = p.has("t");
    if (create && out) { vfs.writeFile(out, "ustar (gesimuleerd archief)", {}); return p.has("v") ? { stdout: p.pos.filter((x) => x !== out).join("\n") } : {}; }
    if (list && out) return { stdout: "(inhoud van archief — gesimuleerd)" };
    if (extract) return p.has("v") ? { stdout: "(uitgepakt — gesimuleerd)" } : {};
    return {};
  },
  zip: ({ args, vfs }) => { const out = args.find((a) => /\.zip$/.test(a)); if (out) vfs.writeFile(out, "PK(gesimuleerd)", {}); return { stdout: out ? `  adding: bestanden -> ${out}` : "" }; },
  unzip: ({ args }) => ({ stdout: `Archive:  ${args.find((a) => /\.zip$/.test(a)) ?? "archief.zip"}\n  inflating: bestand.txt   (gesimuleerd)` }),
};

export const MOCK_COMMANDS: Record<string, CommandHandler> = { ...SYS, ...SILENT, ...ARCHIVE };
