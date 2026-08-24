"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getSection, deleteMaterial, deleteSection, deleteSubsection } from "@/lib/data";
import type { SectionDetail } from "@/lib/types";

export default function SectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const [section, setSection] = useState<SectionDetail | null | undefined>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const token = await getToken();
      const data = await getSection(token ?? "", Number(id));
      if (active) setSection(data ?? undefined);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDeleteSubsection(subId: number) {
    if (!confirm("Usunąć tę podsekcję razem z jej zadaniami?")) return;
    const token = await getToken();
    await deleteSubsection(token ?? "", subId);
    setSection((prev) =>
      prev ? { ...prev, subsections: prev.subsections.filter((s) => s.id !== subId) } : prev
    );
  }

  async function handleDeleteMaterial(materialId: number) {
    if (!confirm("Usunąć ten materiał?")) return;
    const token = await getToken();
    await deleteMaterial(token ?? "", materialId);
    setSection((prev) =>
      prev ? { ...prev, materials: prev.materials.filter((m) => m.id !== materialId) } : prev
    );
  }

  async function handleDeleteSection() {
    if (!confirm("Usunąć tę sekcję razem z podsekcjami, zadaniami i materiałami?")) return;
    const token = await getToken();
    await deleteSection(token ?? "", Number(id));
    router.push("/");
  }

  if (section === null) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-infiro-navy/20 border-t-infiro-navy" />
      </div>
    );
  }
  if (section === undefined) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wszystkie sekcje
      </Link>
      <div className="mt-3 flex items-start justify-between gap-4">
        <h1 className="text-2xl font-semibold text-infiro-navy">{section.title}</h1>
        <div className="flex shrink-0 gap-4 text-sm">
          <Link
            href={`/sections/${section.id}/edit`}
            className="font-medium text-infiro-navy hover:underline"
          >
            Edytuj
          </Link>
          <button
            onClick={handleDeleteSection}
            className="font-medium text-red-600 hover:underline"
          >
            Usuń sekcję
          </button>
        </div>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{section.description}</p>

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Materiały teoretyczne</h2>
      {section.materials.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">Brak materiałów — dodaj pierwszy.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {section.materials.map((m) => (
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
                  href={`/sections/${section.id}/materials/${m.id}/edit`}
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
        href={`/sections/${section.id}/new-material`}
        className="mt-3 inline-block rounded-sm border border-gray-300 px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy"
      >
        Dodaj materiał
      </Link>

      <h2 className="mt-10 text-sm font-semibold text-infiro-navy">Podsekcje</h2>

      {section.subsections.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">Brak podsekcji — dodaj pierwszą.</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.subsections.map((sub) => (
          <div
            key={sub.id}
            className="flex min-h-41 flex-col rounded-sm border border-gray-200 bg-white p-5 hover:border-infiro-navy"
          >
            <Link href={`/sections/${section.id}/${sub.id}`} className="flex-1">
              <h3 className="text-base font-semibold text-infiro-navy">{sub.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{sub.description}</p>
              <div className="mt-4 text-xs text-gray-500">{sub.taskCount} zadań</div>
            </Link>
            <Link
              href={`/sections/${section.id}/${sub.id}/edit`}
              className="mt-3 self-start text-xs font-medium text-infiro-navy hover:underline"
            >
              Edytuj podsekcję
            </Link>
            <button
              onClick={() => handleDeleteSubsection(sub.id)}
              className="mt-1 self-start text-xs font-medium text-red-600 hover:underline"
            >
              Usuń podsekcję
            </button>
          </div>
        ))}
        <Link
          href={`/sections/${section.id}/new-subsection`}
          className="flex min-h-41 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-gray-300 p-5 text-gray-500 hover:border-infiro-navy hover:text-infiro-navy"
        >
          <span className="text-2xl leading-none">+</span>
          <span className="text-sm font-medium">Dodaj podsekcję</span>
        </Link>
      </div>
    </div>
  );
}
