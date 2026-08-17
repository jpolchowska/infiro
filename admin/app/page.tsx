import Link from "next/link";
import { getSections, getStudents } from "@/lib/data";
import { StatTile } from "@/components/StatTile";

export default async function Home() {
  const sections = await getSections();
  const students = await getStudents();
  const totalSubsections = sections.reduce((sum, s) => sum + s.subsectionCount, 0);
  const totalTasks = sections.reduce((sum, s) => sum + s.taskCount, 0);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Witaj!</h1>
      <p className="mt-1 max-w-2xl text-sm text-gray-500">
        Zarządzaj sekcjami, materiałami i zadaniami. Zmiany są widoczne w aplikacji mobilnej po opublikowaniu.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile value={sections.length} label="Sekcje kursu" />
        <StatTile value={totalSubsections} label="Podsekcje" />
        <StatTile value={totalTasks} label="Zadania" />
        <StatTile value={students.length} label="Uczniowie z dostępem" />
      </div>

      <h2 className="mt-10 text-sm font-medium text-gray-500">
        Sekcje kursu
        <span className="ml-2 font-normal text-gray-400">
          {totalSubsections} podsekcji, {totalTasks} zadań
        </span>
      </h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section, index) => (
          <Link
            key={section.id}
            href={`/sections/${section.id}`}
            className="rounded-md border border-gray-200 bg-white p-5 hover:border-infiro-navy"
          >
            <span className="text-xs font-medium text-gray-400">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="mt-1 text-base font-semibold text-infiro-navy">
              {section.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{section.description}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>
                {section.subsectionCount} podsekcji &middot; {section.taskCount} zadań
              </span>
              <span className="font-medium text-infiro-navy">Otwórz</span>
            </div>
          </Link>
        ))}
        <Link
          href="/sections/new"
          className="flex min-h-33 flex-col items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 p-5 text-gray-500 hover:border-infiro-navy hover:text-infiro-navy"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-medium">Dodaj sekcję</span>
        </Link>
      </div>
    </div>
  );
}
