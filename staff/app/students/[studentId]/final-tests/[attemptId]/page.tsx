"use client";

import { notFound, useParams } from "next/navigation";
import { AnsweredQuestionList } from "@/components/tasks/AnsweredQuestionList";
import { LoadState } from "@/components/ui/LoadState";
import { getFinalTestAttempt } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/hooks/useApiData";
import { BackLink } from "@/components/ui/BackLink";

export default function FinalTestAttemptPage() {
  const { studentId, attemptId } = useParams<{ studentId: string; attemptId: string }>();
  const { state } = useApiData(
    (token) => getFinalTestAttempt(token, Number(studentId), Number(attemptId)),
    `${studentId}/${attemptId}`
  );

  if (state.status !== "ready") return <LoadState state={state} />;

  const attempt = state.data;
  if (!attempt) notFound();

  return (
    <div>
      <BackLink href={`/students/${studentId}`}>Wróć do ucznia</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Test końcowy działu</h1>
      <p className="mt-1 text-sm text-gray-500">
        {formatDate(attempt.completedAt)} · wynik {attempt.score}/{attempt.total}
      </p>
      {attempt.answers.length === 0 ? (
        <p className="mt-4 text-sm text-gray-400">
          To podejście pochodzi sprzed zapisywania odpowiedzi, więc są dostępne tylko wyniki.
        </p>
      ) : (
        <AnsweredQuestionList answers={attempt.answers} />
      )}
    </div>
  );
}
