"""Post Face-Up before/after: Phase 13 scorecard metrics and shot zones. Usage: python3 -I summary.py <before dir> <after dir>"""
import json, glob, statistics as st, sys
def load(d, label, lg): return [json.load(open(f)) for f in sorted(glob.glob(f'{d}/dev/phase13/{label}-{lg}-*.json'))]
def metrics(runs):
    gs = [g for r in runs for g in r['games'] if g['stage'] == 'Regular season']; T = [t for g in gs for t in g['totals']]; n = len(T)
    tot = lambda k: sum(t[k] for t in T); margins = [abs(g['score'][0] - g['score'][1]) for g in gs]
    z = {k: [sum(g['shots'][k][m] for g in gs) for m in ('attempts', 'made')] for k in ('inside', 'mid', 'three')}; fga = sum(a for a, _ in z.values())
    seasons = []
    for r in runs:
        rg = [g for g in r['games'] if g['stage'] == 'Regular season']; zz = {k: sum(g['shots'][k]['attempts'] for g in rg) for k in ('inside', 'mid', 'three')}; s = sum(zz.values())
        seasons.append({k: 100 * v / s for k, v in zz.items()})
    return {'seasons': len(runs), 'games': len(gs), 'teamPts': tot('pts') / n, 'poss': tot('poss') / n, 'ORtg': 100 * tot('pts') / tot('poss'), 'FG%': 100 * tot('fgm') / tot('fga'), '3P%': 100 * tot('tpm') / tot('tpa'), 'eFG%': 100 * (tot('fgm') + .5 * tot('tpm')) / tot('fga'),
            'FTA': tot('fta') / n, 'TOV': tot('tov') / n, 'AST': tot('ast') / n, 'BLK': tot('blk') / n, 'meanMargin': st.mean(margins), 'blow20%': 100 * st.mean(m >= 20 for m in margins), 'OT%': 100 * st.mean(g['ot'] for g in gs),
            'rim%': 100 * z['inside'][0] / fga, 'mid%': 100 * z['mid'][0] / fga, 'three%': 100 * z['three'][0] / fga, 'rimFG%': 100 * z['inside'][1] / z['inside'][0], 'midFG%': 100 * z['mid'][1] / z['mid'][0], 'threeFG%': 100 * z['three'][1] / z['three'][0],
            'zoneRangeBySeason': {k: [round(min(s[k] for s in seasons), 1), round(max(s[k] for s in seasons), 1)] for k in ('inside', 'mid', 'three')}}
B, A = sys.argv[1], sys.argv[2]
for lg in (sys.argv[3].split(',') if len(sys.argv)>3 else ('nba','wnba')):
    b, a = metrics(load(B, 'fubefore', lg)), metrics(load(A, 'fuafter', lg))
    print(f'\n### {lg.upper()} — {b["seasons"]} seasons each ({b["games"]} / {a["games"]} games)\n\n| Metric | Before | After | Δ |\n|---|---|---|---|')
    for k in ['rim%', 'mid%', 'three%', 'rimFG%', 'midFG%', 'threeFG%', 'teamPts', 'poss', 'ORtg', 'FG%', '3P%', 'eFG%', 'FTA', 'TOV', 'AST', 'BLK', 'meanMargin', 'blow20%', 'OT%']:
        print(f'| {k} | {b[k]:.2f} | {a[k]:.2f} | {a[k]-b[k]:+.2f} |')
    print(f'| shot-zone range by season (rim/mid/three) | {b["zoneRangeBySeason"]} | {a["zoneRangeBySeason"]} | |')
