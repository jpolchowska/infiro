"use client";

import { useEffect, useRef } from "react";

type ResultDialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  wide?: boolean;
  onClose: () => void;
};

export function ResultDialog({ open, title, children, wide = false, onClose }: ResultDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className={`m-auto w-full ${wide ? "max-w-xl" : "max-w-md"} rounded-sm border border-infiro-border bg-white p-0 shadow-lg backdrop:bg-gray-900/20`}
    >
      <div className="px-6 pt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-gray-900">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-tone-good-soft text-tone-good">
            <svg viewBox="0 0 16 16" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
          </span>
          {title}
        </h2>
        <div className="mt-3 text-sm text-gray-600">{children}</div>
      </div>
      <div className="mt-6 flex justify-end border-t border-gray-100 bg-background/40 px-6 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Zamknij
        </button>
      </div>
    </dialog>
  );
}
