import Link from "next/link";
import { getStudents, getSections } from "@/lib/data";
import { StatTile } from "@/components/StatTile";
import { Badge } from "@/components/Badge";
import { ProgressBar } from "@/components/ProgressBar";

function accuracyBadgeVariant(accuracy: number | null): "easy" | "mid" | "hard" | "neutral" {
  if (accuracy === null) return "neutral";
  if (accuracy >= 70) return "easy";
  if (accuracy >= 40) return "mid";
  return "hard";
}

export default async function ResultsPage() {
  const students = await getStudents();
  const sections = await getSections();
  const totalTasks = sections.reduce((sum, s) => sum + s.taskCount, 0);
  const totalAttempts = students.reduce((sum, s) => sum + s.totalAttempts, 0);
  const withAccuracy = students.filter((s) => s.accuracy !== null);
  const classAccuracy =
    withAccuracy.length > 0
      ? Math.round(withAccuracy.reduce((sum, s) => sum + (s.accuracy ?? 0), 0) / withAccuracy.length)
      : null;

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Panel główny
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Wyniki uczniów</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Przegląd wszystkich uczniów. Kliknij imię, aby zobaczyć pełny raport.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={students.length} label="Uczniowie" />
        <StatTile value={totalTasks} label="Zadania w kursie" />
        <StatTile value={totalAttempts} label="Odpowiedzi" />
        <StatTile value={classAccuracy !== null ? `${classAccuracy}%` : "—"} label="Celność klasy" />
      </div>

      <div className="mt-8 overflow-x-auto rounded-sm border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Uczeń</th>
              <th className="px-4 py-3 font-medium">Rozwiązane</th>
              <th className="px-4 py-3 font-medium">Celność</th>
              <th className="px-4 py-3 font-medium">Odpowiedzi</th>
              <th className="px-4 py-3 font-medium">Ostatnia aktywność</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id} className="border-b border-gray-100 last:border-0">
                <td className="px-4 py-3">
                  <Link
                    href={`/results/${student.id}`}
                    className="font-medium text-infiro-navy hover:underline"
                  >
                    {student.name}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <ProgressBar percent={(student.solvedTasks / student.totalTasks) * 100} />
                    </div>
                    <span className="text-xs text-gray-500">
                      {student.solvedTasks}/{student.totalTasks}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {student.accuracy !== null ? (
                    <Badge variant={accuracyBadgeVariant(student.accuracy)}>{student.accuracy}%</Badge>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-600">{student.totalAttempts}</td>
                <td className="px-4 py-3 text-gray-600">{student.lastActivity ?? "—"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/results/${student.id}`} className="text-infiro-navy hover:underline">
                    Zobacz
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
