import { useState, useEffect, useRef } from 'react';
import { CITIES } from '../data/cities';
import { VARIABLES, getVarDefaultRange } from '../data/variables';
import { getSeriesForCityVar } from '../data/series';
import { runTrend, trendVerdict, formatRate, formatP } from '../lib/stats';
import { buildChart, buildRateChart } from '../lib/chart';
import { getNational, ENSO_LINKS, TC_FLOOD_SHARE } from '../data/national';

type TabId = 'sea' | 'river' | 'heat' | 'rain' | 'built' | 'storms';

const TABS: { id: TabId; label: string }[] = [
  { id: 'sea', label: 'Sea level' },
  { id: 'river', label: 'Rivers' },
  { id: 'heat', label: 'Heat' },
  { id: 'rain', label: 'Rain' },
  { id: 'built', label: 'Urbanization' },
  { id: 'storms', label: 'Typhoons and El Niño' },
];

function PillVerdict({ res }: { res: ReturnType<typeof runTrend> }) {
  const v = trendVerdict(res);
  return <span className={`pill p-${v.k}`}><b aria-hidden="true">{v.sym}</b> {v.text}</span>;
}

function SeaPanel() {
  const chartRef = useRef<HTMLDivElement>(null);
  const s = getSeriesForCityVar('mm', 'sea');
  const before = s ? runTrend(s, 1902, 1964) : null;
  const after = s ? runTrend(s, 1965, 2022) : null;
  const base1960s = s ? s.years.filter(y => y >= 1960 && y <= 1969).reduce((a, y, _, arr) => a + s.values[s.years.indexOf(y)] / arr.length, 0) : 0;

  useEffect(() => {
    if (!chartRef.current || !s || !before || !after) return;
    const pts: [number, number][] = s.years.map((y, i) => [y, s.values[i] - base1960s]);
    const layout = buildChart({
      W: chartRef.current.clientWidth || 760,
      aria: 'Sea level at Manila South Harbor from 1902 to 2022',
      yLabel: 'mm above the 1960s average',
      yWide: true,
      series: [{ color: '#1c6e88', pts, dots: true, r: 2.8, width: 1.8, maxGap: 2 }],
      trends: [
        { x1: 1902, y1: before.intercept! + before.slope! * 1902 - base1960s, x2: 1964, y2: before.intercept! + before.slope! * 1964 - base1960s, color: '#6b7c86', width: 3.2 },
        { x1: 1965, y1: after.intercept! + after.slope! * 1965 - base1960s, x2: 2022, y2: after.intercept! + after.slope! * 2022 - base1960s, color: '#b04a3a', width: 3.2 },
      ],
      vlines: [{ x: 2002, label: 'Gauge moved' }],
    });
    chartRef.current.innerHTML = layout.svg;
  }, []);

  return (
    <div>
      <div className="pane-head">
        <h3>Sea level at Manila's shoreline</h3>
        <span className="badge b-m">Measured</span>
      </div>
      <p className="lead">Yearly average sea level at the Manila South Harbor tide gauge. The rise speeds up after 1965.</p>
      <div className="chips">
        <span className="stat"><i className="sw" style={{ background: '#6b7c86' }} />Before 1965 <b>{before?.ok ? formatRate(before.perDecade!, 'mm') : '—'} mm</b> per decade</span>
        <span className="stat"><i className="sw" style={{ background: '#b04a3a' }} />1965 to 2022 <b>{after?.ok ? formatRate(after.perDecade!, 'mm') : '—'} mm</b> per decade</span>
      </div>
      <div className="chartbox" ref={chartRef} />
      <p className="fine">Dots are yearly values. Gaps are years without enough data.</p>
      <div className="callout">
        <b>Read with care.</b> The gauge measures the sea against the land, so sinking ground counts as rising sea.
        The gauge moved about 1 km in 2002, and the record has no data for 2001 to 2004.
      </div>
    </div>
  );
}

interface CityRow {
  c: typeof CITIES[0];
  s: ReturnType<typeof getSeriesForCityVar> & {};
  base: number;
  res: ReturnType<typeof runTrend>;
}

function HeatPanel() {
  const [measure, setMeasure] = useState<string>('lstn');
  const varDef = VARIABLES[measure];
  const [from, to] = getVarDefaultRange(varDef);
  const baseStart = varDef.from ? 2001 : 1981;

  const rows: CityRow[] = CITIES.flatMap(c => {
    const s = getSeriesForCityVar(c.id, measure);
    if (!s) return [];
    const base = s.years.filter(y => y >= baseStart && y <= 2010).reduce((a, y, _, arr) => a + s.values[s.years.indexOf(y)] / arr.length, 0);
    const res = runTrend(s, from, to);
    return [{ c, s, base, res }];
  });

  const maxDev = Math.max(...rows.flatMap(r => r.s.values.map((v: number) => Math.abs(v - r.base)))) || 1;

  function heatColor(dev: number) {
    const t = Math.max(-1, Math.min(1, dev / maxDev));
    const lerp = (a: number, b: number, f: number) => Math.round(a + (b - a) * f);
    const base = [242, 238, 228];
    const hot = [180, 71, 43];
    const cold = [47, 106, 165];
    const [r1, g1, b1] = t >= 0 ? hot : cold;
    const f = Math.abs(t);
    return `rgb(${lerp(base[0], r1, f)},${lerp(base[1], g1, f)},${lerp(base[2], b1, f)})`;
  }

  const HEAT_MEASURES = [
    ['lstn', 'Night, ground (satellite)'], ['lstd', 'Day, ground (satellite)'],
    ['tmin', 'Night, air (model)'], ['tmax', 'Day, air (model)'], ['tavg', 'Average, air (model)'],
  ];

  return (
    <div>
      <div className="pane-head">
        <h3>Heat: warming in most cities</h3>
        <span className="badge b-s">Satellite</span>
      </div>
      <p className="lead">{varDef.label}. Each stripe is one year, coloured by how far it was from the {baseStart}–2010 average.</p>
      <div>
        <span className="seglab">Measure</span>
        <div className="seg" role="group" aria-label="Temperature measure">
          {HEAT_MEASURES.map(([id, label]) => (
            <button key={id} type="button" data-heat={id} aria-pressed={measure === id ? 'true' : 'false'} onClick={() => setMeasure(id)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="stripes">
        {rows.map(row => (
          <div key={row.c.id} className="srow">
            <span className="slab"><i style={{ background: row.c.color }} />{row.c.name}</span>
            <div className="stripe" role="img" aria-label={`${row.c.name} yearly temperature stripes`}>
              {row.s.years.map((y: number, i: number) => (
                <i key={y} style={{ background: heatColor(row.s.values[i] - row.base) }} title={`${y}: ${(row.s.values[i] - row.base).toFixed(2)} °C vs avg`} />
              ))}
            </div>
            <span className="srate">
              <PillVerdict res={row.res} /><br />
              <b>{formatRate(row.res.perDecade ?? 0, '°C')} °C</b> per decade
            </span>
          </div>
        ))}
      </div>
      <div className="lbar" style={{ background: 'linear-gradient(90deg,#2f6aa5,#f2eee4,#b4472b)' }} />
      <div className="llab"><span>Cooler</span><span>{baseStart}–2010 average</span><span>Warmer</span></div>
    </div>
  );
}

function RainPanel() {
  const [measure, setMeasure] = useState<string>('sr');
  const rateRef = useRef<HTMLDivElement>(null);
  const varDef = VARIABLES[measure];
  const [from, to] = getVarDefaultRange(varDef);

  const rows = CITIES.map(c => {
    const s = getSeriesForCityVar(c.id, measure);
    if (!s) return { c, res: null };
    return { c, res: runTrend(s, from, to) };
  });

  useEffect(() => {
    if (!rateRef.current) return;
    const rateRows = rows.map(r => r.res?.ok
      ? { name: r.c.name, color: r.c.color, rate: r.res.perDecade!, lo: r.res.lo!, hi: r.res.hi!, sig: r.res.level === 'sig', text: formatRate(r.res.perDecade!, 'mm') + ' mm' }
      : { name: r.c.name, color: r.c.color, none: true }
    );
    rateRef.current.innerHTML = buildRateChart(rateRows, `change in ${varDef.label.toLowerCase()} per decade (mm)`, 'Rates of change', rateRef.current.clientWidth || 700);
  }, [measure]);

  const RAIN_MEASURES = [
    ['sr', 'Yearly rain (satellite)'], ['rain', 'Yearly rain (model)'],
    ['srx', 'Wettest month (satellite)'], ['rx1', 'Wettest day (model)'],
  ];

  return (
    <div>
      <div className="pane-head">
        <h3>Rain: no city shows a confirmed significant rise</h3>
        <span className={`badge b-${varDef.from ? 's' : 'n'}`}>{varDef.from ? 'Satellite' : 'NASA model'}</span>
      </div>
      <p className="lead">{varDef.label}, {from} to {to}.</p>
      <div>
        <span className="seglab">Measure</span>
        <div className="seg" role="group" aria-label="Rain measure">
          {RAIN_MEASURES.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={measure === id ? 'true' : 'false'} onClick={() => setMeasure(id)}>{label}</button>
          ))}
        </div>
      </div>
      <div className="chartbox" ref={rateRef} />
      <p className="fine">Filled dot: significant. Hollow dot: could be chance. Line: 95% range of the rate.</p>
      <div className="callout">
        <b>Read with care.</b> NASA's model and the satellite disagree on significance. Treat the rain rise as unproven until station records agree.
      </div>
    </div>
  );
}

function RiverPanel() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [level, setLevel] = useState('a15');
  const s = getSeriesForCityVar('mm', level);
  const res = s ? runTrend(s, 2002, 2016) : null;

  useEffect(() => {
    if (!chartRef.current || !s || !res) return;
    const pts: [number, number][] = s.years.map((y, i) => [y, s.values[i]]);
    const layout = buildChart({
      W: chartRef.current.clientWidth || 760,
      aria: `Bar chart of Marikina River events at ${level}`,
      yLabel: 'times per year', bars: true, yZero: true,
      series: [{ color: '#1c6e88', pts, bar: true }],
      trends: res.ok ? [{ x1: 2002, y1: res.intercept! + res.slope! * 2002, x2: 2016, y2: res.intercept! + res.slope! * 2016, color: '#b04a3a', dash: '7 5', width: 2.6 }] : [],
    });
    chartRef.current.innerHTML = layout.svg;
  }, [level]);

  const LEVELS: [string, string][] = [['a15', '15 m (first alarm)'], ['a16', '16 m'], ['a17', '17 m'], ['a18', '18 m (forced evacuation)']];

  return (
    <div>
      <div className="pane-head">
        <h3>Rivers: more big-flood events? Not shown yet</h3>
        <span className="badge b-m">Measured</span>
      </div>
      <p className="lead">How many times each year the Marikina River reached an alert level at the Sto. Niño gauge, 2002 to 2016.</p>
      <div>
        <span className="seglab">Alert level</span>
        <div className="seg" role="group" aria-label="Alert level">
          {LEVELS.map(([id, label]) => (
            <button key={id} type="button" aria-pressed={level === id ? 'true' : 'false'} onClick={() => setLevel(id)}>{label}</button>
          ))}
        </div>
      </div>
      {res && (
        <div className="chips">
          <span className="stat"><PillVerdict res={res} /></span>
          <span className="stat"><b>{formatRate(res.perDecade ?? 0, 'events')}</b> events per decade</span>
          {res.p != null && <span className="stat"><b>{formatP(res.p)}</b></span>}
        </div>
      )}
      <div className="chartbox" ref={chartRef} />
      <div className="callout">
        <b>Read with care.</b> Fourteen years is short and ends in 2016, before the 2020 and 2024 floods.
      </div>
    </div>
  );
}

function BuiltPanel() {
  const BUILT_DATA: Record<string, { years: number[]; km2: number[]; box: number }> = {
    mm:   { years: [1975,1980,1985,1990,1995,2000,2005,2010,2015,2020], km2: [189.76,196.58,204.65,213.6,226.71,240.52,244.47,248.79,252.67,253.91], box: 1196.5 },
    naga: { years: [1975,1980,1985,1990,1995,2000,2005,2010,2015,2020], km2: [1.96,2.68,3.68,4.88,6.22,7.7,8.24,8.9,9.61,10.19], box: 360.5 },
    tug:  { years: [1975,1980,1985,1990,1995,2000,2005,2010,2015,2020], km2: [3.66,4.57,5.73,7.12,8.1,9.16,10,10.94,11.85,12.33], box: 353.5 },
    cebu: { years: [1975,1980,1985,1990,1995,2000,2005,2010,2015,2020], km2: [25.14,27.4,30.3,33.64,37.5,41.8,43.22,44.79,46.34,47.34], box: 608.2 },
    cdo:  { years: [1975,1980,1985,1990,1995,2000,2005,2010,2015,2020], km2: [8.93,9.92,11.16,12.59,13.56,14.68,15.46,16.41,17.42,18.12], box: 366.9 },
  };
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!chartRef.current) return;
    const series = CITIES.map(c => {
      const d = BUILT_DATA[c.id];
      return { color: c.color, pts: d.years.map((y, i) => [y, d.km2[i] / d.box * 100] as [number, number]), dots: true, r: 3.4, width: 2.4 };
    });
    const layout = buildChart({ W: chartRef.current.clientWidth || 760, aria: 'Built-up share around each city 1975 to 2020', yLabel: '% of the area built up', yZero: true, series });
    chartRef.current.innerHTML = layout.svg;
  }, []);

  return (
    <div>
      <div className="pane-head">
        <h3>Urbanization (built-up land): growing in every city</h3>
        <span className="badge b-s">Satellite</span>
      </div>
      <p className="lead">Share of the area around each city that is built up, from satellite imagery, every five years from 1975 to 2020.</p>
      <div className="chartbox" ref={chartRef} />
      <div className="scroll">
        <table className="tbl">
          <thead><tr><th>City</th><th>Built-up 2020</th><th>Share</th><th>Growth 2000–2020</th></tr></thead>
          <tbody>
            {CITIES.map(c => {
              const d = BUILT_DATA[c.id];
              const i2020 = d.years.indexOf(2020), i2000 = d.years.indexOf(2000);
              return (
                <tr key={c.id}>
                  <td><b>{c.name}</b></td>
                  <td className="num">{d.km2[i2020].toFixed(0)} km²</td>
                  <td className="num">{(d.km2[i2020] / d.box * 100).toFixed(1)}%</td>
                  <td className="num"><b>+{Math.round((d.km2[i2020] / d.km2[i2000] - 1) * 100)}%</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="callout">
        <b>Read with care.</b> Built-up area is not paved area, and it has not been tested against flooding here.
      </div>
    </div>
  );
}

const ENSO_PHASES = [
  { id: 'nina', label: 'La Niña year', color: '#1c6e88', test: (v: number) => v <= -0.5 },
  { id: 'neutral', label: 'Neutral year', color: '#9aa7ae', test: (v: number) => v > -0.5 && v < 0.5 },
  { id: 'nino', label: 'El Niño year', color: '#b04a3a', test: (v: number) => v >= 0.5 },
];

const STORM_VARS: { id: string; sid: string; label: string; from: number; to: number; badge: string }[] = [
  { id: 'landfalls', sid: 'ph-landfalls', label: 'Storm landfalls', from: 1951, to: 2025, badge: 'm' },
  { id: 'strong', sid: 'ph-strong', label: 'Typhoon-strength landfalls', from: 1951, to: 2025, badge: 'm' },
  { id: 'floods', sid: 'ph-floods', label: 'Recorded floods', from: 1985, to: 2024, badge: 'r' },
  { id: 'flooddead', sid: 'ph-flooddead', label: 'Flood deaths', from: 1985, to: 2024, badge: 'r' },
];

function StormsPanel() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [vid, setVid] = useState('landfalls');
  const v = STORM_VARS.find(x => x.id === vid)!;
  const s = getNational(v.sid);
  const oni = getNational('ph-oni');
  const res = s ? runTrend(s, v.from, v.to) : null;
  const oniOf = (y: number) => oni ? oni.values[oni.years.indexOf(y)] : undefined;
  const link = ENSO_LINKS[vid];

  // Average per year in each ENSO phase
  const phaseAvg = ENSO_PHASES.map(ph => {
    const vals = s ? s.values.filter((_, i) => { const o = oniOf(s.years[i]); return o != null && ph.test(o); }) : [];
    const sorted = [...vals].sort((a, b) => a - b), m = sorted.length;
    const median = m ? (m % 2 ? sorted[(m - 1) / 2] : (sorted[m / 2 - 1] + sorted[m / 2]) / 2) : 0;
    return { ...ph, n: m, median, avg: m ? vals.reduce((a, b) => a + b, 0) / m : 0 };
  });

  useEffect(() => {
    if (!chartRef.current || !s || !res) return;
    const series = ENSO_PHASES.map(ph => ({
      color: ph.color, bar: true,
      pts: s.years.map((y, i) => [y, s.values[i]] as [number, number]).filter(([y]) => { const o = oniOf(y); return o != null && ph.test(o); }),
    }));
    const layout = buildChart({
      W: chartRef.current.clientWidth || 760,
      aria: `Bar chart of ${v.label.toLowerCase()} in the Philippines, ${v.from} to ${v.to}, coloured by El Niño and La Niña`,
      yLabel: `${s.unit} per year`, bars: true, yZero: true, series,
      trends: res.ok ? [{ x1: v.from, y1: res.intercept! + res.slope! * v.from, x2: v.to, y2: res.intercept! + res.slope! * v.to, color: '#1d2a33', dash: '7 5', width: 2.4 }] : [],
    });
    chartRef.current.innerHTML = layout.svg;
  }, [vid]);

  const linkText = link
    ? link.p < 0.05
      ? `${link.rho < 0 ? 'More' : 'Fewer'} in La Niña years, significant (Spearman ρ = ${link.rho}, ${formatP(link.p)}, ${link.n} years).`
      : `No significant link to El Niño or La Niña (Spearman ρ = ${link.rho}, ${formatP(link.p)}, ${link.n} years).`
    : '';

  return (
    <div>
      <div className="pane-head">
        <h3>Typhoons and El Niño: what sets off the big floods</h3>
        <span className={`badge b-${v.badge}`}>{v.badge === 'm' ? 'Measured' : 'Reported'}</span>
      </div>
      <p className="lead">
        Storms crossing Philippine land each year since 1951, and large floods recorded since 1985.
        Each bar is coloured by that year's El Niño or La Niña state.
        Tropical storms and typhoons were the main cause of {Math.round(TC_FLOOD_SHARE * 100)}% of the recorded floods.
      </p>
      <div>
        <span className="seglab">Show</span>
        <div className="seg" role="group" aria-label="Typhoon and flood measure">
          {STORM_VARS.map(x => (
            <button key={x.id} type="button" aria-pressed={vid === x.id ? 'true' : 'false'} onClick={() => setVid(x.id)}>{x.label}</button>
          ))}
        </div>
      </div>
      {res && (
        <div className="chips">
          <span className="stat"><PillVerdict res={res} /></span>
          {res.ok && <span className="stat"><b>{formatRate(res.perDecade ?? 0, s!.unit)}</b> {s!.unit} per decade</span>}
          {res.p != null && <span className="stat"><b>{formatP(res.p)}</b></span>}
        </div>
      )}
      <ul className="cities" aria-label="Bar colours">
        {ENSO_PHASES.map(ph => <li key={ph.id}><i style={{ background: ph.color }} />{ph.label}</li>)}
      </ul>
      <div className="chartbox" ref={chartRef} />
      <div className="scroll">
        <table className="tbl">
          <thead><tr><th>Year type</th><th>Years</th><th>Average {s?.unit} per year</th><th>Typical (median)</th></tr></thead>
          <tbody>
            {phaseAvg.map(ph => (
              <tr key={ph.id}>
                <td><b>{ph.label.replace(' year', '')}</b></td>
                <td className="num">{ph.n}</td>
                <td className="num"><b>{ph.avg.toFixed(1)}</b></td>
                <td className="num">{ph.median.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="fine">{linkText}</p>
      <div className="callout">
        <b>Read with care.</b> The flood record lists only large floods that made the news, and reporting has changed over time,
        so its trend says more about the record than about flooding. Storm counts before the 1970s rest on fewer satellite images.
        El Niño and La Niña are judged from the yearly average of NOAA's ONI. One disaster can dominate an average
        (the 1991 Ormoc flood, 6,376 deaths, fell in an El Niño year), so compare the median too.
      </div>
    </div>
  );
}

const PANEL_MAP: Record<TabId, React.ComponentType> = {
  sea: SeaPanel, river: RiverPanel, heat: HeatPanel, rain: RainPanel, built: BuiltPanel, storms: StormsPanel,
};

interface Props { initialTab?: TabId; }

export default function RisingSection({ initialTab }: Props) {
  const [active, setActive] = useState<TabId>(initialTab || 'sea');
  const Panel = PANEL_MAP[active];

  return (
    <section id="rising" className="sec wrap">
      <h2 className="sec-h">The suspects</h2>
      <p className="sec-intro">Pick a suspected factor. Each one is put through the same test, so sea level, rivers, heat, rain, urbanization and typhoons can be judged on equal terms.</p>
      <div className="tabs" role="tablist" aria-label="Topics">
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            onClick={() => setActive(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="panel" role="tabpanel">
        <Panel />
      </div>
    </section>
  );
}
