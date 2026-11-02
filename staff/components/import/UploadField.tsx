"use client";

import { useState } from "react";
import { pluralForm, pluralize } from "@/lib/pluralize";

const FILE_WORDS = ["plik", "pliki", "plików"] as const;
const SELECTED_WORDS = ["wybrany", "wybrane", "wybranych"] as const;

type UploadFieldProps = {
  accept: string;
  hint: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
};

function SelectedFiles({ files }: { files: File[] }) {
  if (files.length === 1) {
    return <span className="font-medium text-infiro-navy">{files[0].name}</span>;
  }

  return (
    <span className="font-medium text-infiro-navy" title={files.map((file) => file.name).join(", ")}>
      {pluralize(files.length, FILE_WORDS)} {pluralForm(files.length, SELECTED_WORDS)}
    </span>
  );
}

export function UploadField({ accept, hint, multiple = false, onFilesSelected }: UploadFieldProps) {
  const [files, setFiles] = useState<File[]>([]);

  function select(list: FileList | null) {
    const selected = Array.from(list ?? []);
    const next = multiple ? selected : selected.slice(0, 1);
    setFiles(next);
    onFilesSelected(next);
  }

  return (
    <label
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        select(event.dataTransfer.files);
      }}
      className="flex flex-1 cursor-pointer items-center justify-center rounded-sm border border-dashed border-gray-300 px-6 py-7 text-center hover:border-infiro-navy"
    >
      <input
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => select(e.target.files)}
      />
      <span className="min-w-0 max-w-full text-sm text-gray-600">
        {files.length > 0 ? (
          <SelectedFiles files={files} />
        ) : (
          <>
            Przeciągnij {multiple ? "pliki" : "plik"} <span className="font-medium text-infiro-navy">{hint}</span> tutaj
            lub kliknij, aby wybrać
          </>
        )}
      </span>
    </label>
  );
}
