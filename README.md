# Earth Trend Detective

**A tool for finding and testing trends in NASA Earth science data, with a case study: what drives severe flooding in the Philippines?**

Users pick a place and a variable from NASA missions and models, see how it changes over time, and test whether the change is significant (Mann-Kendall test and Sen's slope), with plain-language explanations, demonstrations and an AI "Detective".

For the case study, the app pulls together NASA data and other open records, some going back as far as 1902, and tests each suspected factor in five cities: Metro Manila, Naga, Tuguegarao, Metro Cebu and Cagayan de Oro.

## The question

Severe floods such as Ondoy (2009), Sendong (2011), Ulysses (2020) and Kristine (2024) keep hitting the same places. This app asks **which factors contribute, and how strong the evidence is for each one**:

| Suspected factor | Evidence used | Record |
| --- | --- | --- |
| Rising sea and sinking ground | Manila South Harbor tide gauge (PSMSL) | 1902–2022 |
| Heavier rain | NASA POWER (MERRA-2), GPM IMERG satellite, NOAA stations | 1981–2025 |
| Overflowing rivers | Marikina River alert events (MMDA-EFCOS) | 2002–2016 |
| Warming | NASA POWER air temperature, MODIS surface temperature | 1981–2025 |
| Urbanization (built-up land) | GHSL built-up surface (EC JRC) | 1975–2020 |
| Typhoon landfalls | IBTrACS storm tracks (NOAA NCEI) | 1951–2025 |
| El Niño and La Niña | Oceanic Niño Index (NOAA CPC) | 1951–2025 |
| Recorded floods | Dartmouth Flood Observatory archive | 1985–2024 |

Every factor goes through the same **Mann-Kendall trend test** with **Sen's slope**, so the factors can be compared on equal terms. A trend counts as significant when p < 0.05.

## What the app does

- **Investigate any place**: pick any point on a map and one of 12 NASA variables (MERRA-2 model and CERES satellite data via the NASA POWER API, 1981–2025), choose the months and years, and get a chart, the rate per decade, its 95% range and a significance test, in plain words. Includes a guided start, two demonstrations, a second place to compare, and CSV download. A second mode, **Compare the five cities**, puts every dataset in this investigation (model, satellite, gauges, GLDAS) side by side.

The ready-made places use a saved copy of their NASA POWER data (`public/power-cache.json`, rebuilt with `python3 scripts/build_power_cache.py`), so the demos work even if the live API is down; points clicked on the map are fetched live.
- **Overview**: seven suspected factors and what the data says about each.
- **The suspects**: charts and test results for each factor, including a national typhoon, El Niño and flood-record tab.
- **Factors by city**: rate of change per decade for each factor in each city.
- **Findings and actions**: what the evidence points to and what to do first.
- **Since 1902**: timeline of major floods and the factors behind them.
- **What is missing**: the data still needed to confirm or rule out each factor.
- **Upload / Test your data**: run the same test on your own file, inside the browser.
- **Ask Detective**: an AI assistant that answers from the app's data and can explain any result from Investigate any place. Without an AI server it answers from built-in rules.
- **Glossary**: plain definitions of every variable and statistics term.

Demo links for presentations: `#demo-length` and `#demo-opposite` (add `-2` or `-3` to jump to a step).

## Limits

The only flood data is a list of large reported floods; nothing measures flood depth or extent. The app mostly tests the **drivers** of flooding, and trends describe the past, not forecasts. See the "What this investigation cannot say" section in the app.

## Running locally

```bash
npm install
npm run dev
```

Build with `npm run build`.

### Detective (AI chat)

The browser never holds an API key. Put one key in `.env`:

```
ANTHROPIC_API_KEY=...      # Claude (preferred if both are set)
GEMINI_API_KEY=...         # or Gemini (keys from AI Studio may start with AQ. or AIza)
# GEMINI_MODEL=gemini-3.5-flash-lite   # default; fast on the free tier
```

Then run `npm start` (build + server) and open http://localhost:3000. During development, run `npm run server` alongside `npm run dev`; Vite forwards `/api` to it. On a static host such as S3 there is no server, so the Detective uses its built-in answers.

### Adding GLDAS (runoff, evaporation, soil moisture)

Export area-averaged monthly time series from NASA Giovanni (GLDAS Noah Land Surface Model L4 monthly 0.25°, version 2.1) for the same small box around each city, then:

```bash
python3 scripts/build_gldas.py <folder with the Giovanni CSVs>
```

Supported variables: `Qs_acc` (surface runoff), `Qsb_acc` (underground runoff), `Evap_tavg` (evaporation), `SoilMoi0_10cm_inst` (topsoil moisture), `Rainf_f_tavg` (rainfall). They appear under "Water on land (GLDAS)" in Investigate → Compare the five cities. See [DEPLOY_S3.md](DEPLOY_S3.md) for deployment.

### Updating the typhoon, El Niño and flood data

`src/data/national.ts` is generated from the raw downloads:

```bash
python3 scripts/build_national.py ibtracs.WP.list.v04r01.csv oni.txt dfo-philippines-floods.csv --ts
```
