import { api } from "@/lib/api/client";
import { isRecord, parseAnswer, parseEvent, type Turn } from "@/lib/types";

export const CONVERSATION_KEY = "tomi-active-conversation-v1";
export const CONVERSATION_CHANGED = "tomi-conversation-changed";
const MAX_BYTES = 2_000_000;
export interface Conversation {
  format: "tomi-active-conversation-v1";
  owner: string;
  session: string;
  turns: Turn[];
}
export function parseConversation(
  value: unknown,
  owner: string,
): Conversation | null {
  if (
    !isRecord(value) ||
    value.format !== CONVERSATION_KEY ||
    value.owner !== owner ||
    typeof value.session !== "string" ||
    !/^[a-zA-Z0-9-]{1,64}$/.test(value.session) ||
    !Array.isArray(value.turns) ||
    value.turns.length > 200
  )
    return null;
  const turns: Turn[] = [];
  for (const item of value.turns) {
    if (
      !isRecord(item) ||
      typeof item.id !== "string" ||
      typeof item.question !== "string" ||
      typeof item.text !== "string" ||
      !Array.isArray(item.events) ||
      item.events.length > 1000 ||
      !["running", "completed", "failed", "cancelled"].includes(
        String(item.status),
      )
    )
      return null;
    const events = item.events.map(parseEvent);
    const answer =
      item.answer === undefined ? undefined : parseAnswer(item.answer);
    if (
      events.some((event) => !event) ||
      answer === null ||
      (item.status === "completed" && !answer)
    )
      return null;
    turns.push({
      id: item.id,
      question: item.question,
      text: item.text,
      status: item.status as Turn["status"],
      events: events as Turn["events"],
      ...(answer ? { answer } : {}),
      ...(typeof item.error === "string" ? { error: item.error } : {}),
    });
  }
  return { format: CONVERSATION_KEY, owner, session: value.session, turns };
}
export function readConversation(owner: string): Conversation | null {
  try {
    const raw = localStorage.getItem(CONVERSATION_KEY);
    return raw && raw.length <= MAX_BYTES
      ? parseConversation(JSON.parse(raw), owner)
      : null;
  } catch {
    return null;
  }
}
export function saveConversation(
  owner: string,
  session: string,
  turns: Turn[],
): boolean {
  const snapshot: Conversation = {
    format: CONVERSATION_KEY,
    owner,
    session,
    turns: turns.slice(-100),
  };
  let raw = JSON.stringify(snapshot);
  while (raw.length > MAX_BYTES && snapshot.turns.length > 1) {
    snapshot.turns.shift();
    raw = JSON.stringify(snapshot);
  }
  try {
    if (raw.length > MAX_BYTES) return false;
    localStorage.setItem(CONVERSATION_KEY, raw);
    window.dispatchEvent(new Event(CONVERSATION_CHANGED));
    return true;
  } catch {
    return false;
  }
}
export function forgetConversation() {
  try {
    localStorage.removeItem(CONVERSATION_KEY);
  } catch {
    /* Storage may be disabled. */
  }
  window.dispatchEvent(new Event(CONVERSATION_CHANGED));
}

/** Server history is an event log, not a generated answer or a fixture. */
export function mergeHistory(local: Turn[], value: unknown): Turn[] {
  if (!isRecord(value) || !Array.isArray(value.events)) return local;
  const turns = new Map(local.map((turn) => [turn.id, { ...turn }]));
  for (const raw of value.events) {
    const event = parseEvent(raw);
    if (!event) continue;
    if (
      event.type === "run.steered" &&
      typeof event.data.previous_run_id === "string"
    ) {
      const previous = turns.get(event.data.previous_run_id);
      if (previous) {
        turns.delete(previous.id);
        const successor = turns.get(event.run_id);
        turns.set(
          event.run_id,
          successor || {
            ...previous,
            id: event.run_id,
            answer: undefined,
            text: "",
            status: "running",
          },
        );
      }
    }
    let turn = turns.get(event.run_id);
    if (
      !turn &&
      event.type === "run.started" &&
      typeof event.data.question === "string"
    ) {
      turn = {
        id: event.run_id,
        question: event.data.question,
        status: "running",
        text: "",
        events: [],
      };
      turns.set(event.run_id, turn);
    }
    if (!turn) continue;
    if (event.type === "run.started" && typeof event.data.question === "string")
      turn.question = event.data.question;
    if (
      event.type !== "answer.delta" &&
      !turn.events.some(
        (e) => e.type === event.type && e.timestamp === event.timestamp,
      )
    ) {
      turn.events = [...turn.events, event].slice(-1000);
    }
    if (event.type === "answer.completed") {
      const answer = parseAnswer(event.data);
      if (answer) {
        turn.answer = answer;
        turn.status = "completed";
      }
    }
    if (!turn.answer && event.type === "run.failed") {
      turn.status = "failed";
      turn.error =
        typeof event.data.message === "string"
          ? event.data.message
          : "Run failed";
    }
    if (!turn.answer && event.type === "run.cancelled")
      turn.status = "cancelled";
  }
  return [...turns.values()];
}
export async function restoreConversation(
  owner: string,
): Promise<Conversation | null> {
  const saved = readConversation(owner);
  if (!saved) return null;
  try {
    const history = await api<unknown>("history", {
      conversation_id: saved.session,
    });
    const current = readConversation(owner);
    if (current && current.session !== saved.session) return current;
    return {
      ...saved,
      turns: mergeHistory(current?.turns || saved.turns, history),
    };
  } catch {
    return saved;
  }
}
