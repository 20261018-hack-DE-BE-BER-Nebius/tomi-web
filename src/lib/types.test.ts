import { expect, test } from "bun:test";
import { parseAnswer, parseEvent, safeSourceUrl } from "./types";

test("rejects active and credential-bearing citation URLs", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "http://example.com",
    "https://user:pass@example.com",
  ])
    expect(safeSourceUrl(url)).toBeUndefined();
  expect(safeSourceUrl("https://en.wikipedia.org/wiki/Electricity")).toContain(
    "wikipedia.org",
  );
});
test("validates event and answer boundaries", () => {
  expect(parseEvent({ type: "answer.completed", data: {} })).toBeNull();
  expect(
    parseAnswer({
      title: "A",
      summary: "B",
      categories: [],
      evidence: [
        {
          id: "x",
          title: "a",
          url: "https://example.com",
          source: "unknown",
          excerpt: "bad",
        },
      ],
      uncertainty: [],
    }),
  ).toBeNull();
  expect(
    parseAnswer({
      title: "A",
      summary: "B",
      categories: [],
      evidence: [],
      uncertainty: ["No evidence"],
    }),
  ).not.toBeNull();
});
