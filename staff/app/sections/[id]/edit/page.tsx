"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { notFound, useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { FormField, inputClass } from "@/components/FormField";
import { LoadState } from "@/components/LoadState";
import { getSection, updateSection } from "@/lib/data";
import type { Section } from "@/lib/types";
import { useApiData } from "@/lib/useApiData";

export default function EditSectionPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useApiData((token) => getSection(token, Number(id)), id);

  if (state.status !== "ready") return <LoadState state={state} />;
  if (!state.data) notFound();

  return <EditSectionForm section={state.data} />;
}

function EditSectionForm({ section }: { section: Section }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [title, setTitle] = useState(section.title);
  const [description, setDescription] = useState(section.description ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSubmitting(true);
    const token = await getToken();
    await updateSection(token ?? "", section.id, { title, description });
    router.push(`/sections/${section.id}`);
  }

  return (
    <div>
      <Link href={`/sections/${section.id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wróć do sekcji
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Edytuj sekcję</h1>

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
