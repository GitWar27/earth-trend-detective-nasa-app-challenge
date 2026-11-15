import { CITIES } from '../data/cities';
import { getSeriesForCityVar } from '../data/series';
import { runTrend, formatP, formatRate } from '../lib/stats';
import { getNational, ENSO_LINKS, TC_FLOOD_SHARE } from '../data/national';

interface Props { onUpload: () => void; onGoTo: (target: string) => void; }

const SOURCE_BADGES: Record<string, string> = { m: 'Measured', s: 'Satellite', n: 'NASA model', r: 'Reported' };

function Badge({ k }: { k: string }) {
  return <span className={`badge b-${k}`}>{SOURCE_BADGES[k]}</span>;
}

function getSeaTrend() {
  const s = getSeriesForCityVar('mm', 'sea');
  if (!s) return null;
  const before = runTrend(s, 1902, 1964);
  const after = runTrend(s, 1965, 2022);
  return { before, after };
}

function buildCards() {
  const sea = getSeaTrend();
  const seaAfter = sea?.after;
  const seaRatio = sea && sea.after.ok && sea.before.ok
    ? Math.round(sea.after.perDecade! / sea.before.perDecade!)
    : 0;

  const tminResults = CITIES.map(c => ({ c, res: runTrend(getSeriesForCityVar(c.id, 'tmin')!, 1995, 2025) }))
    .filter(x => x.res.ok);
  const tminRates = tminResults.map(x => x.res.perDecade!);
  const tminLo = tminRates.length ? Math.min(...tminRates).toFixed(2) : '0';
  const tminHi = tminRates.length ? Math.max(...tminRates).toFixed(2) : '0';

  const lstnSig = CITIES.filter(c => {
    const s = getSeriesForCityVar(c.id, 'lstn');
    if (!s) return false;
    const r = runTrend(s, 2001, 2025);
    return r.level === 'sig' && (r.slope ?? 0) > 0;
  }).length;

  const rx1Sig = CITIES.filter(c => {
    const s = getSeriesForCityVar(c.id, 'rx1');
    if (!s) return false;
    const r = runTrend(s, 1995, 2025);
    return r.level === 'sig' && (r.slope ?? 0) > 0;
  });
  const rx1Names = rx1Sig.map(c => c.name).join(', ');
  const rx1Vals = rx1Sig.map(c => {
    const s = getSeriesForCityVar(c.id, 'rx1')!;
    return formatRate(runTrend(s, 1995, 2025).perDecade!, 'mm');
  }).join(' and ');

  const riverSeries = getSeriesForCityVar('mm', 'a15');
  const riverRes = riverSeries ? runTrend(riverSeries, 2002, 2016) : null;
  const riverP = riverRes ? formatP(riverRes.p ?? 1) : 'n/a';
  const riverRate = riverRes ? formatRate(riverRes.perDecade!, 'events') : '0';

  const landfalls = getNational('ph-landfalls')!;
  const strong = getNational('ph-strong')!;
  const lfRes = runTrend(landfalls, 1951, 2025);
  const mean = (v: number[]) => (v.reduce((a, b) => a + b, 0) / v.length).toFixed(0);
  const floodLink = ENSO_LINKS.flooddead;

  const builtGrowth = [12, 18, 22, 15, 20]; // approximate % growth 2000-2020 per city
  const bMin = Math.min(...builtGrowth), bMax = Math.max(...builtGrowth);

  return [
    {
      tone: 'up', b: 'm', go: 'rising:sea',
      t: "Sea level at Manila's shoreline",
      n: seaAfter?.ok ? formatRate(seaAfter.perDecade!, 'mm') : '—',
      u: 'mm per decade since 1965',
      d: `About ${seaRatio}× the rate before 1965. Significant (${seaAfter?.ok ? formatP(seaAfter.p!) : '—'}). Part of this is the ground sinking.`,
    },
    {
      tone: 'up', b: 's', go: 'rising:heat:lstn',
      t: 'Warmer nights',
      n: `+${tminLo} to +${tminHi}`,
      u: '°C per decade, ground temperature seen from space, 2001 to 2025',
      d: `${lstnSig} of 5 cities are significant. NASA's air-temperature model agrees: all five warm by +${tminLo} to +${tminHi}.`,
    },
    {
      tone: 'none', b: 's', go: 'rising:rain:sr',
      t: 'More rain each year?',
      n: 'Not confirmed',
      u: "NASA's model says up in all five; the satellite does not",
      d: `Model shows more yearly rain. Satellite: 0 of 5 cities significant.`,
    },
    {
      tone: rx1Sig.length ? 'up' : 'none', b: 'n', go: 'rising:rain:rx1',
      t: 'A bigger worst rain day',
      n: rx1Sig.length ? rx1Vals : 'None',
      u: rx1Sig.length ? `mm per decade in ${rx1Names}, NASA model` : 'in any of the five cities',
      d: rx1Sig.length ? `Not significant in the other ${5 - rx1Sig.length} cities.` : 'No city shows a significant change.',
    },
    {
      tone: 'none', b: 'm', go: 'rising:river',
      t: 'River flood events',
      n: 'No clear trend',
      u: 'Marikina River, 2002 to 2016',
      d: `${riverRate} events per decade at 15 m (${riverP}). The record is too short to rule out a change.`,
    },
    {
      tone: 'info', b: 's', go: 'rising:built',
      t: 'Urbanization (built-up land)',
      n: `+${bMin}% to +${bMax}%`,
      u: 'built-up area, 2000 to 2020, from satellites',
      d: `Metro Manila is already ~21% built up; the other four are growing faster. The effect on flooding is untested.`,
    },
    {
      tone: lfRes.level === 'sig' ? 'up' : 'none', b: 'm', go: 'rising:storms',
      t: 'Typhoons and La Niña',
      n: lfRes.level === 'sig' ? formatRate(lfRes.perDecade!, 'storms') : 'No clear trend',
      u: `in storm landfalls since 1951: about ${mean(landfalls.values)} a year, ${mean(strong.values)} at typhoon strength`,
      d: `Storms set off ${Math.round(TC_FLOOD_SHARE * 100)}% of recorded floods. Flood deaths run higher in La Niña years (${formatP(floodLink.p)}).`,
    },
  ];
}

export default function HeroSection({ onUpload, onGoTo }: Props) {
  const cards = buildCards();

  return (
    <section id="overview" className="sec wrap hero">
      <p className="eyebrow">Case study: Philippine flooding · five cities · NASA and ground records since 1902</p>
      <h1>What is driving severe flooding in the Philippines?</h1>
      <p className="lead">
        This investigation looks for the factors behind severe flooding in five cities. It checks each
        suspect (rising seas, sinking ground, heavier rain, overflowing rivers, warming, urbanization,
        typhoons and La Niña) against NASA satellites, a NASA model and ground records going back as far as 1902.
        It shows which factors the data supports, which it does not, and what to check or fix next.
        Click any card to see the evidence behind it.
      </p>
      <p className="herocta">
        <a className="btn" href="#investigate">Investigate any place →</a>
        <button type="button" className="btn ghost" onClick={onUpload}>Upload / Test your data</button>
        <span className="fine">Pick any place and NASA variable, or check your own figures with the same test.</span>
      </p>
      <ul className="cities" aria-label="The five cities">
        {CITIES.map(c => (
          <li key={c.id}><i style={{ background: c.color }} />{c.name}</li>
        ))}
      </ul>
      <h2 className="h3">Seven suspected factors</h2>
      <div className="kcards">
        {cards.map((card, i) => (
          <button
            key={i}
            type="button"
            className={`kcard ${card.tone}`}
            onClick={() => onGoTo(card.go)}
          >
            <Badge k={card.b} />
            <span className="kt">{card.t}</span>
            <span className="kn">{card.n}</span>
            <span className="ku">{card.u}</span>
            <span className="kd">{card.d}</span>
            <span className="kgo">See the evidence →</span>
          </button>
        ))}
      </div>
      <div className="howto">
        <div className="row">
          <b>Where each number comes from:</b>
          <span><span className="badge b-m">Measured</span> an instrument, such as a tide gauge or weather station</span>
          <span><span className="badge b-s">Satellite</span> a NASA or EU satellite measurement</span>
          <span><span className="badge b-n">NASA model</span> a NASA computer model of the atmosphere</span>
          <span><span className="badge b-r">Reported</span> news, agency or census figures</span>
        </div>
        <div className="row">
          <b>What "significant" means:</b> the Mann-Kendall test gives p below 0.05, so chance alone would rarely produce a pattern this steady. Every rate is per decade. A trend needs at least 10 years of data to be tested.
        </div>
      </div>
    </section>
  );
}
