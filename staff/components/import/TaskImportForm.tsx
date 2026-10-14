"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import { readValidatedJson, type ImportControls } from "@/lib/importControls";
import { UploadField } from "@/components/import/UploadField";
import { importTasks } from "@/lib/data";
import { validateTaskImport } from "@/lib/validateImport";
import { pluralize, WORDS } from "@/lib/pluralize";

export function TaskImportForm({ controls }: { controls: ImportControls }) {
  const [file, setFile] = useState<File | null>(null);
  const [taskCount, setTaskCount] = useState<number | null>(null);

  async function handleSubmit() {
    setTaskCount(null);
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
      const result = await importTasks(token, data);
      setTaskCount(result.taskCount);
    }, "Import się nie powiódł. Spróbuj ponownie.");
  }

  return (
    <ImportCard
      title="Plik z zadaniami (JSON)"
      successMessage={taskCount !== null ? `Zaimportowano ${pluralize(taskCount, WORDS.task)}.` : null}
      submitLabel="Importuj zadania"
      submittingLabel="Importowanie…"
      submitting={controls.submitting}
      onSubmit={handleSubmit}
    >
      <div className="mt-4">
        <UploadField accept=".json" hint=".json" onFileSelected={setFile} />
      </div>
    </ImportCard>
  );
}
