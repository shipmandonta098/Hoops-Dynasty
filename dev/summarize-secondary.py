import json, pathlib, statistics
root=pathlib.Path('dev/balance-audit');outdir=pathlib.Path('dev/secondary-shot-audit')
# Reuse the audit's exact metric definitions without rerunning its output-writing section.
namespace={};exec(pathlib.Path('dev/summarize-balance.py').read_text().split('\nreport={}')[0],namespace)
summarize=namespace['summarize'];result={'baselineCommit':'e787395998debe5b3678085ef4369fa1b89402a6','real':json.loads((outdir/'real-summary.json').read_text())}
for phase in ['after','secondary']:
 result[phase]={}
 for league in ['nba','wnba']:
  runs=[json.loads((root/f'{phase}-{league}-{seed}.json').read_text()) for seed in range(101,111)]
  games=[g for r in runs for g in r['games'] if g['stage']=='Regular season']
  result[phase][league]={'seasons':len(runs),'regular':summarize(games),'perSeed':{r['seed']:summarize([g for g in r['games'] if g['stage']=='Regular season']) for r in runs},'largestGame':max((dict(g,seed=r['seed']) for r in runs for g in r['games'] if g['stage']=='Regular season'),key=lambda g:abs(g['score'][0]-g['score'][1]))}
for phase in ['before','after']:
 result['paired-'+phase]=[]
 for r in json.loads((outdir/f'{phase}.json').read_text()):
  gs=r['games'];result['paired-'+phase].append({'league':r['league'],'games':len(gs),'ppg':statistics.mean(sum(g['score'])/2 for g in gs),'margin':statistics.mean(abs(g['score'][0]-g['score'][1]) for g in gs),'boxPerTeam':{k:statistics.mean(g['totals'][k] for g in gs) for k in gs[0]['totals']},'paths':{k:{'probabilityEvaluations':v['attempts'],'meanProbability':v['probability']/v['attempts']} for k,v in r['paths'].items()}})
(outdir/'summary.json').write_text(json.dumps(result,indent=2))
lines=['# Scoring and competitiveness: continuation audit','',
'The secondary-shot fatigue inconsistency is corrected. This is a small consistency fix, **not a completed scoring calibration**. Full-season scoring and blowout distributions still need improvement. No score caps, comeback bonuses or forced results were added.','',
'## Confirmed defect and change','',
'Ordinary shots used effective runtime attributes. Immediate putbacks used raw layup/dunk ratings, and kick-out shots used raw shooting and physical ratings against a fatigue-adjusted defender. `dist/attributes.js` now routes those secondary-shot inputs through the existing `effectiveAttribute` calculation using the actual shooter’s stamina, minutes role and morale. No stored player attributes change. Shot selection, rebound odds, turnover odds and foul probabilities were not retuned. `dist/index.html` refreshes the script cache key.','',
'## Full-season comparison','',
'Baseline is the previous fatigue fix (commit e787395), not the original excessive back-to-back penalty. Its retained ten NBA and ten WNBA complete regular-season runs are compared with ten new runs per league using the same seeds 101–110. NBA: 30 fictional teams, 82 games each. WNBA: 12 fictional teams, 40 games each. Each phase contains 12,300 NBA and 2,400 WNBA games. These are independent full regular seasons, not twenty consecutive career years or completed postseasons.','',
'| Metric | NBA baseline | NBA revised | WNBA baseline | WNBA revised |','|---|---:|---:|---:|---:|']
for key,label in [('teamPoints','Points/team'),('meanMargin','Mean winning margin'),('medianMargin','Median margin'),('maxMargin','Largest margin'),('possessions','Possessions/team'),('overtimePercent','Overtime %'),('homeWinPercent','Home wins %'),('spreadMAE','Spread mean absolute error')]:
 values=[result[p][l]['regular'][key] for l in ['nba','wnba'] for p in ['after','secondary']];lines.append('|'+label+'|'+'|'.join(f'{v:.2f}' for v in values)+'|')
for threshold in ['20','30','40','50']:
 values=[result[p][l]['regular']['blowoutPercent'][threshold] for l in ['nba','wnba'] for p in ['after','secondary']];lines.append('|'+threshold+'+ point wins (%)|'+'|'.join(f'{v:.2f}' for v in values)+'|')
lines+=['','| Shooting / possessions | NBA baseline | NBA revised | WNBA baseline | WNBA revised |','|---|---:|---:|---:|---:|']
for key in ['FG','3P','FT','eFG','TS','offensiveRating']:
 values=[result[p][l]['regular'][key] for l in ['nba','wnba'] for p in ['after','secondary']];lines.append('|'+key+'|'+'|'.join(f'{v:.4f}' for v in values)+'|')
for key in ['fga','tpa','fta','orb','drb','tov','pf','ast','bench']:
 values=[result[p][l]['regular']['boxPerTeam'][key] for l in ['nba','wnba'] for p in ['after','secondary']];lines.append('|'+key.upper()+' per team|'+'|'.join(f'{v:.2f}' for v in values)+'|')
lines+=['','FG/3P/FT/eFG/TS are fractions. Offensive rating is points per 100 engine-counted possessions. TOV here sums player box rows and excludes team-only turnovers.','']
lines+=['','## Real-season benchmarks','',
'Complete score datasets were retrieved from Fixture Download and checked for duplicate games, full per-team game counts and aggregate scoring. NBA Cup final (Milwaukee 97–81 Oklahoma City, December 17 local / December 18 UTC) is excluded: NBA confirms it does not count toward regular-season statistics. Published league scoring and sample team totals/records were cross-checked against Basketball Reference. These are secondary compiled score datasets, not an official league API export. Individual overtime/possession data are unavailable in these files.','',
'| Metric | NBA 2024–25 | WNBA 2024 |','|---|---:|---:|']
for key,label in [('games','Regular games'),('ppg','Points/team'),('meanMargin','Mean margin'),('medianMargin','Median margin'),('maxMargin','Largest margin'),('homeWinPct','Home wins %')]:lines.append('|'+label+'|'+'|'.join(f"{result['real'][l][key]:.2f}" for l in ['nba','wnba'])+'|')
for bin in result['real']['nba']['bins']:lines.append('|'+bin.replace('-999','+')+' point margin (%)|'+'|'.join(f"{result['real'][l]['bins'][bin]:.2f}" for l in ['nba','wnba'])+'|')
lines+=['','## Remaining scoring mechanisms','',
'The largest new NBA result was 169–87 (seed 105, league day 76, pregame spread −9). The largest WNBA result was 138–64 (seed 106, day 106, spread −8). Both matchups had neither team on a back-to-back and average pregame energy above 99. These retained cases demonstrate that the remaining extreme results cannot all be attributed to the previously corrected back-to-back stack. A maximum alone is not a frequency estimate; the complete distributions above remain the main comparison.', '',
'The simulation still allocates too many shot attempts relative to the reference seasons. Its historical style profiles map pace, three-point share, accuracy and shooting fouls; turnover, offensive-rebound and non-shooting-foul priors are not fully mapped by league and era. Lower turnover counts and more offensive rebounds preserve additional shooting opportunities. Secondary possessions also use simplified immediate putback/kick-out resolution. These are calibration/modeling gaps; the small fatigue correction does not resolve them.','',
'The real WNBA reference has 68.3 FGA, 18.0 FTA and 8.2 offensive rebounds per team. Published player-box turnover sums can differ from official team turnover totals; a future turnover calibration must include team turnovers consistently, rather than treating those definitions as interchangeable. Do not simply lower every shooting percentage to hide extra attempts. Fictional talent distributions also differ from actual historical rosters.','',
'## Verification and limitations','',
'- Five era-format fixtures pass: NBA 1997/2025 and WNBA 1997/2006/2024. These use fictional rosters, not verified historical player populations.',
'- Thirty full fatigued games exercise effective secondary-shot shooting and block inputs; permanent attributes and box/event/final-score agreement are asserted.',
'- Two thousand paired diagnostic games: 500 NBA and 500 WNBA per phase, same seeded matchups. These reset the career for each matchup and are separate from the full-season sample. Diagnostic probability counts are probability evaluations, not FGA: blocked attempts can bypass probability evaluation and shooting-foul attempts can be included.',
'- An earlier two-thousand-game diagnostic used 30 teams in both leagues. Those results are retained as `thirty-team-*.json` and excluded from the standard WNBA comparison.',
'- Forty actual-game feat checks cover male/female and four-/two-period games, event provenance, live-prefix safety, deterministic replay and RNG-free recognition. Synthetic winner/OT/defensive/clinch/idempotence cases also pass.',
'- Twenty-six actual games validate technical/flagrant events, box totals and saves, plus synthetic double technical/ejection cases.',
'- Legacy saves from the original audit baseline and the latest pre-change version load without changing completed scores, boxes or summary events.',
'- No schema migration is necessary. Existing contracts, city photos and custom settings are untouched. Browser QA was unavailable; this is an engine change tested headlessly.',
'- No claim is made that the broad balance objective is complete. Era-specific turnover/rebound/foul calibration and spread-model calibration remain outstanding.','',
'## Files and reproduction','',
'Production: `dist/attributes.js`, `dist/index.html`. Tests: `dev/test-secondary-fatigue.cjs`, `dev/test-secondary-eras.cjs`, updated `dev/test-player-feats.cjs` (current-engine replay replaces an obsolete exact-score comparison against Git HEAD). Audit tools/data: `dev/audit-secondary-shots.cjs`, `dev/audit-competitiveness.cjs` (shared audit claims), `dev/run-secondary-seasons.cjs`, `dev/verify-secondary-seasons.py`, `dev/verify-real-balance.cjs`, `dev/summarize-secondary.py`, `dev/secondary-shot-audit/`, `dev/balance-audit/secondary-*.json`.','',
'```sh\nnode dev/test-secondary-fatigue.cjs\nnode dev/test-player-feats.cjs\nnode dev/run-secondary-seasons.cjs\npython dev/verify-secondary-seasons.py\nnode dev/verify-real-balance.cjs\npython dev/summarize-secondary.py\n```','',
'For before-phase diagnostic reproduction, extract `dist` from commit e787395998debe5b3678085ef4369fa1b89402a6 and pass its directory through `HOOPS_BASELINE_DIST`. Run `node dev/audit-secondary-shots.cjs before 500` and `node dev/audit-secondary-shots.cjs after 500`. Baseline season JSON remains in the previous audit; completed reruns are skipped by the batch runner.','',
'## Sources','',
'- https://fixturedownload.com/results/nba-2024 — full score dataset, retrieved October 20, 2026.',
'- https://fixturedownload.com/results/wnba-2024 — full score dataset, retrieved October 20, 2026.',
'- https://www.basketball-reference.com/leagues/NBA_2025.html — NBA scoring and sample standings cross-check.',
'- https://www.basketball-reference.com/wnba/years/2024.html — WNBA scoring and Liberty 3424–3058 point totals cross-check.',
'- https://www.nba.com/news/starting-5-dec-18-2024 — Cup final excluded from regular-season statistics.']
pathlib.Path('docs/COMPETITIVENESS-CONTINUATION.md').write_text('\n'.join(lines)+'\n')
print('Wrote complete continuation summary/report')
