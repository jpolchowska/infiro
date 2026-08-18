"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField, inputClass } from "@/components/FormField";

export function NewMaterialForm({
  backHref,
  parentTitle,
  onCreate,
}: {
  backHref: string;
  parentTitle: string;
  onCreate: (payload: { title: string; contentText: string; fileName: string | null }) => void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [contentText, setContentText] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onCreate({ title, contentText, fileName });
    router.push(backHref);
  }

  return (
    <div>
      <Link href={backHref} className="text-sm text-gray-500 hover:text-infiro-navy">
        &larr; {parentTitle}
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-infiro-navy">Nowy materiał</h1>

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
        <FormField label="Treść tekstowa">
          <textarea
            rows={4}
            placeholder="np. wyjaśnienie, które uczeń powinien przeczytać przed zadaniami"
            value={contentText}
            onChange={(e) => setContentText(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="...albo dołącz PDF / obraz">
          <input
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.gif"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
            className={inputClass}
          />
        </FormField>
        <p className="text-xs text-gray-500">Wypełnij tekst albo dołącz plik — nie oba naraz.</p>
        <button
          type="submit"
          className="mt-2 self-start rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Dodaj materiał
        </button>
      </form>
    </div>
  );
}
