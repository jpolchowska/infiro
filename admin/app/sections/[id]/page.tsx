import Link from "next/link";
import { notFound } from "next/navigation";
import { getSection, getSubsections } from "@/lib/data";

export default async function SectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const section = await getSection(Number(id));
  if (!section) notFound();

  const subsections = await getSubsections(section.id);

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wszystkie sekcje
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{section.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{section.description}</p>

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Materiały teoretyczne</h2>
      <p className="mt-2 text-sm text-gray-400">Brak materiałów — dodaj pierwszy.</p>
      <Link
        href={`/sections/${section.id}/new-material`}
        className="mt-3 inline-block rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy"
      >
        Dodaj materiał
      </Link>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Podsekcje</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subsections.map((sub) => (
          <Link
            key={sub.id}
            href={`/sections/${section.id}/${sub.id}`}
            className="rounded-sm border border-gray-200 bg-white p-5 hover:border-infiro-navy"
          >
            <h3 className="text-base font-semibold text-infiro-navy">{sub.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{sub.description}</p>
            <div className="mt-4 text-xs text-gray-500">{sub.taskCount} zadań</div>
          </Link>
        ))}
        <Link
          href={`/sections/${section.id}/new-subsection`}
          className="flex flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-gray-300 p-5 text-gray-500 hover:border-infiro-navy hover:text-infiro-navy"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-medium">Dodaj podsekcję</span>
        </Link>
      </div>
    </div>
  );
}
