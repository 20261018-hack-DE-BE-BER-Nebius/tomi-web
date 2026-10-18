export function serverConfig() {
  const backendUrl = process.env.TOMI_BACKEND_URL;
  if (!backendUrl) throw new Error("TOMI_BACKEND_URL is required");
  const url = new URL(backendUrl);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password
  )
    throw new Error("Invalid backend URL");
  const publicOrigin = process.env.TOMI_PUBLIC_ORIGIN;
  if (!publicOrigin) throw new Error("TOMI_PUBLIC_ORIGIN is required");
  return { backendUrl: url.origin, publicOrigin: new URL(publicOrigin).origin };
}
