"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { LoadState } from "@/components/ui/LoadState";
import { StatTile } from "@/components/ui/StatTile";
import { TaskContentView } from "@/components/tasks/TaskContentView";
import { getFinalTestPreview } from "@/lib/data";
import { taskTypeLabel, themeLabel } from "@/lib/labels";
import { pluralForm, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";

export default function FinalTestPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { state } = useApiData((token) => getFinalTestPreview(token, Number(sectionId)), sectionId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const finalTest = state.data;
  if (!finalTest) notFound();

  return (
    <div>
      <Link href={`/sections/${sectionId}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {finalTest.sectionTitle}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Test końcowy działu</h1>

      <div className="mt-6 grid max-w-xl grid-cols-3 gap-3">
        <StatTile value={finalTest.questions.length} label={pluralForm(finalTest.questions.length, WORDS.question)} />
        <StatTile value={finalTest.attempts} label={pluralForm(finalTest.attempts, WORDS.testAttempt)} />
        <StatTile value={finalTest.studentsAttempted} label={pluralForm(finalTest.studentsAttempted, WORDS.student)} />
      </div>

      {finalTest.questions.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">Ten dział nie ma jeszcze testu końcowego.</p>
      ) : (
        <ol className="mt-8 flex max-w-2xl flex-col gap-4">
          {finalTest.questions.map((question, index) => (
            <li key={question.id} className="rounded-lg border border-infiro-border bg-white p-5">
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
