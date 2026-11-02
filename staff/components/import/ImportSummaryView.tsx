import { pluralize, WORDS } from "@/lib/pluralize";
import type { FinalTestImportSummary, TaskImportSummary } from "@/lib/types";

const ANSWER_WORDS = ["odpowiedź ucznia", "odpowiedzi uczniów", "odpowiedzi uczniów"] as const;
const SECTION_WORDS = ["sekcja", "sekcje", "sekcji"] as const;

export function hasDeletions(summary: TaskImportSummary): boolean {
  return summary.deletedTasks.length + summary.deletedSubsections.length + summary.deletedSections.length > 0;
}

export function deletedTaskCount(summary: TaskImportSummary): number {
  return (
    summary.deletedTasks.length +
    summary.deletedSubsections.reduce((sum, subsection) => sum + subsection.taskCount, 0) +
    summary.deletedSections.reduce((sum, section) => sum + section.taskCount, 0)
  );
}

function Count({ label, value, tone }: { label: string; value: number; tone?: "bad" }) {
  return (
    <div className="flex-1 rounded-sm bg-background/60 px-4 py-3">
      <p className={`text-xl font-semibold ${tone === "bad" && value > 0 ? "text-tone-bad" : "text-infiro-navy"}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">{label}</p>
    </div>
  );
}

function details(parts: (string | false)[]): string {
  return parts.filter(Boolean).join(" · ");
}

export function TaskImportSummaryView({ summary }: { summary: TaskImportSummary }) {
  const structureChanges = [
    summary.createdSections > 0 && `nowe: ${pluralize(summary.createdSections, SECTION_WORDS)}`,
    summary.createdSubsections > 0 && `nowe: ${pluralize(summary.createdSubsections, WORDS.subsection)}`,
  ].filter(Boolean);

  return (
    <div>
      <div className="flex gap-3">
        <Count label="Dodane zadania" value={summary.createdTasks} />
        <Count label="Zaktualizowane" value={summary.updatedTasks} />
        <Count label="Usunięte zadania" value={deletedTaskCount(summary)} tone="bad" />
      </div>
      {structureChanges.length > 0 && <p className="mt-3 text-sm text-gray-500">{structureChanges.join(" · ")}</p>}

      {hasDeletions(summary) && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">Usunięte z kursu</p>
          <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-sm border border-infiro-border text-sm">
            {summary.deletedSections.map((section) => (
              <li key={`section-${section.id}`} className="px-4 py-2.5">
                <p className="font-medium text-gray-900">Sekcja „{section.title}”</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {details([
                    pluralize(section.subsectionCount, WORDS.subsection),
                    pluralize(section.taskCount, WORDS.task),
                    section.answerCount > 0 && pluralize(section.answerCount, ANSWER_WORDS),
                    section.hasFinalTest && "test końcowy",
                  ])}
                </p>
              </li>
            ))}
            {summary.deletedSubsections.map((subsection) => (
              <li key={`subsection-${subsection.id}`} className="px-4 py-2.5">
                <p className="font-medium text-gray-900">Podsekcja „{subsection.title}”</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {details([
                    subsection.sectionTitle,
                    pluralize(subsection.taskCount, WORDS.task),
                    subsection.answerCount > 0 && pluralize(subsection.answerCount, ANSWER_WORDS),
                    subsection.hasEbook && "e-book",
                  ])}
                </p>
              </li>
            ))}
            {summary.deletedTasks.map((task) => (
              <li key={`task-${task.id}`} className="px-4 py-2.5">
                <p className="line-clamp-1 text-gray-900">{task.prompt}</p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {details([
                    `${task.sectionTitle} / ${task.subsectionTitle}`,
                    task.answerCount > 0 && pluralize(task.answerCount, ANSWER_WORDS),
                  ])}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function FinalTestImportSummaryView({ summary }: { summary: FinalTestImportSummary }) {
  return (
    <div>
      <div className="flex gap-3">
        <Count label="Dodane pytania" value={summary.createdQuestions} />
        <Count label="Zaktualizowane" value={summary.updatedQuestions} />
        <Count label="Usunięte pytania" value={summary.deletedQuestions.length} tone="bad" />
      </div>

      {summary.deletedQuestions.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-500">Usunięte z testu</p>
          <ul className="mt-2 max-h-64 divide-y divide-gray-100 overflow-y-auto rounded-sm border border-infiro-border text-sm">
            {summary.deletedQuestions.map((question) => (
              <li key={question.id} className="px-4 py-2.5">
                <p className="line-clamp-1 text-gray-900">{question.prompt}</p>
                {question.answerCount > 0 && (
                  <p className="mt-0.5 text-xs text-gray-500">{pluralize(question.answerCount, ANSWER_WORDS)}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
