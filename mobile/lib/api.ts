import * as SecureStore from "expo-secure-store";
import { refreshAccessToken } from "./auth";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
  body?: BodyInit;
};

function buildRequest(options: ApiFetchOptions, token: string | null) {
  const { json, body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  let finalBody = body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  return { ...rest, headers: finalHeaders, body: finalBody };
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const token = await SecureStore.getItemAsync("access_token");
  let response = await fetch(`${BACKEND_URL}${path}`, buildRequest(options, token));

  if (response.status === 401 || response.status === 403) {
    const bodyForCheck = await response.clone().json().catch(() => null);
    const looksLikeExpiredToken = response.status === 401 || bodyForCheck?.message === "Token expired";

    if (looksLikeExpiredToken) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        response = await fetch(`${BACKEND_URL}${path}`, buildRequest(options, newToken));
      }
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data?.error ||
      data?.message ||
      (Array.isArray(data?.errors) ? data.errors.join("; ") : null) ||
      `Request failed (${response.status})`;
    throw new ApiError(response.status, message);
  }

  return data as T;
}
