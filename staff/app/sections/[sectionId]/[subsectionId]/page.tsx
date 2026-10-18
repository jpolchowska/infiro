"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { LoadState } from "@/components/ui/LoadState";
import { getSection, getSubsection } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { COLUMN_HEADER, TABLE_ROW, TableCard } from "@/components/ui/TableCard";
import { difficultyLabel, taskTypeLabel } from "@/lib/labels";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { BackLink } from "@/components/ui/BackLink";

export default function SubsectionPage() {
  const { sectionId, subsectionId } = useParams<{ sectionId: string; subsectionId: string }>();
  const { state } = useApiData(async (token) => {
    const [section, subsection] = await Promise.all([
      getSection(token, Number(sectionId)),
      getSubsection(token, Number(subsectionId)),
    ]);
    return { section, subsection };
  }, `${sectionId}/${subsectionId}`);

  if (state.status !== "ready") return <LoadState state={state} />;

  const { section, subsection } = state.data;
  if (!section || !subsection || subsection.sectionId !== section.id) notFound();

  const basePath = `/sections/${section.id}/${subsection.id}`;

  return (
    <div>
      <BackLink href={`/sections/${section.id}`}>{section.title}</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{subsection.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{subsection.description}</p>

      <section className="mt-8 rounded-sm border border-infiro-border bg-white">
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <h2 className="text-sm font-semibold text-infiro-navy">E-book</h2>
            <p className="mt-0.5 text-sm text-gray-600">{subsection.ebook ? subsection.ebook.title : "Brak e-booka."}</p>
          </div>
          {subsection.ebook && (
            <Link href={`${basePath}/ebook`} className="shrink-0 text-sm font-medium text-infiro-navy hover:underline">
              Podgląd &rsaquo;
            </Link>
          )}
        </div>
      </section>

      <div className="mt-6">
        <TableCard title="Zadania" count={pluralize(subsection.tasks.length, WORDS.task)}>
          <thead className="bg-background/50">
            <tr className="border-b border-gray-100 text-left">
              <th className={COLUMN_HEADER}>Zadanie</th>
              <th className={COLUMN_HEADER}>Treść</th>
              <th className={COLUMN_HEADER}>Typ</th>
              <th className={COLUMN_HEADER}>Poziom</th>
              <th className={COLUMN_HEADER} />
            </tr>
          </thead>
          <tbody>
            {subsection.tasks.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                  Brak zadań w tej podsekcji.
                </td>
              </tr>
            )}
            {subsection.tasks.map((task, index) => {
              const difficulty = difficultyLabel(task.difficulty);
              return (
                <tr key={task.id} className={TABLE_ROW}>
                  <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">Zadanie {index + 1}</td>
                  <td className="max-w-md px-6 py-4 text-gray-600">
                    <span className="line-clamp-2">{task.prompt}</span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-gray-600">{taskTypeLabel(task.type)}</td>
                  <td className="px-6 py-4">
                    <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Link href={`${basePath}/tasks/${task.id}`} className="font-medium text-infiro-navy hover:underline">
                      Podgląd &rsaquo;
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </TableCard>
      </div>
    </div>
  );
}
