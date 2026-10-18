import { parseAnswer, type RunEvent, type Turn } from "@/lib/types";
export function applyEvent(turns: Turn[], event: RunEvent): Turn[] {
  let index = turns.findIndex((turn) => turn.id === event.run_id);
  if (
    event.type === "run.steered" &&
    typeof event.data.previous_run_id === "string"
  ) {
    index = turns.findIndex((turn) => turn.id === event.data.previous_run_id);
  }
  if (index < 0 && ["run.started", "run.failed"].includes(event.type))
    index = turns.findIndex(
      (turn) => turn.status === "running" && turn.events.length === 0,
    );
  if (index < 0) return turns;
  return turns.map((turn, i) => {
    if (i !== index) return turn;
    const next = {
      ...turn,
      id: event.run_id,
      events:
        event.type === "answer.delta"
          ? turn.events
          : [...turn.events, event].slice(-1000),
    };
    if (event.type === "run.steered") {
      next.text = "";
      next.answer = undefined;
      next.error = undefined;
      next.status = "running";
    }
    if (event.type === "answer.delta" && typeof event.data.text === "string")
      next.text += event.data.text;
    if (event.type === "answer.completed") {
      const answer = parseAnswer(event.data);
      if (answer) {
        next.answer = answer;
        next.status = "completed";
      } else {
        next.status = "failed";
        next.error = "The service returned an invalid evidence answer.";
      }
    }
    if (event.type === "run.failed") {
      next.status = "failed";
      next.error =
        typeof event.data.message === "string"
          ? event.data.message
          : "The run failed.";
    }
    if (event.type === "run.cancelled") next.status = "cancelled";
    return next;
  });
}
export function exportTurns(turns: Turn[]) {
  return JSON.stringify(
    {
      format: "tomi-evidence-conversation-v1",
      exported_at: new Date().toISOString(),
      turns,
    },
    null,
    2,
  );
}
