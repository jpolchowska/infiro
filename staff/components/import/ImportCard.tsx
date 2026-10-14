import type { ReactNode, SubmitEvent } from "react";

type ImportCardProps = {
  title: string;
  successMessage: string | null;
  submitLabel: string;
  submittingLabel: string;
  submitting: boolean;
  stretch?: boolean;
  onSubmit: () => void;
  children: ReactNode;
};

export function ImportCard({
  title,
  successMessage,
  submitLabel,
  submittingLabel,
  submitting,
  stretch = false,
  onSubmit,
  children,
}: ImportCardProps) {
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <>
      {successMessage !== null && (
        <div className="rounded-sm border border-green-300 bg-green-50 p-4 text-sm text-green-700">
          {successMessage}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className={`${stretch ? "flex flex-1 flex-col " : ""}rounded-lg border border-infiro-border bg-white p-6`}
      >
        <h2 className="text-sm font-semibold text-infiro-navy">{title}</h2>
        {children}
        <div className="mt-4 flex justify-center">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? submittingLabel : submitLabel}
          </button>
        </div>
      </form>
    </>
  );
}
