import { expect, test } from "bun:test";
import {
  CONVERSATION_KEY,
  mergeHistory,
  parseConversation,
} from "./conversation";

const answer = {
  title: "Recorded answer",
  summary: "Actual source comparison",
  categories: [],
  evidence: [],
  uncertainty: [],
};
const snapshot = {
  format: CONVERSATION_KEY,
  owner: "alice",
  session: "abc-123",
  turns: [],
};
test("conversation restore is account scoped and validates session and content", () => {
  expect(parseConversation(snapshot, "alice")?.session).toBe("abc-123");
  expect(parseConversation(snapshot, "bob")).toBeNull();
  expect(
    parseConversation({ ...snapshot, session: "alice:other" }, "alice"),
  ).toBeNull();
  expect(
    parseConversation({ ...snapshot, turns: [{ answer }] }, "alice"),
  ).toBeNull();
});
test("restores actual server answers and events without inventing answers for incomplete runs", () => {
  const events = [
    {
      type: "run.started",
      run_id: "r1",
      timestamp: "1",
      data: { question: "Shipbuilding" },
    },
    {
      type: "tool.completed",
      run_id: "r1",
      timestamp: "2",
      data: { name: "search" },
    },
    { type: "answer.completed", run_id: "r1", timestamp: "3", data: answer },
    {
      type: "run.started",
      run_id: "r2",
      timestamp: "4",
      data: { question: "Incomplete" },
    },
  ];
  const restored = mergeHistory([], { events });
  expect(restored[0].answer).toEqual(answer);
  expect(restored[0].events).toHaveLength(3);
  expect(restored[1].answer).toBeUndefined();
  expect(mergeHistory(restored, { events })[0].events).toHaveLength(3);
});
test("a steered history replaces the prior run and retains the successor answer", () => {
  const events = [
    {
      type: "run.started",
      run_id: "old",
      timestamp: "1",
      data: { question: "Initial" },
    },
    {
      type: "run.steered",
      run_id: "new",
      timestamp: "2",
      data: { previous_run_id: "old" },
    },
    {
      type: "run.started",
      run_id: "new",
      timestamp: "3",
      data: { question: "Refined" },
    },
    { type: "answer.completed", run_id: "new", timestamp: "4", data: answer },
  ];
  const restored = mergeHistory([], { events });
  expect(restored).toHaveLength(1);
  expect(restored[0].id).toBe("new");
  expect(restored[0].question).toBe("Refined");
  expect(
    mergeHistory(restored, { events: events.slice(0, -1) })[0].answer,
  ).toEqual(answer);
  expect(restored[0].answer).toEqual(answer);
});
