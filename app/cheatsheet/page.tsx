import CheatsheetExplorer from "@/components/CheatsheetExplorer";
import Reveal from "@/components/motion/Reveal";

export const metadata = { title: "Cheat-sheet — BashAcademy" };

export default function CheatsheetPage() {
  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-7 py-8 sm:py-10">
      <Reveal>
        <span className="kicker">openboek · altijd binnen handbereik</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">
          Command <span className="text-gradient">explorer</span>
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] text-fg-muted">
          Geen droge documentatie — een snelle, doorzoekbare kennisbank. Zoek met{" "}
          <kbd className="kbd">Ctrl K</kbd>, filter per categorie, en spring tussen verwante commando&apos;s.
          Net als bij je examen staat dit altijd voor je open.
        </p>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="mt-7">
          <CheatsheetExplorer />
        </div>
      </Reveal>
    </div>
  );
}
