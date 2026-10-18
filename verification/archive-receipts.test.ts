import { expect, test } from "bun:test";
import { createHash } from "node:crypto";

test("public reviewed cases retain all six exact original receipt byte hashes", async () => {
  const manifest = await Bun.file(
    new URL(
      "../public/archive/assets/reviewed-six-cases.json",
      import.meta.url,
    ),
  ).json();
  expect(manifest.cases).toHaveLength(6);
  expect(manifest.successful_cases).toBe(3);
  expect(manifest.failed_cases).toBe(3);
  for (const item of manifest.cases) {
    expect(item.receipt_url).toMatch(/^receipts\/[a-z0-9-]+\.json$/);
    if (!/^receipts\/[a-z0-9-]+\.json$/.test(item.receipt_url))
      throw new Error("Invalid receipt path");
    const original = Bun.file(
      new URL(`../public/archive/${item.receipt_url}`, import.meta.url),
    );
    expect(await original.exists()).toBe(true);
    const hash = createHash("sha256")
      .update(new Uint8Array(await original.arrayBuffer()))
      .digest("hex");
    expect(hash).toBe(item.receipt_sha256);
  }
});
