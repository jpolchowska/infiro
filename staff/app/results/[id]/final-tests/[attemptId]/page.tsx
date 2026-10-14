"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { AnsweredQuestionList } from "@/components/AnsweredQuestionList";
import { LoadState } from "@/components/LoadState";
import { getFinalTestAttempt } from "@/lib/data";
import { formatDate } from "@/lib/format";
import { useApiData } from "@/lib/useApiData";

export default function FinalTestAttemptPage() {
  const { id, attemptId } = useParams<{ id: string; attemptId: string }>();
  const { state } = useApiData(
    (token) => getFinalTestAttempt(token, Number(id), Number(attemptId)),
    `${id}/${attemptId}`
  );

  if (state.status !== "ready") return <LoadState state={state} />;

  const attempt = state.data;
  if (!attempt) notFound();

  return (
    <div>
      <Link href={`/results/${id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wróć do ucznia
      </Link>
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
