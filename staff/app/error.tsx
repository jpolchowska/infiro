"use client";

import { useEffect } from "react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unexpected panel error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="text-2xl font-semibold text-infiro-navy">Coś poszło nie tak</h1>
      <p className="mt-2 text-sm text-gray-600">Wystąpił nieoczekiwany błąd. Spróbuj ponownie.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-sm bg-infiro-navy px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        Spróbuj ponownie
      </button>
    </div>
  );
}
