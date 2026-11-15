import { CITIES } from '../data/cities';
import { VARIABLES, getVarDefaultRange } from '../data/variables';
import { getSeriesForCityVar } from '../data/series';
import { runTrend, formatRate } from '../lib/stats';

const MATRIX_VARS = [
  ['tmin', 'Nights, air', '°C', 'model'],
  ['lstn', 'Nights, ground', '°C', 'satellite'],
  ['lstd', 'Days, ground', '°C', 'satellite'],
  ['rain', 'Yearly rain', 'mm', 'model'],
  ['sr', 'Yearly rain', 'mm', 'satellite'],
  ['rx1', 'Worst rain day', 'mm', 'model'],
  ['sea', 'Sea level', 'mm', 'gauge'],
  ['a15', 'River 15 m+', 'events', 'gauge'],
];

function cellClass(level: string, slope: number) {
  if (level === 'sig' && slope > 0) return 'm-up';
  if (level === 'sig' && slope < 0) return 'm-down';
  if (level === 'maybe') return 'm-maybe';
  if (level === 'short') return 'm-short';
  return 'm-none';
}

function cellSym(level: string, slope: number) {
  if (level === 'sig') return slope > 0 ? '▲' : '▼';
  if (level === 'maybe') return '◇';
  return '–';
}

export default function CitiesMatrix() {
  return (
    <section id="cities" className="sec wrap">
      <h2 className="sec-h">Factors by city</h2>
      <p className="sec-intro">
        Each box shows how fast a factor is changing per decade. The symbol says whether the change is real or could be chance.
      </p>
      <div className="card">
        <div className="scroll">
          <table className="tbl matrix">
            <thead>
              <tr>
                <th scope="col">City</th>
                {MATRIX_VARS.map(([id, label, unit, src]) => (
                  <th key={id} scope="col">{label}<br /><small>{src}</small><br /><small>{unit}/decade</small></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CITIES.map(city => (
                <tr key={city.id}>
                  <th scope="row" className="rowh">
                    <i style={{ background: city.color }} />{city.name}
                  </th>
                  {MATRIX_VARS.map(([varId, , unit]) => {
                    const s = getSeriesForCityVar(city.id, varId);
                    if (!s) return <td key={varId}><div className="mc empty">—</div></td>;
                    const varDef = VARIABLES[varId];
                    const [from, to] = getVarDefaultRange(varDef);
                    const res = runTrend(s, from, to);
                    const cls = cellClass(res.level, res.slope ?? 0);
                    const sym = cellSym(res.level, res.slope ?? 0);
                    const rate = res.ok ? formatRate(res.perDecade!, unit) : '—';
                    return (
                      <td key={varId}>
                        <div className={`mc ${cls}`} title={res.verdict}>
                          <span className="sym">{sym}</span>
                          <b>{rate}</b>
                          <small>{unit}</small>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mkey">
          <span><i style={{ background: 'var(--up-strong)', borderRadius: 5, display: 'inline-block', width: 18, height: 18 }} /> Rising, significant</span>
          <span><i style={{ background: 'var(--up-soft)', borderRadius: 5, display: 'inline-block', width: 18, height: 18 }} /> Rising, suggestive</span>
          <span><i style={{ background: 'var(--down-soft)', borderRadius: 5, display: 'inline-block', width: 18, height: 18 }} /> Falling, significant</span>
          <span><i style={{ background: 'var(--none-soft)', borderRadius: 5, display: 'inline-block', width: 18, height: 18 }} /> No clear trend</span>
        </div>
      </div>
    </section>
  );
}
