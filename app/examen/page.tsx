import ExamRunner from "@/components/ExamRunner";

export const metadata = { title: "Examensimulatie — BashAcademy" };

export default function ExamenPage() {
  return (
    <div className="mx-auto w-full max-w-[1080px] px-5 sm:px-7 py-8 sm:py-10">
      <div className="mb-7">
        <span className="kicker">openboek · op tijd</span>
        <h1 className="mt-3 text-4xl font-bold tracking-tight">Examen<span className="text-gradient">simulatie</span></h1>
        <p className="mt-3 max-w-2xl text-[15px] text-fg-muted">
          Oefen onder examenomstandigheden: willekeurige vragen, een lopende klok, en jij kiest of de
          cheat-sheet beschikbaar is. Achteraf zie je je score en de modeloplossingen.
        </p>
      </div>
      <ExamRunner />
    </div>
  );
}
