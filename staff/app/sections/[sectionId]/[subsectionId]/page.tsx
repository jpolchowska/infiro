"use client";

import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { LoadState } from "@/components/ui/LoadState";
import { getSection, getSubsection, deleteSubsection, deleteTask } from "@/lib/data";
import { Badge } from "@/components/ui/Badge";
import { difficultyLabel, taskTypeLabel } from "@/lib/labels";
import { formatPercent } from "@/lib/format";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { DELETE_ERROR, useSubmit } from "@/hooks/useSubmit";

export default function SubsectionPage() {
  const { sectionId, subsectionId } = useParams<{ sectionId: string; subsectionId: string }>();
  const router = useRouter();
  const { role } = useAuth();
  const { error, submit } = useSubmit();
  const isTeacher = role === "teacher";
  const { state, updateData } = useApiData(async (token) => {
    const [section, subsection] = await Promise.all([
      getSection(token, Number(sectionId)),
      getSubsection(token, Number(subsectionId)),
    ]);
    return { section, subsection };
  }, `${sectionId}/${subsectionId}`);

  async function handleDeleteTask(taskId: number) {
    if (!confirm("Usunąć to zadanie?")) return;
    await submit(async (token) => {
      await deleteTask(token, taskId);
      updateData((current) => ({
        ...current,
        subsection: current.subsection && {
          ...current.subsection,
          tasks: current.subsection.tasks.filter((t) => t.id !== taskId),
        },
      }));
    }, DELETE_ERROR);
  }

  async function handleDeleteSubsection() {
    if (!confirm("Usunąć tę podsekcję razem z jej zadaniami?")) return;
    await submit(async (token) => {
      await deleteSubsection(token, Number(subsectionId));
      router.push(`/sections/${sectionId}`);
    }, DELETE_ERROR);
  }

  if (state.status !== "ready") return <LoadState state={state} />;

  const { section, subsection } = state.data;
  if (!section || !subsection || subsection.sectionId !== section.id) notFound();

  return (
    <div>
      <Link href={`/sections/${section.id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {section.title}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-infiro-navy">{subsection.title}</h1>
        {!isTeacher && (
          <div className="flex shrink-0 gap-4 text-sm">
            <Link
              href={`/sections/${section.id}/${subsection.id}/edit`}
              className="font-medium text-infiro-navy hover:underline"
            >
              Edytuj
            </Link>
            <button
              onClick={handleDeleteSubsection}
              className="font-medium text-red-600 hover:underline"
            >
              Usuń podsekcję
            </button>
          </div>
        )}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{subsection.description}</p>
      {error && (
        <div className="mt-4 max-w-2xl">
          <ErrorMessage message={error} />
        </div>
      )}

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Teoria</h2>
      {subsection.ebook ? (
        <p className="mt-2 text-sm text-gray-700">
          E-book: <span className="font-medium">{subsection.ebook.title}</span>{" "}
          <Link
            href={`/sections/${section.id}/${subsection.id}/ebook`}
            className="ml-2 text-xs font-medium text-infiro-navy hover:underline"
          >
            Podgląd
          </Link>
        </p>
      ) : (
        <p className="mt-2 text-sm text-gray-400">
          {isTeacher ? "Brak teorii." : "Brak teorii — zaimportuj przez stronę Import."}
        </p>
      )}

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Zadania</h2>

      <div className="mt-4 overflow-x-auto rounded-sm border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wide text-gray-500">
              <th className="px-4 py-3 font-medium">#</th>
              <th className="px-4 py-3 font-medium">Treść</th>
              <th className="px-4 py-3 font-medium">Typ</th>
              <th className="px-4 py-3 font-medium">Poziom</th>
              <th className="px-4 py-3 font-medium">Celność</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {subsection.tasks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-gray-400">
                  {isTeacher ? "Brak zadań." : "Brak zadań — zaimportuj je przez stronę Import."}
                </td>
              </tr>
            )}
            {subsection.tasks.map((task, index) => {
              const difficulty = difficultyLabel(task.difficulty);
              return (
                <tr key={task.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 text-gray-400">{index + 1}</td>
                  <td className="max-w-md px-4 py-3 text-gray-900">
                    <span className="line-clamp-2">{task.prompt}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{taskTypeLabel(task.type)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={difficulty.variant}>{difficulty.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {formatPercent(task.stats.accuracy)}
                    <span className="ml-1 text-xs text-gray-400">({pluralize(task.stats.attempts, WORDS.attempt)})</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex justify-end gap-3">
                      <Link
                        href={`/sections/${section.id}/${subsection.id}/tasks/${task.id}`}
                        className="text-xs font-medium text-infiro-navy hover:underline"
                      >
                        Podgląd
                      </Link>
                      {!isTeacher && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Usuń
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {!isTeacher && (
        <div className="mt-4">
          <Link
            href="/import"
            className="rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy"
          >
            Importuj zadania (JSON)
          </Link>
        </div>
      )}
    </div>
  );
}
