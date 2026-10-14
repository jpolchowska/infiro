import type { TaskContent, TaskType } from "@/lib/types";

export function TaskContentView({ type, content }: { type: TaskType; content: TaskContent }) {
  return (
    <div>
      <p className="whitespace-pre-wrap text-gray-900">{content.prompt}</p>

      {type === "single_choice" && (
        <ol className="mt-4 flex flex-col gap-2">
          {content.options.map((option) => (
            <li
              key={option.id}
              className={`rounded-sm border px-3 py-2 text-sm ${
                option.isCorrect ? "border-green-300 bg-green-50 text-green-900" : "border-gray-200 text-gray-700"
              }`}
            >
              {option.text}
              {option.isCorrect && <span className="ml-2 text-xs font-medium text-green-700">Poprawna odpowiedź</span>}
            </li>
          ))}
        </ol>
      )}

      {type === "short_answer" && (
        <div className="mt-4 text-sm">
          <span className="text-gray-500">Akceptowane odpowiedzi: </span>
          <span className="font-medium text-gray-900">{content.acceptedAnswers.join(", ") || "—"}</span>
        </div>
      )}

      {type === "memory" && (
        <table className="mt-4 w-full max-w-md text-sm">
          <tbody>
            {content.memoryPairs.map((pair, index) => (
              <tr key={index} className="border-b border-gray-100 last:border-0">
                <td className="py-2 pr-4 text-gray-900">{pair.a}</td>
                <td className="py-2 text-gray-500">↔</td>
                <td className="py-2 pl-4 text-gray-900">{pair.b}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
