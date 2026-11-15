import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { POWER_VARS, getPowerVar, SEASONS, SOURCE_TEXT } from '../data/powerVars';
import type { PowerVar } from '../data/powerVars';
import { PLACES, getPlace, customPlace } from '../data/places';
import type { Place } from '../data/places';
import { fetchPlace, yearlySeries, POWER_LAST_YEAR } from '../lib/power';
import { runTrend, trendVerdict, formatRate, formatP } from '../lib/stats';
import type { TrendResult } from '../lib/stats';
import { buildChart } from '../lib/chart';
import type { ChartSeries, ChartTrend } from '../lib/chart';
import CityExplorer from './ExplorerSection';

const COLOR_A = '#1f6fb2', COLOR_B = '#c2579a';
const MIN_SPAN = 10;

interface Setup { a: string; b: string | null; v: string; season: string; from: number; to: number; }

// ── Plain-language descriptions of a result ──────────────────────────────────
function rateText(res: TrendResult, unit: string) {
  return `${formatRate(res.perDecade!, unit)} ${unit} per decade`;
}

function shortResult(res: TrendResult | null, unit: string) {
  if (!res) return 'loading…';
  if (!res.ok) return 'too few years to test';
  return `${rateText(res, unit)}, ${trendVerdict(res).text.toLowerCase().replace(' · ', ', ')} (${formatP(res.p!)})`;
}

function explain(place: Place, v: PowerVar, seasonLabel: string, res: TrendResult) {
  const what = `${v.label.toLowerCase()}${seasonLabel === 'Whole year' ? '' : ` in the ${seasonLabel.replace(/ \(.*\)/, '').toLowerCase()}`}`;
  if (!res.ok) return `Only ${res.n} years are selected. The test needs at least ${MIN_SPAN}, so pick a longer period.`;
  const from = res.years[0], to = res.years[res.n - 1];
  const dir = res.slope! > 0 ? 'rose' : 'fell';
  const whole = Math.abs(res.slope! * (to - from));
  const wholeText = `${whole.toFixed(['°C', '%', 'm/s', 'MJ/m²/day'].includes(v.unit) ? 2 : 0)} ${v.unit}`;
  if (res.level === 'sig')
    return `In ${place.name}, ${what} ${dir} by about ${formatRate(Math.abs(res.perDecade!), v.unit).replace(/^[+−]/, '')} ${v.unit} per decade from ${from} to ${to}, about ${wholeText} over the whole period. `
      + `This is significant (${formatP(res.p!)}): chance alone would rarely produce a pattern this steady.`;
  if (res.level === 'maybe')
    return `In ${place.name}, ${what} ${dir} by about ${formatRate(Math.abs(res.perDecade!), v.unit).replace(/^[+−]/, '')} ${v.unit} per decade from ${from} to ${to}, but this is not quite significant (${formatP(res.p!)}). `
      + `A few more years of data might settle it.`;
  return `In ${place.name}, ${what} shows no clear trend from ${from} to ${to} (${formatP(res.p!)}). The typical rate is ${rateText(res, v.unit)}, `
    + `but the ups and downs between years are too big to tell it apart from chance. A longer period may help.`;
}

// ── Guided start: a short series of questions that suggests variables ────────
const TOPICS = [
  { id: 'flood', label: 'Flooding and rain', season: 'wet', vars: ['PRECTOTCORR', 'GWETTOP', 'EVLAND'] },
  { id: 'heat', label: 'Heat', season: 'year', vars: ['T2M_MIN', 'T2M_MAX', 'TS'] },
  { id: 'drought', label: 'Drought and water supply', season: 'dry', vars: ['GWETROOT', 'PRECTOTCORR', 'EVLAND'] },
  { id: 'sky', label: 'Sky, sun and wind', season: 'year', vars: ['CLOUD_AMT', 'ALLSKY_SFC_SW_DWN', 'WS10M'] },
];

function GuidedStart({ onApply }: { onApply: (s: Partial<Setup>) => void }) {
  const [topic, setTopic] = useState('flood');
  const [placeId, setPlaceId] = useState('mm');
  const t = TOPICS.find(x => x.id === topic)!;
  const [season, setSeason] = useState(t.season);

  return (
    <div className="card guide">
      <h3 className="h3">Start an investigation</h3>
      <ol className="qlist">
        <li>
          <span className="lbl">What are you curious about?</span>
          <div className="seg" role="group" aria-label="Topic">
            {TOPICS.map(x => (
              <button key={x.id} type="button" aria-pressed={topic === x.id ? 'true' : 'false'} onClick={() => { setTopic(x.id); setSeason(x.season); }}>{x.label}</button>
            ))}
          </div>
        </li>
        <li>
          <span className="lbl">Where?</span>
          <div className="seg" role="group" aria-label="Place">
            {PLACES.filter(p => p.group === 'Philippines').slice(0, 5).map(p => (
              <button key={p.id} type="button" aria-pressed={placeId === p.id ? 'true' : 'false'} onClick={() => setPlaceId(p.id)}>{p.name}</button>
            ))}
          </div>
          <p className="fine">Or click anywhere on the map below after you choose.</p>
        </li>
        <li>
          <span className="lbl">Which part of the year?</span>
          <div className="seg" role="group" aria-label="Season">
            {SEASONS.map(s => (
              <button key={s.id} type="button" aria-pressed={season === s.id ? 'true' : 'false'} onClick={() => setSeason(s.id)}>{s.label}</button>
            ))}
          </div>
        </li>
      </ol>
      <span className="lbl">Variables worth checking</span>
      <div className="sugg">
        {t.vars.map(id => {
          const v = getPowerVar(id);
          return (
            <div key={id} className="sg">
              <b>{v.label}</b>
              <p>{v.why}</p>
              <button type="button" className="btn sm" onClick={() => onApply({ a: placeId, b: null, v: id, season, from: v.from, to: POWER_LAST_YEAR })}>Investigate this →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Demonstration examples ───────────────────────────────────────────────────
interface DemoStep { title: string; setup: Setup; text: (a: TrendResult | null, b: TrendResult | null) => string; }
interface Demo { id: string; title: string; blurb: string; steps: DemoStep[]; }

const DEMOS: Demo[] = [
  {
    id: 'length', title: 'Does a longer record matter?', blurb: 'Humidity in Metro Manila, over 16 years and over 45 years.',
    steps: [
      { title: 'A short record', setup: { a: 'mm', b: null, v: 'RH2M', season: 'year', from: 2010, to: 2025 },
        text: a => `Relative humidity in Metro Manila, 2010 to 2025: ${shortResult(a, '%')}. `
          + (a?.ok && a.level !== 'sig' ? 'The air is getting more humid, but with only 16 years the ups and downs between years are too big for the test to rule out chance.' : '') },
      { title: 'The same place, a longer record', setup: { a: 'mm', b: null, v: 'RH2M', season: 'year', from: 1981, to: 2025 },
        text: (a) => `Same place, same variable, 1981 to 2025: ${shortResult(a, '%')}. `
          + (a?.level === 'sig' ? 'The rate is about the same, but with 45 years the steady rise now stands out clearly from the noise.' : '') },
      { title: 'The lesson', setup: { a: 'mm', b: null, v: 'RH2M', season: 'year', from: 1981, to: 2025 },
        text: () => '"Not significant" often means "not enough data yet", not "no change". Before deciding nothing is happening, try the longest period the data allows.' },
    ],
  },
  {
    id: 'opposite', title: 'Same process, opposite trends', blurb: 'Daytime highs in tropical Cagayan de Oro and desert Phoenix.',
    steps: [
      { title: 'Daytime highs move in opposite directions', setup: { a: 'cdo', b: 'phoenix', v: 'T2M_MAX', season: 'year', from: 1981, to: 2025 },
        text: (a, b) => `Daytime highs in Cagayan de Oro: ${shortResult(a, '°C')}. In Phoenix, USA: ${shortResult(b, '°C')}. The same variable is moving in opposite directions in the two places.` },
      { title: 'Look at the clouds', setup: { a: 'cdo', b: 'phoenix', v: 'CLOUD_AMT', season: 'year', from: 1984, to: 2025 },
        text: (a, b) => `Cloud cover in Cagayan de Oro: ${shortResult(a, '%')}. In Phoenix: ${shortResult(b, '%')}. Clouds are moving in opposite directions too.` },
      { title: 'One process, two results', setup: { a: 'cdo', b: 'phoenix', v: 'T2M_MIN', season: 'year', from: 1981, to: 2025 },
        text: (a, b) => `A warming climate puts more water vapour into humid air. Over the tropics that can mean more cloud, which shades the ground by day, so daytime highs in Cagayan de Oro fall. `
          + `Over the desert, cloud is thinning and the sun hits harder, so highs rise. Night-time lows, shown now, rise in both: Cagayan de Oro ${shortResult(a, '°C')}; Phoenix ${shortResult(b, '°C')}.` },
    ],
  },
];

// ── Map ──────────────────────────────────────────────────────────────────────
function PlaceMap({ a, b, onPick }: { a: Place; b: Place | null; onPick: (lat: number, lon: number) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pick = useRef(onPick);
  useEffect(() => { pick.current = onPick; });

  useEffect(() => {
    if (!box.current || map.current) return;
    map.current = L.map(box.current, { worldCopyJump: true, minZoom: 2 }).setView([12.5, 122], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 12, attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    map.current.on('click', e => pick.current(e.latlng.lat, L.Util.wrapNum(e.latlng.lng, [-180, 180], true)));
    return () => { map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    layer.current.clearLayers();
    const pts: [Place, string][] = [[a, COLOR_A], ...(b ? [[b, COLOR_B] as [Place, string]] : [])];
    pts.forEach(([p, color]) => L.circleMarker([p.lat, p.lon], { radius: 9, color: '#fff', weight: 2, fillColor: color, fillOpacity: 1 })
      .bindTooltip(p.name).addTo(layer.current!));
    if (b) map.current.fitBounds(L.latLngBounds([[a.lat, a.lon], [b.lat, b.lon]]).pad(0.4), { maxZoom: 6 });
    else if (!map.current.getBounds().pad(-0.1).contains([a.lat, a.lon])) map.current.setView([a.lat, a.lon], 5);
  }, [a, b]);

  return <div className="pmap" ref={box} role="application" aria-label="Map: click to choose a place" />;
}

// ── The section ──────────────────────────────────────────────────────────────
interface Props { onAsk: (question: string, context: string) => void; }

export default function InvestigateSection({ onAsk }: Props) {
  const [placeA, setPlaceA] = useState<Place>(getPlace('mm')!);
  const [placeB, setPlaceB] = useState<Place | null>(null);
  const [pickSlot, setPickSlot] = useState<'A' | 'B'>('A');
  const [varId, setVarId] = useState('T2M_MIN');
  const [seasonId, setSeasonId] = useState('year');
  const [from, setFrom] = useState(1981);
  const [to, setTo] = useState(POWER_LAST_YEAR);
  const [data, setData] = useState<Record<string, Awaited<ReturnType<typeof fetchPlace>>>>({});
  const [error, setError] = useState('');
  const [demo, setDemo] = useState<{ id: string; step: number } | null>(null);
  const [mode, setMode] = useState<'any' | 'cities'>('any');
  const chartRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const v = getPowerVar(varId);
  const season = SEASONS.find(s => s.id === seasonId)!;

  // Fetch NASA POWER data for each chosen place (cached per point)
  useEffect(() => {
    [placeA, placeB].forEach(p => {
      if (!p || data[p.id]) return;
      setError('');
      fetchPlace(p)
        .then(d => setData(prev => ({ ...prev, [p.id]: d })))
        .catch(e => setError(`Could not load NASA POWER data for ${p.name} (${e.message}). Check your connection and try again.`));
    });
  }, [placeA, placeB]);

  const seriesOf = (p: Place | null) => p && data[p.id] ? yearlySeries(data[p.id], v, season.months) : null;
  const sA = seriesOf(placeA), sB = seriesOf(placeB);
  const resA = sA ? runTrend(sA, from, to) : null;
  const resB = sB ? runTrend(sB, from, to) : null;

  function apply(s: Partial<Setup>, scroll = true) {
    if (s.a) setPlaceA(getPlace(s.a)!);
    if (s.b !== undefined) setPlaceB(s.b ? getPlace(s.b)! : null);
    if (s.v) setVarId(s.v);
    if (s.season) setSeasonId(s.season);
    if (s.from) setFrom(s.from);
    if (s.to) setTo(s.to);
    setPickSlot('A');
    setMode('any');
    if (scroll) setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  }

  function chooseVar(id: string) {
    const nv = getPowerVar(id);
    setVarId(id);
    if (from < nv.from) setFrom(nv.from);
  }

  function pickOnMap(lat: number, lon: number) {
    const p = customPlace(lat, lon);
    if (pickSlot === 'B') setPlaceB(p); else setPlaceA(p);
    setDemo(null);
  }

  // Chart
  useEffect(() => {
    if (!chartRef.current) return;
    const series: ChartSeries[] = [], trends: ChartTrend[] = [];
    ([[sA, resA, COLOR_A], [sB, resB, COLOR_B]] as const).forEach(([s, res, color]) => {
      if (!s || !res) return;
      series.push({ color, pts: res.years.map((y, i) => [y, res.values[i]] as [number, number]), dots: true, r: 3, width: 1.8, maxGap: 2 });
      if (res.ok) trends.push({ x1: from, y1: res.intercept! + res.slope! * from, x2: to, y2: res.intercept! + res.slope! * to, color, width: 3, dash: res.level === 'sig' ? undefined : '7 5' });
    });
    if (!series.length) { chartRef.current.innerHTML = '<p class="fine">Loading NASA POWER data…</p>'; return; }
    chartRef.current.innerHTML = buildChart({
      W: chartRef.current.clientWidth || 760,
      aria: `${v.label} per year, ${from} to ${to}, for ${placeA.name}${placeB ? ' and ' + placeB.name : ''}`,
      yLabel: `${v.label} (${v.unit})${season.id === 'year' ? '' : ', ' + season.label}`,
      series, trends,
    }).svg;
  }, [sA?.values, sB?.values, from, to, varId, seasonId]);

  function downloadCsv() {
    const rows = ['year,' + [placeA, placeB].filter(Boolean).map(p => `"${p!.name} ${v.label} (${v.unit})"`).join(',')];
    for (let y = from; y <= to; y++) {
      const a = sA?.values[sA.years.indexOf(y)], b = sB?.values[sB.years.indexOf(y)];
      rows.push([y, a ?? '', ...(placeB ? [b ?? ''] : [])].join(','));
    }
    const url = URL.createObjectURL(new Blob([rows.join('\n')], { type: 'text/csv' }));
    const link = document.createElement('a');
    link.href = url; link.download = `${v.id}_${placeA.name.replace(/\W+/g, '_')}_${from}-${to}.csv`; link.click();
    URL.revokeObjectURL(url);
  }

  function askDetective() {
    const ctx = [[placeA, resA], [placeB, resB]].filter(([p, r]) => p && r)
      .map(([p, r]) => explain(p as Place, v, season.label, r as TrendResult)).join('\n');
    onAsk(`Explain this result: ${v.label} in ${placeA.name}${placeB ? ' and ' + placeB.name : ''}, ${from}–${to}.`,
      `Variable: ${v.label} (${v.unit}) — ${v.def} Source: ${SOURCE_TEXT[v.source]}. Months: ${season.label}.\n${ctx}`);
  }

  const activeDemo = demo ? DEMOS.find(d => d.id === demo.id)! : null;
  const step = activeDemo?.steps[demo!.step];
  function goDemo(id: string, idx: number) {
    const d = DEMOS.find(x => x.id === id)!;
    setDemo({ id, step: idx });
    apply(d.steps[idx].setup, idx === 0);
  }

  // Shareable links open a demo directly, e.g. #demo-opposite or #demo-opposite-2 (step 2)
  useEffect(() => {
    const m = location.hash.match(/^#demo-(\w+?)(?:-(\d+))?$/);
    const d = m && DEMOS.find(x => x.id === m[1]);
    if (d) goDemo(d.id, Math.min(d.steps.length, Math.max(1, +(m[2] || 1))) - 1);
  }, []);

  const groups = [...new Set(POWER_VARS.map(x => x.group))];
  const placeGroups = [...new Set(PLACES.map(p => p.group))];
  const placeSelect = (slot: 'A' | 'B', p: Place | null, set: (id: string) => void) => (
    <select id={`ivPlace${slot}`} value={p && getPlace(p.id) ? p.id : p ? 'custom' : ''} onChange={e => set(e.target.value)}>
      {slot === 'B' && <option value="">No second place</option>}
      {p && !getPlace(p.id) && <option value="custom">{p.name}</option>}
      {placeGroups.map(g => (
        <optgroup key={g} label={g}>
          {PLACES.filter(x => x.group === g).map(x => <option key={x.id} value={x.id}>{x.name}</option>)}
        </optgroup>
      ))}
    </select>
  );

  return (
    <section id="investigate" className="sec wrap">
      <h2 className="sec-h">Investigate any place</h2>
      <p className="sec-intro">
        Be a data detective. Pick a place anywhere on Earth and a variable measured by NASA satellites or produced by NASA's MERRA-2 model.
        The tool fetches about 45 years of monthly data from NASA POWER, plots it, and tests whether the change is significant.
      </p>

      <div className="demos">
        <span className="lbl">Watch a demonstration</span>
        <div className="dgrid">
          {DEMOS.map(d => (
            <button key={d.id} type="button" className="demo" onClick={() => goDemo(d.id, 0)}>
              <b>▶ {d.title}</b><span>{d.blurb}</span>
            </button>
          ))}
        </div>
      </div>

      <GuidedStart onApply={s => { setDemo(null); apply(s); }} />

      <div className="tabs ivmode" role="tablist" aria-label="What to investigate">
        <button type="button" role="tab" aria-selected={mode === 'any'} onClick={() => setMode('any')}>Any place on Earth (NASA POWER)</button>
        <button type="button" role="tab" aria-selected={mode === 'cities'} onClick={() => { setMode('cities'); setDemo(null); }}>Compare the five cities (all datasets)</button>
      </div>

      {mode === 'cities' ? <CityExplorer /> : <>
      <div ref={resultsRef} className="ivgrid">
        <div className="ctl-card ivctl">
          <div className="ctl">
            <label htmlFor="ivPlaceA"><i className="dot" style={{ background: COLOR_A }} />Place</label>
            {placeSelect('A', placeA, id => { if (id !== 'custom') { setPlaceA(getPlace(id)!); setDemo(null); } })}
          </div>
          <div className="ctl">
            <label htmlFor="ivPlaceB"><i className="dot" style={{ background: COLOR_B }} />Compare with (optional)</label>
            {placeSelect('B', placeB, id => { if (id !== 'custom') { setPlaceB(id ? getPlace(id)! : null); setDemo(null); if (!id) setPickSlot('A'); } })}
          </div>
          <div className="ctl">
            <span className="lbl">A map click sets</span>
            <div className="seg" role="group" aria-label="Which place a map click sets">
              <button type="button" aria-pressed={pickSlot === 'A' ? 'true' : 'false'} onClick={() => setPickSlot('A')}>First place</button>
              <button type="button" aria-pressed={pickSlot === 'B' ? 'true' : 'false'} onClick={() => setPickSlot('B')}>Second place</button>
            </div>
          </div>
          <div className="ctl">
            <label htmlFor="ivSeason">Months</label>
            <select id="ivSeason" value={seasonId} onChange={e => { setSeasonId(e.target.value); setDemo(null); }}>
              {SEASONS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div className="ctl wide">
            <label htmlFor="ivVar">What to measure</label>
            <select id="ivVar" value={varId} onChange={e => { chooseVar(e.target.value); setDemo(null); }}>
              {groups.map(g => (
                <optgroup key={g} label={g}>
                  {POWER_VARS.filter(x => x.group === g).map(x => <option key={x.id} value={x.id}>{x.label}</option>)}
                </optgroup>
              ))}
            </select>
            <p className="vdef"><b>{v.label}:</b> {v.def} <span className="fine">Source: {SOURCE_TEXT[v.source]}.</span></p>
          </div>
          <div className="ctl">
            <label htmlFor="ivFrom">From year <output>{from}</output></label>
            <input type="range" id="ivFrom" min={v.from} max={to - MIN_SPAN + 1} value={from} onChange={e => { setFrom(+e.target.value); setDemo(null); }} />
            <label htmlFor="ivTo">To year <output>{to}</output></label>
            <input type="range" id="ivTo" min={from + MIN_SPAN - 1} max={POWER_LAST_YEAR} value={to} onChange={e => { setTo(+e.target.value); setDemo(null); }} />
          </div>
        </div>
        <PlaceMap a={placeA} b={placeB} onPick={pickOnMap} />
      </div>

      {activeDemo && step && (
        <div className="demobox" aria-live="polite">
          <div className="dhead">
            <b>Demo: {activeDemo.title}</b>
            <span className="fine">Step {demo!.step + 1} of {activeDemo.steps.length}</span>
          </div>
          <h4>{step.title}</h4>
          <p>{step.text(resA, resB)}</p>
          <div className="dnav">
            <button type="button" className="btn ghost sm" disabled={demo!.step === 0} onClick={() => goDemo(activeDemo.id, demo!.step - 1)}>← Back</button>
            {demo!.step < activeDemo.steps.length - 1
              ? <button type="button" className="btn sm" onClick={() => goDemo(activeDemo.id, demo!.step + 1)}>Next →</button>
              : <button type="button" className="btn sm" onClick={() => setDemo(null)}>Finish and explore</button>}
            <button type="button" className="btn ghost sm" onClick={() => setDemo(null)}>Exit demo</button>
          </div>
        </div>
      )}

      {error && <div className="callout"><b>Data problem.</b> {error}</div>}

      <div className="card ivout">
        <div className="chartbox" ref={chartRef} />
        <p className="fine">Dots are yearly values. A solid line is a significant trend; a dashed line could be chance.</p>
        <div className="rcards">
          {([[placeA, resA, COLOR_A], [placeB, resB, COLOR_B]] as const).map(([p, res], i) => p && (
            <div key={i} className="rc" style={{ borderLeftColor: i ? COLOR_B : COLOR_A }}>
              <h4>{p.name} {res && <span className={`pill p-${trendVerdict(res).k}`}>{trendVerdict(res).sym} {trendVerdict(res).text}</span>}</h4>
              {res?.ok ? <>
                <div className="big">{formatRate(res.perDecade!, v.unit)} <small>{v.unit} per decade</small></div>
                <p>95% range {formatRate(res.lo!, v.unit)} to {formatRate(res.hi!, v.unit)} · {formatP(res.p!)} · {res.n} years</p>
                <p>{explain(p, v, season.label, res)}</p>
              </> : <p>{res ? explain(p, v, season.label, res) : 'Loading NASA POWER data…'}</p>}
            </div>
          ))}
        </div>
        <div className="ivact">
          <button type="button" className="btn" onClick={askDetective} disabled={!resA}>Ask the Detective about this result</button>
          <button type="button" className="btn ghost" onClick={downloadCsv} disabled={!sA}>Download the yearly data (CSV)</button>
        </div>
      </div>
      </>}
    </section>
  );
}
