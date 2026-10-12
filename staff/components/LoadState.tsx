import { Spinner } from "@/components/Spinner";

type PendingState = { status: "loading" } | { status: "error"; message: string };

export function LoadState({ state }: { state: PendingState }) {
  if (state.status === "loading") return <Spinner />;

  return (
    <p role="alert" className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {state.message}
    </p>
  );
}
