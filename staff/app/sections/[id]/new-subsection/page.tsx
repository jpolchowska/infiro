"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/FormField";
import { useAuth } from "@/components/AuthContext";
import { createSubsection } from "@/lib/data";

export default function NewSubsectionPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSubmitting(true);
    const token = await getToken();
    await createSubsection(token ?? "", Number(id), { title, description });
    router.push(`/sections/${id}`);
  }

  return (
    <div>
      <Link href={`/sections/${id}`} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Wróć do sekcji
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Nowa podsekcja</h1>

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
          {submitting ? "Tworzenie…" : "Utwórz podsekcję"}
        </button>
      </form>
    </div>
  );
}
