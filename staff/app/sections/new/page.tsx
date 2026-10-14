"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/ui/FormField";
import { ErrorMessage } from "@/components/ui/ErrorMessage";
import { createSection } from "@/lib/data";
import { SAVE_ERROR, useSubmit } from "@/hooks/useSubmit";

export default function NewSectionPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { submitting, error, submit } = useSubmit();

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    await submit(async (token) => {
      await createSection(token, { title, description });
      router.push("/");
    }, SAVE_ERROR);
  }

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; Panel główny
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Nowa sekcja</h1>

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
          {submitting ? "Tworzenie…" : "Utwórz sekcję"}
        </button>
      </form>
    </div>
  );
}
