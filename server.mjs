import { createServer } from "node:http";
import next from "next";
import { WebSocket, WebSocketServer } from "ws";
import { runtimeConfig } from "./runtime-config.mjs";

const config = runtimeConfig();
const app = next({
  dev: config.dev,
  hostname: config.hostname,
  port: config.port,
});
await app.prepare();
const handler = app.getRequestHandler();
const server = createServer((request, response) => {
  response.setHeader("Connection", "close");
  handler(request, response).catch(() => {
    if (!response.headersSent) response.writeHead(500);
    response.end("Request failed");
  });
});
const sockets = new WebSocketServer({
  noServer: true,
  maxPayload: 1024 * 1024,
  perMessageDeflate: false,
});
server.on("upgrade", (request, socket, head) => {
  if (request.url !== "/ws") {
    socket.destroy();
    return;
  }
  if (request.headers.origin !== config.publicOrigin) {
    socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
    socket.destroy();
    return;
  }
  const target = new URL("/ws", config.backendUrl);
  target.protocol = target.protocol === "https:" ? "wss:" : "ws:";
  const upstream = new WebSocket(target, {
    headers: {
      Cookie: request.headers.cookie || "",
      Origin: config.publicOrigin,
    },
    handshakeTimeout: 10000,
    maxPayload: 1024 * 1024,
    perMessageDeflate: false,
  });
  socket.on("error", () => upstream.close());
  upstream.on("error", () => {
    if (!socket.destroyed) socket.destroy();
  });
  upstream.on("open", () => {
    if (socket.destroyed) {
      upstream.close();
      return;
    }
    sockets.handleUpgrade(request, socket, head, (client) => {
      client.on("message", (data, binary) => {
        if (
          upstream.readyState === WebSocket.OPEN &&
          upstream.bufferedAmount < 4 * 1024 * 1024
        )
          upstream.send(data, { binary });
        else client.close(1013, "Service busy");
      });
      upstream.on("message", (data, binary) => {
        if (
          client.readyState === WebSocket.OPEN &&
          client.bufferedAmount < 4 * 1024 * 1024
        )
          client.send(data, { binary });
        else upstream.close();
      });
      client.on("close", () => upstream.close());
      client.on("error", () => upstream.close());
      upstream.on("close", () =>
        client.close(1011, "Service connection closed"),
      );
    });
  });
});
server.listen(config.port, config.hostname, () =>
  console.info("Tomi web server ready"),
);
