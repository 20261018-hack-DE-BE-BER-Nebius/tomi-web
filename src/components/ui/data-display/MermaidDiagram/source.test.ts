import { expect, test } from "bun:test";
import { validateDiagramSource } from "./source";

test("diagram edits accept flowcharts while rejecting executable configuration and actions", () => {
  expect(
    validateDiagramSource("flowchart LR\n A[Browser] --> B[Rust API]"),
  ).toBe(true);
  expect(
    validateDiagramSource(
      'flowchart LR\n%%{init: {securityLevel:"loose"}}%%\nA-->B',
    ),
  ).toBe(false);
  expect(
    validateDiagramSource('flowchart LR\nclick A "https://example.com"'),
  ).toBe(false);
  expect(
    validateDiagramSource("flowchart LR\nA[<script>alert(1)</script>]"),
  ).toBe(false);
  expect(validateDiagramSource(`flowchart LR\n${"A".repeat(12000)}`)).toBe(
    false,
  );
});
