import { runTrend, trendVerdict, formatP, formatRate } from '../lib/stats';
import { getSeriesForCityVar } from '../data/series';
import { VARIABLES, getVarDefaultRange } from '../data/variables';
import { CITIES } from '../data/cities';

export function useNavHighlight() {
  const sections = ['overview', 'rising', 'cities', 'try', 'beyond', 'causes', 'history', 'gaps', 'ask', 'sources'];
  if (typeof window === 'undefined') return null;
  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          document.querySelectorAll('#nav a').forEach(a => {
            const href = a.getAttribute('href') || '';
            a.setAttribute('aria-current', href === '#' + e.target.id ? 'true' : 'false');
          });
        }
      });
    },
    { rootMargin: '-20% 0px -70% 0px' }
  );
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });
  return () => observer.disconnect();
}

export function getTrendForCityVar(cityId: string, variable: string, from?: number, to?: number) {
  const varDef = VARIABLES[variable];
  if (!varDef) return null;
  const s = getSeriesForCityVar(cityId, variable);
  if (!s) return null;
  const [defFrom, defTo] = getVarDefaultRange(varDef);
  return runTrend(s, from ?? defFrom, to ?? defTo);
}

export function getKeyStats() {
  const seaSeries = getSeriesForCityVar('mm', 'sea');
  const seaBefore = seaSeries ? runTrend(seaSeries, 1902, 1964) : null;
  const seaAfter = seaSeries ? runTrend(seaSeries, 1965, 2022) : null;

  const tminResults = CITIES.map(c => getTrendForCityVar(c.id, 'tmin'));
  const lstnResults = CITIES.map(c => getTrendForCityVar(c.id, 'lstn'));
  const srResults = CITIES.map(c => getTrendForCityVar(c.id, 'sr'));
  const rx1Results = CITIES.map(c => getTrendForCityVar(c.id, 'rx1'));

  const sigRising = (arr: (ReturnType<typeof runTrend> | null)[]) =>
    arr.filter(r => r?.level === 'sig' && (r.slope ?? 0) > 0);

  const rates = (arr: (ReturnType<typeof runTrend> | null)[]) =>
    arr.filter(r => r?.ok).map(r => r!.perDecade!);

  const tminRates = rates(tminResults);
  const lstnSig = sigRising(lstnResults);
  const srSig = sigRising(srResults);
  const rx1Sig = sigRising(rx1Results);

  return {
    seaAfter: seaAfter?.ok ? Math.round(seaAfter.perDecade!) : 0,
    seaRatio: seaAfter?.ok && seaBefore?.ok ? Math.round(seaAfter.perDecade! / seaBefore.perDecade!) : 0,
    seaCm: seaAfter?.ok ? Math.round(seaAfter.slope! * 57 / 10) : 0,
    tminLo: tminRates.length ? Math.min(...tminRates).toFixed(2) : '0',
    tminHi: tminRates.length ? Math.max(...tminRates).toFixed(2) : '0',
    lstnSig: lstnSig.length,
    srSig: srSig.length,
    rx1Sig: rx1Sig.length,
    rx1Names: rx1Sig.map(r => CITIES.find(c => getTrendForCityVar(c.id, 'rx1') === r)?.name).filter(Boolean).join(', '),
    riverP: (() => { const s = getSeriesForCityVar('mm', 'a15'); return s ? formatP(runTrend(s, 2002, 2016).p ?? 1) : 'n/a'; })(),
  };
}

export { trendVerdict, formatP, formatRate };
