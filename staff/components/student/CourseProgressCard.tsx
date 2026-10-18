import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { DifficultyMeter } from "@/components/ui/DifficultyMeter";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { ratioPercent } from "@/lib/format";
import { pluralize, WORDS } from "@/lib/pluralize";
import type { CurrentSubsection, FinalTestSummary, SectionProgress, TaskDifficulty } from "@/lib/types";

function FinalTestLine({ studentId, finalTest }: { studentId: number; finalTest: FinalTestSummary }) {
  const latest = finalTest.history[0];

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-sm bg-background/60 px-4 py-2.5 text-sm">
      <span className="text-gray-600">
        <span className="font-medium text-gray-900">Test końcowy</span>
        {finalTest.attempts === 0
          ? " · jeszcze nie podchodził(a)"
          : ` · najlepszy ${finalTest.bestScore}/${finalTest.maxScore} · ${pluralize(finalTest.attempts, WORDS.testAttempt)}`}
      </span>
      {latest && (
        <Link
          href={`/students/${studentId}/final-tests/${latest.id}`}
          className="font-medium text-infiro-navy hover:underline"
        >
          Odpowiedzi &rsaquo;
        </Link>
      )}
    </div>
  );
}

export function CourseProgressCard({
  studentId,
  sections,
  current,
}: {
  studentId: number;
  sections: SectionProgress[];
  current: CurrentSubsection | null;
}) {
  return (
    <Card title="Postęp w kursie" aside={current && `Teraz: ${current.subsectionTitle}`}>
      {sections.length === 0 && <p className="text-sm text-gray-400">Kurs nie ma jeszcze zadań.</p>}

      <div className="flex flex-col divide-y divide-gray-100">
        {sections.map((section) => (
          <div key={section.sectionId} className="py-5 first:pt-0 last:pb-0">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-medium text-gray-900">{section.sectionTitle}</h3>
              <span className="shrink-0 text-sm text-gray-500">
                {section.solvedTasks} z {section.totalTasks}
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar percent={ratioPercent(section.solvedTasks, section.totalTasks)} />
            </div>

            <ul className="mt-4 flex flex-col gap-3">
              {section.subsections.map((subsection) => (
                <li
                  key={subsection.subsectionId}
                  className="grid grid-cols-[1fr_6rem_3.5rem_auto] items-center gap-4 text-sm"
                >
                  <span className="truncate text-gray-700">{subsection.subsectionTitle}</span>
                  <ProgressBar percent={ratioPercent(subsection.solvedTasks, subsection.totalTasks)} />
                  <span className="text-right text-xs text-gray-500">
                    {subsection.solvedTasks}/{subsection.totalTasks}
                  </span>
                  <DifficultyMeter level={subsection.unlockedLevel as TaskDifficulty} />
                </li>
              ))}
            </ul>

            {section.finalTest && <FinalTestLine studentId={studentId} finalTest={section.finalTest} />}
          </div>
        ))}
      </div>
    </Card>
  );
}
