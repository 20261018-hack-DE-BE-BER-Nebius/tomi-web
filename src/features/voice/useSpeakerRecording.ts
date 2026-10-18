"use client";
import { type RefObject, useEffect, useRef, useState } from "react";
import type { Language } from "@/lib/types";
import {
  type Diarization,
  MAX_RECORDING_BYTES,
  recordingFormat,
  requestDiarization,
} from "./diarization";
import labels from "./labels.json";
import { recordClip } from "./recording";

type Status =
  | "idle"
  | "requesting"
  | "recording"
  | "processing"
  | "complete"
  | "error";
export function useSpeakerRecording(
  language: Language,
  shared: RefObject<MediaStream | null>,
) {
  const [status, setStatus] = useState<Status>("idle");
  const [seconds, setSeconds] = useState(0);
  const [result, setResult] = useState<Diarization | null>(null);
  const [error, setError] = useState("");
  const generation = useRef(0);
  const clip = useRef<ReturnType<typeof recordClip> | null>(null);
  const owned = useRef<MediaStream | null>(null);
  const controller = useRef<AbortController | null>(null);
  const clock = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const t = labels[language];

  function discard() {
    generation.current++;
    clip.current?.discard();
    clip.current = null;
    controller.current?.abort();
    controller.current = null;
    clearInterval(clock.current);
    owned.current?.getTracks().forEach((track) => {
      track.stop();
    });
    owned.current = null;
    setStatus("idle");
    setResult(null);
    setError("");
    setSeconds(0);
  }
  useEffect(
    () => () => {
      generation.current++;
      clip.current?.discard();
      controller.current?.abort();
      clearInterval(clock.current);
      owned.current?.getTracks().forEach((track) => {
        track.stop();
      });
    },
    [],
  );

  function analyze(blob: Blob, id: number) {
    if (id !== generation.current) return;
    setStatus("processing");
    const request = new AbortController();
    controller.current = request;
    requestDiarization(blob, request.signal)
      .then((value) => {
        if (id !== generation.current) return;
        setResult(value);
        setStatus("complete");
      })
      .catch((failure: unknown) => {
        if (id !== generation.current || request.signal.aborted) return;
        setStatus("error");
        setError(
          `${t.analysisFailed} ${failure instanceof Error ? failure.message : ""}`.trim(),
        );
      })
      .finally(() => {
        if (controller.current === request) controller.current = null;
      });
  }
  function upload(file: File) {
    discard();
    const failure =
      file.size > MAX_RECORDING_BYTES
        ? t.tooLarge
        : !file.size
          ? t.empty
          : !recordingFormat(file.type)
            ? t.unsupported
            : null;
    if (failure) {
      setStatus("error");
      setError(failure);
      return;
    }
    analyze(file, generation.current);
  }

  async function start() {
    discard();
    const id = generation.current;
    if (
      typeof MediaRecorder === "undefined" ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setStatus("error");
      setError(t.unsupported);
      return;
    }
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg;codecs=opus",
    ].find((mime) => MediaRecorder.isTypeSupported(mime));
    if (!mimeType) {
      setStatus("error");
      setError(t.unsupported);
      return;
    }
    setStatus("requesting");
    try {
      const existing = shared.current
        ?.getAudioTracks()
        .some((track) => track.readyState === "live")
        ? shared.current
        : null;
      const input =
        existing ||
        (await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        }));
      if (id !== generation.current) {
        if (!existing)
          input.getTracks().forEach((track) => {
            track.stop();
          });
        return;
      }
      if (!existing) owned.current = input;
      const recorder = new MediaRecorder(input, {
        mimeType,
        audioBitsPerSecond: 64_000,
      });
      const started = Date.now();
      clip.current = recordClip(recorder, {
        release() {
          clearInterval(clock.current);
          owned.current?.getTracks().forEach((track) => {
            track.stop();
          });
          owned.current = null;
          clip.current = null;
        },
        error(code) {
          if (id !== generation.current) return;
          setStatus("error");
          setError(t[code]);
        },
        complete(blob) {
          analyze(blob, id);
        },
      });
      if (recorder.state === "recording") {
        setStatus("recording");
        clock.current = setInterval(
          () => setSeconds(Math.floor((Date.now() - started) / 1000)),
          1000,
        );
      }
    } catch {
      if (id !== generation.current) return;
      owned.current?.getTracks().forEach((track) => {
        track.stop();
      });
      owned.current = null;
      setStatus("error");
      setError(t.microphone);
    }
  }
  function finish() {
    clip.current?.finish();
    if (status === "requesting") discard();
  }
  return { status, seconds, result, error, start, finish, discard, upload };
}
