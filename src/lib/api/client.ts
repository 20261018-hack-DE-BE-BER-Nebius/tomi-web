import { isRecord } from "../types";
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: body === undefined ? {} : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    credentials: "same-origin",
    cache: "no-store",
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const detail =
      isRecord(value) && isRecord(value.error)
        ? value.error.message
        : isRecord(value)
          ? value.message || value.error
          : null;
    throw new Error(
      typeof detail === "string"
        ? detail
        : `Request failed (${response.status})`,
    );
  }
  return value as T;
}
