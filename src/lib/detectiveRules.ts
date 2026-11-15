// Built-in answers for the Detective, used when no AI server is reachable (e.g. the static S3 site).
// Every number is computed from the app's own data, so answers stay in step with the charts.
import { CITIES } from '../data/cities';
import { VARIABLES, getVarDefaultRange } from '../data/variables';
import { getSeriesForCityVar } from '../data/series';
import { getNational, ENSO_LINKS, TC_FLOOD_SHARE } from '../data/national';
import { ACTIONS, GAPS } from '../data/findings';
import { runTrend, formatP, formatRate } from './stats';

function cityTrend(cityId: string, varId: string) {
  const s = getSeriesForCityVar(cityId, varId);
  if (!s) return null;
  const [from, to] = getVarDefaultRange(VARIABLES[varId]);
  return runTrend(s, from, to);
}

// "Metro Manila +0.26 (significant)" for each city
function cityList(varId: string) {
  const unit = VARIABLES[varId].unit;
  return CITIES.map(c => {
    const r = cityTrend(c.id, varId);
    if (!r || !r.ok) return null;
    return { name: c.name, rate: r.perDecade!, sig: r.level === 'sig', text: `${c.name} ${formatRate(r.perDecade!, unit)} ${unit}/decade${r.level === 'sig' ? ' (significant)' : ''}` };
  }).filter((x): x is NonNullable<typeof x> => x !== null);
}

function rain() {
  const model = cityList('rain'), sat = cityList('sr');
  return `**Not confirmed.** NASA's model (MERRA-2, 1995–2025) shows more yearly rain in ${model.filter(x => x.sig).length} of 5 cities, `
    + `but the GPM IMERG satellite (2001–2024) shows a significant rise in ${sat.filter(x => x.sig).length} of 5.\n`
    + `- Model: ${model.map(x => x.text).join('; ')}\n- Satellite: ${sat.map(x => x.text).join('; ')}\n`
    + `When two sources disagree, treat the rise as unproven until long rain-gauge records agree.`;
}

function heat() {
  const l = cityList('tmin').sort((a, b) => b.rate - a.rate);
  return `Nights are warming in the NASA model (1995–2025). Fastest first:\n${l.map(x => '- ' + x.text).join('\n')}\n`
    + `The MODIS satellite's night-time ground temperature (2001–2025) shows the same direction. Warmer air holds about 7% more water per °C, which can feed heavier downpours.`;
}

function sea() {
  const s = getSeriesForCityVar('mm', 'sea');
  if (!s) return 'The sea-level record is not loaded.';
  const before = runTrend(s, 1902, 1964), after = runTrend(s, 1965, 2022);
  return `At the Manila South Harbor tide gauge, sea level rose **${formatRate(after.perDecade!, 'mm')} mm per decade** from 1965 to 2022 (${formatP(after.p!)}, significant), `
    + `against ${formatRate(before.perDecade!, 'mm')} mm per decade before 1965.\n`
    + `The gauge measures the sea against the land, so sinking ground (from groundwater pumping) counts as rising sea. `
    + `GNSS stations beside the gauge would split the two. A higher bay slows drainage and lets high tides push flood water inland.`;
}

function river() {
  const s = getSeriesForCityVar('mm', 'a15');
  const r = s ? runTrend(s, 2002, 2016) : null;
  return `The Marikina River reached 15 m at Sto. Niño ${formatRate(r?.perDecade ?? 0, 'events')} more times per decade from 2002 to 2016 (${formatP(r?.p ?? 1)}): **no significant trend**. `
    + `Fourteen years is short, and the record stops before the 2020 (Ulysses) and 2024 (Kristine) floods. Longer, open river-gauge records would settle it.`;
}

function storms() {
  const lf = getNational('ph-landfalls')!, st = getNational('ph-strong')!;
  const r = runTrend(lf, 1951, 2025);
  const mean = (v: number[]) => (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1);
  const d = ENSO_LINKS.flooddead, f = ENSO_LINKS.floods;
  return `- **Typhoon landfalls:** about ${mean(lf.values)} storms a year cross Philippine land (${mean(st.values)} at typhoon strength), with ${r.level === 'sig' ? 'a significant trend' : 'no significant trend'} since 1951 (${formatP(r.p!)}).\n`
    + `- **Floods they cause:** storms were the main cause of ${Math.round(TC_FLOOD_SHARE * 100)}% of large recorded floods (1985–2024).\n`
    + `- **La Niña:** flood deaths run higher in La Niña years (Spearman ρ = ${d.rho}, ${formatP(d.p)}); recorded floods are more common too (${formatP(f.p)}, suggestive).\n`
    + `So the storms are not becoming more frequent; what they land on may be changing.`;
}

function urban() {
  return `Built-up land grew in all five cities between 1975 and 2020 (GHSL satellite data). Metro Manila is about a fifth built up; Naga, Tuguegarao, Cebu and Cagayan de Oro are growing faster. `
    + `Paved ground sends rain straight into drains instead of soaking in. The link to flooding has **not** been tested here, because there is no city-level flood record to test it against.`;
}

function missing() {
  return `Most valuable first:\n${GAPS.slice(0, 4).map(g => `- **${g.title}** — would test: ${g.test.toLowerCase()}`).join('\n')}`;
}

function actions() {
  return `Ordered by how strong the evidence is:\n${ACTIONS.slice(0, 4).map(a => `- **${a.title}** (${a.who})`).join('\n')}`;
}

function predict() {
  return `The tool can extend a straight trend line, but that is **not a forecast**: it assumes the past rate continues. `
    + `It works best for steady variables like sea level and night temperature. Rain varies so much from year to year that a trend explains little of it, so a straight-line projection of rain is unreliable.`;
}

function stats() {
  return `- **Trend:** a steady rise or fall over years.\n`
    + `- **Mann-Kendall test:** checks whether values tend to go up (or down) year after year, without assuming a straight line.\n`
    + `- **Sen's slope:** the typical rate of change, shown per decade, with a 95% range.\n`
    + `- **p-value:** how likely a pattern this steady is by chance alone. Below 0.05 we call it **significant**.\n`
    + `A trend that is not significant can still be real; sometimes it just needs more years of data.`;
}

function findings() {
  return `${sea().split('\n')[0]}\n\n`
    + `- **Nights:** warming in all five cities.\n`
    + `- **Rain:** NASA's model says more; the satellite does not confirm it.\n`
    + `- **Typhoons:** no more frequent since 1951, but La Niña years bring more flood deaths.\n`
    + `- **Urbanization:** built-up land growing in every city.\n`
    + `The strongest signal is the land and sea at Manila Bay, not the sky.`;
}

function opposite() {
  return `The same process can push one variable in opposite directions in different places. Example: a warming climate puts more water vapour into the air. `
    + `Over humid tropics like Cagayan de Oro that can mean more cloud, which shades the day, so **daytime highs can fall**. Over deserts like Phoenix, cloud thins, so **highs rise**. `
    + `Try the demo "Same process, opposite trends" in Investigate any place.`;
}

const TOPICS: [RegExp, () => string][] = [
  [/opposite|different direction|one way|other way/i, opposite],
  [/mann|kendall|\bsen'?s\b|p.?value|significan|what does .*mean|how .*test/i, stats],
  [/predict|forecast|future|projection|\bwill\b/i, predict],
  [/typhoon|storm|cyclone|ni[nñ]o|ni[nñ]a|\benso\b|\boni\b|landfall/i, storms],
  [/\bsea\b|tide|sink|subsid|coast|\bbay\b/i, sea],
  [/river|marikina|gauge/i, river],
  [/rain|precip|downpour/i, rain],
  [/heat|warm|temperat|night|\bhot/i, heat],
  [/urban|built|concrete|paved/i, urban],
  [/missing|gap|sensor|more data|reliab/i, missing],
  [/do first|action|recommend|should|solution/i, actions],
  [/finding|important|summary|overall|cause|driv|why .*flood/i, findings],
];

export function ruleAnswer(question: string, context = ''): string {
  // A result sent from "Investigate any place" already carries its plain-language explanation
  if (context && /^explain this result|this result|my result/i.test(question))
    return context.split('\n').slice(1).join('\n\n') + `\n\nNext, try a longer period, another season, or a second place to compare.`;
  for (const [re, fn] of TOPICS) if (re.test(question)) return fn();
  return `I can answer from the built-in data about: sea level and sinking ground, rain, night-time warming, the Marikina River, urbanization, typhoons and La Niña, `
    + `what the tests mean, what data is missing, and what to do first. Try one of the suggested questions.`;
}
