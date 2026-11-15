// NASA POWER variables offered in "Investigate any place", with plain-language definitions.
// POWER serves MERRA-2 model values (from 1981) and satellite-based CERES/GEWEX sunlight and cloud (from 1984).

export interface PowerVar {
  id: string;            // NASA POWER parameter name
  label: string;
  unit: string;          // unit shown after yearly aggregation
  agg: 'mean' | 'sum';   // sum: monthly mm/day values become a total for the chosen months
  scale?: number;        // multiply raw values (e.g. 0–1 fraction to %)
  from: number;
  group: string;
  source: 'model' | 'satellite';
  def: string;           // what it is, for a high-school reader
  why: string;           // why it might change, or why it matters for floods
}

const MERRA = 1981, CERES = 1984;

export const POWER_VARS: PowerVar[] = [
  { id: 'T2M_MIN', label: 'Night-time low temperature', unit: '°C', agg: 'mean', from: MERRA, group: 'Heat', source: 'model',
    def: 'The coldest air temperature of each day, 2 metres above the ground, averaged over the months you pick. It usually happens just before sunrise.',
    why: 'Nights often warm faster than days, because clouds, humidity and city surfaces hold heat after sunset.' },
  { id: 'T2M_MAX', label: 'Daytime high temperature', unit: '°C', agg: 'mean', from: MERRA, group: 'Heat', source: 'model',
    def: 'The hottest air temperature of each day, 2 metres above the ground, averaged over the months you pick.',
    why: 'More cloud shades the ground and can hold daytime highs down even while the climate warms.' },
  { id: 'T2M', label: 'Average air temperature', unit: '°C', agg: 'mean', from: MERRA, group: 'Heat', source: 'model',
    def: 'The average air temperature 2 metres above the ground, day and night together.',
    why: 'The simplest sign of a warming or cooling climate.' },
  { id: 'TS', label: 'Ground surface temperature', unit: '°C', agg: 'mean', from: MERRA, group: 'Heat', source: 'model',
    def: 'How warm the very top of the ground (or sea) is, rather than the air above it.',
    why: 'Wet ground stays cooler than dry ground, because evaporating water carries heat away.' },
  { id: 'PRECTOTCORR', label: 'Rainfall', unit: 'mm', agg: 'sum', from: MERRA, group: 'Water', source: 'model',
    def: 'Total rain (and any other precipitation) that falls in the months you pick, in millimetres of water depth.',
    why: 'More rain can mean more floods, but rain varies a lot from year to year, so trends need long records.' },
  { id: 'EVLAND', label: 'Evaporation from land', unit: 'mm', agg: 'sum', from: MERRA, group: 'Water', source: 'model',
    def: 'Water that rises from soil, lakes and plants into the air (evaporation plus plant transpiration), as a depth in millimetres.',
    why: 'Warmer, wetter places evaporate more water, which feeds clouds and rain.' },
  { id: 'GWETTOP', label: 'Surface soil wetness', unit: '%', agg: 'mean', scale: 100, from: MERRA, group: 'Water', source: 'model',
    def: 'How full of water the top 5 cm of soil is: 0% is bone dry, 100% is completely soaked.',
    why: 'Soaked soil cannot absorb more rain, so the next downpour runs off and floods faster.' },
  { id: 'GWETROOT', label: 'Root-zone soil wetness', unit: '%', agg: 'mean', scale: 100, from: MERRA, group: 'Water', source: 'model',
    def: 'How full of water the soil is down to about 1 metre, where plant roots are: 0% is dry, 100% is soaked.',
    why: 'Shows longer-lasting wet or dry spells, such as droughts.' },
  { id: 'RH2M', label: 'Relative humidity', unit: '%', agg: 'mean', from: MERRA, group: 'Water', source: 'model',
    def: 'How close the air is to being full of water vapour, 2 metres above the ground. At 100% the air is saturated.',
    why: 'Humid air feels hotter and holds heat at night.' },
  { id: 'CLOUD_AMT', label: 'Cloud cover', unit: '%', agg: 'mean', from: CERES, group: 'Sky and wind', source: 'satellite',
    def: 'The share of the sky covered by cloud, measured from satellites.',
    why: 'Clouds block sunlight by day and trap heat at night.' },
  { id: 'ALLSKY_SFC_SW_DWN', label: 'Sunlight reaching the ground', unit: 'MJ/m²/day', agg: 'mean', from: CERES, group: 'Sky and wind', source: 'satellite',
    def: 'How much solar energy reaches each square metre of ground per day, after clouds and haze, estimated from satellites.',
    why: 'Falls when skies get cloudier or hazier; matters for crops and solar power.' },
  { id: 'WS10M', label: 'Wind speed', unit: 'm/s', agg: 'mean', from: MERRA, group: 'Sky and wind', source: 'model',
    def: 'Average wind speed 10 metres above the ground, in metres per second.',
    why: 'Changes in winds can show shifts in weather patterns such as the monsoon.' },
];

export const getPowerVar = (id: string) => POWER_VARS.find(v => v.id === id)!;

export const SEASONS: { id: string; label: string; months: number[] }[] = [
  { id: 'year', label: 'Whole year', months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
  { id: 'wet', label: 'Wet season (Jun–Nov)', months: [6, 7, 8, 9, 10, 11] },
  { id: 'dry', label: 'Dry season (Jan–May)', months: [1, 2, 3, 4, 5] },
  { id: 'peak', label: 'Typhoon peak (Jul–Oct)', months: [7, 8, 9, 10] },
];

export const SOURCE_TEXT = {
  model: 'NASA MERRA-2 model, via NASA POWER',
  satellite: 'Satellite (NASA CERES / GEWEX), via NASA POWER',
};
