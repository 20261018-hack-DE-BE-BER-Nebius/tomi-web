const allowed =
  /^(auth\/(demo|login|logout|me)|models|health|history|audio\/transcriptions|images\/generations|realtime\/(session|connect)|diarize|sessions(?:\/[a-zA-Z0-9_-]+)?|pages|cases)$/;
export function isAllowedApiPath(path: string): boolean {
  return allowed.test(path);
}
