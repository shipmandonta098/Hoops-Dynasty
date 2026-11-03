"""Phase 13 scorecard before/after secondary positions, paired by seed.
Usage: python3 dev/phase13/secpos_compare.py <before dir> <after dir> [out.json] [before label=secpos-before] [after label=secpos-after]
Reads secpos-before-<league>-<seed>.json and secpos-after-<league>-<seed>.json audit seasons (dev/audit-phase13-season.cjs)
and reports, per league, each scorecard metric and box-score rate for both versions with the paired mean difference
and its 95% t interval across seeds. A metric is flagged when the interval excludes zero."""
import json, pathlib, statistics as st, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from analyze import season
T95 = {1: 12.706, 2: 4.303, 3: 3.182, 4: 2.776, 5: 2.571, 6: 2.447, 7: 2.365, 8: 2.306, 9: 2.262}

def box(path):
    d = json.load(open(path)); t = [x for g in d['games'] for x in g['totals']]; s = lambda k: sum(x[k] for x in t)
    return {'ptsPerTeamGame': s('pts') / len(t), 'fgPct': 100 * s('fgm') / s('fga'), 'threeRate': 100 * s('tpa') / s('fga'), 'threePct': 100 * s('tpm') / s('tpa'),
            'ftRate': 100 * s('fta') / s('fga'), 'orbPct': 100 * s('orb') / (s('orb') + s('drb')), 'astPerFGM': 100 * s('ast') / s('fgm'),
            'tovPer100': 100 * s('tov') / s('poss'), 'blkPerTeamGame': s('blk') / len(t), 'stlPerTeamGame': s('stl') / len(t), 'pfPerTeamGame': s('pf') / len(t), 'pace': s('poss') / len(t)}

def metrics(path):
    r = season(path); keys = ['meanMargin', 'blow20Pct', 'within5Pct', 'otPct', 'teamMarginSD', 'transitionOpportunityPct', 'fastbreakFGAPct', 'final60Possessions']
    return {**{k: r[k] for k in keys}, **box(path)}

def compare(before_dir, after_dir, before='secpos-before', after='secpos-after'):
    out = {}
    for league in ['nba', 'wnba']:
        pairs = []
        for b in sorted(pathlib.Path(before_dir).glob(f'{before}-{league}-*.json')):
            a = pathlib.Path(after_dir) / b.name.replace(before, after)
            if a.exists(): pairs.append((metrics(b), metrics(a)))
        if len(pairs) < 2: continue
        rows = {}
        for k in pairs[0][0]:
            diffs = [a[k] - b[k] for b, a in pairs if a[k] is not None and b[k] is not None]; n = len(diffs)
            mean = st.mean(diffs); half = T95[n - 1] * st.stdev(diffs) / n ** .5 if n > 1 else float('nan')
            rows[k] = {'before': st.mean(b[k] for b, _ in pairs), 'after': st.mean(a[k] for _, a in pairs), 'diff': mean, 'ci95': [mean - half, mean + half], 'flag': not (mean - half <= 0 <= mean + half)}
        out[league] = {'seasons': len(pairs), 'metrics': rows}
    return out

if __name__ == '__main__':
    res = compare(sys.argv[1], sys.argv[2], *sys.argv[4:6])
    for league, r in res.items():
        print(f"{league.upper()} ({r['seasons']} paired seasons)")
        for k, m in r['metrics'].items():
            print(f"  {k:26s} before {m['before']:8.3f}  after {m['after']:8.3f}  diff {m['diff']:+7.3f}  95% CI [{m['ci95'][0]:+.3f}, {m['ci95'][1]:+.3f}]{'  <-- excludes 0' if m['flag'] else ''}")
    if len(sys.argv) > 3 and sys.argv[3] != '-': pathlib.Path(sys.argv[3]).write_text(json.dumps(res, indent=1))
