import { httpRouter } from "convex/server";
import { telegramWebhook } from "./telegram";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: async () => {
    return new Response(JSON.stringify({ status: "ok", timestamp: Date.now() }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  },
});

http.route({
  path: "/telegram",
  method: "POST",
  handler: telegramWebhook,
});

export default http;