"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getSection, getSubsection, deleteMaterial, deleteSubsection, deleteTask } from "@/lib/data";
import { Badge } from "@/components/Badge";
import { difficultyLabel } from "@/lib/difficulty";
import type { Section, SubsectionDetail } from "@/lib/types";

export default function SubsectionPage() {
  const { id, subsectionId } = useParams<{ id: string; subsectionId: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const [section, setSection] = useState<Section | null | undefined>(null);
  const [subsection, setSubsection] = useState<SubsectionDetail | null | undefined>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const [sectionData, subsectionData] = await Promise.all([
        getSection(token ?? "", Number(id)),
        getSubsection(token ?? "", Number(subsectionId)),
      ]);
      if (active) {
        setSection(sectionData ?? undefined);
        setSubsection(subsectionData ?? undefined);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, subsectionId]);

  async function handleDeleteTask(taskId: number) {
    if (!confirm("Usunąć to zadanie?")) return;
    const token = await getToken();
    await deleteTask(token ?? "", taskId);
    setSubsection((prev) =>
      prev ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev
    );
  }

  async function handleDeleteMaterial(materialId: number) {
    if (!confirm("Usunąć ten materiał?")) return;
    const token = await getToken();
    await deleteMaterial(token ?? "", materialId);
    setSubsection((prev) =>
      prev ? { ...prev, materials: prev.materials.filter((m) => m.id !== materialId) } : prev
    );
  }

  async function handleDeleteSubsection() {
    if (!confirm("Usunąć tę podsekcję razem z jej zadaniami?")) return;
    const token = await getToken();
    await deleteSubsection(token ?? "", Number(subsectionId));
    router.push(`/sections/${id}`);
  }

  if (section === null || subsection === null) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }
  if (!section || !subsection || subsection.sectionId !== section.id) notFound();

  return (
    <div>
      <Link href={`/sections/${section.id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {section.title}
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-infiro-navy">{subsection.title}</h1>
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
      </div>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{subsection.description}</p>

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Materiały teoretyczne</h2>
      {subsection.materials.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">Brak materiałów — dodaj pierwszy.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {subsection.materials.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between rounded-sm border border-gray-200 bg-white px-4 py-2 text-sm"
            >
              <span className="text-gray-700">
                {m.title}{" "}
                <span className="text-xs text-gray-400">
                  ({m.type === "text" ? "tekst" : m.type})
                </span>
              </span>
              <span className="flex gap-3">
                <Link
                  href={`/sections/${section.id}/${subsection.id}/materials/${m.id}/edit`}
                  className="text-xs font-medium text-infiro-navy hover:underline"
                >
                  Edytuj
                </Link>
                <button
                  onClick={() => handleDeleteMaterial(m.id)}
                  className="text-xs font-medium text-red-600 hover:underline"
                >
                  Usuń
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
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
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {subsection.tasks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  Brak zadań — dodaj pierwsze poniżej.
                </td>
              </tr>
            )}
            {subsection.tasks.map((task) => {
              const diff = difficultyLabel(task.difficulty);
              const correctOption = task.options.find((o) => o.isCorrect);
              return (
                <tr key={task.id} className="border-b border-gray-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={diff.variant}>{diff.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{correctOption?.optionText ?? "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="flex justify-end gap-3">
                      <Link
                        href={`/sections/${section.id}/${subsection.id}/tasks/${task.id}/edit`}
                        className="text-xs font-medium text-infiro-navy hover:underline"
                      >
                        Edytuj
                      </Link>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Usuń
                      </button>
                    </span>
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
