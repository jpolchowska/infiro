export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  token?: string;
  json?: unknown;
  body?: BodyInit;
};

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { token, json, body, headers, ...rest } = options;

  const finalHeaders = new Headers(headers);
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  let finalBody = body;
  if (json !== undefined) {
    finalHeaders.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }

  const response = await fetch(path, { ...rest, headers: finalHeaders, body: finalBody });

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
