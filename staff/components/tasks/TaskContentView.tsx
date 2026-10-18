import { Badge } from "@/components/ui/Badge";
import { RichText } from "@/components/ui/RichText";
import type { TaskContent, TaskType } from "@/lib/types";

const LETTERS = ["A", "B", "C", "D", "E", "F"];

export function TaskContentView({ type, content }: { type: TaskType; content: TaskContent }) {
  return (
    <div>
      <p className="whitespace-pre-wrap text-base text-gray-900">
        <RichText text={content.prompt} />
      </p>

      {type === "single_choice" && (
        <ol className="mt-5 flex flex-col gap-2">
          {content.options.map((option, index) => (
            <li
              key={option.id}
              className={`flex items-center gap-3 rounded-sm border px-4 py-3 text-sm ${
                option.isCorrect
                  ? "border-tone-good/30 bg-tone-good-soft text-tone-good"
                  : "border-infiro-border text-gray-700"
              }`}
            >
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                  option.isCorrect ? "bg-tone-good text-white" : "bg-background text-gray-500"
                }`}
              >
                {LETTERS[index] ?? index + 1}
              </span>
              <span className="flex-1">
                <RichText text={option.text} />
              </span>
              {option.isCorrect && <Badge variant="easy">Poprawna</Badge>}
            </li>
          ))}
        </ol>
      )}

      {type === "short_answer" && (
        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">Akceptowane odpowiedzi</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {content.acceptedAnswers.length > 0 ? (
              content.acceptedAnswers.map((answer) => (
                <Badge key={answer} variant="easy">
                  {answer}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-gray-400">—</span>
            )}
          </div>
        </div>
      )}

      {type === "memory" && (
        <ul className="mt-5 flex flex-col gap-2">
          {content.memoryPairs.map((pair, index) => (
            <li
              key={index}
              className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-sm border border-infiro-border px-4 py-3 text-sm"
            >
              <span className="text-gray-900">{pair.a}</span>
              <span className="text-gray-400">↔</span>
              <span className="text-gray-900">{pair.b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
