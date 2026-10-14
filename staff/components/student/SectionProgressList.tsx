import Link from "next/link";
import { ProgressBar } from "@/components/ProgressBar";
import { difficultyLabel } from "@/lib/difficulty";
import { formatDate, ratioPercent } from "@/lib/format";
import type { SectionProgress, TaskDifficulty } from "@/lib/types";

export function SectionProgressList({ studentId, sections }: { studentId: number; sections: SectionProgress[] }) {
  if (sections.length === 0) {
    return <p className="mt-3 text-sm text-gray-400">Kurs nie ma jeszcze zadań.</p>;
  }

  return (
    <div className="mt-4 flex flex-col gap-4">
      {sections.map((section) => (
        <div key={section.sectionId} className="rounded-sm border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-gray-900">{section.sectionTitle}</span>
            <span className="text-gray-500">
              {section.solvedTasks}/{section.totalTasks}
            </span>
          </div>
          <div className="mt-2">
            <ProgressBar percent={ratioPercent(section.solvedTasks, section.totalTasks)} />
          </div>

          <table className="mt-4 w-full text-sm">
            <tbody>
              {section.subsections.map((subsection) => (
                <tr key={subsection.subsectionId} className="border-t border-gray-100">
                  <td className="py-2 pr-4 text-gray-700">{subsection.subsectionTitle}</td>
                  <td className="w-32 py-2 pr-4">
                    <ProgressBar percent={ratioPercent(subsection.solvedTasks, subsection.totalTasks)} />
                  </td>
                  <td className="py-2 pr-4 text-xs text-gray-500">
                    {subsection.solvedTasks}/{subsection.totalTasks}
                  </td>
                  <td className="py-2 text-right text-xs text-gray-500">
                    poziom: {difficultyLabel(subsection.unlockedLevel as TaskDifficulty).label.toLowerCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {section.finalTest && (
            <div className="mt-4 border-t border-gray-100 pt-3 text-sm">
              <span className="text-gray-500">Test końcowy: </span>
              {section.finalTest.attempts === 0 ? (
                <span className="text-gray-400">nie podchodził ({section.finalTest.questionCount} pytań)</span>
              ) : (
                <>
                  <span className="text-gray-900">
                    ostatni {section.finalTest.lastScore}/{section.finalTest.maxScore}, najlepszy{" "}
                    {section.finalTest.bestScore}/{section.finalTest.maxScore}
                  </span>
                  <span className="text-gray-500"> · podejść: {section.finalTest.attempts}</span>
                  <div className="mt-2 flex flex-wrap gap-3">
                    {section.finalTest.history.map((attempt) => (
                      <Link
                        key={attempt.id}
                        href={`/students/${studentId}/final-tests/${attempt.id}`}
                        className="text-xs font-medium text-infiro-navy hover:underline"
                      >
                        {formatDate(attempt.completedAt)}: {attempt.score}/{attempt.total}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
