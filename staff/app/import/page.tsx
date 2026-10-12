"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";
import { EbookImportForm } from "@/components/import/EbookImportForm";
import { FinalTestImportForm } from "@/components/import/FinalTestImportForm";
import { ImagesImportForm } from "@/components/import/ImagesImportForm";
import { ImportErrors } from "@/components/import/ImportErrors";
import type { ImportControls } from "@/components/import/importControls";
import { TaskImportForm } from "@/components/import/TaskImportForm";
import { ApiError } from "@/lib/api";

const SHOW_IMAGES_ZIP_IMPORT = false;

export default function ImportPage() {
  const { getToken } = useAuth();
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const controls: ImportControls = {
    submitting,
    showErrors: setErrors,
    async run(action, fallbackError) {
      setErrors([]);
      setSubmitting(true);
      try {
        const token = await getToken();
        await action(token ?? "");
      } catch (err) {
        setErrors([err instanceof ApiError ? err.message : fallbackError]);
      } finally {
        setSubmitting(false);
      }
    },
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-infiro-navy">Import treści</h1>
      <p className="mt-2 max-w-2xl text-sm text-gray-600">
        Dodawaj treści do aplikacji z plików JSON i ZIP.
      </p>

      <ImportErrors errors={errors} />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-6">
          <TaskImportForm controls={controls} />
          {SHOW_IMAGES_ZIP_IMPORT && <ImagesImportForm controls={controls} />}
          <EbookImportForm controls={controls} />
        </div>

        <div className="flex flex-col gap-6">
          <FinalTestImportForm controls={controls} />
        </div>
      </div>
    </div>
  );
}
