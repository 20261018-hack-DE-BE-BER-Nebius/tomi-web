import { expect, test } from "bun:test";
import { parseReplay } from "./replay";

test("rejects unrelated JSON and invalid answers", () => {
  expect(parseReplay({ turns: [] })).toBeNull();
  expect(
    parseReplay({
      format: "tomi-evidence-conversation-v1",
      turns: [{ id: "x", question: "q", events: [], answer: { title: "x" } }],
    }),
  ).toBeNull();
});
test("accepts actual exported answer shape without manufacturing failed-run answers", () => {
  expect(
    parseReplay({
      format: "tomi-evidence-conversation-v1",
      turns: [{ id: "x", question: "q", events: [], status: "failed" }],
    }),
  ).toEqual([]);
  expect(
    parseReplay({
      format: "tomi-evidence-conversation-v1",
      turns: [
        {
          id: "x",
          question: "q",
          events: [],
          answer: {
            title: "A",
            summary: "S",
            categories: [],
            evidence: [],
            uncertainty: ["Missing sources"],
          },
        },
      ],
    }),
  ).toHaveLength(1);
});
