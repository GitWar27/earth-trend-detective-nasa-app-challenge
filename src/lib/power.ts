// Fetches monthly NASA POWER data for any point and turns it into yearly series for the trend test.
import { POWER_VARS } from '../data/powerVars';
import type { PowerVar } from '../data/powerVars';
import type { Place } from '../data/places';

type Monthly = Record<string, Record<string, number>>; // parameter -> "YYYYMM" -> value
const cache = new Map<string, Promise<Monthly>>();
export const POWER_LAST_YEAR = 2025;

// One request per point fetches every variable, so switching variables is instant
export function fetchPower(lat: number, lon: number): Promise<Monthly> {
  const key = `${lat.toFixed(2)},${lon.toFixed(2)}`;
  if (!cache.has(key)) {
    const params = POWER_VARS.map(v => v.id).join(',');
    const url = `https://power.larc.nasa.gov/api/temporal/monthly/point?parameters=${params}&community=AG`
      + `&longitude=${lon.toFixed(2)}&latitude=${lat.toFixed(2)}&start=1981&end=${POWER_LAST_YEAR}&format=JSON`;
    const p = fetch(url, { signal: AbortSignal.timeout(30000) })
      .then(r => { if (!r.ok) throw new Error(`NASA POWER returned ${r.status}`); return r.json(); })
      .then(j => j.properties.parameter as Monthly);
    p.catch(() => cache.delete(key)); // allow a retry after a failure
    cache.set(key, p);
  }
  return cache.get(key)!;
}

// Saved copy for the ready-made places (scripts/build_power_cache.py), so they and the demos
// load instantly and still work if the live API is slow or down
type Saved = { start: number; places: Record<string, Record<string, (number | null)[]>> };
let saved: Promise<Saved | null> | null = null;
const loadSaved = (): Promise<Saved | null> => saved ??= fetch(`${import.meta.env.BASE_URL}power-cache.json`)
  .then(r => (r.ok ? r.json() : null)).catch(() => null);

export async function fetchPlace(p: Place): Promise<Monthly> {
  const s = await loadSaved();
  const rows = s?.places[p.id];
  if (!s || !rows) return fetchPower(p.lat, p.lon);
  const out: Monthly = {};
  for (const [param, vals] of Object.entries(rows) as [string, (number | null)[]][]) {
    out[param] = {};
    vals.forEach((v, i) => {
      if (v != null) out[param][`${s.start + Math.floor(i / 12)}${String(i % 12 + 1).padStart(2, '0')}`] = v;
    });
  }
  return out;
}

const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();

// One value per year from the chosen months; years missing any chosen month are left out
export function yearlySeries(data: Monthly, v: PowerVar, months: number[]) {
  const raw = data[v.id] || {};
  const years: number[] = [], values: number[] = [];
  for (let y = v.from; y <= POWER_LAST_YEAR; y++) {
    let total = 0, ok = true;
    for (const m of months) {
      const x = raw[`${y}${String(m).padStart(2, '0')}`];
      if (x == null || x <= -999) { ok = false; break; }
      total += v.agg === 'sum' ? x * daysIn(y, m) : x;
    }
    if (!ok) continue;
    const val = (v.agg === 'sum' ? total : total / months.length) * (v.scale ?? 1);
    years.push(y);
    values.push(Math.round(val * 1000) / 1000);
  }
  return { years, values, unit: v.unit };
}
