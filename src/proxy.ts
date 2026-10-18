import { type NextRequest, NextResponse } from "next/server";
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const staticArchive = request.nextUrl.pathname.startsWith("/archive/");
  const archivePdf = staticArchive && request.nextUrl.pathname.endsWith(".pdf");
  const csp = [
    "default-src 'self'",
    staticArchive
      ? "script-src 'self'"
      : `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
    `style-src 'self' 'nonce-${nonce}'`,
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "worker-src 'self'",
    request.nextUrl.pathname.startsWith("/archive/")
      ? "frame-src 'self'"
      : "frame-src 'none'",
    archivePdf ? "frame-ancestors 'self'" : "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "report-uri /api/csp-report",
    "report-to csp-endpoint",
  ].join("; ");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("Cache-Control", "no-store");
  if (archivePdf) response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("Reporting-Endpoints", 'csp-endpoint="/api/csp-report"');
  return response;
}
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|manifest.json|sw.js|offline.html).*)",
  ],
};
