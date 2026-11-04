"""WNBA parity study: current system (pre-#46) vs option 1 (#46 position lineups), paired by seed.
Usage: python3 -I analyze.py [repo dir for real reference logs] [out.json]"""
import json, math, statistics as st, sys, pathlib, collections
HERE = pathlib.Path(__file__).parent
REPO = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/home/user/Hoops-Dynasty')
BAND = (5.3, 6.2)  # Phase 13 target: mean of per-season team-margin SDs (points)

def load(name):
    rows = {}
    for line in open(HERE / name):
        r = json.loads(line); rows[r['seed']] = r
    return rows

def spearman(x, y):
    def ranks(v):
        order = sorted(range(len(v)), key=lambda i: v[i]); r = [0] * len(v); i = 0
        while i < len(v):
            j = i
            while j + 1 < len(v) and v[order[j + 1]] == v[order[i]]: j += 1
            for k in range(i, j + 1): r[order[k]] = (i + j) / 2
            i = j + 1
        return r
    rx, ry = ranks(x), ranks(y); mx, my = st.mean(rx), st.mean(ry)
    num = sum((a - mx) * (b - my) for a, b in zip(rx, ry)); den = math.sqrt(sum((a - mx) ** 2 for a in rx) * sum((b - my) ** 2 for b in ry))
    return num / den if den else 0.0

def season_metrics(r):
    t = r['teams']; g = [x['w'] + x['l'] for x in t]; wp = [x['w'] / (x['w'] + x['l']) for x in t]
    margin = [(x['pf'] - x['pa']) / (x['w'] + x['l']) for x in t]
    strength = [x['strength'] for x in t]; order = sorted(range(len(t)), key=lambda i: -strength[i])
    top3, bot3 = order[:3], order[-3:]; finish = sorted(range(len(t)), key=lambda i: (-wp[i], -margin[i]))
    n = st.mean(g); noise = math.sqrt(.25 / n)
    sd = st.pstdev(wp)
    return {'games': n, 'winSD': sd, 'noiseSD': noise, 'talentShare': max(0.0, 1 - noise ** 2 / sd ** 2) if sd else 0.0, 'marginSD': st.pstdev(margin),
            'best': max(x['w'] for x in t), 'worst': min(x['w'] for x in t), 'bestPct': max(wp), 'worstPct': min(wp),
            'over700': sum(p >= .7 for p in wp), 'under300': sum(p <= .3 for p in wp),
            'rankCorr': spearman(strength, wp), 'top3Pct': st.mean(wp[i] for i in top3), 'bot3Pct': st.mean(wp[i] for i in bot3),
            'favoriteFirst': finish[0] == order[0], 'favoriteTop3': order[0] in finish[:3], 'bottom3InTop4': any(i in finish[:4] for i in bot3),
            'wp': wp}

def summarize(rows):
    m = [season_metrics(r) for r in rows]; all_wp = sorted(p for x in m for p in x['wp']); q = lambda f: all_wp[min(len(all_wp) - 1, int(f * len(all_wp)))]
    mean = lambda k: st.mean(x[k] for x in m)
    bins = collections.Counter(min(9, int(p * 10)) for p in all_wp)
    return {'seasons': len(m), 'teamSeasons': len(all_wp),
            'winPctSD': {'mean': mean('winSD'), 'p10': sorted(x['winSD'] for x in m)[len(m) // 10], 'p90': sorted(x['winSD'] for x in m)[9 * len(m) // 10]},
            'luckOnlySD': mean('noiseSD'), 'shareOfSpreadFromTalent': mean('talentShare'),
            'marginSD': {'mean': mean('marginSD'), 'gapToBand': mean('marginSD') - BAND[0] if mean('marginSD') < BAND[0] else (mean('marginSD') - BAND[1] if mean('marginSD') > BAND[1] else 0.0), 'seasonsInBandPct': 100 * st.mean(BAND[0] <= x['marginSD'] <= BAND[1] for x in m), 'seasonsBelowBandPct': 100 * st.mean(x['marginSD'] < BAND[0] for x in m)},
            'bestRecord': {'wins': mean('best'), 'winPct': mean('bestPct')}, 'worstRecord': {'wins': mean('worst'), 'winPct': mean('worstPct')}, 'games': mean('games'),
            'teamsAt700PlusPerSeason': mean('over700'), 'teamsAt300OrWorsePerSeason': mean('under300'),
            'winPctPercentiles': {k: q(v) for k, v in [('p5', .05), ('p25', .25), ('p50', .5), ('p75', .75), ('p95', .95)]},
            'winPctHistogramPct': {f'{b/10:.1f}-{(b+1)/10:.1f}': 100 * bins[b] / len(all_wp) for b in range(10)},
            'eliteVsWeak': {'strengthRankCorrelation': mean('rankCorr'), 'top3PreseasonWinPct': mean('top3Pct'), 'bottom3PreseasonWinPct': mean('bot3Pct'),
                            'gap': mean('top3Pct') - mean('bot3Pct'), 'favoriteFinishesFirstPct': 100 * mean('favoriteFirst'), 'favoriteFinishesTop3Pct': 100 * mean('favoriteTop3'),
                            'aBottom3TeamFinishesTop4Pct': 100 * mean('bottom3InTop4')}}, m

def paired(ma, mb, k):
    d = [b[k] - a[k] for a, b in zip(ma, mb)]; n = len(d); mu = st.mean(d); half = 1.96 * st.stdev(d) / math.sqrt(n)
    return {'diff': mu, 'ci95': [mu - half, mu + half]}

def real_reference():
    files = {2022: 'dev/phase12/reference-gamelog-2022.json', 2023: 'dev/phase4/real-wnba-2023.json', 2024: 'dev/phase3/real-wnba-2024.json', 2025: 'dev/phase12/reference-gamelog-2025.json'}
    out = []
    for y, f in files.items():
        rs = json.load(open(REPO / f))['resultSets'][0]; rows = [dict(zip(rs['headers'], r)) for r in rs['rowSet']]; t = collections.defaultdict(lambda: [0, 0, 0])
        for r in rows: t[r['TEAM_ID']][0 if r['WL'] == 'W' else 1] += 1; t[r['TEAM_ID']][2] += r['PLUS_MINUS']
        wp = [w / (w + l) for w, l, _ in t.values()]; g = st.mean(w + l for w, l, _ in t.values())
        out.append({'season': y, 'teams': len(t), 'games': g, 'winPctSD': st.pstdev(wp), 'luckOnlySD': math.sqrt(.25 / g), 'marginSD': st.pstdev(pm / (w + l) for w, l, pm in t.values()),
                    'best': max(w for w, l, _ in t.values()), 'worst': min(w for w, l, _ in t.values()), 'bestPct': max(wp), 'worstPct': min(wp)})
    return out

if __name__ == '__main__':
    import os
    a, b = load(os.environ.get('A_FILE', 'pre.jsonl')), load(os.environ.get('B_FILE', 'opt.jsonl')); seeds = sorted(set(a) & set(b))
    sa, ma = summarize([a[s] for s in seeds]); sb, mb = summarize([b[s] for s in seeds])
    res = {'pairedSeasons': len(seeds), 'current': sa, 'option1': sb,
           'differences': {k: paired(ma, mb, k) for k in ['winSD', 'marginSD', 'bestPct', 'worstPct', 'rankCorr', 'top3Pct', 'bot3Pct', 'talentShare']},
           'realWNBA': real_reference()}
    print(json.dumps(res, indent=1))
    if len(sys.argv) > 2: pathlib.Path(sys.argv[2]).write_text(json.dumps(res, indent=1))
