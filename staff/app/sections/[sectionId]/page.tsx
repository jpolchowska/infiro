"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { useAuth } from "@/components/auth/AuthContext";
import { LoadState } from "@/components/ui/LoadState";
import { getSection } from "@/lib/data";
import { pluralize, WORDS } from "@/lib/pluralize";
import { useApiData } from "@/hooks/useApiData";

export default function SectionPage() {
  const { sectionId } = useParams<{ sectionId: string }>();
  const { role } = useAuth();
  const isTeacher = role === "teacher";
  const { state } = useApiData((token) => getSection(token, Number(sectionId)), sectionId);

  if (state.status !== "ready") return <LoadState state={state} />;

  const section = state.data;
  if (!section) notFound();

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wszystkie sekcje
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">{section.title}</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">{section.description}</p>
      <p className="mt-3 text-sm text-gray-700">
        Test końcowy:{" "}
        {section.finalTestQuestionCount > 0 ? (
          <Link href={`/sections/${section.id}/final-test`} className="font-medium text-infiro-navy hover:underline">
            {pluralize(section.finalTestQuestionCount, WORDS.question)}
          </Link>
        ) : (
          <span className="text-gray-400">brak</span>
        )}
      </p>

      <h2 className="mt-8 text-sm font-semibold text-infiro-navy">Podsekcje</h2>

      {section.subsections.length === 0 && (
        <p className="mt-4 text-sm text-gray-400">
          {isTeacher ? "Brak podsekcji." : "Brak podsekcji — zaimportuj zadania przez stronę Import."}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {section.subsections.map((sub) => (
          <Link
            key={sub.id}
            href={`/sections/${section.id}/${sub.id}`}
            className="flex min-h-41 flex-col rounded-lg border border-infiro-border bg-white p-5 hover:border-infiro-navy"
          >
            <h3 className="text-base font-semibold text-infiro-navy">{sub.title}</h3>
            <p className="mt-1 flex-1 text-sm text-gray-600">{sub.description}</p>
            <div className="mt-4 text-xs text-gray-500">{pluralize(sub.taskCount, WORDS.task)}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
