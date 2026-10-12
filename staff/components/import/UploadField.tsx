"use client";

import { useState } from "react";

type UploadFieldProps = {
  accept: string;
  hint: string;
  onFileSelected: (file: File | null) => void;
};

export function UploadField({ accept, hint, onFileSelected }: UploadFieldProps) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <label className="flex flex-1 cursor-pointer items-center justify-center rounded-sm border border-dashed border-gray-300 px-6 py-8 text-center hover:border-infiro-navy">
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
