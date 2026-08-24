"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/FormField";
import type { Material } from "@/lib/types";

export function EditMaterialForm({
  material,
  backHref,
  parentTitle,
  onSave,
}: {
  material: Material;
  backHref: string;
  parentTitle: string;
  onSave: (payload: { title: string; contentText?: string }) => Promise<void>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(material.title);
  const [contentText, setContentText] = useState(material.contentText ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSave({
      title,
      contentText: material.type === "text" ? contentText : undefined,
    });
    router.push(backHref);
  }

  return (
    <div>
      <Link href={backHref} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {parentTitle}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Edytuj materiał</h1>

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
        {material.type === "text" ? (
          <FormField label="Treść tekstowa">
            <textarea
              rows={4}
              required
              value={contentText}
              onChange={(e) => setContentText(e.target.value)}
              className={inputClass}
            />
          </FormField>
        ) : (
          <p className="text-xs text-gray-500">
            Ten materiał to załączony plik ({material.type}) — treści pliku nie da się edytować.
            Usuń materiał i dodaj nowy, żeby podmienić plik.
          </p>
        )}
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
