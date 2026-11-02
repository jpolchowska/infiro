"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import { hasDeletions, TaskImportSummaryView } from "@/components/import/TaskImportSummaryView";
import { readValidatedJson, type ImportControls } from "@/lib/importControls";
import { UploadField } from "@/components/import/UploadField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ResultDialog } from "@/components/ui/ResultDialog";
import { importTasks, previewTaskImport } from "@/lib/data";
import type { TaskImportSummary } from "@/lib/types";
import { validateTaskImport } from "@/lib/validateImport";

const IMPORT_ERROR = "Import się nie powiódł. Spróbuj ponownie.";

export function TaskImportForm({ controls }: { controls: ImportControls }) {
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<{ data: unknown; summary: TaskImportSummary } | null>(null);
  const [result, setResult] = useState<TaskImportSummary | null>(null);
  const [uploadKey, setUploadKey] = useState(0);

  function finish(summary: TaskImportSummary) {
    setResult(summary);
    setFile(null);
    setUploadKey((current) => current + 1);
  }

  async function handleSubmit() {
    setResult(null);
    if (!file) {
      controls.showErrors(["Wybierz plik .json."]);
      return;
    }

    const { data, errors } = await readValidatedJson(file, validateTaskImport);
    if (errors.length > 0) {
      controls.showErrors(errors);
      return;
    }

    await controls.run(async (token) => {
      const summary = await previewTaskImport(token, data);
      if (hasDeletions(summary)) {
        setPending({ data, summary });
      } else {
        finish(await importTasks(token, data));
      }
    }, IMPORT_ERROR);
  }

  async function confirmImport() {
    if (!pending) return;
    const { data } = pending;
    setPending(null);
    await controls.run(async (token) => {
      finish(await importTasks(token, data));
    }, IMPORT_ERROR);
  }

  return (
    <>
      <ImportCard
        title="Zadania"
        format="JSON"
        description="Cały kurs w jednym pliku. Po imporcie kurs wygląda dokładnie jak plik: nowe zadania zostaną dodane, a te, których w pliku nie ma, zostaną usunięte."
        submitLabel="Importuj zadania"
        submittingLabel="Importowanie…"
        submitting={controls.submitting}
        onSubmit={handleSubmit}
      >
        <div className="mt-4">
          <UploadField key={uploadKey} accept=".json" hint=".json" onFileSelected={setFile} />
        </div>
      </ImportCard>

      <ConfirmDialog
        open={pending !== null}
        title="Import zmieni kurs"
        confirmLabel="Importuj"
        busyLabel="Importowanie…"
        tone="primary"
        wide
        onConfirm={confirmImport}
        onCancel={() => setPending(null)}
      >
        <p className="mb-4">
          Tego, czego nie ma w pliku, nie będzie też w kursie. Usunięte zostaną również odpowiedzi uczniów na te
          zadania i nie da się tego cofnąć.
        </p>
        {pending && <TaskImportSummaryView summary={pending.summary} />}
      </ConfirmDialog>

      <ResultDialog open={result !== null} title="Import zakończony" wide onClose={() => setResult(null)}>
        {result && <TaskImportSummaryView summary={result} />}
      </ResultDialog>
    </>
  );
}
