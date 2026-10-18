import { expect, test } from "bun:test";
import { GET } from "./route";

test("archive redirect preserves the browser origin behind a reverse proxy", () => {
  const response = GET();
  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe("/archive/index.html");
});
