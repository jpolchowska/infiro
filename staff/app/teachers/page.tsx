"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadState } from "@/components/ui/LoadState";
import { getStudents, getTeachers, updateStudentTeacher } from "@/lib/data";
import { formatAccount, studentLabel } from "@/lib/format";
import type { Student, Teacher } from "@/lib/types";
import { useApiData } from "@/hooks/useApiData";

export default function TeachersPage() {
  const { state } = useApiData(async (token) => {
    const [students, teachers] = await Promise.all([getStudents(token), getTeachers(token)]);
    return { students, teachers };
  });

  if (state.status !== "ready") return <LoadState state={state} />;

  return <TeacherAssignments initialStudents={state.data.students} teachers={state.data.teachers} />;
}

function assignedTeacherIds(students: Student[]): Record<number, string> {
  return Object.fromEntries(
    students
      .filter((student) => student.teacherId !== null)
      .map((student) => [student.id, String(student.teacherId)])
  );
}

function TeacherAssignments({ initialStudents, teachers }: { initialStudents: Student[]; teachers: Teacher[] }) {
  const { getToken } = useAuth();
  const [students, setStudents] = useState(initialStudents);
  const [teacherIds, setTeacherIds] = useState(() => assignedTeacherIds(initialStudents));
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  async function saveTeacher(student: Student) {
    const value = teacherIds[student.id]?.trim() ?? "";
    const teacherId = value === "" ? null : Number(value);

    if (teacherId !== null && (!Number.isInteger(teacherId) || teacherId < 1)) {
      setError("ID nauczyciela musi być dodatnią liczbą całkowitą.");
      return;
    }

    setSavingId(student.id);
    setSavedId(null);
    setError(null);
    try {
      const token = await getToken();
      const updated = await updateStudentTeacher(token ?? "", student.id, teacherId);
      setStudents((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      setSavedId(student.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać przypisania.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Nauczyciele</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Przypisz uczniom nauczycieli z listy dostępnych kont.
      </p>

      {error !== null && (
        <p className="mt-5 rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mt-8 overflow-x-auto rounded-lg border border-infiro-border bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Uczeń</th>
              <th className="px-4 py-3 font-medium">Nauczyciel</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {students.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                  Brak uczniów.
                </td>
              </tr>
            )}
            {students.map((student) => (
              <tr key={student.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{studentLabel(student)}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={teacherIds[student.id] ?? ""}
                    onChange={(event) =>
                      setTeacherIds((current) => ({ ...current, [student.id]: event.target.value }))
                    }
                    className="w-56 rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-infiro-navy focus:ring-1 focus:ring-infiro-navy"
                    aria-label={`Nauczyciel dla ${studentLabel(student)}`}
                  >
                    <option value="">Brak przypisania</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {formatAccount(teacher.username, teacher.name) ?? `Nauczyciel #${teacher.id}`}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => saveTeacher(student)}
                    disabled={savingId === student.id}
                    className="rounded-sm bg-infiro-navy px-3 py-2 text-sm font-medium text-white hover:bg-infiro-navy/90 disabled:cursor-wait disabled:opacity-60"
                  >
                    {savingId === student.id ? "Zapisywanie..." : "Zapisz"}
                  </button>
                  {savedId === student.id && (
                    <span className="ml-3 text-xs text-green-700">Zapisano</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
