import { MAX_RECORDING_BYTES, MAX_RECORDING_MS } from "./diarization";

export type RecordingError = "tooLarge" | "empty" | "recordingFailed";
export function recordClip(
  recorder: MediaRecorder,
  handlers: {
    complete: (blob: Blob) => void;
    error: (code: RecordingError) => void;
    release: () => void;
  },
) {
  let chunks: Blob[] = [];
  let size = 0;
  let submit = false;
  let closed = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  function close() {
    if (closed) return;
    closed = true;
    clearTimeout(timer);
    handlers.release();
  }
  function discard() {
    submit = false;
    chunks = [];
    close();
    if (recorder.state !== "inactive") recorder.stop();
  }
  function fail(code: RecordingError) {
    if (closed) return;
    discard();
    handlers.error(code);
  }
  function finish() {
    if (closed || recorder.state === "inactive") return;
    submit = true;
    clearTimeout(timer);
    recorder.stop();
  }
  recorder.ondataavailable = (event) => {
    if (closed) return;
    size += event.data.size;
    if (size > MAX_RECORDING_BYTES) {
      fail("tooLarge");
      return;
    }
    if (event.data.size) chunks.push(event.data);
  };
  recorder.onerror = () => fail("recordingFailed");
  recorder.onstop = () => {
    if (closed) return;
    const blob = new Blob(chunks, { type: recorder.mimeType });
    chunks = [];
    close();
    if (!submit) handlers.error("recordingFailed");
    else if (!blob.size) handlers.error("empty");
    else handlers.complete(blob);
  };
  try {
    recorder.start(1000);
    timer = setTimeout(finish, MAX_RECORDING_MS);
  } catch {
    fail("recordingFailed");
  }
  return { finish, discard };
}
