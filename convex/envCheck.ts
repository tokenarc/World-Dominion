import { action } from "./_generated/server";

export const validateEnv = action(async () => {
  const issues = [];
  const checks = {
    BOT_TOKEN: {
      exists: !!process.env.BOT_TOKEN,
      length: process.env.BOT_TOKEN?.length || 0,
      valid: (process.env.BOT_TOKEN?.length || 0) > 20,
    },
    WEBHOOK_SECRET: {
      exists: !!process.env.WEBHOOK_SECRET,
      length: process.env.WEBHOOK_SECRET?.length || 0,
    },
    MINI_APP_URL: {
      exists: !!process.env.MINI_APP_URL,
      valid: process.env.MINI_APP_URL?.includes("vercel.app"),
    },
    CONVEX_SITE: {
      exists: !!process.env.CONVEX_SITE,
      valid: process.env.CONVEX_SITE?.includes("convex.site"),
    },
  };

  Object.entries(checks).forEach(([key, check]) => {
    if (!check.exists) {
      issues.push(`${key} is NOT set`);
    } else if ('valid' in check && !check.valid) {
      issues.push(`${key} has invalid value: ${JSON.stringify(check)}`);
    }
  });

  return {
    allValid: issues.length === 0,
    issues,
    checks,
    timestamp: Date.now(),
  };
});