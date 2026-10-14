import { Badge } from "@/components/Badge";
import { taskTypeLabel } from "@/lib/labels";
import type { AnsweredQuestion } from "@/lib/types";

export function AnsweredQuestionList({ answers }: { answers: AnsweredQuestion[] }) {
  return (
    <ol className="mt-4 flex flex-col gap-3">
      {answers.map((answer, index) => (
        <li key={index} className="rounded-sm border border-gray-200 bg-white p-4 text-sm">
          <div className="flex items-start justify-between gap-4">
            <p className="whitespace-pre-wrap text-gray-900">
              <span className="mr-2 text-gray-400">{index + 1}.</span>
              {answer.prompt}
            </p>
            <Badge variant={answer.isCorrect ? "easy" : "hard"}>{answer.isCorrect ? "Poprawnie" : "Błędnie"}</Badge>
          </div>
          <dl className="mt-3 grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-gray-600">
            <dt className="text-gray-500">Typ</dt>
            <dd>{taskTypeLabel(answer.type)}</dd>
            <dt className="text-gray-500">Odpowiedź ucznia</dt>
            <dd className="text-gray-900">{answer.givenAnswer ?? "Nie wiem"}</dd>
            {!answer.isCorrect && (
              <>
                <dt className="text-gray-500">Poprawna odpowiedź</dt>
                <dd className="text-gray-900">{answer.correctAnswer ?? "—"}</dd>
              </>
            )}
          </dl>
        </li>
      ))}
    </ol>
  );
}
