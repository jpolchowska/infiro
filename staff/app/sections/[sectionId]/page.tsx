"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { BackLink } from "@/components/ui/BackLink";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { LoadState } from "@/components/ui/LoadState";
import { DELETE_LINK, TrashIcon } from "@/components/ui/TrashIcon";
import { deleteFinalTest, getSection } from "@/lib/data";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";
import { useSubmit } from "@/hooks/useSubmit";

export default function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { role } = useAuth();
  const isTeacher = role === "teacher";
  const isAdmin = role === "admin";
  const [version, setVersion] = useState(0);
  const [confirmingFinalTest, setConfirmingFinalTest] = useState(false);
  const finalTestDeletion = useSubmit();
  const { state } = useApiData((token) => getSection(token, Number(sectionId)), `${sectionId}/${version}`);

  if (state.status !== "ready") return <LoadState state={state} />;

  const section = state.data;
  if (!section) notFound();

  const hasFinalTest = section.finalTestQuestionCount > 0;

  async function confirmFinalTestDelete() {
    await finalTestDeletion.submit(async (token) => {
      await deleteFinalTest(token, Number(sectionId));
      setConfirmingFinalTest(false);
      setVersion((current) => current + 1);
    }, "Nie udało się usunąć testu końcowego. Spróbuj ponownie.");
  }

  return (
    <div>
      <BackLink href="/">Wszystkie sekcje</BackLink>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{section.title}</h1>
      {section.description && <p className="mt-2 text-sm text-gray-600">{section.description}</p>}

      <section
        className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-sm border border-infiro-border px-6 py-5 ${
          hasFinalTest ? "bg-white" : "bg-white/60"
        }`}
      >
        <div>
          <h2 className={`text-sm font-semibold ${hasFinalTest ? "text-infiro-navy" : "text-gray-500"}`}>
            Test końcowy
          </h2>
          <p className="mt-0.5 text-sm text-gray-600">
            {hasFinalTest
              ? `${pluralize(section.finalTestQuestionCount, WORDS.question)} sprawdzających całą sekcję`
              : "Brak testu końcowego dla tej sekcji."}
          </p>
        </div>
        {hasFinalTest && (
          <div className="flex shrink-0 items-center gap-5">
            {isAdmin && (
              <button type="button" onClick={() => setConfirmingFinalTest(true)} className={DELETE_LINK}>
                <TrashIcon />
                Usuń
              </button>
            )}
            <Link
              href={`/sections/${section.id}/final-test`}
              className="rounded-sm border border-infiro-border px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy"
            >
              Podgląd &rsaquo;
            </Link>
          </div>
        )}
      </section>

      <div className="mt-10 flex items-baseline gap-3">
        <h2 className="text-sm font-semibold text-infiro-navy">Podsekcje</h2>
        <span className="text-sm text-gray-500">{pluralize(section.subsections.length, WORDS.subsection)}</span>
      </div>

      {section.subsections.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">
          {isTeacher ? "Brak podsekcji." : "Brak podsekcji — zaimportuj zadania przez stronę Import."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.subsections.map((sub, index) => (
          <Link
            key={sub.id}
            href={`/sections/${section.id}/${sub.id}`}
            className="flex min-h-41 flex-col rounded-sm border border-infiro-border bg-white p-5 hover:border-infiro-navy"
          >
            <span className="text-xs font-medium text-gray-400">{String(index + 1).padStart(2, "0")}</span>
            <h3 className="mt-1 text-base font-semibold text-infiro-navy">{sub.title}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-600">{sub.description}</p>
            <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4 text-xs text-gray-500">
              <span>{pluralize(sub.taskCount, WORDS.task)}</span>
              <span className="font-medium text-infiro-navy">Otwórz &rsaquo;</span>
            </div>
          </Link>
        ))}
      </div>

      <ConfirmDialog
        open={confirmingFinalTest}
        title="Usunąć test końcowy?"
        confirmLabel="Usuń"
        busy={finalTestDeletion.submitting}
        error={finalTestDeletion.error}
        onConfirm={confirmFinalTestDelete}
        onCancel={() => setConfirmingFinalTest(false)}
      >
        Pytania testu końcowego i odpowiedzi uczniów na nie zostaną usunięte, a uczniowie przestaną widzieć test.
        Wyniki wcześniejszych podejść zostają w historii. Test można później zaimportować ponownie.
      </ConfirmDialog>
    </div>
  );
}
