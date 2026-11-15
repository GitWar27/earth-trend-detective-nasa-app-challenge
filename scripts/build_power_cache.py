"""Save NASA POWER monthly data for the ready-made places, so demos work without the live API.

Usage: python3 scripts/build_power_cache.py
Reads places from src/data/places.ts and variables from src/data/powerVars.ts, writes public/power-cache.json:
{ placeId: { PARAM: [values from January 1981 onward, null where missing] } }
"""
import json, os, re, urllib.request

ROOT = os.path.join(os.path.dirname(__file__), '..')
START, END = 1981, 2025

def src(path):
    return open(os.path.join(ROOT, path)).read()

places = re.findall(r"id: '([\w]+)', name: '[^']*', lat: (-?[\d.]+), lon: (-?[\d.]+)", src('src/data/places.ts'))
params = re.findall(r"\{ id: '([A-Z0-9_]+)'", src('src/data/powerVars.ts'))
out = {}
for pid, lat, lon in places:
    # Same rounding as src/lib/power.ts, so cached and live values match
    url = (f"https://power.larc.nasa.gov/api/temporal/monthly/point?parameters={','.join(params)}&community=AG"
           f"&longitude={float(lon):.2f}&latitude={float(lat):.2f}&start={START}&end={END}&format=JSON")
    data = json.load(urllib.request.urlopen(url, timeout=120))['properties']['parameter']
    out[pid] = {}
    for p in params:
        vals = [data[p].get(f'{y}{m:02d}', -999) for y in range(START, END + 1) for m in range(1, 13)]
        out[pid][p] = [None if v is None or v <= -999 else round(v, 3) for v in vals]
    print(pid, 'ok')
path = os.path.join(ROOT, 'public', 'power-cache.json')
json.dump({'start': START, 'places': out}, open(path, 'w'), separators=(',', ':'))
print(f'wrote public/power-cache.json ({os.path.getsize(path) // 1024} KB, {len(out)} places, {len(params)} variables)')
