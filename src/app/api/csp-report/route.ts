export async function POST(request: Request) {
  if (Number(request.headers.get("content-length") || 0) > 16000)
    return new Response(null, { status: 413 });
  const body = await request.text();
  if (body.length > 16000) return new Response(null, { status: 413 });
  return new Response(null, { status: 204 });
}
