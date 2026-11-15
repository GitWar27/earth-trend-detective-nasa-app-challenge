// Rate limits for AI calls, shared by every Lambda instance through a DynamoDB table.
// Counters are keyed by a hash of the visitor's IP (never the IP itself) and expire after a day (DynamoDB TTL).
// Limits can be changed with environment variables, without new code.
import { createHash } from "node:crypto";
import { DynamoDBClient, UpdateItemCommand } from "@aws-sdk/client-dynamodb";

const db = new DynamoDBClient({});
const num = (name, fallback) => +(process.env[name] || fallback);

async function bump(table, key, ttlSeconds) {
  const out = await db.send(new UpdateItemCommand({
    TableName: table,
    Key: { pk: { S: key } },
    UpdateExpression: "ADD n :one SET #ttl = if_not_exists(#ttl, :ttl)",
    ExpressionAttributeNames: { "#ttl": "ttl" },
    ExpressionAttributeValues: { ":one": { N: "1" }, ":ttl": { N: String(Math.floor(Date.now() / 1000) + ttlSeconds) } },
    ReturnValues: "UPDATED_NEW",
  }));
  return +out.Attributes.n.N;
}

// Returns null if the call may go ahead, otherwise { scope, retryAfter } (seconds)
export async function checkLimits(ip) {
  const table = process.env.LIMIT_TABLE;
  if (!table) return null;
  const now = Date.now(), minute = Math.floor(now / 60000), day = new Date(now).toISOString().slice(0, 10);
  const who = createHash("sha256").update((process.env.ORIGIN_SECRET || "") + ip).digest("hex").slice(0, 24);
  const toNextMinute = 60 - Math.floor((now / 1000) % 60);
  const toNextDay = Math.ceil((Date.parse(day + "T00:00:00Z") + 86400000 - now) / 1000);
  try {
    const [perMinute, perDay] = await Promise.all([
      bump(table, `ip#${who}#m#${minute}`, 120),
      bump(table, `ip#${who}#d#${day}`, 90000),
    ]);
    if (perDay > num("LIMIT_IP_PER_DAY", 50)) return { scope: "visitor_day", retryAfter: toNextDay };
    if (perMinute > num("LIMIT_IP_PER_MINUTE", 5)) return { scope: "visitor_minute", retryAfter: toNextMinute };
    // Counted only for visitors within their own limits, so one visitor cannot use up the site's allowance
    if (await bump(table, `all#d#${day}`, 90000) > num("LIMIT_SITE_PER_DAY", 500)) return { scope: "site_day", retryAfter: toNextDay };
    return null;
  } catch (e) {
    // If the table is unreachable, let the call through rather than switch the AI off; Lambda's
    // account-wide concurrency limit still caps the damage
    console.error("rate limit check failed:", String(e.message || e));
    return null;
  }
}
