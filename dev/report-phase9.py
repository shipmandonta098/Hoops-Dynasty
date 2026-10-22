import pathlib,json,zipfile,html,shutil,hashlib
P=pathlib.Path('dev/phase9');r=json.load(open(P/'results.json'));s=json.load(open(P/'standings.json'));assert r['wnbaSeasons']['n']==1200
for league,n in [('nba',1000),('wnba',400)]:
 for arm in ['production','hold']:
  assert r[league][arm]['games']==n
  assert len(r[league][arm+'Synthetic'])==4
  assert all(x['OT']['n']==100 for x in r[league][arm+'Synthetic'])
assert json.load(open(P/'save-verification.json'))['passed']
for name in ['attributes.js','tendencies.js']:assert pathlib.Path('dist/'+name).read_bytes()==pathlib.Path('dev/phase8/candidate-dist/'+name).read_bytes()
o=[]
def add(t=''):o.append(t)
def table(h,rows):
 add(' | '.join(h));add(' | '.join('---'for _ in h))
 for row in rows:add(' | '.join(str(x)for x in row))
 add()
def pct(x):return f'{x:.2f}%'
def rr(x):return f"{x['k']}/{x['n']} ({x['pct']:.2f}%)"
add('Hoops Dynasty — Phase 8 promotion and follow-up audit')
add('21 October 2026')
add('Phase 8 is ACCEPTED by explicit user override of the earlier mirror gate. The original candidate attributes.js and tendencies.js are promoted byte-for-byte. Phase 7 late-game and rotation improvements remain. The earlier Phase 8 report records a historical rejection; it is no longer the deployment decision. The tied last-shot change below is an experiment only and is NOT in production.')
add('\n1. Five complete WNBA regular seasons')
add('Seeds 101–105, modern 2024 format, 12 fictional teams, 40 games per team: 240 games per season, 1,200 games total. Five independently generated universes, not a five-year longitudinal career. Production Phase 8, with no experimental tied-hold logic.')
x=r['wnbaSeasons'];table(['Metric','Five-season result'],[['Points/team',f"{x['points']:.2f}"],['Mean winning margin',f"{x['meanMargin']:.2f}"],['Within ten',pct(x['within10'])],['20+ margins',pct(x['blow20'])],['30+ margins',pct(x['blow30'])],['Overtime',rr(x['OT'])]])
table(['Seed','Games','Points/team','Mean margin','20+','OT'],[[a['seed'],a['n'],f"{a['points']:.2f}",f"{a['meanMargin']:.2f}",pct(a['blow20']),rr(a['OT'])]for a in r['wnbaSeeds']])
add('Four matched seeds 101–104 are available from Phase 7; no fifth Phase 7 season is fabricated. Career outcomes can change subsequent simulation states, so these comparisons pair initial season seeds, not every subsequent random draw.')
a,b=r['matchedFourWNBA']['phase7'],r['matchedFourWNBA']['phase8'];table(['Metric','Phase 7 / four seasons','Phase 8 / same four seeds'],[[k,f'{a[k]:.2f}',f'{b[k]:.2f}']for k in ['points','meanMargin','within10','blow20','blow30']]+[['OT',rr(a['OT']),rr(b['OT'])]])
add('\n2. NBA standings and talent expression')
add('Standings reconstructed from all 82 regular-season results for each team. Standard deviation is the population SD across 30 team win percentages, expressed in percentage points; each season is computed separately. Real data are the retained official NBA LeagueGameLog datasets for 2023–24 and 2024–25 (2,460 team-game rows each). Every team has 82 games, and each season sums to 1,230 wins.')
table(['Season/seed','Win% SD (pp)','Worst wins','Best wins','60+ teams','25-or-fewer teams'],[[a['season'],f"{a['winPctSD_pp']:.2f}",a['minWins'],a['maxWins'],a['teams60plus'],a['teams25orFewer']]for a in s['real']]+[[a['seed'],f"{a['winPctSD_pp']:.2f}",a['minWins'],a['maxWins'],a['teams60plus'],a['teams25orFewer']]for a in s['simulation']])
add(f"Simulation mean SD: {s['simulationMeanSD_pp']:.2f} percentage points; seed range {s['simulationSDRange_pp'][0]:.2f}–{s['simulationSDRange_pp'][1]:.2f}. The real references are 16.01 and 16.08 pp. The simulated standings are narrower, although a strong team can still reach 73 wins.")
add('Across the five universes, average 10th-percentile win% is 33.00%, versus 25.37% in 2024–25; average 90th-percentile win% is 65.63%, versus 64.51%. Thus compression is especially visible among the weaker teams. Each simulated team’s first observed pregame OVR strength correlates with final wins at 0.68–0.83 across seeds. Talent is expressed, but this does not validate its magnitude. The OVR metric is the existing simple strength estimate; standings alone cannot isolate roster-generation spread, injury/tanking behavior, schedule effects and gameplay sensitivity. These are associations, not causal estimates.')
add('Limited same-seed Phase 7 comparison: win% SD changed 15.61 → 13.85 pp in seed 101 and 14.13 → 13.85 pp in seed 102. Thus the narrower standings are not solely a comparison with real rosters, although two paired career seeds cannot establish the general effect and changed outcomes alter later career state.')
add('Sources: https://www.nba.com/standings?Season=2024-25 and https://www.nba.com/standings?Season=2023-24 ; underlying archived official endpoint: https://stats.nba.com/stats/leaguegamelog . Local provenance: dev/phase3/real-nba-2025.json and dev/phase4/real-nba-2023-24.json. Full per-team tables are included in standings.json.')
add('\n3. Naturally occurring ties with fewer than 24 seconds left')
add('Definition: one observation per game if a positive-duration tied-score interval intersects the final 24 seconds of regulation. A tie existing at 24 seconds and continuing below it counts; a score tying the game exactly at the regulation buzzer does not count in this cohort. Multiple ties in one game do not create duplicate observations. Outcomes are OT versus a winner decided in regulation. Regulation and overtime are not combined.')
add('Independent reset-game tests: 1,000 NBA and 400 WNBA varied-roster games per arm, world 603, matching starting states and seeds. These are NOT the five full-season samples. Changed decisions can consume RNG differently. Results are conditional on the generated fixtures, not estimates from real NBA/WNBA play-by-play.')
for league in ['nba','wnba']:
 add(league.upper());table(['Arm','All games','Tied-under-24 games','To OT','Decided in regulation','Overall OT'],[[arm,r[league][arm]['games'],r[league][arm]['tiedUnder24'],rr(r[league][arm]['conditionalOT']),rr(r[league][arm]['conditionalRegulationDecision']),rr(r[league][arm]['overallOT'])]for arm in ['production','hold']])
 for arm in ['production','hold']:add(arm+' conditional OT Wilson 95% interval: '+str([round(x,2)for x in r[league][arm]['conditionalOT']['wilson95']])+'%.')
 add('Paired outcome switches: '+str(r[league]['pairedChanges'])+'.');add('Same eligible game seeds across both arms: '+str(r[league]['sameEligibleGameSeeds'])+'. The intervals reflect binomial sampling within this fixture sample, not uncertainty across every possible roster distribution.')
add('\n4. Tied hold-for-last-shot experiment')
add('When tied, 4 < remaining seconds <=24, and the shot clock can cover all remaining game time, the test spends remaining−4 seconds setting up. It then uses the ordinary final-shot resolver. It does not hold without attempting a shot, force a miss, alter shooting accuracy or guarantee overtime. A shorter shot clock keeps existing behavior. Fouls, turnovers, rebounds and legal replies remain possible. The treatment also applies to qualifying overtime-period endings.')
add('Synthetic controlled starts: 100 seeds/configurations per row and arm, tied at 100–100 with 23, 15, 5 or zero regulation seconds remaining. These injected starting scores are not full-game records. Both arms include the same lower-three-point-ability variation. They are useful mechanism tests, not league-frequency estimates.')
for league in ['nba','wnba']:
 add(league.upper());table(['Start','Production OT','Hold OT','Production first shot seconds left','Hold first shot seconds left'],[[a['case'],rr(a['OT']),rr(b['OT']),None if a['meanFirstShotSeconds']is None else round(a['meanFirstShotSeconds'],2),None if b['meanFirstShotSeconds']is None else round(b['meanFirstShotSeconds'],2)]for a,b in zip(r[league]['productionSynthetic'],r[league]['holdSynthetic'])])
add('Interpretation: evaluate the natural-game conditional rates and their sample sizes, not only the synthetic 23-second case. Holding is a basketball decision with costs as well as benefits: it reduces the opponent’s reply time but may remove opportunities to rebound and retry. The experiment is kept separate from the explicitly requested Phase 8 promotion. No additional gameplay acceptance gate is imposed on Phase 8.')
add('\n5. Verification, preservation and files')
add('Passed: five complete WNBA regular-season schedules and scoring/box identities; 2,800 full-length reset games across production/hold arms with legal winners, score/box and minute identities; 1,600 synthetic ending cases with chronological events and correct OT initiation; loading a Phase 7 save preserves completed scores, boxes and summary events. The prior Phase 8 150-game historical-format validation remains applicable because the two promoted modules are identical to that tested candidate. No new schema, completed-result rewrite, player-rating change, city-photo change or UI redesign.')
add('Production modified: dist/attributes.js and dist/tendencies.js. Existing dist/late-game.js is unchanged; the hold experiment is only dev/phase9/hold-variant.cjs. Evidence/harnesses: dev/phase9/, dev/run-phase9-wnba.cjs, dev/phase9-ot-matches.cjs, dev/run-phase9-ot.cjs, dev/test-phase9-endings.cjs, dev/test-phase9-save.cjs, dev/phase9-standings.py, dev/phase9-analysis.py and dev/report-phase9.py. WNBA season results: dev/balance-audit/phase9-wnba-101..105.json. NBA standings reuse the five completed Phase 8 NBA seasons, seeds 101–105.')
add('Reproduce: node dev/run-phase9-wnba.cjs; node dev/run-phase9-ot.cjs; node dev/test-phase9-endings.cjs nba production; node dev/test-phase9-endings.cjs nba hold; node dev/test-phase9-endings.cjs wnba production; node dev/test-phase9-endings.cjs wnba hold; node dev/test-phase9-save.cjs; python dev/phase9-standings.py; python dev/phase9-analysis.py; python dev/report-phase9.py. Preserve archived outputs before intentionally rerunning. The hold source transform must remain audit-only unless separately promoted.')
t='\n'.join(o)+'\n';pathlib.Path('docs/PHASE9-PROMOTION.txt').write_text(t);pathlib.Path('dist/audits/phase9.txt').write_text(t)
page='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Phase 8 promotion and follow-up</title><style>body{background:#111820;color:#e7ebf0;font:15px/1.6 system-ui;margin:24px}main{max-width:1100px;margin:auto}a{color:#ffb66b}pre{white-space:pre-wrap;overflow-wrap:anywhere}</style><main><a href="phase9.txt" download>Download TXT</a> · <a href="phase9.zip" download>Download report ZIP</a><pre>'+html.escape(t)+'</pre></main></html>'
pathlib.Path('dist/audits/phase9.html').write_text(page)
with zipfile.ZipFile('dist/audits/phase9.zip','w',zipfile.ZIP_DEFLATED)as z:
 z.write('dist/audits/phase9.txt','Phase9-Followup.txt')
 for f in ['results.json','standings.json','save-verification.json']:z.write(P/f,f)
 assert z.testzip()is None
for ext in ['txt','zip']:shutil.copyfile('dist/audits/phase9.'+ext,'../Hoops-Dynasty-Phase-9-Followup.'+ext)
print('Report built; Phase 8 promoted; hold experiment remains audit-only')
