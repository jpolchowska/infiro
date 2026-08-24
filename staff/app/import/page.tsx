"use client";

import { useState, type SubmitEvent } from "react";
import { validateImportPayload } from "@/lib/validateImport";
import { importTasks } from "@/lib/data";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/components/AuthContext";

const MAX_ERRORS_SHOWN = 20;

function UploadField({
  accept,
  hint,
  onFileSelected,
}: {
  accept: string;
  hint: string;
  onFileSelected: (file: File | null) => void;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label className="block cursor-pointer rounded-sm border border-dashed border-gray-300 px-6 py-8 text-center hover:border-infiro-navy">
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0] ?? null;
          setFileName(file?.name ?? null);
          onFileSelected(file);
        }}
      />
      <span className="text-sm text-gray-600">
        {fileName ? (
          <span className="font-medium text-infiro-navy">{fileName}</span>
        ) : (
          <>
            Przeciągnij plik <span className="font-medium text-infiro-navy">{hint}</span> tutaj lub
            kliknij, aby wybrać
          </>
        )}
      </span>
    </label>
  );
}

export default function ImportPage() {
  const { getToken } = useAuth();
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [taskCount, setTaskCount] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleJsonSubmit(e: SubmitEvent) {
    e.preventDefault();
    setTaskCount(null);
    if (!jsonFile) {
      setErrors(["Wybierz plik .json."]);
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(await jsonFile.text());
    } catch {
      setErrors(["Nie udało się sparsować pliku jako JSON."]);
      return;
    }

    const validationErrors = validateImportPayload(data);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors(null);
    setSubmitting(true);
    try {
      const token = await getToken();
      const result = await importTasks(token ?? "", data);
      setTaskCount(result.task_count);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors([err.message]);
      } else {
        setErrors(["Import się nie powiódł. Spróbuj ponownie."]);
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Import treści</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Sekcje i podsekcje dopasowywane są po dokładnym tytule i tworzone,
        jeśli nie istnieją. Import zawsze dodaje nowe zadania — nie nadpisuje
        istniejących.
      </p>

      {errors && errors.length > 0 && (
        <div className="mt-6 max-w-xl rounded-sm border border-red-300 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-700">Popraw przed importem</h2>
          <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-red-700">
            {errors.slice(0, MAX_ERRORS_SHOWN).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
          {errors.length > MAX_ERRORS_SHOWN && (
            <p className="mt-2 text-xs text-red-600">
              …i {errors.length - MAX_ERRORS_SHOWN} więcej.
            </p>
          )}
        </div>
      )}

      {taskCount !== null && (
        <div className="mt-6 max-w-xl rounded-sm border border-green-300 bg-green-50 p-4 text-sm text-green-700">
          Zaimportowano {taskCount} zadań.
        </div>
      )}

      <form onSubmit={handleJsonSubmit} className="mt-6 max-w-xl rounded-sm border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-infiro-navy">Plik z zadaniami (JSON)</h2>
        <div className="mt-4">
          <UploadField accept=".json" hint=".json" onFileSelected={setJsonFile} />
        </div>
        <div className="mt-4 flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Importowanie…" : "Importuj zadania"}
          </button>
        </div>
      </form>

      <div className="mt-6 max-w-xl rounded-sm border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-infiro-navy">Zdjęcia (ZIP)</h2>
        <p className="mt-1 text-xs text-gray-500">
          Rozpakowywane do static/uploads i dowiązywane do zadań po nazwie pliku.
        </p>
        <div className="mt-4">
          <UploadField accept=".zip" hint=".zip" onFileSelected={() => {}} />
        </div>
        <div className="mt-4 flex justify-center">
          <button className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Rozpakuj i zaimportuj
          </button>
        </div>
      </div>
    </div>
  );
}
