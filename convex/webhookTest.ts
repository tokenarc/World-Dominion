import { action } from "./_generated/server";

export const testWebhook = action(async () => {
  const botToken = process.env.BOT_TOKEN;
  const webhookSecret = process.env.WEBHOOK_SECRET;
  const convexSite = process.env.CONVEX_SITE;

  if (!botToken) {
    return {
      success: false,
      error: "BOT_TOKEN not set",
    };
  }

  const infoResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/getWebhookInfo`
  );
  const info = await infoResponse.json();

  const testResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: 123456789,
        text: "Webhook test",
      }),
    }
  );
  const testResult = await testResponse.json();

  return {
    success: true,
    webhookInfo: info,
    expectedUrl: `${convexSite}/telegram`,
    actualUrl: info.result?.url,
    urlMatch: info.result?.url === `${convexSite}/telegram`,
    secretSet: !!webhookSecret,
    testMessageResult: testResult,
  };
});