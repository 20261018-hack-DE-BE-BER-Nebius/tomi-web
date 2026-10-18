import WebSocket from "ws";
import {
  mergeHistory,
  parseConversation,
} from "../src/features/evidence/conversation";
import { parseReplay } from "../src/features/evidence/replay";
import { parseEvent } from "../src/lib/types";

const origin = process.env.CANVAS_TEST_ORIGIN;
if (!origin) throw new Error("Set CANVAS_TEST_ORIGIN");
const login = await fetch(`${origin}/api/auth/demo`, {
  method: "POST",
  headers: { Origin: origin, "Content-Type": "application/json" },
  body: "{}",
});
if (!login.ok) throw new Error(`Demo ${login.status}`);
const cookie = login.headers.get("set-cookie")?.split(";")[0];
if (!cookie) throw new Error("Session cookie missing");
const identity = (await login.json()) as { user: { id: string } };
const session = crypto.randomUUID();
const events: unknown[] = [];
const question =
  "Compare historical and modern shipbuilding techniques. Explain source limitations.";
await new Promise<void>((resolve, reject) => {
  const ws = new WebSocket(`${origin.replace(/^http/, "ws")}/ws`, {
    headers: { Origin: origin, Cookie: cookie },
  });
  const deadline = setTimeout(() => {
    ws.close();
    reject(new Error("Timed out"));
  }, 120000);
  ws.onopen = () =>
    ws.send(
      JSON.stringify({
        type: "chat.message",
        session_id: session,
        request_id: crypto.randomUUID(),
        text: question,
        model: "gpt-6-astra",
        language: "en",
      }),
    );
  ws.onmessage = (message) => {
    const event = parseEvent(JSON.parse(String(message.data)));
    if (!event) return;
    if (event.type !== "answer.delta") events.push(event);
    if (event.type === "answer.completed" || event.type === "run.failed") {
      clearTimeout(deadline);
      ws.close();
      resolve();
    }
  };
  ws.onerror = () => {
    clearTimeout(deadline);
    reject(new Error("WebSocket failed"));
  };
});
const response = await fetch(`${origin}/api/history`, {
  method: "POST",
  headers: {
    Origin: origin,
    Cookie: cookie,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ conversation_id: session }),
});
const history = await response.json();
const turns = mergeHistory([], history);
const snapshot = parseConversation(
  {
    format: "tomi-active-conversation-v1",
    owner: identity.user.id,
    session,
    turns,
  },
  identity.user.id,
);
const replay = parseReplay({
  format: "tomi-evidence-conversation-v1",
  turns: snapshot?.turns || [],
});
const last = events.at(-1) as { type: string };
const receipt = {
  observed_at: new Date().toISOString(),
  origin,
  history_http_status: response.status,
  actual_terminal_event: last.type,
  live_events: events,
  restored_answers: replay?.length,
  restored_sources: replay?.flatMap((run) => run.answer.evidence).length,
  cross_account_rejected:
    parseConversation(snapshot, "different-user") === null,
  result:
    last.type === "answer.completed" && response.ok && Boolean(replay?.length)
      ? "passed"
      : "failed",
};
await Bun.write(
  "verification/canvas-live-acceptance.json",
  JSON.stringify(receipt, null, 2),
);
await fetch(`${origin}/api/auth/logout`, {
  method: "POST",
  headers: {
    Origin: origin,
    Cookie: cookie,
    "Content-Type": "application/json",
  },
  body: "{}",
});
console.log(
  JSON.stringify({
    result: receipt.result,
    history: response.status,
    answers: receipt.restored_answers,
    sources: receipt.restored_sources,
    account_isolation: receipt.cross_account_rejected,
  }),
);
if (receipt.result !== "passed") process.exitCode = 1;
