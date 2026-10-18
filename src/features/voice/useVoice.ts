"use client";
import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api/client";
import { isRecord, type Language, type RunEvent } from "@/lib/types";
import { useSpeakerRecording } from "./useSpeakerRecording";
export function useVoice(
  language: Language,
  onQuestion: (query: string) => boolean,
) {
  const [active, setActive] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [muted, setMuted] = useState(false);
  const [error, setError] = useState("");
  const [transcript, setTranscript] = useState("");
  const peer = useRef<RTCPeerConnection | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const recording = useSpeakerRecording(language, stream);
  const channel = useRef<RTCDataChannel | null>(null);
  const audio = useRef<HTMLAudioElement | null>(null);
  const pending = useRef<string | null>(null);
  const question = useRef(onQuestion);
  question.current = onQuestion;
  function disconnect() {
    channel.current?.close();
    peer.current?.close();
    stream.current?.getTracks().forEach((track) => {
      track.stop();
    });
    if (audio.current) {
      audio.current.pause();
      audio.current.srcObject = null;
    }
    peer.current = null;
    stream.current = null;
    channel.current = null;
    pending.current = null;
    setActive(false);
    setConnecting(false);
    setMuted(false);
  }
  function stop() {
    recording.finish();
    disconnect();
  }
  function reset() {
    recording.discard();
    disconnect();
  }
  useEffect(
    () => () => {
      peer.current?.close();
      stream.current?.getTracks().forEach((track) => {
        track.stop();
      });
      audio.current?.pause();
    },
    [],
  );
  function message(raw: string) {
    try {
      const event: unknown = JSON.parse(raw);
      if (!isRecord(event)) return;
      if (
        event.type ===
          "conversation.item.input_audio_transcription.completed" &&
        typeof event.transcript === "string"
      )
        setTranscript(event.transcript);
      if (
        event.type === "response.function_call_arguments.done" &&
        event.name === "compare_sources" &&
        typeof event.arguments === "string" &&
        typeof event.call_id === "string"
      ) {
        const args: unknown = JSON.parse(event.arguments);
        if (isRecord(args) && typeof args.query === "string") {
          pending.current = event.call_id;
          if (!question.current(args.query))
            setError(
              "The evidence connection is unavailable. Reconnect the chat.",
            );
        }
      }
      if (event.type === "error")
        setError(
          "The voice provider returned an error. End the call and retry.",
        );
    } catch {
      setError("The voice provider returned an unreadable event.");
    }
  }
  async function start() {
    setConnecting(true);
    setError("");
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const pc = new RTCPeerConnection();
      peer.current = pc;
      stream.current.getTracks().forEach((track) => {
        pc.addTrack(track, stream.current as MediaStream);
      });
      audio.current = new Audio();
      audio.current.autoplay = true;
      pc.ontrack = (event) => {
        if (audio.current) {
          audio.current.srcObject = event.streams[0];
          audio.current
            .play()
            .catch(() =>
              setError("Audio playback was blocked by the browser."),
            );
        }
      };
      pc.onconnectionstatechange = () => {
        if (pc.connectionState === "failed") {
          setError("The voice connection failed.");
          reset();
        }
      };
      const dc = pc.createDataChannel("oai-events");
      channel.current = dc;
      dc.onmessage = (event) => message(event.data);
      dc.onopen = () => {
        setActive(true);
        setConnecting(false);
      };
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      const answer = await api<{ sdp: string }>("realtime/connect", {
        sdp: offer.sdp,
        language,
      });
      if (typeof answer.sdp !== "string")
        throw new Error("The voice service returned no SDP answer.");
      await pc.setRemoteDescription({ type: "answer", sdp: answer.sdp });
    } catch (e) {
      reset();
      setError(e instanceof Error ? e.message : "Unable to start voice");
    }
  }
  function toggleMute() {
    const next = !muted;
    stream.current?.getAudioTracks().forEach((track) => {
      track.enabled = !next;
    });
    setMuted(next);
  }
  function deliver(event: RunEvent) {
    if (
      !pending.current ||
      channel.current?.readyState !== "open" ||
      !["answer.completed", "run.failed"].includes(event.type)
    )
      return;
    channel.current.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: "function_call_output",
          call_id: pending.current,
          output: JSON.stringify(event.data),
        },
      }),
    );
    channel.current.send(JSON.stringify({ type: "response.create" }));
    pending.current = null;
  }
  return {
    active,
    connecting,
    muted,
    error,
    transcript,
    recording,
    start,
    stop,
    reset,
    toggleMute,
    deliver,
  };
}
