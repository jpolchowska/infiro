"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { LoadState } from "@/components/LoadState";
import { Badge } from "@/components/Badge";
import { difficultyLabel } from "@/lib/difficulty";
import { getSubsection } from "@/lib/data";
import { useApiData } from "@/lib/useApiData";

export default function ViewTaskPage() {
  const { id, subsectionId, taskId } = useParams<{
    id: string;
    subsectionId: string;
    taskId: string;
  }>();
  const { state } = useApiData(async (token) => {
    const subsection = await getSubsection(token, Number(subsectionId));
    return subsection?.tasks.find((item) => item.id === Number(taskId));
  }, `${subsectionId}/${taskId}`);

  if (state.status !== "ready") return <LoadState state={state} />;

  const task = state.data;
  if (!task) notFound();

  const difficulty = difficultyLabel(task.difficulty);

  return (
    <div>
      <Link
        href={`/sections/${id}/${subsectionId}`}
        className="text-sm text-gray-500 hover:text-infiro-navy"
      >
        &larr; Wróć do podsekcji
      </Link>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-infiro-navy">{task.title}</h1>
        <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
      </div>

      <section className="mt-6 max-w-2xl rounded-sm border border-gray-200 bg-white p-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">Treść pytania</h2>
        <p className="mt-3 whitespace-pre-wrap text-gray-900">{task.bodyText}</p>

        <h2 className="mt-8 text-xs font-medium uppercase tracking-wide text-gray-500">
          Opcje odpowiedzi
        </h2>
        <ol className="mt-3 flex flex-col gap-2">
          {task.options.map((option) => (
            <li
              key={option.id}
              className={`rounded-sm border px-3 py-2 ${
                option.isCorrect
                  ? "border-green-300 bg-green-50 text-green-900"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              {option.optionText}
              {option.isCorrect && (
                <span className="ml-2 text-xs font-medium text-green-700">Poprawna odpowiedź</span>
              )}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
