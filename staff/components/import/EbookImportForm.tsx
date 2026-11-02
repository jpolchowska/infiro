"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import type { ImportControls } from "@/lib/importControls";
import { UploadField } from "@/components/import/UploadField";
import { importEbook } from "@/lib/data";
import { ResultDialog } from "@/components/ui/ResultDialog";

export function EbookImportForm({ controls }: { controls: ImportControls }) {
  const [file, setFile] = useState<File | null>(null);
  const [importedTitle, setImportedTitle] = useState<string | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  async function handleSubmit() {
    setImportedTitle(null);
    if (!file) {
      controls.showErrors(["Wybierz plik .zip."]);
      return;
    }

    await controls.run(async (token) => {
      const result = await importEbook(token, file);
      setImportedTitle(result.title);
      setFile(null);
      setUploadKey((current) => current + 1);
    }, "Import e-booka się nie powiódł. Spróbuj ponownie.");
  }

  return (
    <>
      <ImportCard
        title="E-book"
        format="ZIP"
        description="Jeden e-book dla jednej podsekcji: plik ebook.json i folder images. Ponowny import zastępuje poprzedni e-book."
        submitLabel="Importuj e-book"
        submittingLabel="Importowanie…"
        submitting={controls.submitting}
        onSubmit={handleSubmit}
      >
        <div className="mt-4">
          <UploadField key={uploadKey} accept=".zip" hint=".zip" onFileSelected={setFile} />
        </div>
      </ImportCard>

      <ResultDialog open={importedTitle !== null} title="Import zakończony" onClose={() => setImportedTitle(null)}>
        E-book „{importedTitle}” został zaimportowany.
      </ResultDialog>
    </>
  );
}
