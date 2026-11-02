"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import type { ImportControls } from "@/lib/importControls";
import { UploadField } from "@/components/import/UploadField";
import { ApiError } from "@/lib/api";
import { importEbook } from "@/lib/data";
import { pluralize } from "@/lib/pluralize";
import { ResultDialog } from "@/components/ui/ResultDialog";

const EBOOK_WORDS = ["e-book", "e-booki", "e-booków"] as const;

type EbookImportResult = {
  imported: { fileName: string; title: string }[];
  failed: { fileName: string; error: string }[];
};

export function EbookImportForm({ controls }: { controls: ImportControls }) {
  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<EbookImportResult | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  async function handleSubmit() {
    setResult(null);
    if (files.length === 0) return;

    await controls.run(async (token) => {
      const outcome: EbookImportResult = { imported: [], failed: [] };
      for (const file of files) {
        try {
          const imported = await importEbook(token, file);
          outcome.imported.push({ fileName: file.name, title: imported.title });
        } catch (error) {
          outcome.failed.push({
            fileName: file.name,
            error: error instanceof ApiError ? error.message : "Import się nie powiódł.",
          });
        }
      }
      setResult(outcome);
      setFiles([]);
      setUploadKey((current) => current + 1);
    }, "Import e-booka się nie powiódł. Spróbuj ponownie.");
  }

  return (
    <>
      <ImportCard
        title="E-book"
        format="ZIP"
        description="Jeden e-book dla jednej podsekcji: plik ebook.json i folder images. Ponowny import zastępuje poprzedni. Można wgrać kilka plików naraz."
        submitLabel={files.length > 1 ? `Importuj ${pluralize(files.length, EBOOK_WORDS)}` : "Importuj e-book"}
        submittingLabel="Importowanie…"
        submitting={controls.submitting}
        ready={files.length > 0}
        onSubmit={handleSubmit}
      >
        <div className="mt-4">
          <UploadField key={uploadKey} accept=".zip" hint=".zip" multiple onFilesSelected={setFiles} />
        </div>
      </ImportCard>

      <ResultDialog
        open={result !== null}
        title={result && result.failed.length > 0 ? "Import zakończony z błędami" : "Import zakończony"}
        onClose={() => setResult(null)}
      >
        {result && (
          <div className="flex flex-col gap-4">
            {result.imported.length > 0 && (
              <div>
                <p>Zaimportowano {pluralize(result.imported.length, EBOOK_WORDS)}:</p>
                <ul className="mt-2 flex flex-col gap-1">
                  {result.imported.map((item) => (
                    <li key={item.fileName} className="text-gray-900">
                      „{item.title}”
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.failed.length > 0 && (
              <div>
                <p className="font-medium text-tone-bad">Nie udało się:</p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {result.failed.map((item) => (
                    <li key={item.fileName}>
                      <span className="font-medium text-gray-900">{item.fileName}</span>
                      <span className="text-gray-600">: {item.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </ResultDialog>
    </>
  );
}
