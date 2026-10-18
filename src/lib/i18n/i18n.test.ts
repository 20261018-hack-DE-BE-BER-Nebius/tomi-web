import { expect, test } from "bun:test";
import { dictionaries } from "./index";

test("all four languages cover the same interface", () => {
  const keys = Object.keys(dictionaries.en).sort();
  for (const labels of Object.values(dictionaries)) {
    expect(Object.keys(labels).sort()).toEqual(keys);
    expect(Object.values(labels).every((text) => text.trim().length > 0)).toBe(
      true,
    );
  }
});
