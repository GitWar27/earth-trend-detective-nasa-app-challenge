export interface TrendResult {
  years: number[];
  values: number[];
  n: number;
  span: number;
  missing: number;
  unit: string;
  ok: boolean;
  verdict: string;
  level: 'short' | 'sig' | 'maybe' | 'none';
  z?: number;
  p?: number;
  perDecade?: number;
  lo?: number;
  hi?: number;
  slope?: number;
  intercept?: number;
  dir?: string;
}

const MIN_YEARS = 10;

function erfc(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))));
  const a = poly * Math.exp(-x * x);
  return x >= 0 ? a : 2 - a;
}

function mannKendall(vals: number[]) {
  const n = vals.length;
  let s = 0;
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) s += Math.sign(vals[j] - vals[i]);
  const freq: Record<number, number> = {};
  vals.forEach(v => { freq[v] = (freq[v] || 0) + 1; });
  let varS = n * (n - 1) * (2 * n + 5);
  for (const k in freq) { const c = freq[k]; varS -= c * (c - 1) * (2 * c + 5); }
  varS /= 18;
  const z = s === 0 || varS === 0 ? 0 : (s - Math.sign(s)) / Math.sqrt(varS);
  return { s, z, p: erfc(Math.abs(z) / Math.SQRT2) };
}

function senSlope(years: number[], vals: number[]) {
  const slopes: number[] = [];
  for (let i = 0; i < vals.length; i++)
    for (let j = i + 1; j < vals.length; j++)
      slopes.push((vals[j] - vals[i]) / (years[j] - years[i]));
  slopes.sort((a, b) => a - b);
  const med = (arr: number[]) => arr.length % 2 ? arr[(arr.length - 1) / 2] : (arr[arr.length / 2 - 1] + arr[arr.length / 2]) / 2;
  const slope = med(slopes);
  const n = vals.length;
  const ci = 1.96 * Math.sqrt(n * (n - 1) * (2 * n + 5) / 18);
  const lo = slopes[Math.max(0, Math.floor((slopes.length - ci) / 2))];
  const hi = slopes[Math.min(slopes.length - 1, Math.floor((slopes.length + ci) / 2) + 1)];
  const intercept = med(vals.map((v, i) => v - slope * years[i]).sort((a, b) => a - b));
  return { slope, lo, hi, intercept };
}

export function runTrend(series: { years: number[]; values: number[]; unit: string }, from: number, to: number): TrendResult {
  const years: number[] = [], values: number[] = [];
  series.years.forEach((y, i) => { if (y >= from && y <= to) { years.push(y); values.push(series.values[i]); } });
  const n = years.length;
  const span = n ? years[n - 1] - years[0] + 1 : 0;
  const base = { years, values, n, span, missing: Math.max(0, span - n), unit: series.unit };
  if (n < MIN_YEARS) return { ...base, ok: false, verdict: 'Too few years to test', level: 'short' };
  const mk = mannKendall(values);
  const sen = senSlope(years, values);
  const dir = sen.slope > 0 ? 'Rising' : sen.slope < 0 ? 'Falling' : 'Flat';
  const level: TrendResult['level'] = mk.p < 0.05 ? 'sig' : mk.p < 0.1 ? 'maybe' : 'none';
  const verdict = level === 'sig' ? dir + ', significant' : level === 'maybe' ? dir + ', suggestive but not significant' : 'No significant trend';
  return { ...base, ok: true, z: mk.z, p: mk.p, perDecade: sen.slope * 10, lo: sen.lo * 10, hi: sen.hi * 10, slope: sen.slope, intercept: sen.intercept, dir, level, verdict };
}

export function trendR2(res: TrendResult): number | null {
  if (!res.ok || !res.slope) return null;
  const mean = res.values.reduce((a, b) => a + b, 0) / res.n;
  let ss = 0, sr = 0;
  for (let i = 0; i < res.n; i++) {
    ss += (res.values[i] - mean) ** 2;
    sr += (res.values[i] - (res.intercept! + res.slope! * res.years[i])) ** 2;
  }
  return ss ? Math.max(0, 1 - sr / ss) : 0;
}

export function predictability(r2: number | null): string {
  if (r2 == null) return 'unknown';
  return r2 >= 0.6 ? 'high' : r2 >= 0.3 ? 'moderate' : r2 >= 0.1 ? 'low' : 'very low';
}

export function trendVerdict(res: TrendResult): { k: string; text: string; sym: string } {
  if (!res.ok) return { k: 'short', text: 'Too few years', sym: '–' };
  if (res.level === 'sig') return res.slope! > 0 ? { k: 'up', text: 'Rising · significant', sym: '▲' } : { k: 'down', text: 'Falling · significant', sym: '▼' };
  if (res.level === 'maybe') return { k: 'maybe', text: (res.slope! > 0 ? 'Rising' : 'Falling') + ' · not quite significant', sym: '◇' };
  return { k: 'none', text: 'No clear trend', sym: '–' };
}

export function formatP(p: number): string {
  const s = p < 0.0001 ? 'below 0.0001' : p < 0.001 ? p.toFixed(4) : p.toFixed(3);
  return s.startsWith('below') ? 'p < ' + s.slice(6) : 'p = ' + s;
}

export function formatRate(v: number, unit: string): string {
  const dec = ['°C', '%', 'events', 'm/s', 'MJ/m²/day'].includes(unit) ? 2 : Math.abs(v) < 10 ? 1 : 0;
  const abs = Math.abs(v).toFixed(dec);
  return (Number(abs) === 0 ? '' : v > 0 ? '+' : '−') + abs;
}
