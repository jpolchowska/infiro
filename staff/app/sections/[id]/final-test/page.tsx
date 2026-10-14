"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/Badge";
import { LoadState } from "@/components/LoadState";
import { StatTile } from "@/components/StatTile";
import { TaskContentView } from "@/components/TaskContentView";
import { getFinalTestPreview } from "@/lib/data";
import { taskTypeLabel, themeLabel } from "@/lib/labels";
import { useApiData } from "@/lib/useApiData";

export default function FinalTestPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApiData((token) => getFinalTestPreview(token, Number(id)), id);

  if (state.status !== "ready") return <LoadState state={state} />;

  const finalTest = state.data;
  if (!finalTest) notFound();

  return (
    <div>
      <Link href={`/sections/${id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {finalTest.sectionTitle}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Test końcowy działu</h1>

      <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
        <StatTile value={finalTest.questions.length} label="Pytania" />
        <StatTile value={finalTest.attempts} label="Podejścia" />
        <StatTile value={finalTest.studentsAttempted} label="Uczniowie" />
      </div>

      {finalTest.questions.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">Ten dział nie ma jeszcze testu końcowego.</p>
      ) : (
        <ol className="mt-8 flex max-w-2xl flex-col gap-4">
          {finalTest.questions.map((question, index) => (
            <li key={question.id} className="rounded-sm border border-gray-200 bg-white p-5">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-infiro-navy">Pytanie {index + 1}</span>
                <Badge>{taskTypeLabel(question.type)}</Badge>
                {question.themes.length > 0 && (
                  <span className="text-xs text-gray-500">
                    Warianty: {question.themes.map(themeLabel).join(", ")}
                  </span>
                )}
              </div>
              <TaskContentView type={question.type} content={question} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
