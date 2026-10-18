import {
  type Answer,
  isRecord,
  parseAnswer,
  parseEvent,
  type RunEvent,
} from "@/lib/types";
export interface Replay {
  id: string;
  question: string;
  answer: Answer;
  events: RunEvent[];
}
export function parseReplay(value: unknown): Replay[] | null {
  if (
    !isRecord(value) ||
    value.format !== "tomi-evidence-conversation-v1" ||
    !Array.isArray(value.turns) ||
    value.turns.length > 200
  )
    return null;
  const result: Replay[] = [];
  for (const turn of value.turns) {
    if (
      !isRecord(turn) ||
      typeof turn.id !== "string" ||
      typeof turn.question !== "string" ||
      !Array.isArray(turn.events)
    )
      return null;
    if (!turn.answer) continue;
    const answer = parseAnswer(turn.answer);
    if (!answer) return null;
    const events = turn.events.map(parseEvent);
    if (events.some((event) => event === null)) return null;
    result.push({
      id: turn.id,
      question: turn.question,
      answer,
      events: events as RunEvent[],
    });
  }
  return result;
}
