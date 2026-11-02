"use client";

import { notFound, useParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { LoadState } from "@/components/ui/LoadState";
import { RichText } from "@/components/ui/RichText";
import { StatTile } from "@/components/ui/StatTile";
import { TaskContentView } from "@/components/tasks/TaskContentView";
import { getFinalTestPreview } from "@/lib/data";
import { formatPercent } from "@/lib/format";
import { taskTypeLabel, themeLabel } from "@/lib/labels";
import { pluralForm, WORDS } from "@/lib/pluralize";
import type { FinalTestQuestion, FinalTestQuestionGroup } from "@/lib/types";
import { useApiData } from "@/hooks/useApiData";
import { BackLink } from "@/components/ui/BackLink";

function formatAverage(value: number | null): string {
  return value === null ? "—" : value.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}

function QuestionGroupCard({
  title,
  group,
  questions,
  tone,
}: {
  title: string;
  group: FinalTestQuestionGroup;
  questions: FinalTestQuestion[];
  tone: "good" | "bad";
}) {
  return (
    <section className="rounded-sm border border-infiro-border bg-white px-6 py-5">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-xs font-medium uppercase tracking-wide text-gray-500">{title}</h2>
        <span className={`text-sm font-semibold ${tone === "good" ? "text-tone-good" : "text-tone-bad"}`}>
          {group.correctRate}% poprawnych
        </span>
      </div>
      <ul className="mt-3 flex flex-col gap-2">
        {group.questionIds.map((questionId) => {
          const index = questions.findIndex((question) => question.id === questionId);
          if (index === -1) return null;
          return (
            <li key={questionId} className="flex gap-3 text-sm">
              <span className="shrink-0 font-semibold text-infiro-navy">Pytanie {index + 1}</span>
              <span className="line-clamp-1 text-gray-600">
                <RichText text={questions[index].prompt} />
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export default function FinalTestPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { state } = useApiData((token) => getFinalTestPreview(token, Number(sectionId)), sectionId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const finalTest = state.data;
  if (!finalTest) notFound();

  return (
    <div>
      <BackLink href={`/sections/${sectionId}`}>{finalTest.sectionTitle}</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Test końcowy działu</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={finalTest.questions.length} label={pluralForm(finalTest.questions.length, WORDS.question)} />
        <StatTile value={`${finalTest.studentsAttempted}/${finalTest.studentsTotal}`} label="Ilu uczniów rozwiązało" />
        <StatTile value={formatAverage(finalTest.averageAttempts)} label="Liczba podejść na ucznia" />
        <StatTile value={formatPercent(finalTest.averageScore)} label="Średni wynik" />
      </div>

      {finalTest.easiest && finalTest.hardest && (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <QuestionGroupCard title="Najłatwiejsze" group={finalTest.easiest} questions={finalTest.questions} tone="good" />
          <QuestionGroupCard title="Najtrudniejsze" group={finalTest.hardest} questions={finalTest.questions} tone="bad" />
        </div>
      )}

      {finalTest.questions.length === 0 ? (
        <p className="mt-6 text-sm text-gray-400">Ten dział nie ma jeszcze testu końcowego.</p>
      ) : (
        <ol className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {finalTest.questions.map((question, index) => (
            <li key={question.id} className="rounded-sm border border-infiro-border bg-white p-5">
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
