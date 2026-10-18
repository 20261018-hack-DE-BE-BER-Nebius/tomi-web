"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  forgetConversation,
  restoreConversation,
  saveConversation,
} from "@/features/evidence/conversation";
import { api } from "@/lib/api/client";
import {
  isRecord,
  type Language,
  type Model,
  parseEvent,
  type RunEvent,
  type Turn,
} from "@/lib/types";
import { applyEvent, exportTurns } from "./runState";
export function useChat(language: Language) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [model, setModel] = useState("");
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const socket = useRef<WebSocket | null>(null);
  const session = useRef("");
  const owner = useRef("");
  const savedRevision = useRef("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const retries = useRef(0);
  const onEvent = useRef<((event: RunEvent) => void) | null>(null);
  const connect = useCallback(() => {
    if (!alive.current) return;
    setStatus("connecting");
    const url = new URL("/ws", location.href);
    url.protocol = location.protocol === "https:" ? "wss:" : "ws:";
    socket.current?.close();
    const ws = new WebSocket(url);
    socket.current = ws;
    const deadline = setTimeout(() => {
      if (ws.readyState === WebSocket.CONNECTING) ws.close();
    }, 10000);
    ws.onopen = () => {
      clearTimeout(deadline);
      retries.current = 0;
      setStatus("online");
      setError("");
    };
    ws.onmessage = (message) => {
      try {
        const event = parseEvent(JSON.parse(message.data));
        if (!event) {
          setError("Invalid service event");
          return;
        }
        setTurns((current) => applyEvent(current, event));
        onEvent.current?.(event);
      } catch {
        setError("Unreadable service event");
      }
    };
    ws.onclose = () => {
      clearTimeout(deadline);
      if (!alive.current || socket.current !== ws) return;
      setStatus("offline");
      setTurns((current) =>
        current.map((turn) =>
          turn.status === "running"
            ? {
                ...turn,
                status: "failed",
                error: "Connection lost. Reconnect and retry this question.",
              }
            : turn,
        ),
      );
      timer.current = setTimeout(
        connect,
        Math.min(30000, 1000 * 2 ** retries.current++),
      );
    };
    ws.onerror = () => setError("The realtime connection is unavailable.");
  }, []);
  useEffect(() => {
    alive.current = true;
    session.current = crypto.randomUUID();
    api<{ user: { id: string } }>("auth/me")
      .then(async (identity) => {
        if (!alive.current) return;
        if (!isRecord(identity.user) || typeof identity.user.id !== "string")
          throw new Error("Invalid session");
        owner.current = identity.user.id;
        const saved = await restoreConversation(owner.current);
        if (!alive.current) return;
        if (saved) {
          session.current = saved.session;
          setTurns(
            saved.turns.map((turn) =>
              turn.status === "running"
                ? {
                    ...turn,
                    status: "failed",
                    error:
                      "This run was interrupted. Send a new question to continue.",
                  }
                : turn,
            ),
          );
        }
        setReady(true);
        connect();
      })
      .catch(() => {
        location.replace("/login");
      });
    api<{ data: unknown[] }>("models")
      .then((value) => {
        if (!Array.isArray(value.data))
          throw new Error("Invalid model catalog");
        const valid = value.data.filter(
          (x): x is Model =>
            isRecord(x) &&
            typeof x.id === "string" &&
            typeof x.name === "string" &&
            typeof x.provider === "string" &&
            typeof x.available === "boolean" &&
            Array.isArray(x.capabilities),
        );
        setModels(valid);
        setModel(
          valid.find((x) => x.available && x.capabilities.includes("chat"))
            ?.id ||
            valid.find((x) => x.capabilities.includes("chat"))?.id ||
            "",
        );
      })
      .catch((e) => setError(e.message));
    return () => {
      alive.current = false;
      if (timer.current) clearTimeout(timer.current);
      socket.current?.close();
    };
  }, [connect]);
  useEffect(() => {
    if (!ready || !owner.current) return;
    const revision = JSON.stringify(
      turns.map((turn) => [
        turn.id,
        turn.status,
        turn.events.length,
        turn.question,
      ]),
    );
    if (revision === savedRevision.current) return;
    savedRevision.current = revision;
    saveConversation(owner.current, session.current, turns);
  }, [turns, ready]);
  function send(text: string) {
    if (socket.current?.readyState !== WebSocket.OPEN || !text.trim())
      return false;
    const active = turns.findLast((turn) => turn.status === "running");
    if (active) {
      socket.current.send(
        JSON.stringify({
          type: "chat.steer",
          run_id: active.id,
          text: text.trim(),
        }),
      );
      setTurns((current) =>
        current.map((turn) =>
          turn.id === active.id
            ? {
                ...turn,
                question: `${turn.question}
↳ ${text.trim()}`,
              }
            : turn,
        ),
      );
      return true;
    }
    const id = crypto.randomUUID();
    setTurns((current) => [
      ...current,
      { id, question: text.trim(), events: [], text: "", status: "running" },
    ]);
    socket.current.send(
      JSON.stringify({
        type: "chat.message",
        request_id: id,
        session_id: session.current,
        text: text.trim(),
        model,
        language,
        context: turns.slice(-6).flatMap((turn) => [
          { role: "user", content: turn.question },
          ...(turn.answer
            ? [
                {
                  role: "assistant",
                  content: turn.answer.summary.slice(0, 12000),
                },
              ]
            : []),
        ]),
      }),
    );
    return true;
  }
  function stop() {
    const active = turns.findLast((turn) => turn.status === "running");
    if (active && socket.current?.readyState === WebSocket.OPEN)
      socket.current.send(
        JSON.stringify({ type: "chat.cancel", run_id: active.id }),
      );
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportTurns(turns)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `tomi-${session.current}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return {
    turns,
    forget: forgetConversation,
    models,
    model,
    setModel,
    status,
    error,
    setError,
    ready,
    send,
    stop,
    download,
    clear: () => {
      stop();
      setTurns([]);
      session.current = crypto.randomUUID();
      saveConversation(owner.current, session.current, []);
    },
    reconnect: () => {
      if (timer.current) clearTimeout(timer.current);
      connect();
    },
    onEvent,
    session,
  };
}
