"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { BackLink } from "@/components/ui/BackLink";
import { Card } from "@/components/ui/Card";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadState } from "@/components/ui/LoadState";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import { COLUMN_HEADER, TABLE_ROW, TableCard } from "@/components/ui/TableCard";
import { getStudents, getTeachers, updateStudentTeacher } from "@/lib/data";
import { formatAccount, formatPercent, formatRelativeDate, ratioPercent, studentLabel } from "@/lib/format";
import { accuracyTone } from "@/lib/labels";
import { pluralForm, pluralize, WORDS } from "@/lib/pluralize";
import { teacherStats } from "@/lib/teacherStats";
import type { Student, Teacher } from "@/lib/types";
import { SAVE_ERROR, useSubmit } from "@/hooks/useSubmit";
import { useApiData } from "@/hooks/useApiData";

export default function TeacherPage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const { state } = useApiData(async (token) => {
    const [teachers, students] = await Promise.all([getTeachers(token), getStudents(token)]);
    return { teachers, students };
  }, teacherId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const teacher = state.data.teachers.find((item) => item.id === Number(teacherId));
  if (!teacher) notFound();

  return <TeacherDetail teacher={teacher} teachers={state.data.teachers} initialStudents={state.data.students} />;
}

function teacherName(teacher: Teacher): string {
  return formatAccount(teacher.username, teacher.name) ?? `Nauczyciel #${teacher.id}`;
}

function TeacherDetail({
  teacher,
  teachers,
  initialStudents,
}: {
  teacher: Teacher;
  teachers: Teacher[];
  initialStudents: Student[];
}) {
  const [students, setStudents] = useState(initialStudents);
  const [selectedId, setSelectedId] = useState("");
  const { submitting, error, submit } = useSubmit();

  const ownStudents = students.filter((student) => student.teacherId === teacher.id);
  const unassigned = students.filter((student) => student.teacherId === null);
  const atOtherTeachers = students.filter((student) => student.teacherId !== null && student.teacherId !== teacher.id);
  const stats = teacherStats(ownStudents);
  const teachersById = new Map(teachers.map((item) => [item.id, item]));

  async function assign(studentId: number, teacherId: number | null) {
    await submit(async (token) => {
      const updated = await updateStudentTeacher(token, studentId, teacherId);
      setStudents((current) => current.map((student) => (student.id === updated.id ? updated : student)));
      setSelectedId("");
    }, SAVE_ERROR);
  }

  function unassign(student: Student) {
    if (confirm(`Odpiąć ucznia ${studentLabel(student)} od nauczyciela ${teacherName(teacher)}?`)) {
      assign(student.id, null);
    }
  }

  return (
    <div>
      <BackLink href="/teachers">Nauczyciele</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{teacherName(teacher)}</h1>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatTile
          value={stats.studentCount}
          label={pluralForm(stats.studentCount, ["Uczeń", "Uczniowie", "Uczniów", "Uczniów"])}
        />
        <StatTile value={formatPercent(stats.averageAccuracy)} label="Średnia celność" />
        <StatTile value={stats.activeThisWeek} label="Aktywni w tym tygodniu" />
      </div>

      <div className="mt-6">
        <Card title="Przypisz ucznia">
          <form
            className="flex flex-wrap items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              if (selectedId) assign(Number(selectedId), teacher.id);
            }}
          >
            <select
              value={selectedId}
              onChange={(event) => setSelectedId(event.target.value)}
              aria-label="Uczeń do przypisania"
              className="min-w-64 flex-1 rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-infiro-navy focus:ring-1 focus:ring-infiro-navy"
            >
              <option value="">Wybierz ucznia…</option>
              {unassigned.length > 0 && (
                <optgroup label="Bez nauczyciela">
                  {unassigned.map((student) => (
                    <option key={student.id} value={student.id}>
                      {studentLabel(student)}
                    </option>
                  ))}
                </optgroup>
              )}
              {atOtherTeachers.length > 0 && (
                <optgroup label="U innych nauczycieli">
                  {atOtherTeachers.map((student) => {
                    const current = student.teacherId !== null ? teachersById.get(student.teacherId) : undefined;
                    return (
                      <option key={student.id} value={student.id}>
                        {studentLabel(student)} — teraz: {current ? teacherName(current) : "inny nauczyciel"}
                      </option>
                    );
                  })}
                </optgroup>
              )}
            </select>
            <button
              type="submit"
              disabled={!selectedId || submitting}
              className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Zapisywanie…" : "Przypisz"}
            </button>
          </form>
          {error && (
            <div className="mt-3">
              <ErrorMessage message={error} />
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6">
        <TableCard title="Uczniowie" count={pluralize(ownStudents.length, WORDS.student)}>
          <thead className="bg-background/50">
            <tr className="border-b border-gray-100 text-left">
              <th className={COLUMN_HEADER}>Uczeń</th>
              <th className={COLUMN_HEADER}>Rozwiązane</th>
              <th className={COLUMN_HEADER}>Celność</th>
              <th className={COLUMN_HEADER}>Ostatnia aktywność</th>
              <th className={COLUMN_HEADER} />
            </tr>
          </thead>
          <tbody>
            {ownStudents.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Ten nauczyciel nie ma jeszcze uczniów.
                </td>
              </tr>
            )}
            {ownStudents.map((student) => (
              <tr key={student.id} className={TABLE_ROW}>
                <td className="whitespace-nowrap px-6 py-4">
                  <Link href={`/students/${student.id}`} className="font-medium text-infiro-navy hover:underline">
                    {studentLabel(student)}
                  </Link>
                </td>
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
                <td className="whitespace-nowrap px-6 py-4 text-gray-600">{formatRelativeDate(student.lastActivity)}</td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link href={`/students/${student.id}`} className="font-medium text-infiro-navy hover:underline">
                    Zobacz &rsaquo;
                  </Link>
                  <button
                    type="button"
                    onClick={() => unassign(student)}
                    disabled={submitting}
                    className="ml-5 font-medium text-tone-bad hover:underline disabled:opacity-50"
                  >
                    Odepnij
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </TableCard>
      </div>
    </div>
  );
}
