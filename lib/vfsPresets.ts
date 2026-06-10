import { VFS, type VfsSpec, type VfsOptions } from "./vfs";

/** Standaard home-filesystem voor de sandbox + als basis voor oefeningen. */
export const DEFAULT_SPEC: VfsSpec = {
  home: { d: {
    student: { d: {
      documenten: { d: {
        "cv.txt": "Naam: Student\nOpleiding: Toegepaste Informatica\nJaar: 2\n",
        "notities.md": "# Notities\n- bash leren\n- examen voorbereiden\n- cheat-sheet gebruiken\n",
        "budget.csv": "maand,bedrag\njan,1200\nfeb,1100\nmrt,1250\n",
      } },
      projecten: { d: {
        web: { d: {
          "index.html": "<!doctype html>\n<html>\n  <body>hallo</body>\n</html>\n",
          "style.css": "body { margin: 0; font-family: sans-serif; }\n",
        } },
        scripts: { d: {
          "backup.sh": { f: "#!/bin/bash\necho 'backup gestart'\n", mode: "755" },
          "deploy.sh": { f: "#!/bin/bash\necho 'deploy gestart'\n", mode: "755" },
        } },
      } },
      downloads: { d: {
        "foto.jpg": "��JFIF binaire data�",
        "archief.tar.gz": " binaire data",
        "setup.deb": "!<arch> binaire data",
      } },
      ".bashrc": "export PS1='\\u@\\h:\\w\\$ '\nalias ll='ls -la'\nalias ..='cd ..'\n",
      ".profile": "# ~/.profile — wordt geladen bij login\n",
    } },
    alice: { d: {
      Documents: { d: { "verslag.txt": "Vergadering maandag 9u\nActiepunten...\n", "todo.md": "- planning afwerken\n- mail bob\n" } },
      pictures: { d: { vacation: { d: { "strand.jpg": "JPEG-data", "zonsondergang.jpg": "JPEG-data", "duik.jpg": "JPEG-data" } }, "profiel.png": "PNG-data" } },
      ".bashrc": "# alice\nexport EDITOR=nano\n",
    } },
    bob: { d: {
      workspace: { d: {
        python: { d: { "main.py": "print('hallo wereld')\n", "utils.py": "def helper():\n    pass\n" } },
        "README.md": "# Bobs werkmap\n",
      } },
      Downloads: { d: {} },
      ".bashrc": "# bob\n",
    } },
  } },
  etc: { d: {
    hostname: "bashacademy\n",
    hosts: "127.0.0.1 localhost\n127.0.1.1 bashacademy\n",
    passwd: "root:x:0:0:root:/root:/bin/bash\ndaemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\nstudent:x:1000:1000:Student:/home/student:/bin/bash\nalice:x:1001:1001:Alice:/home/alice:/bin/bash\nbob:x:1002:1002:Bob:/home/bob:/bin/bash\n",
    group: "root:x:0:\nsudo:x:27:student\nstudent:x:1000:\nalice:x:1001:\nbob:x:1002:\n",
    "os-release": "NAME=\"Ubuntu\"\nVERSION=\"24.04 LTS\"\nID=ubuntu\n",
    nginx: { d: { "nginx.conf": "user www-data;\nworker_processes auto;\n" } },
    ssh: { d: { "sshd_config": "Port 22\nPermitRootLogin no\n" } },
    apt: { d: { "apt.conf": "APT::Get::Assume-Yes \"true\";\n" } },
  }, owner: "root", group: "root" },
  var: { d: {
    log: { d: {
      syslog: "jun 10 09:00:01 bashacademy systemd[1]: Started Daily apt.\njun 10 09:05:12 bashacademy kernel: usb 1-1: new device\n",
      "auth.log": "jun 10 09:01:33 bashacademy sshd[812]: Accepted password for student\njun 10 09:02:01 bashacademy sudo: student : TTY=pts/0\n",
    } },
  }, owner: "root", group: "root" },
  tmp: { d: {}, mode: "1777", owner: "root", group: "root" },
};

export function makeVfs(opts: VfsOptions = {}): VFS {
  return VFS.fromSpec(DEFAULT_SPEC, {
    cwd: "/home/student", user: "student", home: "/home/student", host: "bashacademy", ...opts,
  });
}

/** Voorgedefinieerde VFS-presets per oefening (uitbreidbaar met cursusdata). */
const PRESETS: Record<string, () => VFS> = {
  default: () => makeVfs(),
  "etc-root": () => makeVfs({ cwd: "/etc" }),
  "var-log": () => makeVfs({ cwd: "/var/log" }),
  "leeg-home": () =>
    VFS.fromSpec({ home: { d: { student: { d: {} } } } }, { cwd: "/home/student", user: "student", home: "/home/student" }),
};

/** Geef een verse VFS voor een oefening op basis van vfsStart (of de default). */
export function makeVfsForExercise(vfsStart?: string): VFS {
  return (vfsStart && PRESETS[vfsStart] ? PRESETS[vfsStart] : PRESETS.default)();
}

/** Verse env voor een sessie. */
export function makeEnv(vfs: VFS): Record<string, string> {
  return {
    USER: vfs.user, HOME: vfs.home, PWD: vfs.cwd, SHELL: "/bin/bash",
    HOSTNAME: vfs.host, LANG: "nl_BE.UTF-8", "?": "0", PS1: "",
  };
}
