"""Injury realism report: before (main) vs after (this branch) from dev/injury-audit.cjs runs.
Usage: python3 -I report.py before-1.json[,before-2.json] after-1.json[,after-2.json]"""
import json, sys, statistics as st, collections
def load(arg): return [json.load(open(f)) for f in arg.split(',')]
def pct(a, q): a = sorted(a); return a[min(len(a) - 1, int(q * (len(a) - 1)))] if a else None
def analyze(runs):
    inj = [dict(i, seed=r['seed']) for r in runs for i in r['injuries']]
    seasons = sum(len(r['seasons']) for r in runs)
    reg = [i for i in inj if i['context'] == 'game']
    by = collections.defaultdict(list)
    for i in inj: by[(i['severity'], i['name'])].append(i)
    missed = collections.defaultdict(int)
    for r in runs:
        for m in r['missed']: missed[(r['seed'], m['year'], m['team'])] += m['out']
    per_team = list(missed.values())
    types = {}
    for (sev, name), xs in sorted(by.items(), key=lambda kv: (['Minor', 'Moderate', 'Severe'].index(kv[0][0]), -len(kv[1]))):
        played = [x for x in xs if not x['dayToDay']]; d = [x['days'] for x in played]
        types[name] = {'severity': sev, 'perSeason': len(xs) / seasons, 'dayToDay%': 100 * (len(xs) - len(played)) / len(xs),
                       'days': {'min': min(d), 'p25': pct(d, .25), 'median': pct(d, .5), 'p75': pct(d, .75), 'max': max(d), 'mean': st.mean(d), 'atMin%': 100 * sum(v == min(d) for v in d) / len(d)} if d else None}
    sev = collections.Counter(i['severity'] for i in inj)
    # Ratings: immediate change at injury (ACL/Achilles) and change over that season vs same-age peers without one.
    major = [i for i in inj if i['name'] in ('torn ACL', 'torn Achilles')]
    # Season-long rating change for ACL/Achilles players: start to end of the season of the injury (incl. offseason
    # development), vs uninjured players of the same age band. Uses the season index recorded with each injury.
    rating, hit_keys = [], set()
    for r in runs:
        for i in r['injuries']:
            if i['name'] not in ('torn ACL', 'torn Achilles') or 'season' not in i: continue
            s = next((x for x in r['seasons'] if x['season'] == i['season']), None)
            b, a = (s['ratingsBefore'].get(str(i['id'])), s['ratingsAfter'].get(str(i['id']))) if s else (None, None)
            if b and a and b.get('spd') is not None and a.get('spd') is not None and (r['seed'], i['season'], i['id']) not in hit_keys:
                hit_keys.add((r['seed'], i['season'], i['id'])); rating.append({'hit': True, 'age': b['age'], 'ovr': a['ovr'] - b['ovr'], 'spd': a['spd'] - b['spd'], 'jmp': a['jmp'] - b['jmp']})
        for s in r['seasons']:
            for pid, b in s['ratingsBefore'].items():
                a = s['ratingsAfter'].get(pid)
                if not a or b.get('spd') is None or a.get('spd') is None or (r['seed'], s['season'], int(pid)) in hit_keys: continue
                rating.append({'hit': False, 'age': b['age'], 'ovr': a['ovr'] - b['ovr'], 'spd': a['spd'] - b['spd'], 'jmp': a['jmp'] - b['jmp']})
    # Immediate effects of ACL/Achilles (the saved major-injury records).
    records = {}
    for r in runs:
        for s in r['seasons']:
            for pid, x in s['ratingsAfter'].items():
                m = x.get('majorInjury')
                if m: records[(r['seed'], pid, m['year'], m['name'])] = m
    recs = list(records.values())
    def group(f):
        xs = [x for x in rating if f(x)]
        return {'n': len(xs), 'ovr': st.mean(x['ovr'] for x in xs) if xs else None, 'spd': st.mean(x['spd'] for x in xs) if xs else None, 'jmp': st.mean(x['jmp'] for x in xs) if xs else None}
    retired_major = sum(1 for r in runs for s in r['seasons'] for i in r['injuries'] if i['name'] in ('torn ACL', 'torn Achilles') and i['id'] in s['gone'] and i['year'] == r_year(r, s))
    return {'seasons': seasons, 'injuriesPerSeason': len(inj) / seasons, 'gameInjuriesPerSeason': len(reg) / seasons,
            'severity%': {k: 100 * v / len(inj) for k, v in sev.items()}, 'dayToDay%': 100 * sum(i['dayToDay'] for i in inj) / len(inj),
            'gamesMissedPerTeam': {'mean': st.mean(per_team), 'min': min(per_team), 'max': max(per_team), 'median': pct(per_team, .5)},
            'types': types,
            'majorImmediate': {'n': len(major), 'ovr': st.mean(m['ovr'] for m in recs) if recs else 0.0,
                               'spd': st.mean(m['spd'] for m in recs) if recs else 0.0, 'jmp': st.mean(m['jmp'] for m in recs) if recs else 0.0,
                               'neverSame%': 100 * st.mean(m['neverSame'] for m in recs) if recs else None, 'recorded': len(recs),
                               'restrictDays': st.mean(i['restrict'] for i in major) if major else None, 'rehabWindow': st.mean(i['rehab'] for i in major) if major else None},
            'seasonRatingChange': {'acl/achilles': group(lambda x: x['hit']), 'peers 30+': group(lambda x: not x['hit'] and x['age'] >= 30), 'peers <30': group(lambda x: not x['hit'] and x['age'] < 30),
                                   'acl/achilles 30+': group(lambda x: x['hit'] and x['age'] >= 30)},
            'majorThenRetired': retired_major}
def r_year(run, s):
    # The injury year for season s: the first injury year seen plus (season - 1).
    years = sorted({i['year'] for i in run['injuries']})
    return (years[0] if years else 0) + s['season'] - 1
B, A = analyze(load(sys.argv[1])), analyze(load(sys.argv[2]))
f = lambda v: '—' if v is None else (f'{v:.2f}' if isinstance(v, float) else str(v))
print('# Injury realism — 5-season audit, before vs after\n')
print(f"NBA, 30 teams, {B['seasons']} / {A['seasons']} seasons (seeds 2026, 2027), full seasons with playoffs and offseason. Before = main, after = this branch.\n")
print('| Metric | Before | After |\n|---|---|---|')
for k, g in [('Injuries per season (all contexts)', lambda d: d['injuriesPerSeason']), ('In-game injuries per season', lambda d: d['gameInjuriesPerSeason']), ('Day-to-day share of all injuries %', lambda d: d['dayToDay%']),
             ('Severe share %', lambda d: d['severity%'].get('Severe', 0)), ('Moderate share %', lambda d: d['severity%'].get('Moderate', 0)), ('Minor share %', lambda d: d['severity%'].get('Minor', 0)),
             ('Player-games missed per team per season (mean)', lambda d: d['gamesMissedPerTeam']['mean']), ('… median / min / max', lambda d: f"{d['gamesMissedPerTeam']['median']} / {d['gamesMissedPerTeam']['min']} / {d['gamesMissedPerTeam']['max']}"),
             ('ACL/Achilles tears (total)', lambda d: d['majorImmediate']['n']), ('… permanent OVR / speed / jumping change (records)', lambda d: ' / '.join(f(d['majorImmediate'][k]) for k in ('ovr', 'spd', 'jmp'))), ('… never the same %', lambda d: d['majorImmediate']['neverSame%']),
             ('… reinjury window / minutes-restriction days', lambda d: f(d['majorImmediate']['rehabWindow']) + ' / ' + f(d['majorImmediate']['restrictDays'])), ('… retired the same offseason', lambda d: d['majorThenRetired'])]:
    print(f'| {k} | {f(g(B))} | {f(g(A))} |')
for label, d in [('Before', B), ('After', A)]:
    print(f'\n## {label}: injuries by type (days missed excludes day-to-day)\n\n| Type | Severity | Per season | Day-to-day % | Days min / p25 / median / p75 / max | Mean | % at min |\n|---|---|---|---|---|---|---|')
    for name, t in d['types'].items():
        dd = t['days']; print(f"| {name} | {t['severity']} | {t['perSeason']:.1f} | {t['dayToDay%']:.0f} | " + (f"{dd['min']} / {dd['p25']} / {dd['median']} / {dd['p75']} / {dd['max']} | {dd['mean']:.1f} | {dd['atMin%']:.0f}" if dd else '— | — | —') + ' |')
print('\n## Season rating change for the season of the injury (start → end, incl. offseason development) vs uninjured peers\n\n| Group | Before n / OVR / SPD / JMP | After n / OVR / SPD / JMP |\n|---|---|---|')
for k in A['seasonRatingChange']:
    g = lambda d: ' / '.join(f(d['seasonRatingChange'][k][x]) for x in ('n', 'ovr', 'spd', 'jmp'))
    print(f'| {k} | {g(B)} | {g(A)} |')
