"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import { FinalTestImportSummaryView } from "@/components/import/ImportSummaryView";
import { readValidatedJson, type ImportControls } from "@/lib/importControls";
import { UploadField } from "@/components/import/UploadField";
import { getSections, importFinalTest, previewFinalTestImport } from "@/lib/data";
import { useApiData } from "@/hooks/useApiData";
import { validateFinalTestImport } from "@/lib/validateImport";
import type { FinalTestImportSummary } from "@/lib/types";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ResultDialog } from "@/components/ui/ResultDialog";

const IMPORT_ERROR = "Import testu końcowego się nie powiódł. Spróbuj ponownie.";

type ImportRequest = { sectionId: number; sectionTitle: string; data: unknown };

export function FinalTestImportForm({ controls }: { controls: ImportControls }) {
  const { state } = useApiData(getSections);
  const sections = state.status === "ready" ? state.data : [];
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<{ request: ImportRequest; summary: FinalTestImportSummary } | null>(null);
  const [result, setResult] = useState<{ sectionTitle: string; summary: FinalTestImportSummary } | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  const sectionId = selectedSectionId ?? sections[0]?.id ?? null;

  async function handleSubmit() {
    setResult(null);
    if (!sectionId) {
      controls.showErrors(["Wybierz dział."]);
      return;
    }
    if (!file) {
      controls.showErrors(["Wybierz plik .json."]);
      return;
    }

    const { data, errors } = await readValidatedJson(file, validateFinalTestImport);
    if (errors.length > 0) {
      controls.showErrors(errors);
      return;
    }

    const request = {
      sectionId,
      sectionTitle: sections.find((section) => section.id === sectionId)?.title ?? "",
      data,
    };
    await controls.run(async (token) => {
      const summary = await previewFinalTestImport(token, request.sectionId, request.data);
      if (summary.deletedQuestions.length > 0) {
        setPending({ request, summary });
      } else {
        await runImport(token, request);
      }
    }, IMPORT_ERROR);
  }

  async function runImport(token: string, request: ImportRequest) {
    const summary = await importFinalTest(token, request.sectionId, request.data);
    setResult({ sectionTitle: request.sectionTitle, summary });
    setFile(null);
    setUploadKey((current) => current + 1);
  }

  async function confirmImport() {
    if (!pending) return;
    const { request } = pending;
    setPending(null);
    await controls.run((token) => runImport(token, request), IMPORT_ERROR);
  }

  return (
    <>
      <ImportCard
        title="Test końcowy"
        format="JSON"
        description="Pytania testu końcowego dla wybranej sekcji. Po imporcie test wygląda dokładnie jak plik: nowe pytania zostaną dodane, a te, których w pliku nie ma, zostaną usunięte."
        submitLabel="Importuj test końcowy"
        submittingLabel="Importowanie…"
        submitting={controls.submitting}
        stretch
        onSubmit={handleSubmit}
      >
        <div className="mt-4">
          <label className="block text-sm text-gray-600">
            Dział
            <select
              className="mt-1 block w-full rounded-sm border border-gray-300 px-3 py-2 text-sm"
              value={sectionId ?? ""}
              onChange={(e) => setSelectedSectionId(Number(e.target.value) || null)}
            >
              {sections.length === 0 && <option value="">Brak działów</option>}
              {sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-1 flex-col">
          <UploadField key={uploadKey} accept=".json" hint=".json" onFileSelected={setFile} />
        </div>
      </ImportCard>

      <ConfirmDialog
        open={pending !== null}
        title="Import zmieni test końcowy"
        confirmLabel="Importuj"
        busyLabel="Importowanie…"
        tone="primary"
        wide
        onConfirm={confirmImport}
        onCancel={() => setPending(null)}
      >
        <p className="mb-4">
          Pytań, których nie ma w pliku, nie będzie też w teście sekcji „{pending?.request.sectionTitle}”. Usunięte
          zostaną również odpowiedzi uczniów na te pytania i nie da się tego cofnąć.
        </p>
        {pending && <FinalTestImportSummaryView summary={pending.summary} />}
      </ConfirmDialog>

      <ResultDialog open={result !== null} title="Import zakończony" wide onClose={() => setResult(null)}>
        {result && (
          <>
            <p className="mb-4">Test końcowy sekcji „{result.sectionTitle}”.</p>
            <FinalTestImportSummaryView summary={result.summary} />
          </>
        )}
      </ResultDialog>
    </>
  );
}
