"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import type { ImportControls } from "@/components/import/importControls";
import { UploadField } from "@/components/import/UploadField";
import { uploadImagesZip } from "@/lib/data";

export function ImagesImportForm({ controls }: { controls: ImportControls }) {
  const [file, setFile] = useState<File | null>(null);
  const [fileCount, setFileCount] = useState<number | null>(null);

  async function handleSubmit() {
    setFileCount(null);
    if (!file) {
      controls.showErrors(["Wybierz plik .zip."]);
      return;
    }

    await controls.run(async (token) => {
      const result = await uploadImagesZip(token, file);
      setFileCount(result.file_count);
    }, "Nie udało się rozpakować zdjęć. Spróbuj ponownie.");
  }

  return (
    <ImportCard
      title="Zdjęcia (ZIP)"
      description="Rozpakowywane do static/uploads i dowiązywane do zadań po nazwie pliku."
      successMessage={fileCount !== null ? `Rozpakowano ${fileCount} zdjęć.` : null}
      submitLabel="Rozpakuj i zaimportuj"
      submittingLabel="Rozpakowywanie…"
      submitting={controls.submitting}
      onSubmit={handleSubmit}
    >
      <div className="mt-4">
        <UploadField accept=".zip" hint=".zip" onFileSelected={setFile} />
      </div>
    </ImportCard>
  );
}
