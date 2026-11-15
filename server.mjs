// Server for "Earth Trend Detective": serves the built app (dist/) and answers the Detective at /api/ask.
// The API key stays on this machine (in .env) and is never sent to the browser.
// Run:  npm run build && npm run server     then open http://localhost:3000
// The question-answering code is shared with the AWS Lambda version (lambda/ask.mjs).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { answer, provider } from "./lambda/ask.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
try {
  for (const l of fs.readFileSync(path.join(here, ".env"), "utf8").split(/\r?\n/)) {
    const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
  }
} catch {}

const PROVIDER = provider();
const PORT = +process.env.PORT || 3000;
const DIST = path.join(here, "dist");
if (!PROVIDER) console.warn("No ANTHROPIC_API_KEY or GEMINI_API_KEY in .env: the Detective will use its built-in answers.");

const hits = new Map();
const limited = (ip) => { const now = Date.now(), a = (hits.get(ip) || []).filter((t) => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 15; };
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json" }); res.end(JSON.stringify(obj)); };
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".json": "application/json", ".ico": "image/x-icon" };

http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://x");
  if (req.method === "GET" && url.pathname === "/api/health") return send(res, 200, { ok: true, provider: PROVIDER });
  if (req.method === "POST" && url.pathname === "/api/ask") {
    if (limited(req.socket.remoteAddress)) return send(res, 429, { error: "rate_limited", scope: "visitor_minute", retryAfter: 60 });
    let body = "";
    for await (const c of req) { body += c; if (body.length > 120000) return send(res, 413, { error: "too_large" }); }
    const [status, out] = await answer(body);
    return send(res, status, out);
  }
  if (req.method === "GET") {
    // Static files from dist/, falling back to index.html
    const file = path.join(DIST, path.normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, ""));
    const target = file.startsWith(DIST) && fs.existsSync(file) && fs.statSync(file).isFile() ? file : path.join(DIST, "index.html");
    if (!fs.existsSync(target)) return send(res, 404, { error: "run npm run build first" });
    res.writeHead(200, { "Content-Type": TYPES[path.extname(target)] || "application/octet-stream" });
    return fs.createReadStream(target).pipe(res);
  }
  send(res, 404, { error: "not_found" });
}).listen(PORT, "127.0.0.1", () => console.log(`Open http://localhost:${PORT}  (Detective: ${PROVIDER || "built-in answers"})`));
