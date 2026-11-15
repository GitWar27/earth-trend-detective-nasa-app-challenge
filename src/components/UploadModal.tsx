import { useState, useRef, useEffect } from 'react';
import { runTrend, trendVerdict, formatP } from '../lib/stats';
import { buildChart } from '../lib/chart';

// ── CSV parser ────────────────────────────────────────────────────────────────
const MISSING = new Set(['', 'na', 'n/a', 'nan', 'null', 'none', '-', '--', '-999', '-9999', '-999.0', '-9999.0']);

function parseCSV(raw: string): { rows: string[][]; delim: string } {
  raw = raw.replace(/^\uFEFF/, '');
  const firstLine = raw.split(/\r?\n/).find(l => l.trim()) || '';
  const countDelim = (d: string) => (firstLine.match(d === '\t' ? /\t/g : new RegExp('\\' + d, 'g')) || []).length;
  const delim = [',', ';', '\t'].map(d => [d, countDelim(d)] as [string, number]).sort((a, b) => b[1] - a[1])[0][1] ? [',', ';', '\t'].map(d => [d, countDelim(d)] as [string, number]).sort((a, b) => b[1] - a[1])[0][0] : ',';
  const rows: string[][] = [];
  let row: string[] = [], cell = '', inQ = false;
  for (let i = 0; i < raw.length; i++) {
    const c = raw[i];
    if (inQ) { if (c === '"') { if (raw[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += c; }
    else if (c === '"') inQ = true;
    else if (c === delim) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && raw[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(v => v.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some(v => v.trim())) rows.push(row);
  return { rows, delim };
}

function parseVal(s: string, delim: string): number | null {
  const t = String(s ?? '').trim();
  if (MISSING.has(t.toLowerCase())) return null;
  let v = t.replace(/\s/g, '');
  if (delim === ';' && /^-?\d+,\d+$/.test(v)) v = v.replace(',', '.');
  return /^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(v) ? Number(v) : NaN;
}

function parseYear(s: string): number | null {
  const t = String(s).trim();
  let m = t.match(/^(\d{4})(?:\.0)?$/); if (m) return +m[1];
  m = t.match(/^(\d{4})[-\/.]\d/); if (m) return +m[1];
  m = t.match(/^\d{1,2}[-\/.]\d{1,2}[-\/.](\d{4})/); if (m) return +m[1];
  m = t.match(/^[A-Za-z]{3,9}\s+\d{1,2},?\s+(\d{4})/); if (m) return +m[1];
  return null;
}

interface ParsedFile {
  names: string[];
  data: { year: number; vals: (number | null)[] }[];
  dated: boolean;
  delim: string;
  badRows: number;
  badVals: number;
  firstBad: string;
  perYear: Map<number, number>;
}

function parseFile(raw: string): { ok: false; error: string } | { ok: true } & ParsedFile {
  const { rows, delim } = parseCSV(raw);
  if (rows.length < 2) return { ok: false, error: 'The file needs a header row and at least one data row.' };
  const headers = rows[0].map(h => h.trim());
  if (headers.length < 2) return { ok: false, error: 'The file needs at least two columns: a year/date column, then a value column.' };
  if (headers.length - 1 > 8) return { ok: false, error: `Too many value columns (${headers.length - 1}). Please keep up to 8.` };
  const names = headers.slice(1).map((h, i) => h || `Column ${i + 2}`);
  const data: { year: number; vals: (number | null)[] }[] = [];
  let badRows = 0, badVals = 0, firstBad = '';
  rows.slice(1).forEach((row, ri) => {
    const yr = parseYear(row[0] || '');
    if (yr == null || yr < 1500 || yr > 2200) { badRows++; if (!firstBad) firstBad = `row ${ri + 2}: "${(row[0] || '').trim()}"`; return; }
    const vals = names.map((_, i) => { const v = parseVal(row[i + 1] || '', delim); if (Number.isNaN(v)) { badVals++; return null; } return v; });
    data.push({ year: yr, vals });
  });
  if (!data.length) return { ok: false, error: `No row has a readable year in the first column${firstBad ? ' (first problem at ' + firstBad + ')' : ''}.` };
  const perYear = new Map<number, number>();
  data.forEach(d => perYear.set(d.year, (perYear.get(d.year) || 0) + 1));
  const dated = Math.max(...perYear.values()) > 1;
  return { ok: true, names, data, dated, delim, badRows, badVals, firstBad, perYear };
}

function aggregateColumn(parsed: ParsedFile, colIdx: number, agg: string): { years: number[]; values: number[]; dropped: number[] } {
  const byYear = new Map<number, number[]>();
  parsed.data.forEach(d => { const v = d.vals[colIdx]; if (v != null) { if (!byYear.has(d.year)) byYear.set(d.year, []); byYear.get(d.year)!.push(v); } });
  const maxCount = Math.max(...[...byYear.values()].map(a => a.length));
  const years: number[] = [], values: number[] = [], dropped: number[] = [];
  [...byYear.keys()].sort((a, b) => a - b).forEach(yr => {
    const arr = byYear.get(yr)!;
    if (parsed.dated && arr.length < 0.9 * maxCount) { dropped.push(yr); return; }
    years.push(yr);
    values.push(agg === 'sum' ? arr.reduce((a, b) => a + b, 0) : agg === 'max' ? Math.max(...arr) : agg === 'min' ? Math.min(...arr) : arr.reduce((a, b) => a + b, 0) / arr.length);
  });
  return { years, values, dropped };
}

// ── Sample data ───────────────────────────────────────────────────────────────
const SAMPLE_YEARLY = `year,Rainfall (mm),Night temp (C)\n` +
  [[2001,2410,24.1],[2002,2380,24.0],[2003,2290,24.2],[2004,2520,24.3],[2005,2470,24.2],
   [2006,2610,24.5],[2007,2350,24.4],[2008,2580,24.6],[2009,2730,24.5],[2010,2480,24.9],
   [2011,2650,24.6],[2012,2590,24.8],[2013,2710,24.9],[2014,2540,25.0],[2015,2680,25.1],
   [2016,2620,25.2],[2017,2750,25.1],[2018,2700,25.3],[2019,2560,25.4],[2020,2790,25.3]]
  .map(r => r.join(',')).join('\n');

function downloadCSV(name: string, content: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([content], { type: 'text/csv' }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 500);
}

// ── Component ─────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void; }

export default function UploadModal({ open, onClose }: Props) {
  const [parsed, setParsed] = useState<ParsedFile | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [colIdx, setColIdx] = useState(0);
  const [agg, setAgg] = useState('mean');
  const [unit, setUnit] = useState('');
  const [fromYear, setFromYear] = useState<number | ''>('');
  const [toYear, setToYear] = useState<number | ''>('');
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => boxRef.current?.focus(), 20);
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (open && e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  function loadRaw(raw: string, name: string) {
    setError(''); setParsed(null);
    const result = parseFile(raw);
    if (!result.ok) { setError(result.error); return; }
    setFileName(name);
    setParsed(result);
    setColIdx(0); setAgg('mean'); setUnit('');
    const years = result.data.map(d => d.year);
    setFromYear(Math.min(...years)); setToYear(Math.max(...years));
  }

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('File is too large (max 5 MB).'); return; }
    if (/\.(xlsx|xls|ods|numbers|pdf|zip|json)$/i.test(file.name)) { setError('Not a plain-text file. Export as CSV from Excel or Google Sheets first.'); return; }
    const reader = new FileReader();
    reader.onerror = () => setError('Could not read the file.');
    reader.onload = () => loadRaw(String(reader.result), file.name);
    reader.readAsText(file);
  }

  // Render chart whenever inputs change
  useEffect(() => {
    if (!parsed || !chartRef.current) return;
    const { years, values } = aggregateColumn(parsed, colIdx, agg);
    const from = fromYear || years[0];
    const to = toYear || years[years.length - 1];
    const s = { years, values, unit };
    const res = runTrend(s, from as number, to as number);
    if (!res.ok || !chartRef.current) return;
    const pts: [number, number][] = res.years.map((y, i) => [y, res.values[i]]);
    const layout = buildChart({
      W: chartRef.current.clientWidth || 620,
      aria: 'Your data with trend line',
      yLabel: parsed.names[colIdx] + (unit ? ` (${unit})` : ''),
      series: [{ color: '#1c6e88', pts, dots: true, r: 2.8, width: 1.8, maxGap: 2 }],
      trends: [{ x1: res.years[0], y1: res.intercept! + res.slope! * res.years[0], x2: res.years[res.years.length - 1], y2: res.intercept! + res.slope! * res.years[res.years.length - 1], color: '#b04a3a', dash: res.level === 'sig' ? undefined : '7 5', width: 2.4 }],
    });
    chartRef.current.innerHTML = layout.svg;
  }, [parsed, colIdx, agg, unit, fromYear, toYear]);

  function getResult() {
    if (!parsed) return null;
    const { years, values, dropped } = aggregateColumn(parsed, colIdx, agg);
    const from = (fromYear || years[0]) as number;
    const to = (toYear || years[years.length - 1]) as number;
    const res = runTrend({ years, values, unit }, from, to);
    const v = trendVerdict(res);
    return { res, v, dropped };
  }

  const result = getResult();

  if (!open) return null;

  return (
    <div className="upmodal" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="upbox" role="dialog" aria-modal="true" aria-labelledby="upTitle" ref={boxRef} tabIndex={-1}>
        <div className="uphead">
          <h2 id="upTitle">Upload / Test your data</h2>
          <button type="button" className="aclose dark" aria-label="Close" onClick={onClose}>&times;</button>
        </div>
        <p className="uplead">Check whether <b>your own yearly or daily data</b> shows a real trend, using the same Mann-Kendall test as the rest of this investigation. Your file is read inside your browser — <b>not uploaded or stored anywhere</b>.</p>

        <div className="upgrid">
          {/* Left: instructions */}
          <section className="upinfo" aria-label="How to prepare your file">
            <h3>How to prepare your file</h3>
            <ul className="uplist">
              <li><b>File type:</b> CSV (comma-separated). Semicolon or tab-separated also work.</li>
              <li><b>Layout:</b> a header row, then one row per year or per reading. The <b>first column is the year or date</b>.</li>
              <li><b>Dates:</b> <code>2015</code>, <code>2015-07-21</code>, or <code>21/07/2015</code>. Daily/monthly readings are combined into yearly values.</li>
              <li><b>Years:</b> at least <b>10 years</b> needed for the test.</li>
              <li><b>Missing values:</b> leave the cell empty, or write <code>NA</code> or <code>-999</code>.</li>
            </ul>
            <h3>Sample format</h3>
            <pre>{`year,Rainfall (mm),Night temp (C)\n2001,2410,24.1\n2002,2380,24.0\n…`}</pre>
            <button type="button" className="btn ghost sm" onClick={() => downloadCSV('sample-yearly.csv', SAMPLE_YEARLY)}>Download sample</button>
            {' '}
            <button type="button" className="btn ghost sm" onClick={() => loadRaw(SAMPLE_YEARLY, 'sample-yearly.csv')}>Try sample</button>
          </section>

          {/* Right: upload + results */}
          <section className="upwork" aria-label="Upload and results">
            <h3>Upload and test</h3>

            {/* Drop zone */}
            <div
              className={`updrop${dragOver ? ' over' : ''}`}
              tabIndex={0}
              role="button"
              aria-label="Drop a CSV file here or press Enter to choose one"
              onClick={() => fileRef.current?.click()}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && fileRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFile(e.dataTransfer.files[0]); }}
            >
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/></svg>
              <b>Drop your CSV file here</b>
              <span>or</span>
              <button type="button" className="btn" onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>Choose a file</button>
              <input ref={fileRef} type="file" accept=".csv,.tsv,.txt,text/csv,text/plain" hidden onChange={e => { handleFile(e.target.files?.[0]); e.target.value = ''; }} />
            </div>

            {error && <div className="uperr" role="alert"><b>Could not use this file.</b> {error}</div>}

            {parsed && (
              <div id="upSetup">
                <p className="upfile">
                  <b>{fileName}</b>: {parsed.data.length.toLocaleString()} rows, {parsed.names.length} value column{parsed.names.length > 1 ? 's' : ''}, {parsed.dated ? 'several rows per year (will be combined)' : 'one row per year'}.
                  {parsed.badRows > 0 && <span className="warn"> {parsed.badRows} row{parsed.badRows > 1 ? 's' : ''} skipped (unreadable year).</span>}
                  {parsed.badVals > 0 && <span className="warn"> {parsed.badVals} value{parsed.badVals > 1 ? 's' : ''} treated as missing.</span>}
                </p>
                <div className="upctl">
                  {parsed.names.length > 1 && (
                    <label>Column to test
                      <select value={colIdx} onChange={e => setColIdx(+e.target.value)}>
                        {parsed.names.map((n, i) => <option key={i} value={i}>{n}</option>)}
                      </select>
                    </label>
                  )}
                  {parsed.dated && (
                    <label>Combine readings by
                      <select value={agg} onChange={e => setAgg(e.target.value)}>
                        <option value="mean">Yearly average</option>
                        <option value="sum">Yearly total</option>
                        <option value="max">Yearly highest</option>
                        <option value="min">Yearly lowest</option>
                      </select>
                    </label>
                  )}
                  <label>Unit (optional)<input type="text" maxLength={14} placeholder="mm, °C, …" value={unit} onChange={e => setUnit(e.target.value)} /></label>
                  <label>From year<input type="number" min={1500} max={2200} value={fromYear} onChange={e => setFromYear(e.target.value ? +e.target.value : '')} /></label>
                  <label>To year<input type="number" min={1500} max={2200} value={toYear} onChange={e => setToYear(e.target.value ? +e.target.value : '')} /></label>
                </div>
              </div>
            )}

            {result && (
              <div className="upout" aria-live="polite">
                {!result.res.ok ? (
                  <div className="upcard">
                    <h3>{parsed!.names[colIdx]}</h3>
                    <p>Only <b>{result.res.n} usable year{result.res.n === 1 ? '' : 's'}</b> in the chosen range. The test needs at least <b>10 years</b>.</p>
                    {result.dropped.length > 0 && <p className="fine">Years left out (incomplete): {result.dropped.join(', ')}.</p>}
                  </div>
                ) : (
                  <div className={`upcard ${result.v.k === 'up' ? 'up' : result.v.k === 'down' ? 'down' : ''}`}>
                    <h3>{parsed!.names[colIdx]} <small>{result.res.years[0]} to {result.res.years[result.res.n - 1]}</small></h3>
                    <p className="upv"><span className="sym">{result.v.sym}</span> <b>{result.v.text}</b></p>
                    <div className="upstats">
                      <div><span>Rate of change</span><b>{result.res.perDecade! >= 0 ? '+' : '−'}{Math.abs(result.res.perDecade!).toFixed(Math.abs(result.res.perDecade!) < 10 ? 2 : 1)}{unit ? ' ' + unit : ''} per decade</b><small>95% range {result.res.lo!.toFixed(2)} to {result.res.hi!.toFixed(2)}</small></div>
                      <div><span>Test result</span><b>{formatP(result.res.p!)}</b><small>Significant if p &lt; 0.05</small></div>
                      <div><span>Years used</span><b>{result.res.n}</b><small>{result.res.missing ? result.res.missing + ' missing' : 'no gaps'}</small></div>
                    </div>
                    <div className="chartbox" ref={chartRef} style={{ minHeight: 180 }} />
                    <p className="fine">
                      {result.res.level === 'sig' ? 'The direction is unlikely to be chance. ' : 'The data do not rule out chance as the explanation. '}
                      A trend does not say why it happens.
                    </p>
                    {result.dropped.length > 0 && <p className="fine warn">Years left out (incomplete): {result.dropped.join(', ')}.</p>}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
