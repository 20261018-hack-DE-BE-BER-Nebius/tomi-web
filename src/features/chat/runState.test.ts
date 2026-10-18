import { describe, expect, test } from "bun:test";
import type { RunEvent, Turn } from "@/lib/types";
import { applyEvent } from "./runState";

const pending: Turn = {
  id: "request-1",
  question: "Compare",
  events: [],
  text: "",
  status: "running",
};
const event = (
  type: string,
  run_id = "run-1",
  data: Record<string, unknown> = {},
): RunEvent => ({ type, run_id, timestamp: "2026-10-18T18:00:00Z", data });
describe("real run reducer", () => {
  test("binds service run IDs and appends only matching events", () => {
    const begun = applyEvent([pending], event("run.started"));
    expect(begun[0].id).toBe("run-1");
    expect(
      applyEvent(begun, event("answer.delta", "run-1", { text: "Evidence" }))[0]
        .text,
    ).toBe("Evidence");
    expect(
      applyEvent(begun, event("answer.delta", "other", { text: "Injected" }))[0]
        .text,
    ).toBe("");
  });
  test("a steering successor keeps the audit trail and replaces partial text", () => {
    const begun = applyEvent([pending], event("run.started"));
    begun[0].text = "Partial";
    const steered = applyEvent(
      begun,
      event("run.steered", "run-2", { previous_run_id: "run-1" }),
    );
    expect(steered[0].id).toBe("run-2");
    expect(steered[0].text).toBe("");
    expect(steered[0].events).toHaveLength(2);
    expect(
      applyEvent(steered, event("answer.delta", "run-2", { text: "New" }))[0]
        .text,
    ).toBe("New");
  });
  test("invalid evidence cannot appear as a successful answer", () => {
    const begun = applyEvent([pending], event("run.started"));
    const result = applyEvent(
      begun,
      event("answer.completed", "run-1", { title: "Trust me" }),
    );
    expect(result[0].status).toBe("failed");
    expect(result[0].answer).toBeUndefined();
  });
  test("pre-start failure clears the pending run", () => {
    expect(
      applyEvent(
        [pending],
        event("run.failed", "run-1", { message: "Not configured" }),
      )[0].status,
    ).toBe("failed");
  });
  test("cancel events do not imply a completed answer", () => {
    const begun = applyEvent([pending], event("run.started"));
    expect(applyEvent(begun, event("run.cancelled"))[0].status).toBe(
      "cancelled",
    );
  });
});
