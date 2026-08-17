import Link from "next/link";
import { notFound } from "next/navigation";
import { getSection, getSubsection, getTasks } from "@/lib/data";
import { Badge } from "@/components/Badge";
import { difficultyLabel } from "@/lib/difficulty";

export default async function SubsectionPage({
  params,
}: {
  params: Promise<{ id: string; subsectionId: string }>;
}) {
  const { id, subsectionId } = await params;
  const section = await getSection(Number(id));
  const subsection = await getSubsection(Number(subsectionId));
  if (!section || !subsection || subsection.sectionId !== section.id) notFound();

  const tasks = await getTasks(subsection.id);

  return (
    <div>
      <Link href={`/sections/${section.id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {section.title}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{subsection.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{subsection.description}</p>

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Materiały teoretyczne</h2>
      <p className="mt-2 text-sm text-gray-400">Brak materiałów — dodaj pierwszy.</p>
      <Link
        href={`/sections/${section.id}/${subsection.id}/new-material`}
        className="mt-3 inline-block rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy"
      >
        Dodaj materiał
      </Link>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Zadania</h2>

      <div className="mt-4 overflow-x-auto rounded-sm border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">Tytuł</th>
              <th className="px-4 py-3 font-medium">Poziom</th>
              <th className="px-4 py-3 font-medium">Poprawna odpowiedź</th>
              <th className="px-4 py-3 font-medium">Warianty</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Brak zadań — dodaj pierwsze poniżej.
                </td>
              </tr>
            )}
            {tasks.map((task) => {
              const diff = difficultyLabel(task.difficulty);
              return (
                <tr key={task.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={diff.variant}>{diff.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{task.correctAnswer}</td>
                  <td className="px-4 py-3">
                    {task.variantCount > 1 ? (
                      <Badge variant="neutral">{task.variantCount} warianty</Badge>
                    ) : (
                      <span className="text-gray-400">tylko domyślny</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/sections/${section.id}/${subsection.id}/new-task`}
          className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Dodaj zadanie
        </Link>
        <Link
          href="/import"
          className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy"
        >
          Importuj zadania (JSON)
        </Link>
      </div>
    </div>
  );
}
