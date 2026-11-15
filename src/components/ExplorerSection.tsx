import { useState, useEffect, useRef } from 'react';
import { CITIES } from '../data/cities';
import { VARIABLES, getVarDefaultRange } from '../data/variables';
import { getSeriesForCityVar } from '../data/series';
import { runTrend, trendVerdict, formatRate, formatP } from '../lib/stats';
import { buildChart, buildRateChart } from '../lib/chart';
import type { ChartTrend } from '../lib/chart';

const VAR_OPTIONS = Object.entries(VARIABLES).map(([id, v]) => ({ id, label: v.label, group: v.group }));

// The five-city explorer, shown as a mode of "Investigate"
export default function CityExplorer() {
  const [varId, setVarId] = useState('lstn');
  const [selectedCities, setSelectedCities] = useState<string[]>(CITIES.map(c => c.id));
  const [fromYear, setFromYear] = useState(1995);
  const [toYear, setToYear] = useState(2025);
  const [extraYears, setExtraYears] = useState(0);
  const [showChange, setShowChange] = useState(false);
  const [showSmooth, setShowSmooth] = useState(false);

  const mainChartRef = useRef<HTMLDivElement>(null);
  const rateChartRef = useRef<HTMLDivElement>(null);

  const varDef = VARIABLES[varId];

  function smooth5(vals: number[]) {
    return vals.map((_, i, arr) => {
      const slice = arr.slice(Math.max(0, i - 2), i + 3);
      return slice.reduce((a, b) => a + b, 0) / slice.length;
    });
  }

  useEffect(() => {
    if (!mainChartRef.current) return;
    const W = mainChartRef.current.clientWidth || 760;
    type SeriesItem = { color: string; pts: [number,number][]; dots: boolean; r: number; width: number; trends: ChartTrend[] };
    const seriesItems: SeriesItem[] = [];
    for (const cid of selectedCities) {
      const city = CITIES.find(c => c.id === cid)!;
      const s = getSeriesForCityVar(cid, varId);
      if (!s) continue;
      const filtered = s.years.map((y, i) => ({ y, v: s.values[i] })).filter(p => p.y >= fromYear && p.y <= toYear);
      if (!filtered.length) continue;
      let vals = filtered.map(p => p.v);
      if (showSmooth) vals = smooth5(vals);
      const base = vals[0];
      const pts: [number, number][] = filtered.map((p, i) => [p.y, showChange ? vals[i] - base : vals[i]]);
      const res = runTrend(s, fromYear, toYear);
      const trends: ChartTrend[] = res.ok ? [{
        x1: fromYear, y1: showChange ? res.intercept! + res.slope! * fromYear - base : res.intercept! + res.slope! * fromYear,
        x2: toYear + extraYears, y2: showChange ? res.intercept! + res.slope! * (toYear + extraYears) - base : res.intercept! + res.slope! * (toYear + extraYears),
        color: city.color, dash: res.level === 'sig' ? undefined : '7 5', width: 1.8, opacity: 0.6,
      }] : [];
      seriesItems.push({ color: city.color, pts, dots: true, r: 2.4, width: 1.8, trends });
    }
    const allTrends = seriesItems.flatMap(s => s.trends);
    const layout = buildChart({
      W, aria: `${varDef.label} for selected cities`,
      yLabel: varDef.label + (varDef.unit ? ` (${varDef.unit})` : ''),
      series: seriesItems.map(({ color, pts, dots, r, width }) => ({ color, pts, dots, r, width })),
      trends: allTrends,
    });
    mainChartRef.current.innerHTML = layout.svg;
  }, [varId, selectedCities, fromYear, toYear, extraYears, showChange, showSmooth]);

  useEffect(() => {
    if (!rateChartRef.current) return;
    const rows = selectedCities.map(cid => {
      const city = CITIES.find(c => c.id === cid)!;
      const s = getSeriesForCityVar(cid, varId);
      if (!s) return { name: city.name, color: city.color, none: true };
      const res = runTrend(s, fromYear, toYear);
      if (!res.ok) return { name: city.name, color: city.color, none: true };
      return { name: city.name, color: city.color, rate: res.perDecade!, lo: res.lo!, hi: res.hi!, sig: res.level === 'sig', text: formatRate(res.perDecade!, varDef.unit) + ' ' + varDef.unit };
    });
    rateChartRef.current.innerHTML = buildRateChart(rows, `change per decade (${varDef.unit})`, 'Rates of change', rateChartRef.current.clientWidth || 700);
  }, [varId, selectedCities, fromYear, toYear]);

  function toggleCity(id: string) {
    setSelectedCities(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  }

  function reset() {
    const [f, t] = getVarDefaultRange(VARIABLES[varId]);
    setFromYear(f); setToYear(t); setExtraYears(0); setShowChange(false); setShowSmooth(false);
    setSelectedCities(CITIES.map(c => c.id));
  }

  const groups = [...new Set(VAR_OPTIONS.map(v => v.group))];

  return (
    <div className="cityex">
      <p className="lead">Compare all five cities on every dataset in this investigation: NASA model, satellite, tide gauge, river gauge and GLDAS. Choose what to look at, which cities, and which years.</p>
      <div className="ctl-card">
        <div className="ctl">
          <label htmlFor="exVar">What to look at</label>
          <select id="exVar" value={varId} onChange={e => { setVarId(e.target.value); const [f, t] = getVarDefaultRange(VARIABLES[e.target.value]); setFromYear(f); setToYear(t); }}>
            {groups.map(g => (
              <optgroup key={g} label={g}>
                {VAR_OPTIONS.filter(v => v.group === g).map(v => <option key={v.id} value={v.id}>{v.label}</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="ctl">
          <span className="lbl">Cities</span>
          <div className="cchips" role="group" aria-label="Cities">
            {CITIES.map(c => (
              <button key={c.id} type="button" className="cchip" aria-pressed={selectedCities.includes(c.id) ? 'true' : 'false'} onClick={() => toggleCity(c.id)}>
                <i style={{ background: c.color }} />{c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="ctl">
          <label htmlFor="exFrom">From year <output>{fromYear}</output></label>
          <input type="range" id="exFrom" min={1981} max={toYear - 1} value={fromYear} onChange={e => setFromYear(+e.target.value)} />
        </div>
        <div className="ctl">
          <label htmlFor="exTo">To year <output>{toYear}</output></label>
          <input type="range" id="exTo" min={fromYear + 1} max={2025} value={toYear} onChange={e => setToYear(+e.target.value)} />
        </div>
        <div className="ctl">
          <label htmlFor="exExt">Extend the trend forward <output>{extraYears}</output></label>
          <input type="range" id="exExt" min={0} max={30} step={1} value={extraYears} onChange={e => setExtraYears(+e.target.value)} />
        </div>
        <div className="ctl checks">
          <label><input type="checkbox" checked={showChange} onChange={e => setShowChange(e.target.checked)} /> Show change from the start year</label>
          <label><input type="checkbox" checked={showSmooth} onChange={e => setShowSmooth(e.target.checked)} /> Smooth with a 5-year average</label>
          <button className="btn ghost" type="button" onClick={reset}>Reset</button>
        </div>
      </div>
      <div className="exout">
        <div className="card">
          <div className="chartbox" ref={mainChartRef} />
          <div className="key">
            {CITIES.filter(c => selectedCities.includes(c.id)).map(c => (
              <span key={c.id}><svg width="30" height="10"><line x1="0" y1="5" x2="30" y2="5" stroke={c.color} strokeWidth="2.5" /></svg>{c.name}</span>
            ))}
          </div>
        </div>
        <div className="card">
          <h3 className="h3">Rate of change per decade</h3>
          <div className="chartbox" ref={rateChartRef} />
          <p className="fine">A filled dot is significant. A hollow dot could be chance. The line is the 95% range.</p>
        </div>
        <div className="rcards">
          {selectedCities.map(cid => {
            const city = CITIES.find(c => c.id === cid)!;
            const s = getSeriesForCityVar(cid, varId);
            if (!s) return null;
            const res = runTrend(s, fromYear, toYear);
            const v = trendVerdict(res);
            return (
              <div key={cid} className="rc" style={{ borderLeftColor: city.color }}>
                <h4>{city.name} <span className={`pill p-${v.k}`}>{v.sym} {v.text}</span></h4>
                {res.ok && (
                  <>
                    <div className="big">{formatRate(res.perDecade!, varDef.unit)} {varDef.unit}/decade</div>
                    <p>95% range: {formatRate(res.lo!, varDef.unit)} to {formatRate(res.hi!, varDef.unit)} · {formatP(res.p!)}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
