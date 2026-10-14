"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthContext";

export type Loadable<T> =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: T };

const LOAD_ERROR = "Nie udało się wczytać danych. Odśwież stronę albo spróbuj ponownie za chwilę.";

export function useApiData<T>(load: (token: string) => Promise<T>, key = "") {
  const { getToken } = useAuth();
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const token = await getToken();
        const data = await load(token ?? "");
        if (active) setState({ status: "ready", data });
      } catch {
        if (active) setState({ status: "error", message: LOAD_ERROR });
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function updateData(change: (data: T) => T) {
    setState((current) =>
      current.status === "ready" ? { status: "ready", data: change(current.data) } : current
    );
  }

  return { state, updateData };
}
