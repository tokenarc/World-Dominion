const https = require('https');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CONVEX_SITE_URL = process.env.CONVEX_SITE_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

if (!BOT_TOKEN || !CONVEX_SITE_URL) {
  console.error('Error: BOT_TOKEN and CONVEX_SITE_URL env vars are required');
  console.error('Usage: BOT_TOKEN=xxx CONVEX_SITE_URL=https://xxx.convex.cloud node set-webhook.js');
  process.exit(1);
}

const webhookUrl = `${CONVEX_SITE_URL}/telegram`;
const url = new URL(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`);

const postData = JSON.stringify({
  url: webhookUrl,
  ...(WEBHOOK_SECRET && { secret_token: WEBHOOK_SECRET })
});

const options = {
  hostname: url.hostname,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log(`Setting webhook to: ${webhookUrl}`);
if (WEBHOOK_SECRET) {
  console.log(`Using secret token: ${WEBHOOK_SECRET.substring(0, 8)}...`);
}

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const result = JSON.parse(data);
    if (result.ok) {
      console.log('Webhook set successfully!');
      console.log('Response:', result.result);
    } else {
      console.error('Failed to set webhook:', result.description);
      process.exit(1);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
  process.exit(1);
});

req.write(postData);
req.end();
