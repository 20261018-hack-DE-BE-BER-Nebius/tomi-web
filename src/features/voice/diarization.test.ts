import { describe, expect, test } from "bun:test";
import {
  DIARIZATION_MODEL,
  encodeRecording,
  MAX_RECORDING_BYTES,
  parseDiarization,
  recordingFormat,
  requestDiarization,
} from "./diarization";
import labels from "./labels.json";

const response = {
  model: DIARIZATION_MODEL,
  model_revision: "test-revision",
  mode: "batch",
  duration_seconds: 5,
  segments: [
    { speaker: "speaker_1", start: 0, end: 3 },
    { speaker: "speaker_2", start: 2.5, end: 5 },
  ],
};
describe("batch diarization boundary", () => {
  test("preserves actual overlapping intervals and accepts no-speech output", () => {
    expect(parseDiarization(response)?.segments).toEqual(response.segments);
    expect(parseDiarization({ ...response, segments: [] })?.segments).toEqual(
      [],
    );
  });
  test("rejects identity labels, non-batch claims and impossible intervals", () => {
    for (const value of [
      { ...response, mode: "realtime" },
      { ...response, model: "unverified" },
      { ...response, duration_seconds: Number.NaN },
      { ...response, duration_seconds: 61 },
      { ...response, segments: [{ speaker: "Alice", start: 0, end: 1 }] },
      { ...response, segments: [{ speaker: "speaker_9", start: 0, end: 1 }] },
      { ...response, segments: [{ speaker: "speaker_1", start: -1, end: 1 }] },
      { ...response, segments: [{ speaker: "speaker_1", start: 2, end: 1 }] },
      { ...response, segments: [{ speaker: "speaker_1", start: 0, end: 6 }] },
    ])
      expect(parseDiarization(value)).toBeNull();
  });
  test("encodes only bounded supported microphone audio", async () => {
    expect(recordingFormat("audio/webm;codecs=opus")).toBe("webm");
    expect(recordingFormat("audio/mp4")).toBe("mp4");
    expect(recordingFormat("audio/mpeg")).toBe("mp3");
    expect(recordingFormat("audio/x-wav")).toBe("wav");
    expect(recordingFormat("text/html")).toBeNull();
    expect(
      await encodeRecording(new Blob(["audio"], { type: "audio/webm" })),
    ).toEqual({ audio: btoa("audio"), format: "webm" });
    await expect(
      encodeRecording(new Blob([], { type: "audio/webm" })),
    ).rejects.toThrow();
    await expect(
      encodeRecording(
        new Blob([new Uint8Array(MAX_RECORDING_BYTES + 1)], {
          type: "audio/webm",
        }),
      ),
    ).rejects.toThrow();
  });
  test("an aborted upload never reaches the network", async () => {
    const original = globalThis.fetch;
    let calls = 0;
    globalThis.fetch = (() => {
      calls++;
      throw new Error("unexpected network");
    }) as unknown as typeof fetch;
    try {
      const controller = new AbortController();
      controller.abort();
      await expect(
        requestDiarization(
          new Blob(["audio"], { type: "audio/webm" }),
          controller.signal,
        ),
      ).rejects.toThrow();
      expect(calls).toBe(0);
    } finally {
      globalThis.fetch = original;
    }
  });
  test("all recording, privacy and error labels have four-language parity", () => {
    for (const language of ["en", "es", "de", "fr"] as const) {
      expect(Object.keys(labels[language])).toEqual(Object.keys(labels.en));
      expect(
        Object.values(labels[language]).every((label) => label.trim()),
      ).toBe(true);
    }
  });
});
