import { notFound } from "next/navigation";
import Link from "next/link";
import ExerciseRunner from "@/components/ExerciseRunner";
import { getExercise, nextExercise, prevExercise } from "@/lib/exercises";

export function generateMetadata({ params }: { params: { id: string } }) {
  const ex = getExercise(params.id);
  return { title: ex ? `${ex.title} — oefening` : "Oefening — BashAcademy" };
}

export default function ExercisePage({ params }: { params: { id: string } }) {
  const ex = getExercise(params.id);
  if (!ex) notFound();
  const prev = prevExercise(ex.id);
  const next = nextExercise(ex.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-5 sm:px-7 py-7">
      <div className="flex items-center justify-between gap-3 mb-5">
        <Link href="/oefeningen" className="text-[13px] text-fg-dim hover:text-fg font-mono transition-colors">← alle oefeningen</Link>
        <div className="flex gap-2">
          {prev && <Link href={`/oefeningen/${prev.id}`} className="btn btn-ghost btn-sm">← vorige</Link>}
          {next && <Link href={`/oefeningen/${next.id}`} className="btn btn-ghost btn-sm">volgende →</Link>}
        </div>
      </div>
      <ExerciseRunner exercise={ex} />
    </div>
  );
}
