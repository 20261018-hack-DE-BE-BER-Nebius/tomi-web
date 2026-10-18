function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}
export function runtimeConfig() {
  const port = Number(required("PORT"));
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error("PORT must be valid");
  const backend = new URL(required("TOMI_BACKEND_URL"));
  const origin = new URL(required("TOMI_PUBLIC_ORIGIN"));
  if (
    !["http:", "https:"].includes(backend.protocol) ||
    backend.username ||
    backend.password
  )
    throw new Error("Invalid backend URL");
  return {
    port,
    hostname: required("HOSTNAME"),
    backendUrl: backend.origin,
    publicOrigin: origin.origin,
    dev: process.env.NODE_ENV === "development",
  };
}
