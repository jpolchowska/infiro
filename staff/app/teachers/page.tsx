"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { getStudents, getTeachers, updateStudentTeacher } from "@/lib/data";
import type { Student } from "@/lib/types";

type Teacher = {
  id: number;
  name: string | null;
  email: string | null;
};

export default function TeachersPage() {
  const { getToken } = useAuth();
  const [students, setStudents] = useState<Student[] | null>(null);
  const [teachers, setTeachers] = useState<Teacher[] | null>(null);
  const [teacherIds, setTeacherIds] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        const [data, teacherData] = await Promise.all([
          getStudents(token ?? ""),
          getTeachers(token ?? ""),
        ]);
        if (active) {
          setStudents(data);
          setTeachers(teacherData);
          setTeacherIds(
            Object.fromEntries(
              data
                .filter((student) => student.teacherId !== null)
                .map((student) => [student.id, String(student.teacherId)])
            )
          );
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Nie udało się pobrać uczniów.");
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setStudents((current) => current?.map((item) => (item.id === updated.id ? updated : item)) ?? null);
      setSavedId(student.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nie udało się zapisać przypisania.");
    } finally {
      setSavingId(null);
    }
  }

  if ((students === null || teachers === null) && error === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
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

      {students !== null && teachers !== null && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-gray-200 bg-white">
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
                    <div className="font-medium text-gray-900">
                      {student.name ?? "Uczeń bez imienia"}
                    </div>
                    <div className="mt-0.5 text-xs text-gray-500">{student.email ?? "—"}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={teacherIds[student.id] ?? ""}
                      onChange={(event) =>
                        setTeacherIds((current) => ({ ...current, [student.id]: event.target.value }))
                      }
                      className="w-56 rounded-sm border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-infiro-navy focus:ring-1 focus:ring-infiro-navy"
                      aria-label={`Nauczyciel dla ${student.name ?? "ucznia"}`}
                    >
                      <option value="">Brak przypisania</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id}>
                          {teacher.name ?? teacher.email ?? `Nauczyciel #${teacher.id}`}
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
      )}
    </div>
  );
}
