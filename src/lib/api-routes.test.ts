import { describe, expect, test } from "bun:test";
import { isAllowedApiPath } from "./api-routes";

describe("BFF route allowlist", () => {
  test("forwards saved history to the implemented backend endpoint", () => {
    expect(isAllowedApiPath("history")).toBe(true);
  });

  test("forwards audio transcription to the implemented backend endpoint", () => {
    expect(isAllowedApiPath("audio/transcriptions")).toBe(true);
  });

  test("keeps the additions exact and rejects alternate or nested routes", () => {
    for (const path of [
      "history/",
      "history/private",
      "historyevil",
      "/history",
      "../history",
      "audio",
      "audio/diarize",
      "audio/transcriptions/private",
      "audio/transcriptions/",
      "audio//transcriptions",
      "audio%2ftranscriptions",
    ]) {
      expect(isAllowedApiPath(path)).toBe(false);
    }
  });

  test("retains existing authentication, model and inference routes", () => {
    for (const path of [
      "auth/demo",
      "auth/login",
      "auth/logout",
      "auth/me",
      "models",
      "images/generations",
      "realtime/session",
      "realtime/connect",
      "diarize",
    ]) {
      expect(isAllowedApiPath(path)).toBe(true);
    }
  });
});
