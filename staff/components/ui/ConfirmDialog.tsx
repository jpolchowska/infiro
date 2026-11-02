"use client";

import { useEffect, useRef } from "react";
import { ErrorMessage } from "@/components/ui/ErrorMessage";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  tone?: "danger" | "primary";
  wide?: boolean;
  busy?: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busyLabel = "Usuwanie…",
  tone = "danger",
  wide = false,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
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
        if (!busy) onCancel();
      }}
      className={`m-auto w-full ${wide ? "max-w-xl" : "max-w-md"} rounded-sm border border-infiro-border bg-white p-0 shadow-lg backdrop:bg-gray-900/20`}
    >
      <div className="px-6 pt-6">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <div className="mt-2 text-sm text-gray-600">{children}</div>
        {error && (
          <div className="mt-4">
            <ErrorMessage message={error} />
          </div>
        )}
      </div>
      <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 bg-background/40 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="rounded-sm border border-infiro-border bg-white px-4 py-2 text-sm font-medium text-infiro-navy hover:border-infiro-navy disabled:opacity-50"
        >
          Anuluj
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`rounded-sm px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 ${
            tone === "danger" ? "bg-tone-bad" : "bg-infiro-navy"
          }`}
        >
          {busy ? busyLabel : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
