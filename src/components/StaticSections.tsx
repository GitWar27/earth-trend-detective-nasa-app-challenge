import { GAPS } from '../data/findings';
import { POWER_VARS, SOURCE_TEXT } from '../data/powerVars';


const LIMITS = [
  "NASA's model shows more yearly rain in all five cities, but satellite rainfall shows no significant rise. Treat the rise as unproven until station records agree.",
  'Sea level at Manila is measured against the land. It cannot separate ocean rise from sinking ground, and the gauge moved in 2002.',
  'The river record is 14 years long and ends in 2016. It cannot rule out a change after the 2020 and 2024 floods.',
  'Built-up area is measured from satellites but has not been tested against flooding.',
  'Only Metro Manila has ground-station checks. The other four cities rest on the model alone.',
  'Storm figures in the timeline come from news and agency reports. They describe events, not trends.',
  'The flood record lists only large floods that made the news. Changes in reporting can look like changes in flooding.',
  'El Niño and La Niña are linked to flooding here by correlation only, over 40 years of flood records.',
];

export function GapsSection() {
  return (
    <section id="gaps" className="sec wrap">
      <h2 className="sec-h">What is missing</h2>
      <p className="sec-intro">Evidence the investigation still needs to confirm or rule out each factor, ordered by how much each would improve the answers.</p>
      <div className="gaplist">
        {GAPS.map((g, i) => (
          <div key={i} className="gap">
            <div className="rank">{i + 1}</div>
            <div>
              <h3>{g.title}</h3>
              <dl>
                <dt>We have</dt><dd>{g.have}</dd>
                <dt>We need</dt><dd>{g.need}</dd>
                <dt>Would test</dt><dd>{g.test}</dd>
              </dl>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SourcesSection() {
  return (
    <section id="sources" className="sec wrap">
      <h2 className="sec-h">Data sources</h2>
      <p className="sec-intro">NASA data and other data are listed apart.</p>
      <div className="sgrid">
        {[
          { name: 'NASA POWER API (live, any place)', status: 'Used', what: 'Monthly MERRA-2 model and CERES/GEWEX satellite values for any point on Earth, 1981 to 2025, fetched live by Investigate any place.', url: 'https://power.larc.nasa.gov/docs/services/api/' },
          { name: 'NASA POWER (MERRA-2 reanalysis)', status: 'Used', what: 'Daily rainfall, air temperature and humidity for the model cell over each of the five cities, 1981 to 2025.', url: 'https://power.larc.nasa.gov/' },
          { name: 'GPM IMERG satellite rainfall (via Giovanni)', status: 'Used', what: 'Monthly rainfall from satellites, adjusted with rain gauges, over a small box around each city. Complete years 2001 to 2024.', url: 'https://giovanni.gsfc.nasa.gov/giovanni/' },
          { name: 'MODIS land surface temperature (Terra, MOD11A2)', status: 'Used', what: 'Yearly mean daytime and night-time ground surface temperature at 1 km, 2001 to 2025.', url: 'https://lpdaac.usgs.gov/products/mod11a2v061/' },
          { name: 'GLDAS Noah land model v2.1 (via Giovanni)', status: 'Used', what: 'Monthly surface runoff, underground runoff, evaporation and topsoil moisture over a small box around each city, 2000 to 2025.', url: 'https://disc.gsfc.nasa.gov/datasets/GLDAS_NOAH025_M_2.1/summary' },
          { name: 'GHSL built-up surface (European Commission JRC)', status: 'Used', what: 'Built-up area inside a small box around each city, every five years from 1975 to 2020.', url: 'https://ghsl.jrc.ec.europa.eu/' },
          { name: 'NOAA GHCN-Daily weather stations', status: 'Used', what: 'Daily rain and temperature at Science Garden, NAIA and Port Area in Metro Manila.', url: 'https://www.ncei.noaa.gov/cdo-web/' },
          { name: 'Manila South Harbor tide gauge (PSMSL)', status: 'Used', what: 'Yearly mean sea level at the gauge, 1902 to 2022, 95 usable years.', url: 'https://psmsl.org/data/obtaining/stations/145.php' },
          { name: 'IBTrACS tropical cyclone tracks (NOAA NCEI)', status: 'Used', what: 'Every Western Pacific storm track. Counted here as storms crossing Philippine land each season, 1951 to 2025.', url: 'https://www.ncei.noaa.gov/products/international-best-track-archive' },
          { name: 'Oceanic Niño Index (NOAA CPC)', status: 'Used', what: 'Monthly El Niño and La Niña index from 1950, averaged here into one value per year.', url: 'https://origin.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ONI_v5.php' },
          { name: 'Dartmouth Flood Observatory archive', status: 'Used', what: '215 large Philippine floods from 1985 to 2024, with deaths, people displaced and main cause.', url: 'https://floodobservatory.colorado.edu/Archives/' },
          { name: 'Marikina River alert events (MMDA-EFCOS)', status: 'Used', what: 'Times per year the river reached 15–18 m at the Sto. Niño gauge, 2002 to 2016.', url: 'https://core.ac.uk/download/335032278.pdf' },
        ].map(src => (
          <div key={src.name} className="src">
            <h4>{src.name}</h4>
            <div className="tags"><span className="tagc">{src.status}</span></div>
            <p>{src.what}</p>
            <div className="lk"><a href={src.url} target="_blank" rel="noopener">Source →</a></div>
          </div>
        ))}
      </div>
      <div className="card" style={{ marginTop: 18 }}>
        <h3 className="h3">What this investigation cannot say</h3>
        <ul className="plain limits">
          {LIMITS.map((l, i) => <li key={i}>{l}</li>)}
        </ul>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 className="h3">How the tests work</h3>
        <p>The <b>Mann-Kendall test</b> asks whether values tend to rise or fall year after year, without assuming a straight line. <b>Sen's slope</b> gives the typical rate of change, and its 95% range shows how sure that rate is. A trend is called significant when p is below 0.05. Fewer than 10 years is too few to test.</p>
      </div>
    </section>
  );
}

// Variables used outside "Investigate any place" (those have their own definitions in powerVars)
const OTHER_TERMS: [string, string][] = [
  ['Sea level (tide gauge)', "The yearly average height of the sea at the Manila South Harbor gauge. It is measured against the land, so if the land sinks, the sea looks higher."],
  ['Land surface temperature (MODIS)', "How hot the ground itself is, seen by NASA's MODIS instrument on the Terra satellite. Ground can be much hotter than the air by day."],
  ['Satellite rainfall (GPM IMERG)', "Rain estimated from a fleet of satellites led by NASA and Japan's GPM mission, checked against rain gauges."],
  ['River alert events', 'How many times a year the Marikina River rose past an alarm level (15 to 18 m) at the Sto. Niño gauge.'],
  ['Built-up land (urbanization)', 'Land covered by buildings, mapped from satellite images. More built-up land usually means more paved ground that rain cannot soak into.'],
  ['Typhoon landfall', 'A tropical storm whose centre crosses onto land. "Typhoon strength" means winds of at least 64 knots (119 km/h).'],
  ['El Niño and La Niña (ONI)', "Natural swings in Pacific Ocean temperature. NOAA's Oceanic Niño Index is above +0.5 °C in El Niño and below −0.5 °C in La Niña. La Niña usually brings the Philippines more rain."],
];

const STAT_TERMS: [string, string][] = [
  ['Time series', 'Values of one variable lined up in time order, here one value per year.'],
  ['Trend', 'A steady rise or fall that lasts over many years, beyond the normal ups and downs.'],
  ['Rate per decade', 'How much the variable changes in 10 years along the trend line. +0.2 °C per decade means about 1 °C warmer after 50 years.'],
  ['Mann-Kendall test', 'Compares every year with every later year and counts how often the value went up versus down. Lots more "ups" than "downs" means a rising trend.'],
  ["Sen's slope", 'The typical rate of change: the middle value of the slopes between every pair of years. One strange year cannot pull it far.'],
  ['p-value', 'The chance of seeing a pattern this steady if nothing were really changing. Small p-values mean chance is an unlikely explanation.'],
  ['Significant', 'p is below 0.05: chance alone would produce a pattern this steady less than 1 time in 20. "Not significant" does not prove there is no change; often it means more years are needed.'],
  ['95% range', 'The range the true rate most likely falls in. If it includes zero, the data cannot rule out "no change".'],
  ['Seasonal cycle', 'The normal swing from wet to dry or hot to cool within each year. Using one value per year (or the same months each year) removes it, so it cannot fake a trend.'],
  ['Model (reanalysis)', "A computer model, like NASA's MERRA-2, that combines satellite and weather-station measurements with physics to fill in the weather everywhere, every hour."],
  ['Correlation', 'Two things rising and falling together. It does not prove one causes the other.'],
];

export function GlossarySection() {
  return (
    <section id="glossary" className="sec wrap">
      <h2 className="sec-h">Glossary</h2>
      <p className="sec-intro">Plain-language definitions of every variable and test in this tool.</p>
      <div className="gloss">
        <div className="card">
          <h3 className="h3">Variables you can investigate anywhere</h3>
          <dl>
            {POWER_VARS.map(v => (
              <div key={v.id}><dt>{v.label} <small>({v.unit}, {SOURCE_TEXT[v.source].replace(', via NASA POWER', '')})</small></dt><dd>{v.def}</dd></div>
            ))}
          </dl>
        </div>
        <div className="card">
          <h3 className="h3">Other data in this investigation</h3>
          <dl>{OTHER_TERMS.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
          <h3 className="h3" style={{ marginTop: 18 }}>Statistics words</h3>
          <dl>{STAT_TERMS.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
        </div>
      </div>
    </section>
  );
}

const TEAM: { name: string; role: string; initials?: string }[] = [
  { name: 'Warly De La Cruz', initials: 'WD', role: 'Senior Data Engineer, Full-Stack Software and AI Developer, and Solutions Architect' },
  { name: 'Gian Balaag', role: 'Senior Software and AI Full-Stack Developer and Data Engineer' },
  { name: 'Rozaida Tuazon', role: 'Professor, AsiaTech College, and Data Analyst' },
  { name: 'John Lodie Crisostomo', role: 'BSIT Student' },
  { name: 'Gem Erien Capistrano', role: 'BSIT Student' },
  { name: 'Alfonso Vianney Sebolino', role: 'BSIT Student' },
];

const initials = (name: string) => {
  const parts = name.split(' ');
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export function TeamSection() {
  return (
    <section id="team" className="sec wrap">
      <h2 className="sec-h">Team</h2>
      <p className="sec-intro">The developers and members behind Earth Trend Detective.</p>
      <ul className="team">
        {TEAM.map(m => (
          <li key={m.name} className="card member">
            <span className="avatar" aria-hidden="true">{m.initials ?? initials(m.name)}</span>
            <div>
              <h3>{m.name}</h3>
              <p>{m.role}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
