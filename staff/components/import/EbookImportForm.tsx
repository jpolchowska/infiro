"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import type { ImportControls } from "@/components/import/importControls";
import { UploadField } from "@/components/import/UploadField";
import { importEbook } from "@/lib/data";

export function EbookImportForm({ controls }: { controls: ImportControls }) {
  const [file, setFile] = useState<File | null>(null);
  const [importedTitle, setImportedTitle] = useState<string | null>(null);

  async function handleSubmit() {
    setImportedTitle(null);
    if (!file) {
      controls.showErrors(["Wybierz plik .zip."]);
      return;
    }

    await controls.run(async (token) => {
      const result = await importEbook(token, file);
      setImportedTitle(result.title);
    }, "Import e-booka się nie powiódł. Spróbuj ponownie.");
  }

  return (
    <ImportCard
      title="E-book (ZIP)"
      successMessage={importedTitle !== null ? `Zaimportowano e-book "${importedTitle}".` : null}
      submitLabel="Importuj e-book"
      submittingLabel="Importowanie…"
      submitting={controls.submitting}
      onSubmit={handleSubmit}
    >
      <div className="mt-4">
        <UploadField accept=".zip" hint=".zip" onFileSelected={setFile} />
      </div>
    </ImportCard>
  );
}
