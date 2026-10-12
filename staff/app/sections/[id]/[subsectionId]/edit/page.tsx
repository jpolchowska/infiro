"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { ErrorMessage } from "@/components/ErrorMessage";
import { FormField, inputClass } from "@/components/FormField";
import { LoadState } from "@/components/LoadState";
import { getSubsection, updateSubsection } from "@/lib/data";
import type { Subsection } from "@/lib/types";
import { useApiData } from "@/lib/useApiData";
import { SAVE_ERROR, useSubmit } from "@/lib/useSubmit";

export default function EditSubsectionPage() {
  const { id, subsectionId } = useParams<{ id: string; subsectionId: string }>();
  const { state } = useApiData((token) => getSubsection(token, Number(subsectionId)), subsectionId);

  if (state.status !== "ready") return <LoadState state={state} />;
  if (!state.data) notFound();

  return <EditSubsectionForm subsection={state.data} backHref={`/sections/${id}/${subsectionId}`} />;
}

function EditSubsectionForm({ subsection, backHref }: { subsection: Subsection; backHref: string }) {
  const router = useRouter();
  const [title, setTitle] = useState(subsection.title);
  const [description, setDescription] = useState(subsection.description ?? "");
  const { submitting, error, submit } = useSubmit();

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    await submit(async (token) => {
      await updateSubsection(token, subsection.id, { title, description });
      router.push(backHref);
    }, SAVE_ERROR);
  }

  return (
    <div>
      <Link href={backHref} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wróć do podsekcji
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Edytuj podsekcję</h1>

      <form onSubmit={handleSubmit} className="mt-6 flex max-w-lg flex-col gap-4">
        <FormField label="Tytuł">
          <input
            type="text"
            required
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Opis">
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputClass}
          />
        </FormField>
        {error && <ErrorMessage message={error} />}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 self-start rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </form>
    </div>
  );
}
