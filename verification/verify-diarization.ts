import { createHash } from "node:crypto";
import {
  encodeRecording,
  parseDiarization,
} from "../src/features/voice/diarization";

const origin = process.env.DIARIZATION_TEST_ORIGIN;
const audioPath = process.env.DIARIZATION_TEST_AUDIO;
const output = process.env.DIARIZATION_TEST_RECEIPT;
if (!origin || !audioPath || !output)
  throw new Error(
    "Set DIARIZATION_TEST_ORIGIN, DIARIZATION_TEST_AUDIO and DIARIZATION_TEST_RECEIPT explicitly.",
  );
const target = new URL(origin);
if (
  target.origin !== origin ||
  target.username ||
  target.password ||
  !(
    target.protocol === "https:" ||
    (target.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(target.hostname))
  )
)
  throw new Error("Expected an HTTPS origin or local test origin.");
if (await Bun.file(output).exists())
  throw new Error("Refusing to overwrite a prior receipt.");
const file = Bun.file(audioPath);
const body = await encodeRecording(file);
const headers: Record<string, string> = {
  Origin: origin,
  "Content-Type": "application/json",
};
const login = await fetch(`${origin}/api/auth/demo`, {
  method: "POST",
  headers,
  body: "{}",
  redirect: "error",
});
if (!login.ok)
  throw new Error(`Demo authentication failed: HTTP ${login.status}`);
headers.Cookie = login.headers
  .getSetCookie()
  .map((item) => item.split(";")[0])
  .join("; ");
if (!headers.Cookie)
  throw new Error("Demo authentication returned no session cookie.");
try {
  const started = performance.now();
  const response = await fetch(`${origin}/api/diarize`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000),
    redirect: "error",
  });
  const value: unknown = await response.json();
  const parsed = parseDiarization(value);
  const receipt = {
    observed_at: new Date().toISOString(),
    origin,
    route: "/api/diarize",
    class: "actual selected-file HTTP inference; not microphone capture",
    audio_bytes: file.size,
    audio_sha256: createHash("sha256")
      .update(new Uint8Array(await file.arrayBuffer()))
      .digest("hex"),
    http_status: response.status,
    duration_seconds: Math.round((performance.now() - started) / 10) / 100,
    parsed: Boolean(parsed),
    response: parsed,
    passed: response.ok && Boolean(parsed),
  };
  const child = Bun.spawn(
    ["bunx", "biome", "format", "--stdin-file-path=receipt.json"],
    { stdin: "pipe", stdout: "pipe", stderr: "pipe" },
  );
  child.stdin.write(JSON.stringify(receipt));
  child.stdin.end();
  const formatted = await new Response(child.stdout).text();
  if (await child.exited) throw new Error("Receipt formatting failed");
  await Bun.write(output, formatted);
  console.log(
    JSON.stringify({
      passed: receipt.passed,
      http_status: response.status,
      segments: parsed?.segments.length || 0,
      anonymous_speakers: new Set(
        parsed?.segments.map((segment) => segment.speaker),
      ).size,
    }),
  );
  if (!receipt.passed) process.exitCode = 1;
} finally {
  await fetch(`${origin}/api/auth/logout`, {
    method: "POST",
    headers,
    body: "{}",
    redirect: "error",
  });
}
