"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getStudentDetail } from "@/lib/data";
import { formatRelativeDate } from "@/lib/format";
import { StatTile } from "@/components/StatTile";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";
import type { StudentDetail } from "@/lib/types";

export default function StudentResultPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [student, setStudent] = useState<StudentDetail | null | undefined>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const data = await getStudentDetail(token ?? "", Number(id));
      if (active) setStudent(data ?? undefined);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (student === undefined) notFound();

  if (student === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }

  return (
    <div>
      <Link href="/results" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wszyscy uczniowie
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">
        {student.name ?? "Uczeń bez imienia"}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{student.email ?? "—"}</p>

      <div className="mt-6 rounded-sm border border-infiro-navy/20 bg-infiro-navy/5 p-4">
        <h2 className="text-sm font-semibold text-infiro-navy">Test poziomujący</h2>
        <p className="mt-1 text-sm text-gray-600">
          Wszystkie dane na tej stronie pochodzą obecnie z testu poziomującego — przeglądanie
          kursu i regularne zadania nie są jeszcze dostępne w aplikacji mobilnej.
        </p>
      </div>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Wynik testu poziomującego</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          value={`${student.correctAttempts} / ${student.totalAttempts}`}
          label="Poprawne odpowiedzi"
        />
        <StatTile value={student.accuracy !== null ? `${student.accuracy}%` : "—"} label="Celność testu" />
        <StatTile
          value={
            student.levelingTestCompletedAt
              ? formatRelativeDate(student.levelingTestCompletedAt)
              : "—"
          }
          label={student.levelingTestCompletedAt ? "Ukończony" : "Nieukończony"}
        />
      </div>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Postęp według sekcji</h2>
      <div className="mt-4 flex flex-col gap-3">
        {student.sectionProgress.map((sp) => (
          <div key={sp.sectionTitle} className="rounded-sm border border-gray-200 bg-white p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-gray-900">{sp.sectionTitle}</span>
              <span className="text-gray-500">
                {sp.solvedTasks}/{sp.totalTasks}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar percent={(sp.solvedTasks / sp.totalTasks) * 100} />
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Do powtórki</h2>
      {student.needsPractice.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">
          Brak — ostatnia próba każdego podjętego zadania była poprawna.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col gap-2">
          {student.needsPractice.map((item, i) => (
            <li key={i} className="rounded-sm border border-gray-200 bg-white px-4 py-2.5 text-sm">
              <span className="font-medium text-gray-900">{item.taskTitle}</span>
              <span className="text-gray-500">
                {" "}
                — {item.subsectionTitle} &middot; próba #{item.attemptNumber}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Ostatnia aktywność</h2>
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
            {student.recentActivity.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                  Brak odpowiedzi.
                </td>
              </tr>
            )}
            {student.recentActivity.map((a, i) => (
              <tr key={i} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3 font-medium text-gray-900">{a.taskTitle}</td>
                <td className="px-4 py-3 text-gray-600">{a.subsectionTitle}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.isCorrect ? "easy" : "hard"}>
                    {a.isCorrect ? "Poprawnie" : "Błędnie"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-gray-600">#{a.attemptNumber}</td>
                <td className="px-4 py-3 text-gray-600">{formatRelativeDate(a.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
