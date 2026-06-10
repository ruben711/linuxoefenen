import Link from "next/link";
import CheatsheetExplorer from "@/components/CheatsheetExplorer";
import { getCommand } from "@/lib/cheatsheet";

export function generateMetadata({ params }: { params: { cmd: string } }) {
  const c = getCommand(decodeURIComponent(params.cmd));
  return { title: c ? `${c.name} — cheat-sheet` : "Cheat-sheet — BashAcademy" };
}

export default function CheatsheetCmdPage({ params }: { params: { cmd: string } }) {
  const name = decodeURIComponent(params.cmd);
  return (
    <div className="mx-auto w-full max-w-[1320px] px-5 sm:px-7 py-8 sm:py-10">
      <div className="mb-5 text-[13px] text-fg-dim font-mono">
        <Link href="/cheatsheet" className="hover:text-fg transition-colors">cheat-sheet</Link>
        <span className="mx-1.5">/</span>
        <span className="text-fg">{name}</span>
      </div>
      <CheatsheetExplorer initialSelected={name} />
    </div>
  );
}
