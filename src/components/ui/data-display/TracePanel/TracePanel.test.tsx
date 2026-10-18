import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { TracePanel } from "./TracePanel";

test("trace renders supplied events without inventing activity", () => {
  const empty = renderToStaticMarkup(
    <TracePanel events={[]} label="Activity" note="Real events" />,
  );
  expect(empty).not.toContain("tool.completed");
  const html = renderToStaticMarkup(
    <TracePanel
      label="Activity"
      note="Real events"
      events={[
        {
          type: "tool.completed",
          run_id: "r",
          timestamp: "2026-10-18T18:00:00Z",
          data: { tool: "retrieve", result: "<script>" },
        },
      ]}
    />,
  );
  expect(html).toContain("tool.completed");
  expect(html).not.toContain("<script>");
});
