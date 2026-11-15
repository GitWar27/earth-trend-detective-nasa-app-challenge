// Answers a Detective question with Claude or Gemini. Shared by server.mjs (local) and index.mjs (AWS Lambda).
// Uses Claude if ANTHROPIC_API_KEY is set, otherwise Gemini with GEMINI_API_KEY.
// Settings are read on each call, because server.mjs loads .env after this module is imported.

function config() {
  const env = process.env;
  const claudeKey = env.ANTHROPIC_API_KEY;
  const geminiKey = env.GEMINI_API_KEY || env.VITE_GEMINI_API_KEY;
  return {
    provider: claudeKey ? "claude" : geminiKey ? "gemini" : null,
    claudeKey, geminiKey,
    claudeModel: env.CLAUDE_MODEL || "claude-sonnet-5-5",
    // flash-lite answers in about a second; larger models were overloaded or slow on the free tier
    geminiModel: env.GEMINI_MODEL || "gemini-3.5-flash-lite",
  };
}

export const provider = () => config().provider;

async function askClaude(c, system, messages) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", signal: AbortSignal.timeout(25000),
    headers: { "x-api-key": c.claudeKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({ model: c.claudeModel, max_tokens: 900, system, messages }),
  });
  const out = await r.json();
  if (!r.ok) throw new Error("Claude API " + r.status + " " + JSON.stringify(out).slice(0, 300));
  return (out.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
}

// Gemini's Interactions API: new keys cannot use the older generateContent endpoint.
// store:false keeps it stateless, so the whole conversation is sent each time.
async function askGemini(c, system, messages) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
    method: "POST", signal: AbortSignal.timeout(25000),
    headers: { "x-goog-api-key": c.geminiKey, "content-type": "application/json", "Api-Revision": "2026-05-20" },
    body: JSON.stringify({
      model: c.geminiModel, store: false, system_instruction: system,
      input: messages.map((m) => m.role === "assistant"
        ? { type: "model_output", content: [{ type: "text", text: m.content }] }
        : { type: "user_input", content: m.content }),
      generation_config: { max_output_tokens: 900 },
    }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error("Gemini API " + r.status + " " + JSON.stringify(out).slice(0, 300));
  return (out.steps || []).filter((s) => s.type === "model_output")
    .flatMap((s) => s.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
}

// Takes the raw JSON request body; returns [status, response object]
export async function answer(rawBody) {
  const c = config();
  if (!c.provider) return [503, { error: "no_key" }];
  if (rawBody.length > 120000) return [413, { error: "too_large" }];
  let j; try { j = JSON.parse(rawBody); } catch { return [400, { error: "bad_json" }]; }
  const system = String(j.system || "").slice(0, 40000);
  const messages = (Array.isArray(j.messages) ? j.messages : []).slice(-8)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", content: String(m.content || "").slice(0, 4000) }));
  if (!system || !messages.length || messages[messages.length - 1].role !== "user") return [400, { error: "bad_request" }];
  try {
    const text = c.provider === "claude" ? await askClaude(c, system, messages) : await askGemini(c, system, messages);
    return text.trim() ? [200, { text }] : [502, { error: "empty" }];
  } catch (e) {
    console.error(String(e.message || e));
    return [502, { error: "upstream_failed" }];
  }
}
