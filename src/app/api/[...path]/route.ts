import { type NextRequest, NextResponse } from "next/server";
import { isAllowedApiPath } from "@/lib/api-routes";
import { serverConfig } from "@/lib/config";

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const path = (await context.params).path.join("/");
  if (!isAllowedApiPath(path))
    return NextResponse.json(
      { error: { message: "Unknown route" } },
      { status: 404 },
    );
  if (
    request.method !== "GET" &&
    request.headers.get("origin") !== serverConfig().publicOrigin
  )
    return NextResponse.json(
      { error: { message: "Origin rejected" } },
      { status: 403 },
    );
  if (Number(request.headers.get("content-length") || 0) > 2_000_000)
    return NextResponse.json(
      { error: { message: "Request too large" } },
      { status: 413 },
    );
  try {
    const body = request.method === "GET" ? undefined : await request.text();
    if (body && new TextEncoder().encode(body).length > 2_000_000)
      return NextResponse.json(
        { error: { message: "Request too large" } },
        { status: 413 },
      );
    const response = await fetch(`${serverConfig().backendUrl}/api/${path}`, {
      method: request.method,
      headers: {
        "Content-Type":
          request.headers.get("content-type") || "application/json",
        Cookie: request.headers.get("cookie") || "",
        Origin: serverConfig().publicOrigin,
      },
      body,
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(120000),
    });
    const headers = new Headers({
      "Content-Type":
        response.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    });
    for (const cookie of response.headers.getSetCookie())
      headers.append("Set-Cookie", cookie);
    return new Response(response.body, { status: response.status, headers });
  } catch {
    return NextResponse.json(
      {
        error: {
          message:
            "The Tomi service is unavailable. Check the service connection and try again.",
        },
      },
      { status: 503 },
    );
  }
}
export const GET = proxy;
export const POST = proxy;
