"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthContext";

export const SAVE_ERROR = "Nie udało się zapisać. Spróbuj ponownie.";
export const DELETE_ERROR = "Nie udało się usunąć. Spróbuj ponownie.";

export function useSubmit() {
  const { getToken } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(action: (token: string) => Promise<void>, errorMessage: string) {
    setSubmitting(true);
    setError(null);
    try {
      const token = await getToken();
      await action(token ?? "");
    } catch {
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return { submitting, error, submit };
}
