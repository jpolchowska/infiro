import Link from "next/link";
import { Badge } from "@/components/Badge";
import { formatDate } from "@/lib/format";
import { levelingTestStatusLabel } from "@/lib/labels";
import type { LevelingTestAttempt, LevelingTestState } from "@/lib/types";

type LevelingTestPanelProps = {
  studentId: number;
  state: LevelingTestState;
  attempts: LevelingTestAttempt[];
};

export function LevelingTestPanel({ studentId, state, attempts }: LevelingTestPanelProps) {
  const status = levelingTestStatusLabel(state.status);

  return (
    <section>
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-sm font-semibold text-infiro-navy">Test poziomujący</h2>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <dl className="mt-3 grid max-w-md grid-cols-[max-content_1fr] gap-x-6 gap-y-1 text-sm">
        <dt className="text-gray-500">Ostatnio</dt>
        <dd className="text-gray-900">{formatDate(state.lastCompletedAt)}</dd>
        <dt className="text-gray-500">Następny od</dt>
        <dd className="text-gray-900">{formatDate(state.dueAt)}</dd>
        <dt className="text-gray-500">Termin</dt>
        <dd className="text-gray-900">{formatDate(state.deadlineAt)}</dd>
      </dl>

      {attempts.length > 0 && (
        <div className="mt-4 overflow-x-auto rounded-sm border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Wynik</th>
                <th className="px-4 py-3 font-medium">Wyniki działów</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-600">{formatDate(attempt.completedAt)}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {attempt.score}/{attempt.total}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {attempt.perSection
                      .map((section) => `${section.sectionTitle} ${section.score}/${section.total}`)
                      .join(" · ")}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/results/${studentId}/leveling-tests/${attempt.id}`}
                      className="text-xs font-medium text-infiro-navy hover:underline"
                    >
                      Odpowiedzi
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
