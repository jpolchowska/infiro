import type { ReactNode, SubmitEvent } from "react";

type ImportCardProps = {
  title: string;
  format: string;
  description: string;
  submitLabel: string;
  submittingLabel: string;
  submitting: boolean;
  ready: boolean;
  stretch?: boolean;
  onSubmit: () => void;
  children: ReactNode;
};

export function ImportCard({
  title,
  format,
  description,
  submitLabel,
  submittingLabel,
  submitting,
  ready,
  stretch = false,
  onSubmit,
  children,
}: ImportCardProps) {
  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    onSubmit();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`${stretch ? "flex flex-1 flex-col " : ""}rounded-sm border border-infiro-border bg-white px-5 py-4.5`}
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-semibold text-infiro-navy">{title}</h2>
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-gray-400">{format}</span>
      </div>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {children}
      <div className="mt-4 flex justify-center">
        <button
          type="submit"
          disabled={submitting || !ready}
          className="rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </form>
  );
}
