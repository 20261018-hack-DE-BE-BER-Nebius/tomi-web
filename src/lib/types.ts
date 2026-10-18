export type Language = "en" | "es" | "de" | "fr";
export interface Model {
  id: string;
  name: string;
  provider: string;
  capabilities: string[];
  available: boolean;
  availability_reason?: string;
}
export interface Evidence {
  id: string;
  title: string;
  url: string;
  source: "historical" | "modern";
  excerpt: string;
}
export interface Answer {
  title: string;
  summary: string;
  categories: { name: string; description: string }[];
  evidence: Evidence[];
  uncertainty: string[];
  model?: string;
  blocks?: {
    type: string;
    historical?: string;
    modern?: string;
    source_ids?: string[];
  }[];
}
export interface RunEvent {
  type: string;
  run_id: string;
  session_id?: string;
  timestamp: string;
  data: Record<string, unknown>;
}
export interface Turn {
  id: string;
  question: string;
  events: RunEvent[];
  answer?: Answer;
  text: string;
  status: "running" | "completed" | "failed" | "cancelled";
  error?: string;
}
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
export function parseEvent(value: unknown): RunEvent | null {
  if (
    !isRecord(value) ||
    typeof value.type !== "string" ||
    typeof value.run_id !== "string" ||
    typeof value.timestamp !== "string" ||
    !isRecord(value.data)
  )
    return null;
  return value as unknown as RunEvent;
}
export function parseAnswer(value: unknown): Answer | null {
  if (
    !isRecord(value) ||
    typeof value.title !== "string" ||
    typeof value.summary !== "string" ||
    !Array.isArray(value.evidence) ||
    !Array.isArray(value.categories) ||
    !Array.isArray(value.uncertainty)
  )
    return null;
  if (
    !value.evidence.every(
      (x) =>
        isRecord(x) &&
        [x.id, x.title, x.url, x.excerpt].every((s) => typeof s === "string") &&
        ["historical", "modern"].includes(String(x.source)),
    )
  )
    return null;
  if (
    !value.categories.every(
      (x) =>
        isRecord(x) &&
        typeof x.name === "string" &&
        typeof x.description === "string",
    ) ||
    !value.uncertainty.every((x) => typeof x === "string")
  )
    return null;
  return value as unknown as Answer;
}
export function safeSourceUrl(value: string): string | undefined {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.href
      : undefined;
  } catch {
    return undefined;
  }
}
