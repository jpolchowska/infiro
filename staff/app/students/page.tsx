"use client";

import Link from "next/link";
import { getStudents } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { LoadState } from "@/components/ui/LoadState";
import { formatAccount, formatRelativeDate, ratioPercent, studentLabel } from "@/lib/format";
import { accuracyTone, levelingTestStatusLabel } from "@/lib/labels";
import { useApiData } from "@/hooks/useApiData";
import { BackLink } from "@/components/ui/BackLink";

export default function ResultsPage() {
  const { state } = useApiData(getStudents);

  if (state.status !== "ready") return <LoadState state={state} />;

  const students = state.data;

  return (
    <div>
      <BackLink href="/">Panel główny</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Uczniowie</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Lista uczniów i ich postępów. Kliknij ucznia, aby zobaczyć szczegóły.
      </p>

      <div className="mt-6 overflow-x-auto rounded-sm border border-infiro-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Uczeń</th>
              <th className="px-4 py-3 font-medium">Nauczyciel</th>
              <th className="px-4 py-3 font-medium">Rozwiązane</th>
              <th className="px-4 py-3 font-medium">Celność</th>
              <th className="px-4 py-3 font-medium">Test poziomujący</th>
              <th className="px-4 py-3 font-medium">Ostatnia aktywność</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                  Brak uczniów.
                </td>
              </tr>
            )}
            {students.map((student) => {
              const levelingTest = levelingTestStatusLabel(student.levelingTest.status);
              return (
                <tr key={student.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3">
                    <Link href={`/students/${student.id}`} className="font-medium text-infiro-navy hover:underline">
                      {studentLabel(student)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatAccount(student.teacherUsername, student.teacherName) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24">
                        <ProgressBar percent={ratioPercent(student.solvedTasks, student.totalTasks)} tone={accuracyTone(student.accuracy)} />
                      </div>
                      <span className="text-xs text-gray-500">
                        {student.solvedTasks}/{student.totalTasks}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {student.accuracy !== null ? (
                      <Badge variant={accuracyTone(student.accuracy)}>{student.accuracy}%</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={levelingTest.variant}>{levelingTest.label}</Badge>
                    {student.lastLevelingTest && (
                      <span className="ml-2 text-xs text-gray-500">
                        {student.lastLevelingTest.score}/{student.lastLevelingTest.total}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatRelativeDate(student.lastActivity)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/students/${student.id}`} className="text-infiro-navy hover:underline">
                      Zobacz
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
