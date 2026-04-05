import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { telegramWebhook } from "./telegram";

const http = httpRouter();

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async (_ctx, _request) => {
    return new Response(
      JSON.stringify({ status: "ok", timestamp: Date.now() }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  }),
});

http.route({
  path: "/telegram",
  method: "POST",
  handler: telegramWebhook,
});

export default http;