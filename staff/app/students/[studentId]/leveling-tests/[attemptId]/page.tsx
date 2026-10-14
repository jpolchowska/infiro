"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AnsweredQuestionList } from "@/components/tasks/AnsweredQuestionList";
import { LoadState } from "@/components/ui/LoadState";
import { getLevelingTestAttempt } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/hooks/useApiData";

export default function LevelingTestAttemptPage() {
  const { studentId, attemptId } = useParams<{ studentId: string; attemptId: string }>();
  const { state } = useApiData(
    (token) => getLevelingTestAttempt(token, Number(studentId), Number(attemptId)),
    `${studentId}/${attemptId}`
  );

  if (state.status !== "ready") return <LoadState state={state} />;

  const attempt = state.data;
  if (!attempt) notFound();

  return (
    <div>
      <Link href={`/students/${studentId}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wróć do ucznia
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Test poziomujący</h1>
      <p className="mt-1 text-sm text-gray-500">
        {formatDate(attempt.completedAt)} · wynik {attempt.score}/{attempt.total}
      </p>
      <p className="mt-3 text-sm text-gray-700">
        {attempt.perSection.map((section) => `${section.sectionTitle}: ${section.score}/${section.total}`).join(" · ")}
      </p>
      <AnsweredQuestionList answers={attempt.answers} />
    </div>
  );
}
