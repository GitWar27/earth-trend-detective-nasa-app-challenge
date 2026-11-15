export interface ChartSeries {
  pts: [number, number][];
  color: string;
  width?: number;
  opacity?: number;
  dots?: boolean;
  r?: number;
  hollow?: boolean;
  bar?: boolean;
  noline?: boolean;
  maxGap?: number;
}
export interface ChartTrend { x1: number; y1: number; x2: number; y2: number; color: string; width?: number; dash?: string; opacity?: number; }
export interface ChartWedge { pts: [number, number][]; color: string; }
export interface ChartVline { x: number; label?: string; }
export interface ChartOptions {
  W?: number; H?: number; yWide?: boolean; yLabel?: string; yTicks?: number; yZero?: boolean;
  bars?: boolean; aria?: string;
  series?: ChartSeries[]; trends?: ChartTrend[]; wedges?: ChartWedge[]; vlines?: ChartVline[];
}
export interface ChartLayout {
  svg: string; W: number; H: number;
  m: { l: number; r: number; t: number; b: number };
  iw: number; ih: number;
  sx: (x: number) => number;
  sy: (y: number) => number;
  xInv: (px: number) => number;
}

function niceTicks(lo: number, hi: number, n = 5) {
  if (hi <= lo) hi = lo + 1;
  const step0 = (hi - lo) / n;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const r = step0 / mag;
  const step = (r >= 7.5 ? 10 : r >= 3.5 ? 5 : r >= 1.5 ? 2 : 1) * mag;
  const tlo = Math.floor(lo / step + 1e-9) * step;
  const thi = Math.ceil(hi / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let t = tlo; t <= thi + step * 1e-6; t += step) ticks.push(+t.toFixed(10));
  return { ticks, lo: tlo, hi: thi, step };
}

function fmtTick(v: number, step: number) {
  const d = step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step) - 1e-9));
  return v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }).replace('-', '\u2212');
}

function xStep(range: number, width: number) {
  for (const s of [1, 2, 5, 10, 20, 50]) if (width / Math.max(1, range / s) >= 44) return s;
  return 50;
}

function svgPath(pts: [number, number][], sx: (x: number) => number, sy: (y: number) => number, maxGap?: number) {
  let d = '', prev: number | null = null;
  for (const [x, y] of pts) {
    d += (prev === null || (maxGap != null && x - prev > maxGap) ? 'M' : 'L') + sx(x).toFixed(1) + ' ' + sy(y).toFixed(1);
    prev = x;
  }
  return d;
}

function esc(s: string) {
  return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]!));
}

export function buildChart(opts: ChartOptions): ChartLayout {
  const W = Math.max(280, Math.round(opts.W || 760));
  const H = opts.H || Math.round(Math.min(380, Math.max(210, W * 0.46)));
  const m = { l: opts.yWide ? 62 : 50, r: 16, t: 26, b: 30 };
  const iw = W - m.l - m.r, ih = H - m.t - m.b;

  let xlo = Infinity, xhi = -Infinity, ylo = Infinity, yhi = -Infinity;
  const touch = (x: number, y: number) => {
    if (x < xlo) xlo = x; if (x > xhi) xhi = x;
    if (y < ylo) ylo = y; if (y > yhi) yhi = y;
  };
  (opts.series || []).forEach(s => s.pts.forEach(([x, y]) => touch(x, y)));
  (opts.trends || []).forEach(t => { touch(t.x1, t.y1); touch(t.x2, t.y2); });
  (opts.wedges || []).forEach(w => w.pts.forEach(([x, y]) => touch(x, y)));
  if (!isFinite(xlo)) { xlo = 0; xhi = 1; ylo = 0; yhi = 1; }
  if (opts.bars) { xlo -= 0.7; xhi += 0.7; }
  if (opts.yZero) { ylo = Math.min(ylo, 0); yhi = Math.max(yhi, 0); }
  const pad = (yhi - ylo) * 0.07 || 1;
  if (!(opts.yZero && ylo === 0)) ylo -= pad;
  yhi += pad;

  const tk = niceTicks(ylo, yhi, opts.yTicks || (H < 230 ? 3 : 5));
  const sx = (x: number) => m.l + (x - xlo) / (xhi - xlo || 1) * iw;
  const sy = (y: number) => m.t + ih - (y - tk.lo) / (tk.hi - tk.lo) * ih;
  const xInv = (px: number) => xlo + (px - m.l) / iw * (xhi - xlo);

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(opts.aria || 'Chart')}">`;

  tk.ticks.forEach(t => {
    svg += `<line class="grid" x1="${m.l}" x2="${m.l + iw}" y1="${sy(t).toFixed(1)}" y2="${sy(t).toFixed(1)}"/>`;
    svg += `<text class="tick" x="${m.l - 8}" y="${(sy(t) + 4).toFixed(1)}" text-anchor="end">${fmtTick(t, tk.step)}</text>`;
  });
  if (tk.lo < 0 && tk.hi > 0)
    svg += `<line class="zero" x1="${m.l}" x2="${m.l + iw}" y1="${sy(0).toFixed(1)}" y2="${sy(0).toFixed(1)}"/>`;

  const xs = xStep(xhi - xlo, iw);
  for (let x = Math.ceil(xlo / xs) * xs; x <= xhi + 1e-9; x += xs)
    svg += `<text class="tick" x="${sx(x).toFixed(1)}" y="${H - 9}" text-anchor="middle">${x}</text>`;

  if (opts.yLabel) svg += `<text class="ylab" x="${m.l}" y="14">${esc(opts.yLabel)}</text>`;

  (opts.wedges || []).forEach(w => {
    svg += `<polygon points="${w.pts.map(([x, y]) => sx(x).toFixed(1) + ',' + sy(y).toFixed(1)).join(' ')}" fill="${w.color}" opacity=".14"/>`;
  });
  (opts.vlines || []).forEach(v => {
    svg += `<line class="vline" x1="${sx(v.x).toFixed(1)}" x2="${sx(v.x).toFixed(1)}" y1="${m.t}" y2="${m.t + ih}"/>`;
    if (v.label) svg += `<text class="vlab" x="${(sx(v.x) + 5).toFixed(1)}" y="${m.t + 12}">${esc(v.label)}</text>`;
  });
  (opts.trends || []).forEach(t => {
    const dash = t.dash ? `stroke-dasharray="${t.dash}"` : '';
    svg += `<line x1="${sx(t.x1).toFixed(1)}" y1="${sy(t.y1).toFixed(1)}" x2="${sx(t.x2).toFixed(1)}" y2="${sy(t.y2).toFixed(1)}" stroke="${t.color}" stroke-width="${t.width || 2.2}" ${dash} opacity="${t.opacity || 0.95}" stroke-linecap="round"/>`;
  });
  (opts.series || []).forEach(s => {
    if (s.bar) {
      const bw = Math.max(3, iw / (xhi - xlo) * 0.62);
      s.pts.forEach(([x, y]) => {
        const vy = sy(Math.max(y, 0)), bh = Math.abs(sy(y) - sy(0));
        svg += `<rect x="${(sx(x) - bw / 2).toFixed(1)}" y="${vy.toFixed(1)}" width="${bw.toFixed(1)}" height="${Math.max(bh, 1).toFixed(1)}" fill="${s.color}" opacity="${s.opacity || 0.85}" rx="2"/>`;
      });
      return;
    }
    if (!s.noline)
      svg += `<path d="${svgPath(s.pts, sx, sy, s.maxGap)}" fill="none" stroke="${s.color}" stroke-width="${s.width || 2.2}" opacity="${s.opacity || 1}" stroke-linejoin="round" stroke-linecap="round"/>`;
    if (s.dots) s.pts.forEach(([x, y]) => {
      svg += `<circle cx="${sx(x).toFixed(1)}" cy="${sy(y).toFixed(1)}" r="${s.r || 3}" fill="${s.hollow ? 'var(--surface)' : s.color}" stroke="${s.color}" stroke-width="1.6" opacity="${s.opacity || 1}"/>`;
    });
  });

  svg += '</svg>';
  return { svg, W, H, m, iw, ih, sx, sy, xInv };
}

export interface RateRow { name: string; color: string; rate?: number; lo?: number; hi?: number; sig?: boolean; text?: string; none?: boolean; }

export function buildRateChart(rows: RateRow[], xLabel: string, aria: string, W = 700): string {
  const rowH = 38, narrow = W < 460;
  const m = { l: narrow ? 94 : 130, r: narrow ? 66 : 92, t: 18, b: 44 };
  const H = m.t + rows.length * rowH + m.b;
  const iw = W - m.l - m.r;
  const valid = rows.filter(r => !r.none);
  const lo0 = Math.min(0, ...valid.map(r => r.lo ?? 0));
  const hi0 = Math.max(0, ...valid.map(r => r.hi ?? 0));
  const pad = (hi0 - lo0) * 0.08 || 1;
  const tk = niceTicks(lo0 - pad, hi0 + pad, narrow ? 3 : 5);
  const sx = (x: number) => m.l + (x - tk.lo) / (tk.hi - tk.lo) * iw;

  let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(aria)}">`;
  tk.ticks.forEach(t => {
    svg += `<line class="grid" x1="${sx(t).toFixed(1)}" x2="${sx(t).toFixed(1)}" y1="${m.t - 4}" y2="${m.t + rows.length * rowH}"/>`;
    svg += `<text class="tick" x="${sx(t).toFixed(1)}" y="${m.t + rows.length * rowH + 16}" text-anchor="middle">${fmtTick(t, tk.step)}</text>`;
  });
  if (tk.lo < 0 && tk.hi > 0)
    svg += `<line class="zero" x1="${sx(0).toFixed(1)}" x2="${sx(0).toFixed(1)}" y1="${m.t - 4}" y2="${m.t + rows.length * rowH}"/>`;
  svg += `<text class="ylab" x="${(m.l + iw / 2).toFixed(1)}" y="${H - 6}" text-anchor="middle">${esc(xLabel)}</text>`;

  rows.forEach((row, i) => {
    const cy = m.t + i * rowH + rowH / 2;
    svg += `<text class="rname" x="${m.l - 10}" y="${(cy + 4).toFixed(1)}" text-anchor="end">${esc(row.name)}</text>`;
    if (row.none) {
      svg += `<text class="rval" x="${m.l + 6}" y="${(cy + 4).toFixed(1)}">no data / too few years</text>`;
      return;
    }
    svg += `<line x1="${sx(row.lo!).toFixed(1)}" x2="${sx(row.hi!).toFixed(1)}" y1="${cy}" y2="${cy}" stroke="${row.color}" stroke-width="3.2" opacity=".55" stroke-linecap="round"/>`;
    svg += `<circle cx="${sx(row.rate!).toFixed(1)}" cy="${cy}" r="7" fill="${row.sig ? row.color : 'var(--surface)'}" stroke="${row.color}" stroke-width="2.6"/>`;
    svg += `<text class="rval" x="${W - m.r + 10}" y="${(cy + 4).toFixed(1)}">${esc(row.text || '')}</text>`;
  });
  svg += '</svg>';
  return svg;
}
