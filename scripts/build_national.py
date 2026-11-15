"""Build yearly national series (typhoon landfalls, ENSO, recorded floods) for the app.

Usage: python3 scripts/build_national.py <ibtracs.WP.list.v04r01.csv> <oni.txt> <dfo-philippines-floods.csv>
Prints a JSON summary; with --ts writes src/data/national.ts.
"""
import csv, json, sys, math
from collections import defaultdict
from datetime import datetime

FIRST, LAST = 1951, 2025  # reliable aircraft/satellite-era tracks; last complete year

def in_ph(lat, lon):
    # Philippine land area box, with Sabah (north Borneo) cut out
    if not (4.5 <= lat <= 21.2 and 116.9 <= lon <= 126.8):
        return False
    return not (lat < 7.4 and lon < 119.3)

def num(s):
    s = s.strip()
    return float(s) if s else None

def typhoons(path):
    storms = {}  # sid -> {year, name, landfall, maxwind}
    with open(path, newline='') as f:
        r = csv.reader(f)
        head = next(r); next(r)  # second row holds units
        ix = {h: i for i, h in enumerate(head)}
        for row in r:
            # the newest seasons are only in provisional tracks; spurs are duplicates
            if row[ix['TRACK_TYPE']] not in ('main', 'PROVISIONAL', 'US-PROVISIONAL'):
                continue
            yr = int(row[ix['SEASON']])
            if yr < FIRST or yr > LAST:
                continue
            lat, lon = float(row[ix['LAT']]), float(row[ix['LON']])
            if not in_ph(lat, lon):
                continue
            d2l = num(row[ix['DIST2LAND']])
            if d2l is None or d2l > 50:
                continue
            sid = row[ix['SID']]
            s = storms.setdefault(sid, {'year': yr, 'name': row[ix['NAME']], 'landfall': False, 'wind': 0})
            if d2l == 0:
                s['landfall'] = True
            w = num(row[ix['USA_WIND']])
            if w is not None:
                s['wind'] = max(s['wind'], w)
    count, strong = defaultdict(int), defaultdict(int)
    for s in storms.values():
        if not s['landfall']:
            continue
        count[s['year']] += 1
        if s['wind'] >= 64:  # typhoon strength, 1-minute winds (JTWC)
            strong[s['year']] += 1
    return count, strong

def oni(path):
    vals = defaultdict(list)
    with open(path) as f:
        next(f)
        for line in f:
            p = line.split()
            if len(p) == 4:
                vals[int(p[1])].append(float(p[3]))
    return {y: round(sum(v) / len(v), 2) for y, v in vals.items() if len(v) == 12}

def floods(path):
    n, dead, disp, tc = defaultdict(int), defaultdict(int), defaultdict(int), defaultdict(int)
    with open(path, newline='', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f):
            y = datetime.strptime(row['Start Date'].strip(), '%m/%d/%y').year
            n[y] += 1
            dead[y] += int(row['Fatalities'].replace(',', '') or 0)
            disp[y] += int(row['Displaced'].replace(',', '') or 0)
            # since ~2010 DFO names the storm ("Tropical Storm Washi") instead of "Tropical cyclone"
            cause = row['Main Cause'].lower()
            if any(k in cause for k in ('tropical', 'typhoon', 'cyclone', 'storm')):
                tc[y] += 1
    return n, dead, disp, tc

def spearman(a, b):
    def rank(x):
        o = sorted(range(len(x)), key=lambda i: x[i]); r = [0.0] * len(x); i = 0
        while i < len(o):
            j = i
            while j + 1 < len(o) and x[o[j + 1]] == x[o[i]]: j += 1
            for k in range(i, j + 1): r[o[k]] = (i + j) / 2 + 1
            i = j + 1
        return r
    ra, rb = rank(a), rank(b); n = len(a)
    ma, mb = sum(ra) / n, sum(rb) / n
    cov = sum((x - ma) * (y - mb) for x, y in zip(ra, rb))
    rho = cov / math.sqrt(sum((x - ma) ** 2 for x in ra) * sum((y - mb) ** 2 for y in rb))
    t = rho * math.sqrt((n - 2) / max(1e-12, 1 - rho ** 2))
    p = math.erfc(abs(t) / math.sqrt(2))  # normal approximation, fine for n > 30
    return round(rho, 2), round(p, 4), n

def write_ts(d, path='src/data/national.ts'):
    def ser(sid, source, kind, variable, unit, years, values, note):
        return (f"  {{ id:'{sid}', region:'Philippines', source:{json.dumps(source)}, kind:'{kind}', variable:'{variable}', unit:'{unit}',\n"
                f"    years:{json.dumps(years, separators=(',', ':'))},\n"
                f"    values:{json.dumps(values, separators=(',', ':'))},\n"
                f"    note:{json.dumps(note)} }},\n")
    ty, fy = d['tyYears'], d['floodYears']
    oy = sorted(int(y) for y in d['oni'])
    ib = 'IBTrACS v04r01 (NOAA NCEI)'
    dfo = 'Dartmouth Flood Observatory archive'
    body = ''.join([
        ser('ph-landfalls', ib, 'Storm tracks', 'landfalls', 'storms', ty, d['landfalls'],
            'Tropical cyclones whose track crosses Philippine land in a season. Main and provisional tracks.'),
        ser('ph-strong', ib, 'Storm tracks', 'strong', 'storms', ty, d['strong'],
            'Landfalling storms with 1-minute winds of 64 knots or more (typhoon strength) within 50 km of Philippine land.'),
        ser('ph-oni', 'NOAA Oceanic Nino Index (ONI)', 'Ocean index', 'oni', '°C', oy, [d['oni'][y] for y in oy],
            'Yearly average of the 3-month Nino 3.4 sea surface temperature anomaly. Positive is El Nino, negative is La Nina.'),
        ser('ph-floods', dfo, 'Event record', 'floods', 'events', fy, d['floods'],
            'Large flood events in the Philippines recorded by the Dartmouth Flood Observatory, by start year.'),
        ser('ph-tcfloods', dfo, 'Event record', 'tcfloods', 'events', fy, d['tcFloods'],
            'Recorded floods whose main cause is a tropical storm or typhoon.'),
        ser('ph-flooddead', dfo, 'Event record', 'flooddead', 'deaths', fy, d['dead'],
            'Deaths in recorded flood events, by start year.'),
    ])
    links = {k[len('rho_oni_'):]: {'rho': v[0], 'p': v[1], 'n': v[2]} for k, v in d.items() if k.startswith('rho_oni_')}
    ts = ("// Generated by scripts/build_national.py. Do not edit by hand.\n"
          "import type { Series } from './series';\n\n"
          "export const NATIONAL_SERIES: Series[] = [\n" + body + "];\n\n"
          "// Spearman rank correlation of each series with the yearly ONI\n"
          f"export const ENSO_LINKS: Record<string, {{ rho: number; p: number; n: number }}> = {json.dumps(links)};\n\n"
          f"export const TC_FLOOD_SHARE = {d['tcShare']};\n\n"
          "export const getNational = (id: string): Series | null => NATIONAL_SERIES.find(s => s.id === id) ?? null;\n")
    open(path, 'w').write(ts)

if __name__ == '__main__':
    ib, on, dfo = sys.argv[1:4]
    lf, st = typhoons(ib)
    en = oni(on)
    fn, fd, fdisp, ftc = floods(dfo)
    ty = list(range(FIRST, LAST + 1))
    fy = list(range(1985, max(fn) + 1))
    out = {
        'landfalls': [lf[y] for y in ty], 'strong': [st[y] for y in ty], 'tyYears': ty,
        'oni': {y: en[y] for y in ty if y in en},
        'floodYears': fy, 'floods': [fn[y] for y in fy], 'dead': [fd[y] for y in fy],
        'displaced': [fdisp[y] for y in fy], 'tcFloods': [ftc[y] for y in fy],
        'totalFloods': sum(fn.values()), 'tcShare': round(sum(ftc.values()) / sum(fn.values()), 2),
    }
    both = [y for y in ty if y in en]
    out['rho_oni_landfalls'] = spearman([en[y] for y in both], [lf[y] for y in both])
    out['rho_oni_strong'] = spearman([en[y] for y in both], [st[y] for y in both])
    fb = [y for y in fy if y in en]
    out['rho_oni_floods'] = spearman([en[y] for y in fb], [fn[y] for y in fb])
    out['rho_oni_flooddead'] = spearman([en[y] for y in fb], [fd[y] for y in fb])
    if '--ts' in sys.argv:
        write_ts(out)
    print(json.dumps(out))
