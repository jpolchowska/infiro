import { Badge } from "@/components/Badge";
import { formatRelativeDate } from "@/lib/format";
import { taskTypeLabel } from "@/lib/labels";
import type { ActivityItem, PracticeItem } from "@/lib/types";

export function NeedsPracticeList({ items }: { items: PracticeItem[] }) {
  if (items.length === 0) {
    return <p className="mt-2 text-sm text-gray-400">Brak — ostatnia próba każdego podjętego zadania była poprawna.</p>;
  }

  return (
    <ul className="mt-3 flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.taskId} className="rounded-sm border border-gray-200 bg-white px-4 py-2.5 text-sm">
          <p className="line-clamp-2 text-gray-900">{item.prompt}</p>
          <p className="mt-1 text-xs text-gray-500">
            {taskTypeLabel(item.type)} · {item.sectionTitle} / {item.subsectionTitle} · próba #{item.attemptNumber}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function RecentActivityTable({ items }: { items: ActivityItem[] }) {
  return (
    <div className="mt-4 overflow-x-auto rounded-sm border border-gray-200 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3 font-medium">Zadanie</th>
            <th className="px-4 py-3 font-medium">Podsekcja</th>
            <th className="px-4 py-3 font-medium">Wynik</th>
            <th className="px-4 py-3 font-medium">Próba</th>
            <th className="px-4 py-3 font-medium">Data</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                Brak odpowiedzi.
              </td>
            </tr>
          )}
          {items.map((item, index) => (
            <tr key={index} className="border-b border-gray-100 last:border-0">
              <td className="max-w-xs px-4 py-3 text-gray-900">
                <span className="line-clamp-2">{item.prompt}</span>
              </td>
              <td className="px-4 py-3 text-gray-600">{item.subsectionTitle ?? "—"}</td>
              <td className="px-4 py-3">
                <Badge variant={item.isCorrect ? "easy" : "hard"}>{item.isCorrect ? "Poprawnie" : "Błędnie"}</Badge>
              </td>
              <td className="px-4 py-3 text-gray-600">#{item.attemptNumber}</td>
              <td className="px-4 py-3 text-gray-600">{formatRelativeDate(item.submittedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
