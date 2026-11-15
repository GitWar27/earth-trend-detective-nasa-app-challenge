// AWS Lambda handler for the Detective, reached through CloudFront at /api/* (Lambda function URL origin).
// Environment: GEMINI_API_KEY (or ANTHROPIC_API_KEY), ORIGIN_SECRET (sent by CloudFront as x-origin-verify),
// LIMIT_TABLE (DynamoDB table for rate limits), optional LIMIT_IP_PER_MINUTE, LIMIT_IP_PER_DAY, LIMIT_SITE_PER_DAY.
import { answer, provider } from "./ask.mjs";
import { checkLimits } from "./limit.mjs";

const reply = (statusCode, obj, extra = {}) => ({
  statusCode, headers: { "content-type": "application/json", "cache-control": "no-store", ...extra }, body: JSON.stringify(obj),
});

export async function handler(event) {
  const h = event.headers || {};
  // Only CloudFront knows the secret, so the function URL cannot be called directly
  if (!process.env.ORIGIN_SECRET || h["x-origin-verify"] !== process.env.ORIGIN_SECRET) return reply(403, { error: "forbidden" });
  const method = event.requestContext?.http?.method, path = event.rawPath || "";
  if (method === "GET" && path === "/api/health") return reply(200, { ok: true, provider: provider() });
  if (method !== "POST" || path !== "/api/ask") return reply(404, { error: "not_found" });
  const ip = (h["x-forwarded-for"] || "").split(",")[0].trim() || event.requestContext?.http?.sourceIp || "?";
  const blocked = await checkLimits(ip);
  if (blocked) return reply(429, { error: "rate_limited", ...blocked }, { "retry-after": String(blocked.retryAfter) });
  const body = event.isBase64Encoded ? Buffer.from(event.body || "", "base64").toString("utf8") : event.body || "";
  const [status, out] = await answer(body);
  return reply(status, out);
}
