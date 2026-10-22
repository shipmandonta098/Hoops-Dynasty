import json,glob,math,statistics as st,hashlib,pathlib,csv
root=pathlib.Path('dev/balance-audit');dest=pathlib.Path('dev/phase2');report=['# Hoops Dynasty — Phase 2 possession and competitiveness audit','', 'Baseline: commit 48d22fc668ff4c06c445bfcf119f025fffb335fe, preserved secondary-* files, seeds 101–110. All measurements below come from completed runs. Fictional rosters; independent full regular seasons, not consecutive career years or verified historical rosters. Identical starting seeds preserve reproducibility, but changed random branches naturally lead to different later injuries, morale and game states; the separate controlled fixtures reset state for every matchup.','']
for label in ['baseline','revised']:
 control=json.loads((dest/f'controlled-{label}.json').read_text());assert len(control)==14 and all(len(r['games'])==100 for r in control), 'Controlled audit incomplete'
history=json.loads((dest/'historical.json').read_text());assert {(r['league'],r['year']) for r in history}=={('nba',1997),('nba',2025),('wnba',1997),('wnba',2006),('wnba',2024)} and all(len(r['games'])==30 for r in history)
bench={'nba':{'points':113.83,'meanMargin':12.74,'medianMargin':10,'fga':89.2,'fta':21.7,'orb':11.1,'totalTov':14.3,'pf':18.6,'blow20':21.06,'blow30':6.51,'blow40':1.79,'blow50':.41},'wnba':{'points':81.67,'meanMargin':10.82,'medianMargin':9,'fga':68.3,'fta':18,'orb':8.2,'totalTov':13.3,'pf':17.2,'blow20':9.17,'blow30':2.92,'blow40':0,'blow50':0}}
bench['nba'].update({'FG%':46.7,'2P%':54.5,'3PAshare%':100*37.6/89.2,'3P%':36.0,'FT%':78.0,'eFG%':100*(41.7+.5*13.5)/89.2,'TS%':100*113.83/(2*(89.2+.44*21.7))})
bench['wnba'].update({'FG%':43.8,'2P%':48.8,'3PAshare%':100*22.8/68.3,'3P%':33.8,'FT%':78.5,'eFG%':100*(29.9+.5*7.7)/68.3,'TS%':100*81.67/(2*(68.3+.44*18))})
real=json.loads(pathlib.Path('dev/secondary-shot-audit/real-summary.json').read_text())
for league,r in real.items():
 bench[league].update({'margin'+k:v for k,v in r['bins'].items()});bench[league]['games']=r['games'];bench[league]['homeWin%']=r['homeWinPct'];bench[league]['maxMargin']=r['maxMargin'];bench[league]['combinedScore']=2*r['ppg']
def metrics(gs):
 ts=[t for g in gs for t in g['totals']];n=len(gs);av=lambda k:sum(t.get(k,0) for t in ts)/len(ts);m=[abs(g['score'][0]-g['score'][1]) for g in gs];res=[g['score'][0]-g['score'][1]+g['spread'] for g in gs];tot=lambda k:sum(t[k] for t in ts)
 d={'games':n,'points':av('pts'),'meanMargin':st.mean(m),'medianMargin':st.median(m),'maxMargin':max(m),'rawPoss':av('poss'),'fga':av('fga'),'fta':av('fta'),'orb':av('orb'),'playerTov':av('tov'),'pf':av('pf'),'FG%':100*tot('fgm')/tot('fga'),'3P%':100*tot('tpm')/tot('tpa'),'FT%':100*tot('ftm')/tot('fta'),'eFG%':100*(tot('fgm')+.5*tot('tpm'))/tot('fga'),'TS%':100*tot('pts')/(2*(tot('fga')+.44*tot('fta'))),'rawORtg':100*av('pts')/av('poss'),'MAE':st.mean(abs(v) for v in res),'signedError':st.mean(res),'RMSE':math.sqrt(st.mean(v*v for v in res)),'residualSD':st.pstdev(res),'OT%':100*st.mean(g['ot'] for g in gs),'homeWin%':100*st.mean(g['score'][0]>g['score'][1] for g in gs)}
 for lo,hi in [(1,5),(6,10),(11,19),(20,29),(30,39),(40,49),(50,999)]:d[f'margin{lo}-{hi}']=100*st.mean(lo<=v<=hi for v in m)
 for k in [20,30,40,50]:d['blow'+str(k)]=100*st.mean(v>=k for v in m)
 for label,xs in [('strength',[g['strengths'][0]-g['strengths'][1] for g in gs]),('predictedMargin',[-g['spread'] for g in gs])]:
  ys=[g['score'][0]-g['score'][1] for g in gs];xm=st.mean(xs);ym=st.mean(ys);den=sum((x-xm)**2 for x in xs)
  if den:
   slope=sum((x-xm)*(y-ym) for x,y in zip(xs,ys))/den;d[label+'Slope']=slope;d[label+'Intercept']=ym-slope*xm
 rated=[g for g in gs if g['strengths'][0]!=g['strengths'][1]]
 d['strongerWin%']=100*st.mean((g['strengths'][0]-g['strengths'][1])*(g['score'][0]-g['score'][1])>0 for g in rated) if rated else 0
 d['teamScoreSD']=st.pstdev(t['pts'] for t in ts)
 fgs=sorted(100*t['fgm']/t['fga'] for t in ts if t['fga']);d['FGp10%']=fgs[int((len(fgs)-1)*.1)];d['FGp90%']=fgs[int((len(fgs)-1)*.9)]
 d['2P%']=100*(tot('fgm')-tot('tpm'))/(tot('fga')-tot('tpa'))
 d['3PAshare%']=100*tot('tpa')/tot('fga')
 d['ORBshare%']=100*tot('orb')/(tot('orb')+tot('drb'))
 d['rawPacePer48']=av('poss')/(av('mp')/5)*48
 d['combinedScore']=2*d['points']
 d['meanLeadChanges']=st.mean(g.get('leadChanges',0) for g in gs)
 q3=[sum(q[0]-q[1] for q in g['periodScores'][:3]) for g in gs];final=[g['score'][0]-g['score'][1] for g in gs]
 d['meanEnteringQ4Margin']=st.mean(abs(v) for v in q3)
 nonTied=[(a,b) for a,b in zip(q3,final) if a]
 d['Q4trailerWins%']=100*st.mean(a*b<0 for a,b in nonTied) if nonTied else 0
 d['benchPoints']=av('bench')
 d['residual40%']=100*st.mean(abs(v)>=40 for v in res)
 if all('totalTurnovers' in t for t in ts):d.update(totalTov=av('totalTurnovers'),teamOnlyTov=av('teamOnlyTurnovers'),estimatedPoss=av('estimatedPossessions'),estimatedORtg=100*av('pts')/av('estimatedPossessions'))
 return d
labels={'games':'Games','points':'Points per team','meanMargin':'Mean winning margin','medianMargin':'Median winning margin','maxMargin':'Largest margin','rawPoss':'Engine slots per team','estimatedPoss':'Estimated possessions per team','fga':'FGA per team','fta':'FTA per team','orb':'Offensive rebounds per team','playerTov':'Player-box turnovers per team','totalTov':'Total team turnovers per team','teamOnlyTov':'Team-only turnovers per team','pf':'Personal fouls per team','rawORtg':'Points per 100 engine slots','estimatedORtg':'Points per 100 estimated possessions','MAE':'Spread mean absolute error','signedError':'Spread signed error (home bias)','RMSE':'Spread root mean squared error','residualSD':'Spread residual standard deviation','OT%':'Overtime games %','homeWin%':'Home win %','residual40%':'Absolute spread error 40+ %','ORBshare%':'ORB share of credited rebounds %','rawPacePer48':'Engine slots per 48 minutes','combinedScore':'Combined game score','meanLeadChanges':'Mean lead changes','meanEnteringQ4Margin':'Mean margin entering Q4','Q4trailerWins%':'Q4 trailing team eventually wins %','benchPoints':'Bench points per team','teamScoreSD':'Team scoring standard deviation','strengthSlope':'Actual margin / strength-gap regression slope','strengthIntercept':'Strength regression home intercept','predictedMarginSlope':'Actual / predicted margin regression slope','predictedMarginIntercept':'Prediction regression home intercept'}
labels['strongerWin%']='Higher pregame-strength team win %'
labels.update({'blow'+str(k):str(k)+'+ point margins %' for k in [20,30,40,50]})
labels.update({'margin'+str(a)+'-'+str(b):str(a)+('–'+str(b) if b<999 else '+')+' point games %' for a,b in [(1,5),(6,10),(11,19),(20,29),(30,39),(40,49),(50,999)]})
results={};manifest=[];csvrows=[]
for league in ['nba','wnba']:
 results[league]={}
 for phase in ['secondary','phase2']:
  runs=[]
  for seed in range(101,111):
   p=root/f'{phase}-{league}-{seed}.json';r=json.loads(p.read_text());expected=1230 if league=='nba' else 240
   assert len(r['games'])==expected and r['regularGames']==expected
   runs.append(r);manifest.append({'path':str(p),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
  gs=[g for r in runs for g in r['games']];m=metrics(gs);byseed=[metrics(r['games']) for r in runs]
  results[league][phase]={'aggregate':m,'bySeed':byseed}
 report+=['## '+league.upper(),'', 'Rate rows are percentages; Change % is relative change, not percentage-point change. FGp10/FGp90 describe the distribution of individual team-game shooting percentages.', '','| Metric | Baseline | Revised | Change % | Reference |','|---|---:|---:|---:|---:|']
 old=results[league]['secondary']['aggregate'];new=results[league]['phase2']['aggregate']
 for key in dict.fromkeys([*old,*new]):
  a,b=old.get(key),new.get(key);change=100*(b-a)/a if a not in [0,None] and b is not None else None
  fmt=lambda x:'Unavailable' if x is None else f'{x:.2f}'
  report.append(f'| {labels.get(key,key)} | {fmt(a)} | {fmt(b)} | {fmt(change)} | {fmt(bench[league].get(key))} |')
  csvrows.append([league,key,a,b,change,bench[league].get(key)])
 report+=['','Full-season baseline total team turnovers were not retained in the old audit. Its player-box totals are shown separately; revised total turnovers include team-only violations. The separately traced baseline sample supplies the missing distinction without inventing full-season totals. Raw possessions are scheduled engine slots; estimated possessions are FGA − ORB + total TOV + 0.44 FTA. Neither is presented as identical to an official pace estimator.','', '### Run-to-run uncertainty','', '| Metric | Revised mean across seeds | Approx. 95% interval for seed mean | Seed range |','|---|---:|---:|---:|']
 for key in ['points','meanMargin','blow20','blow30','blow40','blow50']:
  vs=[r[key] for r in results[league]['phase2']['bySeed']];mean=st.mean(vs);half=2.262*st.stdev(vs)/math.sqrt(len(vs));report.append(f'| {labels.get(key,key)} | {mean:.2f} | {mean-half:.2f}–{mean+half:.2f} | {min(vs):.2f}–{max(vs):.2f} |')
 report+=['','Intervals use ten independently seeded seasons, not an assumption that games within a season are independent. Rare tails remain uncertain.','', '### Spread calibration by predicted home margin','', '| Predicted home margin | Games | Actual mean margin | Signed error | MAE | RMSE | Home win % |','|---|---:|---:|---:|---:|---:|---:|']
 gs=[g for r in [json.loads((root/f'phase2-{league}-{seed}.json').read_text()) for seed in range(101,111)] for g in r['games']]
 for lo,hi in [(-100,-10),(-10,-5),(-5,0),(0,5),(5,10),(10,100)]:
  a=[g for g in gs if lo<=-g['spread']<hi]
  if a:
   mm=metrics(a);report.append(f"| {lo} to {hi} | {len(a)} | {st.mean(g['score'][0]-g['score'][1] for g in a):.2f} | {mm['signedError']:.2f} | {mm['MAE']:.2f} | {mm['RMSE']:.2f} | {mm['homeWin%']:.2f} |")
report+=['','## Strength and game development','', '| League / phase / absolute strength gap | Games | Mean margin | 30+ % | 40+ % |','|---|---:|---:|---:|---:|']
for league in ['nba','wnba']:
 for phase in ['secondary','phase2']:
  gs=[g for seed in range(101,111) for g in json.loads((root/f'{phase}-{league}-{seed}.json').read_text())['games']]
  for lo,hi in [(0,2),(2,5),(5,10),(10,100)]:
   group=[g for g in gs if lo<=abs(g['strengths'][0]-g['strengths'][1])<hi]
   if group:
    m=metrics(group);report.append(f"| {league} / {phase} / {lo}–{hi} | {len(group)} | {m['meanMargin']:.2f} | {m['blow30']:.2f} | {m['blow40']:.2f} |")
report+=['','### Rested matchups','', '| League / phase | Games with neither team on a back-to-back | Mean margin | 30+ % | 40+ % |','|---|---:|---:|---:|---:|']
for league in ['nba','wnba']:
 for phase in ['secondary','phase2']:
  gs=[g for seed in range(101,111) for g in json.loads((root/f'{phase}-{league}-{seed}.json').read_text())['games'] if not any(g['back'])]
  m=metrics(gs);report.append(f"| {league} / {phase} | {len(gs)} | {m['meanMargin']:.2f} | {m['blow30']:.2f} | {m['blow40']:.2f} |")
report+=['','The strength field is the existing pregame team-strength calculation, not an independently validated talent score. Identical strengths need not imply identical rotations, attributes or tactics.','']
report+=['','## Confirmed mechanisms and changes','',
'- Possessions are fixed minute slots, not elapsed-time-driven ball-control episodes. Coach tempo had been centered at 50 despite generated system tempos averaging 63.5. Centering the existing pace adjustment at 63.5 removes the structural population-level addition while preserving fast/slow coaching differences.',
'- Team-only shot-clock turnovers are already stored independently and displayed through teamTurnoverCount. They are rare in the traced sample; they do not explain the several-turnover shortfall. Player and team turnovers remain distinct.',
'- Existing pass, handling, interception, isolation and pick-and-roll hazards lacked league/era turnover context. Their rating-dependent risks now use a bounded multiplier derived from the reference turnover share relative to the measured approximately 12.5% neutral event environment. This is a model translation, not a guarantee of a target count.',
'- Ordinary off-ball defensive contact was absent. A bounded non-shooting defensive-foul path now depends on defender foul tendency, defensive IQ, coaching discipline, crowd and the existing foul slider. Non-bonus calls retain the ball; bonus calls use existing free throws and rebound resolution. Shooting-foul and shooting-accuracy formulas were not retuned.',
'- Rebounding used neutral 1:3 offensive/defensive odds in every era. Reference ORB/DRB odds now provide the starting environment, multiplied by the existing active-lineup strength ratio and user slider. This preserves rebounding talent. The original modern offensive-board probability was near 25%; high per-game counts partly reflected too many misses, not a huge probability defect.',
'- The old clock was always 24 seconds and every rebound reset to 14. WNBA pre-2006 now uses 30; WNBA pre-2016 and NBA pre-2018 use the full rebound reset; NBA pre-1954 has no shot-clock violation. Early WNBA defensive-foul resets now use 30 seconds through 2003, 20 in 2004–05, then 14. These are rule corrections, separate from statistical calibration; older NBA defensive-foul reset history remains incompletely modeled.',
'- The added retained-possession contact path now refreshes the defender, box row, stamina and lineup effects if that foul disqualifies the original defender. A forced non-bonus disqualification regression passes five games per league. The first provisional full-season batch is retained under dev/phase2/candidate-seasons, but excluded from the final comparison; all twenty final seasons were rerun after this correction.',
'- No overall-rating compression, score caps, trailing-team bonuses, scripted comebacks, widened spreads, or shooting penalties were added. The spread formula is unchanged.',
'', '## Accounting and remaining limitations','',
'- Instrumentation records each slot’s start side, start/end clock window, state trace, terminal phase, fouls, FT trips, turnovers, rebound opportunities, shot path and before/after box deltas. It consumes no randomness. All 200 baseline diagnostic scores matched the previously retained game results exactly.',
'- Offensive rebounds are continuations, not possession endings. The report separates terminal outcomes from rebound and foul events; an and-one is not counted as a second possession. Technical/flagrant retained trips do not create a new slot.',
'- The legacy possessionOutcomes field marks the first qualifying event, so it is not an authoritative terminal-outcome count. New audit tracing uses final state/turnover evidence instead. Existing saved records are preserved.',
'- The engine still uses fixed clock windows. Secondary shots and repeated rebounds can be compressed into one window; shot-clock time and game-clock time are not fully coupled. Period-expiration endings and team-rebound attribution are not comprehensively modeled. This phase does not claim a physically complete clock engine.',
'- The existing primary shooting-foul hazard has no shot-location term. The matched samples below record the actual one-, two- and three-shot trip counts. This distribution was not calibrated against verified shot-location foul data in this phase. It also makes the generic 0.44 FTA possession estimator imperfect for this engine.',
'- Final missed free throws still use the general rebound resolver; separate FT rebound geometry and shooting-foul opportunities on immediate secondary shots remain modeling weaknesses. No unsupported FT rebound percentage was asserted as verified.',
'- Statistical priors are sparse: NBA 1997, 2023, 2024; WNBA 1997, 2006, 2023, 2024. Other years use the nearest row; possessionEnvironment exposes the reference and approximate flag. These translations are assumptions for fictional roster populations, not verified annual rates for every historical season.',
'- Scoring efficiency, physical-matchup accumulation, roster construction and the simple OVR spread model may leave residual bias and blowout excess. Lower shot volume alone is not proof of complete balance. Compare all tail metrics above.',
'', '## Reference variation','', 'The 2023–24 NBA averaged 114.2 points, 88.9 FGA and 21.7 FTA per team; 2024–25 averaged 113.83 points, 89.2 FGA and 21.7 FTA. WNBA 2022 averaged 82.3 points, 68.0 FGA and 18.2 FTA; 2023 averaged 82.7 points, 68.3 FGA and 18.5 FTA; 2024 averaged 81.67 points, 68.3 FGA and 18.0 FTA. These adjacent-season checks support a range, not a mandatory scoring target. Complete real-game margin distributions are available here only for the retained 2024 reference seasons. Reference eFG and TS are estimates derived from rounded aggregate tables. Zero 40+ margins in the 240-game WNBA reference does not imply that the true probability of such a result is zero.', '', '## Sources','',
'- https://www.basketball-reference.com/leagues/NBA_2025.html (2024–25 NBA reference)',
'- https://www.basketball-reference.com/leagues/NBA_2024.html (2023–24 cross-check)',
'- https://www.basketball-reference.com/leagues/NBA_1998.html (1997 start-year NBA)',
'- https://www.basketball-reference.com/wnba/years/2024.html',
'- https://www.basketball-reference.com/wnba/years/2023.html',
'- https://www.basketball-reference.com/wnba/years/2022.html',
'- https://www.basketball-reference.com/wnba/years/2006.html',
'- https://www.basketball-reference.com/wnba/years/1997.html',
'- https://official.nba.com/nba-board-of-governors-approves-rules-changes-for-2018-19-season/',
'- https://www.wnba.com/news/wnba-announces-rules-changes-for-2016-season/amp',
'- https://www.wnba.com/news/wnba-history-timeline-2012 (December 2003 change for the 2004 season)',
'- https://www.oursportscentral.com/services/releases/wnba-announces-rules-changes/n-3247203 (WNBA-issued 2005 release)',
'- Prior audit retained complete margin datasets: https://fixturedownload.com/results/nba-2024 and https://fixturedownload.com/results/wnba-2024; NBA Cup final excluded.',
'', 'Aggregate reference tables were checked in indexed source results; direct Basketball Reference access returned 403. No claim of newly downloading its complete game logs. Prior validated margin datasets are reused.']
(dest/'summary.json').write_text(json.dumps(results,indent=2));(dest/'manifest.json').write_text(json.dumps(manifest,indent=2));
with (dest/'comparison.csv').open('w') as f:
 w=csv.writer(f);w.writerow(['league','metric','baseline','revised','relative_change_percent','reference']);w.writerows(csvrows)
pathlib.Path('docs/PHASE2-COMPETITIVENESS.md').write_text('\n'.join(report)+'\n')
print('Wrote phase 2 report from 40 retained full seasons (29,400 games).')
extra=['','## Controlled matchups','', '100 paired seeds per league/scenario; equal rosters and coaches before the stated changes. WNBA uses 12 teams. The controlled fixture does not claim to represent all real-world roster distributions. The no-fatigue scenario disables effective-attribute fatigue only; stamina-driven substitutions still operate. Home-court and user-team context are retained, so equal rosters are not a neutral-venue experiment.','', '| League / scenario | Baseline mean home margin | Revised mean home margin | Baseline margin SD | Revised margin SD | Baseline 30+ % | Revised 30+ % |','|---|---:|---:|---:|---:|---:|---:|']
old=json.loads((dest/'controlled-baseline.json').read_text());new=json.loads((dest/'controlled-revised.json').read_text());assert len(old)==len(new)==14
for x in old:
 y=next(v for v in new if (v['league'],v['scenario'])==(x['league'],x['scenario']));assert len(x['games'])==len(y['games'])==100
 a=[g['score'][0]-g['score'][1] for g in x['games']];b=[g['score'][0]-g['score'][1] for g in y['games']]
 extra.append(f"| {x['league']} / {x['scenario']} | {st.mean(a):.2f} | {st.mean(b):.2f} | {st.pstdev(a):.2f} | {st.pstdev(b):.2f} | {sum(abs(v)>=30 for v in a)} | {sum(abs(v)>=30 for v in b)} |")
extra+=['','## Traced possession samples','', '50 matched game seeds per league/phase. Each rebound was checked against recorded misses; no sampled slot had more credited rebounds than eligible recorded field-goal and free-throw misses. Some missed shots have no player rebound (for example, loose-ball fouls).','', '| League / phase | Shots/team | FTA/team | Total TOV/team | Raw slots/team | ORB share of credited boards |','|---|---:|---:|---:|---:|---:|']
pathdetails=[]
for phase in ['baseline-paths','revised-paths']:
 for r in json.loads((dest/(phase+'.json')).read_text()):
  assert not r['failures'];n=2*r['count'];t=r['totals'];assert sum(r['ends'].values())==r['slots']
  extra.append(f"| {r['league']} / {phase} | {t['fga']/n:.2f} | {t['fta']/n:.2f} | {(t['tov']+t['teamOnly'])/n:.2f} | {r['slots']/n:.2f} | {100*r['orbPct']:.2f}% |")
  pathdetails+=['',f"{r['league']} {phase} terminal counts: "+', '.join(f'{k}={v} ({100*v/r["slots"]:.2f}%)' for k,v in r['ends'].items()),'', 'Secondary-shot paths: '+', '.join(f'{k}: {v["made"]}/{v["attempts"]}' for k,v in r['shots'].items() if not k.startswith('primary')), '', 'Rebound sources: '+', '.join(f'{k}: {v["offensive"]} offensive / {v["total"]} total' for k,v in r['reboundSources'].items()),'', 'FT trip counts (technical/retained flags overlap trip lengths): '+', '.join(f'{k}={v}' for k,v in r['trips'].items()),'', 'Turnover types: '+', '.join(f'{k}={v}' for k,v in r['turnovers'].items()),'']
extra+=pathdetails
extra+=['','## Historical fixtures','', 'Thirty full-length games in each requested era, fictional six-team test rosters. These check formats, scoring and event integrity; they are not league-wide historical calibration samples.','', '| League / year | Games | Points/team | FGA/team | FTA/team | Player TOV/team | PF/team |','|---|---:|---:|---:|---:|---:|---:|']
for r in sorted(json.loads((dest/'historical.json').read_text()),key=lambda r:(r['league'],r['year'])):
 gs=r['games'];assert len(gs)==30
 extra.append(f"| {r['league']} / {r['year']} | {len(gs)} | {st.mean(sum(g['score'])/2 for g in gs):.2f} | "+' | '.join(f"{st.mean(g['totals'][k] for g in gs):.2f}" for k in ['fga','fta','tov','pf'])+' |')
extra+=['','## Validation, persistence and scope','',
'- Full-season verifier checks all 14,700 revised games, 82/40 games per team, no same-day schedule duplicates, period/box/final-score agreement, valid minutes and nonnegative shooting/turnover totals. Original baseline hashes are checked unchanged.',
'- Historical clock unit tests cover the five requested eras plus NBA pre-1954, bounded/monotonic turnover risks and preserved shooting-skill ordering.',
'- Player-feat tests: synthetic shot/FT winners, overtime, exact buzzer timing, permanent leads, defensive attribution, live-prefix visibility, playoffs and idempotent news; 40 actual games; production day progression and career persistence.',
'- Technical/flagrant tests: synthetic paired technicals and ejections plus 26 actual NBA/WNBA games; box/event totals and save/load.',
'- Legacy save test: baseline engine career loads with completed scores, boxes and summary events unchanged. No save migration required.',
'- Thirty fatigued full games verify effective secondary-shot attributes, permanent-rating preservation and score/event/box agreement.',
'- No changes to contracts, names, city photographs, morale decisions, GM employment, schedules or existing completed results. Browser visual QA was unavailable; this is headless gameplay verification, not a claim of device testing.',
'', '## Modified files','',
'Production: dist/attributes.js; dist/statistical-balance.js; dist/possession-engine.js; dist/tendencies.js; dist/pick-and-roll.js; dist/index.html (cache versions).',
'', 'Audit infrastructure: dev/audit-competitiveness.cjs; dev/audit-phase2.cjs; dev/phase2-instrument.cjs; dev/phase2-controlled.cjs; dev/phase2-historical.cjs; dev/test-phase2-rules.cjs; dev/test-phase2-foul-substitution.cjs; dev/run-phase2-seasons.cjs; dev/run-phase2-wnba.cjs; dev/verify-phase2.py; dev/report-phase2.py; dev/protect-phase2-results.cjs; retained output under dev/phase2/ and dev/balance-audit/phase2-*.json; dev/player-feat-simulation-results.json; docs/PHASE2-COMPETITIVENESS.md.']
p=pathlib.Path('docs/PHASE2-COMPETITIVENESS.md');p.write_text(p.read_text()+'\n'.join(extra)+'\n')

p=pathlib.Path('docs/PHASE2-COMPETITIVENESS.md')
p.write_text(p.read_text()+"\n## Reproduction\n\nThe full-season runners reuse retained result files; move only phase2-* results aside to rerun, preserving secondary-* baselines. Reconstruct the frozen baseline dist from git commit 48d22fc668ff4c06c445bfcf119f025fffb335fe and set HOOPS_BASELINE_DIST to that dist directory for baseline diagnostics. Run node dev/run-phase2-seasons.cjs, then python3 dev/verify-phase2.py and python3 dev/report-phase2.py. Diagnostic runs: node dev/audit-phase2.cjs baseline-paths 50; node dev/audit-phase2.cjs revised-paths 50; node dev/phase2-controlled.cjs baseline 100; node dev/phase2-controlled.cjs revised 100; node dev/phase2-historical.cjs. Controlled results also resume retained scenarios. The phase2 production change affects future games only.\n")
p=pathlib.Path('docs/PHASE2-COMPETITIVENESS.md')
lead=['## Outcome','', 'The possession corrections reduce scoring volume. They do not complete competitive-balance calibration. No blanket shooting reduction or spread widening was used.','']
for league in ['nba','wnba']:
 a=results[league]['secondary']['aggregate'];b=results[league]['phase2']['aggregate']
 lead.append(f"- {league.upper()}: points/team {a['points']:.2f} → {b['points']:.2f}; FGA {a['fga']:.2f} → {b['fga']:.2f}; mean margin {a['meanMargin']:.2f} → {b['meanMargin']:.2f}; 20+ margins {a['blow20']:.2f}% → {b['blow20']:.2f}% (reference {bench[league]['blow20']:.2f}%).")
lead+=['','The remaining excessive margin variance has not been traced to one confirmed defect. Equal-roster and rested-game results show that fatigue alone is not an adequate explanation. The engine still compresses possessions into fixed clock windows, lacks complete secondary-shot foul/turnover paths, and needs further shot-location foul and efficiency calibration. Historical format compatibility passed; historical statistical balance is not established by the small fixtures.','']
text=p.read_text();title,body=text.split('\n',1);p.write_text(title+'\n\n'+'\n'.join(lead)+body)
