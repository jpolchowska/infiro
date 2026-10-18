"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadState } from "@/components/ui/LoadState";
import { StatTile } from "@/components/ui/StatTile";
import { getSections, getStudents } from "@/lib/data";
import { pluralForm, pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";

export default function Home() {
  const { role } = useAuth();
  const isTeacher = role === "teacher";
  const { state } = useApiData(async (token) => {
    const [sections, students] = await Promise.all([getSections(token), getStudents(token)]);
    return { sections, studentCount: students.length };
  });

  if (state.status !== "ready") return <LoadState state={state} />;

  const { sections, studentCount } = state.data;
  const totalSubsections = sections.reduce((sum, s) => sum + s.subsectionCount, 0);
  const totalTasks = sections.reduce((sum, s) => sum + s.taskCount, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Witaj!</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        {isTeacher
          ? "Przeglądaj treść kursu: sekcje, podsekcje i zadania."
          : "Przeglądaj treść kursu: sekcje, podsekcje i zadania. Nową treść dodasz przez import JSON."}
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={sections.length} label={pluralForm(sections.length, ["Sekcja kursu", "Sekcje kursu", "Sekcji kursu"])} />
        <StatTile value={totalSubsections} label={pluralForm(totalSubsections, WORDS.subsection)} />
        <StatTile value={totalTasks} label={pluralForm(totalTasks, WORDS.task)} />
        <StatTile
          value={studentCount}
          label={pluralForm(studentCount, [
            "Uczeń z dostępem",
            "Uczniowie z dostępem",
            "Uczniów z dostępem",
            "Uczniów z dostępem",
          ])}
        />
      </div>

      <div className="mt-10 flex items-baseline justify-between">
        <h2 className="text-xl font-semibold text-infiro-navy">Sekcje kursu</h2>
        <span className="flex items-center gap-3 text-sm text-gray-500">
          <span>{pluralize(totalSubsections, WORDS.subsection)}</span>
          <span className="text-gray-300">|</span>
          <span>{pluralize(totalTasks, WORDS.task)}</span>
        </span>
      </div>

      {sections.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">
          {isTeacher ? "Brak sekcji." : "Brak sekcji — zaimportuj zadania przez stronę Import."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <Link
            key={section.id}
            href={`/sections/${section.id}`}
            className="flex min-h-41 flex-col rounded-sm border border-infiro-border bg-white p-5 hover:border-infiro-navy"
          >
            <span className="text-xs font-medium text-gray-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 text-base font-semibold text-infiro-navy">
              {section.title}
            </h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-600">{section.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span>
                {pluralize(section.subsectionCount, WORDS.subsection)} &middot; {pluralize(section.taskCount, WORDS.task)}
              </span>
              <span className="font-medium text-infiro-navy">Otwórz &rarr;</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
