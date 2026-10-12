"use client";

import { useState } from "react";
import { ImportCard } from "@/components/import/ImportCard";
import { readValidatedJson, type ImportControls } from "@/components/import/importControls";
import { UploadField } from "@/components/import/UploadField";
import { getSections, importFinalTest } from "@/lib/data";
import { useApiData } from "@/lib/useApiData";
import { validateFinalTestImport } from "@/lib/validateImport";

export function FinalTestImportForm({ controls }: { controls: ImportControls }) {
  const { state } = useApiData(getSections);
  const sections = state.status === "ready" ? state.data : [];
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [questionCount, setQuestionCount] = useState<number | null>(null);

  const sectionId = selectedSectionId ?? sections[0]?.id ?? null;

  async function handleSubmit() {
    setQuestionCount(null);
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

    await controls.run(async (token) => {
      const result = await importFinalTest(token, sectionId, data);
      setQuestionCount(result.question_count);
    }, "Import testu końcowego się nie powiódł. Spróbuj ponownie.");
  }

  return (
    <ImportCard
      title="Test końcowy działu (JSON)"
      successMessage={questionCount !== null ? `Zaimportowano ${questionCount} pytań testu końcowego.` : null}
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
        <UploadField accept=".json" hint=".json" onFileSelected={setFile} />
      </div>
    </ImportCard>
  );
}
