import { ErrorMessage } from "@/components/ErrorMessage";
import { Spinner } from "@/components/Spinner";

type PendingState = { status: "loading" } | { status: "error"; message: string };

export function LoadState({ state }: { state: PendingState }) {
  if (state.status === "loading") return <Spinner />;

  return <ErrorMessage message={state.message} />;
}
