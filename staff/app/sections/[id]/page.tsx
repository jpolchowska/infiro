"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { getSection, deleteSection, deleteSubsection } from "@/lib/data";
import type { SectionDetail } from "@/lib/types";

export default function SectionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getToken, keycloak } = useAuth();
  const isTeacher = Boolean(keycloak?.hasRealmRole("ROLE_TEACHER"));
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
        {!isTeacher && (
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
        )}
      </div>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{section.description}</p>

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Podsekcje</h2>

      {section.subsections.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">
          {isTeacher ? "Brak podsekcji." : "Brak podsekcji — dodaj pierwszą."}
        </p>
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
            {!isTeacher && (
              <>
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
              </>
            )}
          </div>
        ))}
        {!isTeacher && (
          <Link
            href={`/sections/${section.id}/new-subsection`}
            className="flex min-h-41 flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-gray-300 p-5 text-gray-500 hover:border-infiro-navy hover:text-infiro-navy"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-sm font-medium">Dodaj podsekcję</span>
          </Link>
        )}
      </div>
    </div>
  );
}
