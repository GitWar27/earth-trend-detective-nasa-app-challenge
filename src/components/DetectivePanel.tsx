import { useState, useRef, useEffect } from 'react';
import { CITIES } from '../data/cities';
import { VARIABLES, getVarDefaultRange } from '../data/variables';
import { getSeriesForCityVar } from '../data/series';
import { runTrend, formatP, formatRate } from '../lib/stats';
import { NATIONAL_SERIES, ENSO_LINKS, TC_FLOOD_SHARE } from '../data/national';
import { ruleAnswer } from '../lib/detectiveRules';

// ── Build a compact data digest for the system prompt ────────────────────────
function buildDigest(): string {
  const lines: string[] = ['TREND RESULTS (Mann-Kendall + Sen slope; rate per decade):'];
  const varIds = ['tmin', 'tavg', 'tmax', 'lstn', 'lstd', 'rain', 'sr', 'rx1', 'srx', 'rh'];
  CITIES.forEach(city => {
    varIds.forEach(vid => {
      const s = getSeriesForCityVar(city.id, vid);
      if (!s) return;
      const varDef = VARIABLES[vid];
      const [from, to] = getVarDefaultRange(varDef);
      const res = runTrend(s, from, to);
      if (!res.ok) return;
      lines.push(`- ${city.name} | ${varDef.label} | ${res.years[0]}–${res.years[res.n - 1]} | ${formatRate(res.perDecade!, varDef.unit)} ${varDef.unit}/decade (95% ${formatRate(res.lo!, varDef.unit)} to ${formatRate(res.hi!, varDef.unit)}) | ${formatP(res.p!)} | ${res.verdict}`);
    });
  });
  // Sea level
  const sea = getSeriesForCityVar('mm', 'sea');
  if (sea) {
    const after = runTrend(sea, 1965, 2022);
    const before = runTrend(sea, 1902, 1964);
    if (after.ok) lines.push(`- Manila sea level 1965–2022: ${formatRate(after.perDecade!, 'mm')} mm/decade | ${formatP(after.p!)} | ${after.verdict}`);
    if (before.ok) lines.push(`- Manila sea level 1902–1964: ${formatRate(before.perDecade!, 'mm')} mm/decade (before acceleration)`);
  }
  // River
  const river = getSeriesForCityVar('mm', 'a15');
  if (river) {
    const res = runTrend(river, 2002, 2016);
    if (res.ok) lines.push(`- Marikina River ≥15 m events 2002–2016: ${formatRate(res.perDecade!, 'events')} events/decade | ${formatP(res.p!)} | ${res.verdict}`);
  }
  // National typhoon, ENSO and flood-record series
  const NAT_RANGE: Record<string, [number, number]> = { 'ph-landfalls': [1951, 2025], 'ph-strong': [1951, 2025], 'ph-oni': [1951, 2025], 'ph-floods': [1985, 2024], 'ph-tcfloods': [1985, 2024], 'ph-flooddead': [1985, 2024] };
  NATIONAL_SERIES.forEach(s => {
    const [from, to] = NAT_RANGE[s.id];
    const res = runTrend(s, from, to);
    if (res.ok) lines.push(`- Philippines | ${s.note} | ${from}–${to} | ${formatRate(res.perDecade!, s.unit)} ${s.unit}/decade | ${formatP(res.p!)} | ${res.verdict}`);
  });
  Object.entries(ENSO_LINKS).forEach(([k, l]) => lines.push(`- Link of ${k} to yearly ONI (negative = more in La Niña years): Spearman rho ${l.rho}, ${formatP(l.p)}, ${l.n} years`));
  lines.push(`- Tropical storms and typhoons were the main cause of ${Math.round(TC_FLOOD_SHARE * 100)}% of recorded floods (DFO).`);
  lines.push('');
  lines.push('KEY CAVEATS:');
  lines.push("- NASA's model shows more yearly rain in all five cities, but satellite rainfall (IMERG 2001–2024) shows no significant rise in any of them. Treat the rain rise as unproven.");
  lines.push('- Sea level at Manila is measured against the land. It cannot separate ocean rise from sinking ground. The gauge moved ~1 km in 2002.');
  lines.push('- The river record is 14 years long and ends in 2016, before the 2020 and 2024 floods.');
  lines.push('- Only Metro Manila has ground-station checks. The other four cities rest on the NASA model alone.');
  lines.push('- The only flood data is the Dartmouth Flood Observatory list of large reported floods, 1985–2024. Nothing measures flood depth or extent.');
  lines.push('- The 1991 Ormoc flood (6,376 deaths, an El Niño year) dominates flood-death averages.');
  return lines.join('\n');
}

const SYSTEM_PROMPT = `You are the Detective, the assistant inside "Earth Trend Detective", a tool for finding and testing trends in NASA Earth science data. Its case study is an investigation into the factors that contribute to severe flooding in five Philippine cities, using NASA and other records going back as far as 1902: Metro Manila, Naga, Tuguegarao, Metro Cebu, and Cagayan de Oro.

Rules:
- Answer ONLY from the DATA DIGEST below and from what the user tells you. If the data cannot answer, say so plainly and say what measurement would help.
- Quote numbers with units and the period they cover. Say "significant" only when the digest says so. Give p-values sparingly.
- The investigation has NO measured flood depth or extent, only a list of large reported floods. Do not overstate trends in flooding itself. Distinguish measured, satellite, NASA model, and reasoned statements.
- For prediction questions, give the straight-line extrapolation and say it is NOT a forecast.
- For missing data questions, say what each gap would let us test.
- If a CURRENT INVESTIGATION is given, explain that result in plain words for a high-school student: what the variable is, the rate, whether it is significant and what that means, and one likely process behind it. Suggest one next thing to check.
- Correlation is not cause: word relationship results carefully.
- The app also has "Investigate any place": users pick any point on a map and one of 12 NASA POWER variables (MERRA-2 model and CERES satellite, 1981–2025), and it runs the same trend test. It has two demos: "Does a longer record matter?" and "Same process, opposite trends". Suggest it when a question is about a place or variable not in the digest.
- Be concise: at most ~150 words, short paragraphs or a short list, plain language, no preamble or filler phrases.

${buildDigest()}`;

const SUGGESTED = [
  'What are the most important findings?',
  'Is the rise in rain real?',
  'Which city is warming fastest at night?',
  'What data is missing to make this more reliable?',
  'How predictable is rainfall here?',
  'What should be done first?',
  'Why can the same variable trend in opposite directions?',
];

interface Message { role: 'user' | 'assistant'; content: string; }

// Explains which AI limit was reached (see lambda/limit.mjs) and when to try again
function rateLimitText(scope?: string, retryAfter?: number) {
  const wait = !retryAfter ? 'later' : retryAfter < 90 ? `in ${retryAfter} seconds` : `in about ${Math.ceil(retryAfter / 3600)} hours`;
  const why = scope === 'site_day' ? 'The Detective has reached its AI limit for today across all visitors.'
    : scope === 'visitor_day' ? 'You have reached your AI question limit for today.'
    : 'You are asking questions faster than the AI limit allows.';
  return `${why} This answer comes from the built-in rules. AI answers return ${wait}.`;
}

function renderMarkdown(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
    .replace(/\*(.+?)\*/g, '<i>$1</i>')
    .split('\n').map(line => {
      const li = line.match(/^\s*[-•*]\s+(.*)/);
      if (li) return `<li>${li[1]}</li>`;
      return line.trim() ? `<p>${line}</p>` : '';
    })
    .join('')
    .replace(/(<li>.*<\/li>)+/g, m => `<ul>${m}</ul>`);
}

interface Props { open: boolean; onOpen: () => void; onClose: () => void; pending?: { question: string; context: string; id: number } | null; }

export default function DetectivePanel({ open, onOpen, onClose, pending }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  // The latest result from "Investigate any place", added to the AI's instructions
  const [liveContext, setLiveContext] = useState('');

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, loading]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (open && e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  async function send(question: string, context = liveContext) {
    if (!question.trim() || loading) return;
    setInput('');
    const newMessages: Message[] = [...messages, { role: 'user', content: question }];
    setMessages(newMessages);
    setLoading(true);
    setStatus('');

    // Give up after 30 s so the panel never sits on "Thinking…" forever
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);

    // The AI server (server.mjs) holds the API key; the browser never sees it.
    // Without a server (e.g. the static S3 site) answers come from built-in rules.
    let answer = '';
    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          system: context ? `${SYSTEM_PROMPT}\n\nCURRENT INVESTIGATION (live NASA POWER data the user is looking at):\n${context}` : SYSTEM_PROMPT,
          messages: newMessages.slice(-8),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.text) answer = data.text;
      else if (res.status === 429) setStatus(rateLimitText(data.scope, data.retryAfter));
      else setStatus('The AI server is not available, so this answer comes from the built-in rules.');
    } catch (e: any) {
      setStatus(e?.name === 'AbortError'
        ? 'The AI server did not answer within 30 seconds, so this answer comes from the built-in rules.'
        : 'The AI server is not available, so this answer comes from the built-in rules.');
    }
    setMessages([...newMessages, { role: 'assistant', content: answer || ruleAnswer(question, context) }]);
    clearTimeout(timer);
    setLoading(false);
  }

  // A question sent from "Investigate any place"
  useEffect(() => {
    if (!pending) return;
    setLiveContext(pending.context);
    send(pending.question, pending.context);
  }, [pending?.id]);

  return (
    <>
      {/* Floating action button — always visible, opens the panel */}
      <button
        type="button"
        className="fab"
        onClick={onOpen}
        aria-expanded={open}
        aria-controls="askPanel"
        style={{ display: open ? 'none' : undefined }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>
        </svg>
        <span>Ask Detective</span>
      </button>

      {/* Chat panel — controlled purely by CSS, no hidden attribute */}
      <div
        id="askPanel"
        className="askpanel"
        role="dialog"
        aria-label="Ask the Detective"
        aria-modal="true"
        style={{ display: open ? 'flex' : 'none' }}
      >
        <div className="ahead">
          <div>
            <b>Detective</b>
            <span className="asub">Ask about the data, predictions and what is missing</span>
          </div>
          <button type="button" className="aclose" aria-label="Close the chat" onClick={onClose}>&times;</button>
        </div>

        <div id="askLog" ref={logRef} aria-live="polite">
          {messages.length === 0 && (
            <div className="msg a">
              <p>I am the Detective. Ask me which factors drive the flooding, how strong the evidence is, what the data can and cannot predict, or what measurements are missing.</p>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role === 'user' ? 'u' : 'a'}`} dangerouslySetInnerHTML={{ __html: m.role === 'user' ? `<p>${m.content.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</p>` : renderMarkdown(m.content) }} />
          ))}
          {loading && <div className="msg a"><p className="fine">Thinking…</p></div>}
        </div>

        <div className="chips2">
          {SUGGESTED.map(q => (
            <button key={q} type="button" className="chip" onClick={() => send(q)}>{q}</button>
          ))}
        </div>

        <div id="askForm" role="search">
          <label className="sr" htmlFor="askInput">Your question</label>
          <input
            ref={inputRef}
            id="askInput"
            type="text"
            autoComplete="off"
            placeholder="Ask a question about the data"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); send(input); } }}
          />
          <button className="btn" type="button" onClick={() => send(input)} disabled={loading}>Ask</button>
        </div>
        {status && <p id="askStatus">{status}</p>}
      </div>
    </>
  );
}
