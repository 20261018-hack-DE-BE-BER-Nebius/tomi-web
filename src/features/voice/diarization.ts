import { isRecord } from "@/lib/types";

export const MAX_RECORDING_BYTES = 1024 * 1024;
export const MAX_RECORDING_MS = 59_000;
export const DIARIZATION_MODEL = "nvidia/Nemotron-3-Diarization";
export interface SpeakerSegment {
  speaker: string;
  start: number;
  end: number;
}
export interface Diarization {
  model: typeof DIARIZATION_MODEL;
  model_revision: string;
  mode: "batch";
  duration_seconds: number;
  segments: SpeakerSegment[];
}
export function parseDiarization(value: unknown): Diarization | null {
  if (
    !isRecord(value) ||
    Object.keys(value).some(
      (key) =>
        ![
          "model",
          "model_revision",
          "mode",
          "duration_seconds",
          "segments",
          "audio_sha256",
          "identity_inference",
          "quantization",
          "runtime",
        ].includes(key),
    ) ||
    (value.identity_inference !== undefined &&
      value.identity_inference !== false) ||
    value.model !== DIARIZATION_MODEL ||
    value.mode !== "batch" ||
    typeof value.model_revision !== "string" ||
    !/^[a-zA-Z0-9._/-]{1,128}$/.test(value.model_revision) ||
    typeof value.duration_seconds !== "number" ||
    !Number.isFinite(value.duration_seconds) ||
    value.duration_seconds <= 0 ||
    value.duration_seconds > 60 ||
    !Array.isArray(value.segments) ||
    value.segments.length > 1000
  )
    return null;
  const duration = value.duration_seconds;
  const segments: SpeakerSegment[] = [];
  for (const item of value.segments) {
    if (
      !isRecord(item) ||
      Object.keys(item).some(
        (key) => !["speaker", "start", "end"].includes(key),
      ) ||
      typeof item.speaker !== "string" ||
      !/^speaker_[1-8]$/.test(item.speaker) ||
      typeof item.start !== "number" ||
      typeof item.end !== "number" ||
      !Number.isFinite(item.start) ||
      !Number.isFinite(item.end) ||
      item.start < 0 ||
      item.end <= item.start ||
      item.end > duration
    )
      return null;
    segments.push({ speaker: item.speaker, start: item.start, end: item.end });
  }
  return {
    model: DIARIZATION_MODEL,
    model_revision: value.model_revision,
    mode: "batch",
    duration_seconds: duration,
    segments,
  };
}

export function recordingFormat(
  mime: string,
): "webm" | "mp4" | "ogg" | "mp3" | "wav" | null {
  if (/^audio\/webm(?:;|$)/i.test(mime)) return "webm";
  if (/^audio\/mp4(?:;|$)/i.test(mime)) return "mp4";
  if (/^audio\/ogg(?:;|$)/i.test(mime)) return "ogg";
  if (/^audio\/(?:mpeg|mp3)(?:;|$)/i.test(mime)) return "mp3";
  if (/^audio\/(?:wav|wave|x-wav)(?:;|$)/i.test(mime)) return "wav";
  return null;
}

export async function encodeRecording(blob: Blob) {
  const format = recordingFormat(blob.type);
  if (!format || !blob.size || blob.size > MAX_RECORDING_BYTES)
    throw new Error("Invalid recording");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 8192)
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  return { audio: btoa(binary), format };
}

export async function requestDiarization(blob: Blob, signal: AbortSignal) {
  const body = await encodeRecording(blob);
  if (signal.aborted) throw new DOMException("Aborted", "AbortError");
  const response = await fetch("/api/diarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    signal: AbortSignal.any([signal, AbortSignal.timeout(120_000)]),
    body: JSON.stringify(body),
  });
  const value: unknown = await response.json();
  if (!response.ok) {
    const detail =
      isRecord(value) && isRecord(value.error) ? value.error.message : null;
    throw new Error(
      typeof detail === "string"
        ? detail.slice(0, 500)
        : `HTTP ${response.status}`,
    );
  }
  const result = parseDiarization(value);
  if (!result) throw new Error("Invalid speaker-separation response");
  return result;
}
