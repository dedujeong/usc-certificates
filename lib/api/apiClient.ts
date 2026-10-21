const TOKEN_KEY = "usc_auth_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public fields?: Record<string, string[]>,
  ) {
    super(message);
  }
}

interface ApiEnvelope<T> {
  data?: T;
  error?: { message: string; code?: string; fields?: Record<string, string[]> };
}

function getToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401) {
    window.dispatchEvent(new Event("usc:unauthorized"));
  }

  const body = (await res.json().catch(() => ({}))) as ApiEnvelope<T>;

  if (!res.ok) {
    throw new ApiError(res.status, body.error?.message ?? "Request failed", body.error?.code, body.error?.fields);
  }

  return body.data as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: "GET" }),
  post: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => apiFetch<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

/** For endpoints that return a binary body (e.g. a generated PDF) instead of the `{data}`/`{error}` JSON envelope. */
export async function apiFetchBlob(path: string, init: RequestInit = {}): Promise<{ blob: Blob; filename: string | null }> {
  const token = getToken();
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });

  if (res.status === 401) {
    window.dispatchEvent(new Event("usc:unauthorized"));
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ApiEnvelope<unknown>;
    throw new ApiError(res.status, body.error?.message ?? "Request failed", body.error?.code);
  }

  const disposition = res.headers.get("Content-Disposition") ?? "";
  const filenameMatch = disposition.match(/filename="([^"]+)"/);

  return { blob: await res.blob(), filename: filenameMatch?.[1] ?? null };
}
