"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { LoadState } from "@/components/ui/LoadState";
import { COLUMN_HEADER, TABLE_ROW, TableCard } from "@/components/ui/TableCard";
import { getStudents, getTeachers } from "@/lib/data";
import { formatAccount } from "@/lib/format";
import { accuracyTone } from "@/lib/labels";
import { pluralize, WORDS } from "@/lib/pluralize";
import { teacherStats } from "@/lib/teacherStats";
import { useApiData } from "@/hooks/useApiData";

export default function TeachersPage() {
  const { state } = useApiData(async (token) => {
    const [teachers, students] = await Promise.all([getTeachers(token), getStudents(token)]);
    return { teachers, students };
  });

  if (state.status !== "ready") return <LoadState state={state} />;

  const { teachers, students } = state.data;
  const unassignedCount = students.filter((student) => student.teacherId === null).length;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Nauczyciele</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Nauczyciele i wyniki ich uczniów. Otwórz nauczyciela, aby przypisać mu uczniów.
      </p>

      <div className="mt-6">
        <TableCard title="Nauczyciele" count={pluralize(teachers.length, WORDS.teacher)}>
          <thead className="bg-background/50">
            <tr className="border-b border-gray-100 text-left">
              <th className={COLUMN_HEADER}>Nauczyciel</th>
              <th className={COLUMN_HEADER}>Uczniowie</th>
              <th className={COLUMN_HEADER}>Śr. celność</th>
              <th className={COLUMN_HEADER}>Aktywni (7 dni)</th>
              <th className={COLUMN_HEADER}>Zaległy test</th>
              <th className={COLUMN_HEADER} />
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                  Brak nauczycieli. Konto nauczyciela zakłada się w Keycloaku w grupie „nauczyciele”.
                </td>
              </tr>
            )}
            {teachers.map((teacher) => {
              const stats = teacherStats(students.filter((student) => student.teacherId === teacher.id));
              const hasStudents = stats.studentCount > 0;
              return (
                <tr key={teacher.id} className={TABLE_ROW}>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Link href={`/teachers/${teacher.id}`} className="font-medium text-infiro-navy hover:underline">
                      {formatAccount(teacher.username, teacher.name) ?? `Nauczyciel #${teacher.id}`}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-gray-900">{stats.studentCount}</td>
                  <td className="px-6 py-4">
                    {stats.averageAccuracy !== null ? (
                      <Badge variant={accuracyTone(stats.averageAccuracy)}>{stats.averageAccuracy}%</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">
                    {hasStudents ? `${stats.activeThisWeek} z ${stats.studentCount}` : "—"}
                  </td>
                  <td className="px-6 py-4">
                    {!hasStudents ? (
                      <span className="text-gray-400">—</span>
                    ) : stats.overdueLevelingTests > 0 ? (
                      <Badge variant="hard">{stats.overdueLevelingTests}</Badge>
                    ) : (
                      <span className="text-gray-600">0</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`/teachers/${teacher.id}`} className="font-medium text-infiro-navy hover:underline">
                      Otwórz &rsaquo;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      </div>

      {unassignedCount > 0 && (
        <p className="mt-4 text-sm text-gray-600">
          Bez nauczyciela: <span className="font-medium text-gray-900">{pluralize(unassignedCount, WORDS.student)}</span>
        </p>
      )}
    </div>
  );
}
