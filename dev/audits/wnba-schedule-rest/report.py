"""Before/after WNBA schedule report. Usage: python3 -I report.py before.jsonl after.jsonl"""
import json, sys, statistics as st
def load(f): return [json.loads(l) for l in open(f)]
B, A = load(sys.argv[1]), load(sys.argv[2])
out = ['# WNBA / custom schedule rest — before vs after', '',
       'Fresh WNBA leagues built from the historical presets (`historicalPlan(\'wnba\', year)`), two conferences, the final calendar after Opening Night and All-Star placement. Seeds 11–15. *Before* = `main`, *after* = this branch.', '']
for label, teams in [('year 2024', '2024 format · 12 teams · 40 games'), ('year 2025', '2025 format · 13 teams · 44 games')]:
    b = [r for r in B if r['label'] == label]; a = [r for r in A if r['label'] == label]
    out += [f'## {teams}', '', '| Metric | Before (5 seeds) | After (5 seeds) |', '|---|---|---|']
    rng = lambda xs: f'{min(xs)}–{max(xs)}' if min(xs) != max(xs) else f'{min(xs)}'
    def rowf(name, f): out.append(f'| {name} | {f(b)} | {f(a)} |')
    rowf('Season start → end', lambda rs: ', '.join(sorted({r['start'] + ' → ' + r['end'] for r in rs})))
    rowf('All-Star break (game)', lambda rs: ', '.join(sorted({r['allStar'] for r in rs})))
    rowf('Longest league-wide blackout', lambda rs: ', '.join(sorted({r['blackout'] for r in rs})))
    for k in ['0', '1', '2', '3', '4', '5', '6+']:
        rowf(f'Rest gaps {k}d (% of gaps)', lambda rs, k=k: f"{st.mean(r['restPct'][k] for r in rs):.1f}% ({rng([r['restPct'][k] for r in rs])})")
    rowf('Back-to-backs per team (mean)', lambda rs: f"{st.mean(r['b2bPerTeam'] for r in rs):.2f} ({rng([r['b2bPerTeam'] for r in rs])})")
    rowf('Back-to-backs, worst team', lambda rs: rng([r['b2bMax'] for r in rs]))
    rowf('Back-to-backs league-wide', lambda rs: rng([r['b2bLeague'] for r in rs]))
    rowf('3 games in 4 nights (league)', lambda rs: rng([r['three4Total'] for r in rs]))
    rowf('Longest break per team (incl. All-Star)', lambda rs: f"{min(r['longestBreak'][0] for r in rs)}–{max(r['longestBreak'][1] for r in rs)} days")
    rowf('Longest break per team (outside All-Star)', lambda rs: f"{min(r['longestOutsideAllStar'][0] for r in rs)}–{max(r['longestOutsideAllStar'][1] for r in rs)} days")
    rowf('Max games in 7 days (any team)', lambda rs: rng([r['max7'] for r in rs]))
    rowf('Opening Night', lambda rs: ', '.join(sorted({r.get('openingNight', 'n/a') for r in rs})))
    out.append('')
    out += ['Per seed (after): back-to-backs by team · longest break outside All-Star by team', '']
    for r in a: out.append(f"- seed {r['seed']}: b2b {r['b2bByTeam']} · longest {r['longestOutByTeam']}")
    out.append('')
print('\n'.join(out))
