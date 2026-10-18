"use client";

import Link from "next/link";
import { getStudents } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/ui/BackLink";
import { LoadState } from "@/components/ui/LoadState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { COLUMN_HEADER, TABLE_ROW, TableCard } from "@/components/ui/TableCard";
import { formatAccount, formatRelativeDate, ratioPercent, studentLabel } from "@/lib/format";
import { accuracyTone, levelingTestStatusLabel } from "@/lib/labels";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";

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

      <div className="mt-6">
        <TableCard title="Uczniowie" count={pluralize(students.length, WORDS.student)}>
          <thead className="bg-background/50">
            <tr className="border-b border-gray-100 text-left">
              <th className={COLUMN_HEADER}>Uczeń</th>
              <th className={COLUMN_HEADER}>Nauczyciel</th>
              <th className={COLUMN_HEADER}>Rozwiązane</th>
              <th className={COLUMN_HEADER}>Celność</th>
              <th className={COLUMN_HEADER}>Test poziomujący</th>
              <th className={COLUMN_HEADER}>Ostatnia aktywność</th>
              <th className={COLUMN_HEADER} />
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
                  Brak uczniów.
                </td>
              </tr>
            )}
            {students.map((student) => {
              const levelingTest = levelingTestStatusLabel(student.levelingTest.status);
              const teacher = formatAccount(student.teacherUsername, student.teacherName);
              return (
                <tr key={student.id} className={TABLE_ROW}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/students/${student.id}`} className="font-medium text-infiro-navy hover:underline">
                      {studentLabel(student)}
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">{teacher ?? "—"}</td>
                  <td className="px-6 py-4">
                    <div className="w-40">
                      <ProgressBar
                        percent={ratioPercent(student.solvedTasks, student.totalTasks)}
                        tone={accuracyTone(student.accuracy)}
                      />
                    </div>
                    <span className="mt-1.5 block text-xs text-gray-500">
                      {student.solvedTasks} z {student.totalTasks}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {student.accuracy !== null ? (
                      <Badge variant={accuracyTone(student.accuracy)}>{student.accuracy}%</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge variant={levelingTest.variant}>{levelingTest.label}</Badge>
                    {student.lastLevelingTest && (
                      <span className="ml-2 text-xs text-gray-500">
                        {student.lastLevelingTest.score}/{student.lastLevelingTest.total}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">{formatRelativeDate(student.lastActivity)}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`/students/${student.id}`} className="font-medium text-infiro-navy hover:underline">
                      Zobacz &rsaquo;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      </div>
    </div>
  );
}
