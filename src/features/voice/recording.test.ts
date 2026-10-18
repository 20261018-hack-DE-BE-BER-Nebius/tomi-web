import { describe, expect, test } from "bun:test";
import { MAX_RECORDING_BYTES } from "./diarization";
import { recordClip } from "./recording";

class Recorder {
  state: RecordingState = "inactive";
  mimeType = "audio/webm;codecs=opus";
  ondataavailable: MediaRecorder["ondataavailable"] = null;
  onstop: MediaRecorder["onstop"] = null;
  onerror: MediaRecorder["onerror"] = null;
  finalChunk = new Blob(["final"]);
  start() {
    this.state = "recording";
  }
  data(blob: Blob) {
    this.ondataavailable?.call(
      this as unknown as MediaRecorder,
      { data: blob } as BlobEvent,
    );
  }
  stop() {
    this.state = "inactive";
    queueMicrotask(() => {
      this.data(this.finalChunk);
      this.onstop?.call(this as unknown as MediaRecorder, new Event("stop"));
    });
  }
}
function session() {
  const recorder = new Recorder();
  const blobs: Blob[] = [];
  const errors: string[] = [];
  let released = 0;
  const clip = recordClip(recorder as unknown as MediaRecorder, {
    complete: (blob) => blobs.push(blob),
    error: (code) => errors.push(code),
    release: () => {
      released++;
    },
  });
  return { recorder, blobs, errors, clip, released: () => released };
}
describe("explicit microphone recording lifecycle", () => {
  test("finishing waits for the final browser chunk and sends one complete clip", async () => {
    const run = session();
    run.recorder.data(new Blob(["first"]));
    expect(run.blobs).toHaveLength(0);
    run.clip.finish();
    run.clip.finish();
    expect(run.blobs).toHaveLength(0);
    await Promise.resolve();
    expect(run.blobs).toHaveLength(1);
    expect(await run.blobs[0].text()).toBe("firstfinal");
    expect(run.released()).toBe(1);
    expect(run.errors).toEqual([]);
  });
  test("discarding prevents an already queued final chunk from being submitted", async () => {
    const run = session();
    run.recorder.data(new Blob(["private"]));
    run.clip.finish();
    run.clip.discard();
    await Promise.resolve();
    expect(run.blobs).toEqual([]);
    expect(run.errors).toEqual([]);
    expect(run.released()).toBe(1);
  });
  test("oversized input is discarded rather than partially uploaded", async () => {
    const run = session();
    run.recorder.data(new Blob([new Uint8Array(MAX_RECORDING_BYTES + 1)]));
    await Promise.resolve();
    expect(run.blobs).toEqual([]);
    expect(run.errors).toEqual(["tooLarge"]);
    expect(run.released()).toBe(1);
  });
  test("device disconnection does not count as consent to submit", async () => {
    const run = session();
    run.recorder.stop();
    await Promise.resolve();
    expect(run.blobs).toEqual([]);
    expect(run.errors).toEqual(["recordingFailed"]);
    expect(run.released()).toBe(1);
  });
});
