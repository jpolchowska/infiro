import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { levelingTestStatusLabel } from "@/lib/labels";
import type { LevelingTestAttempt, LevelingTestState } from "@/lib/types";

export function LevelingTestCard({
  studentId,
  state,
  attempts,
}: {
  studentId: number;
  state: LevelingTestState;
  attempts: LevelingTestAttempt[];
}) {
  const status = levelingTestStatusLabel(state.status);
  const dates = [
    ["Ostatnio", state.lastCompletedAt],
    ["Następny od", state.dueAt],
    ["Termin", state.deadlineAt],
  ] as const;

  return (
    <Card title="Test poziomujący" aside={<Badge variant={status.variant}>{status.label}</Badge>}>
      <dl className="grid grid-cols-3 gap-3">
        {dates.map(([label, date]) => (
          <div key={label}>
            <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{label}</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(date)}</dd>
          </div>
        ))}
      </dl>

      {attempts.length > 0 && (
        <ul className="mt-5 flex flex-col divide-y divide-gray-100 border-t border-gray-100">
          {attempts.map((attempt) => (
            <li key={attempt.id} className="flex items-center justify-between gap-4 py-3 text-sm last:pb-0">
              <span className="text-gray-600">{formatDate(attempt.completedAt)}</span>
              <span className="font-medium text-gray-900">
                {attempt.score}/{attempt.total}
              </span>
              <Link
                href={`/students/${studentId}/leveling-tests/${attempt.id}`}
                className="font-medium text-infiro-navy hover:underline"
              >
                Odpowiedzi &rsaquo;
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
