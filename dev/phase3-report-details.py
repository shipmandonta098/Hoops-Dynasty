import json,pathlib,statistics as st
p=pathlib.Path('dev/phase3');out=[]
for league in ['nba','wnba']:
 out+=['## '+league.upper()+' additional diagnostics','', '| Identical neutral fixture | Mean margin | Margin SD | 30+ % |','|---|---:|---:|---:|']
 for variant in ['baseline','candidate']:
  r=json.loads((p/f'{variant}-{league}-neutral.json').read_text());assert r['fixtureVersion']==3
  ms=[g['score'][0]-g['score'][1] for g in r['games']]
  out.append(f'| {variant} (200 games) | {st.mean(map(abs,ms)):.2f} | {st.pstdev(ms):.2f} | {100*st.mean(abs(x)>=30 for x in ms):.2f} |')
 out+=['','These are controlled game fixtures, not ten independent season estimates. NBA 30+ counts can rise even as the mean margin falls. No claim is made that every tail metric improves.','', '| Pregame lead (signed) | Possession slots | Points/slot |','|---|---:|---:|']
 r=json.loads((p/f'baseline-{league}-population.json').read_text())
 for k,v in sorted(r['slots'].items()):out.append(f"| {k} to next ten | {v['n']} | {v['points']/v['n']:.3f} |")
 out+=['','Lead bins condition on prior game outcomes and different lineups; they cannot establish causation or justify a trailing-team bonus. A possession slot is the engine accounting unit, not official statistical pace.','']
 gs=[g for seed in range(101,111) for g in json.loads(pathlib.Path(f'dev/balance-audit/phase3-{league}-{seed}.json').read_text())['games']]
 vals={k:[] for k in ['FG','2P','3P','eFG','TS']}
 for g in gs:
  for t in g['totals']:
   pairs={'FG':(t['fgm'],t['fga']),'2P':(t['fgm']-t['tpm'],t['fga']-t['tpa']),'3P':(t['tpm'],t['tpa']),'eFG':(t['fgm']+.5*t['tpm'],t['fga']),'TS':(t['pts'],2*(t['fga']+.44*t['fta']))}
   for k,(n,d) in pairs.items():
    if d:vals[k].append(100*n/d)
 out+=['| Revised team-game distribution | Mean % | SD | p10 | p90 |','|---|---:|---:|---:|---:|']
 for k,v in vals.items():
  v.sort();out.append(f'| {k} | {st.mean(v):.2f} | {st.pstdev(v):.2f} | {v[int((len(v)-1)*.1)]:.2f} | {v[int((len(v)-1)*.9)]:.2f} |')
 out+=['']
paths=json.loads((p/'candidate-paths.json').read_text())
out+=['## Foul-path follow-up','','The revised 50-game-per-league path audit checks actual trips and rebound sources. The candidate produced 48 NBA and 30 WNBA three-shot trips, down from 245 and 205 in the retained Phase 2 diagnostic. Residual overfrequency remains possible: the official comparison contains only 20 games per league and different rosters. The correction is not presented as complete foul calibration.','', 'The no-physical experiment disables derived physical attributes and direct matchup bonuses; biography-based rebounding size is not removed. The no-coach experiment changes skill/fit only. These names must not be interpreted as complete removal of every related mechanism.','']
pathlib.Path('docs/PHASE3-COMPETITIVENESS.md').open('a').write('\n'.join(out)+'\n')
extra=['## Ablation scoring and uncertainty','','Comparators: home/crowd/altitude are compared with neutral; no-momentum with home; population removals with population; all other identical-roster removals with neutral. Intervals below describe paired seeded games within these fixed fixtures, not uncertainty over the universe of possible rosters.','', '| Case | Pts/team | FG% | eFG% | Points/100 estimated possessions | Mean margin change | Approx. paired 95% interval |','|---|---:|---:|---:|---:|---:|---:|']
for f in sorted(p.glob('baseline-*.json')):
 if f.name=='baseline-hashes.json':continue
 r=json.loads(f.read_text());sc=r['scenario'];refsc='population' if sc.startswith('population') else 'home' if sc=='no-momentum' else 'neutral'
 comp=json.loads((p/f"baseline-{r['league']}-{refsc}.json").read_text());a=r['games'];b=comp['games'];ds=[abs(x['score'][0]-x['score'][1])-abs(y['score'][0]-y['score'][1]) for x,y in zip(a,b)];m=st.mean(ds);se=1.96*st.stdev(ds)/len(ds)**.5
 totals={k:sum(t[k] for g in a for t in g['totals']) for k in ['pts','fgm','fga','tpm','orb','tov','fta']};n=len(a)*2;pos=totals['fga']-totals['orb']+totals['tov']+.44*totals['fta']
 extra.append(f"| {r['league']} {sc} | {totals['pts']/n:.2f} | {100*totals['fgm']/totals['fga']:.2f} | {100*(totals['fgm']+.5*totals['tpm'])/totals['fga']:.2f} | {100*totals['pts']/pos:.2f} | {m:+.2f} | {m-se:+.2f} to {m+se:+.2f} |")
extra+=['','Controlled possession estimates use player turnovers because these fixture summaries do not retain team-only turnover totals. They must not be equated exactly with the full-season total-turnover estimator.','']
pathlib.Path('docs/PHASE3-COMPETITIVENESS.md').open('a').write('\n'.join(extra)+'\n')

extra=['## Paired season changes','','| League / measure | Mean change | Approx. 95% interval |','|---|---:|---:|']
summary=json.loads((p/'summary.json').read_text())
for league,v in summary.items():
 for key in ['points','meanMargin','blow20','blow30','blow40','blow50']:
  diffs=[b[key]-a[key] for a,b in zip(v['phase2']['bySeed'],v['phase3']['bySeed'])];m=st.mean(diffs);h=2.262*st.stdev(diffs)/10**.5
  extra.append(f'| {league} / {key} | {m:+.3f} | {m-h:+.3f} to {m+h:+.3f} |')
extra+=['','Rate differences are percentage points. Same initial seeds do not preserve later injury/roster/RNG trajectories after gameplay branching changes. These intervals describe differences over the ten retained seeds.','']
pathlib.Path('docs/PHASE3-COMPETITIVENESS.md').open('a').write('\n'.join(extra)+'\n')
extra=['## Isolated correction effects','','| League / version | Games | Mean margin | 30+ % |','|---|---:|---:|---:|']
for league in ['nba','wnba']:
 for version in ['baseline','fatigue-only','foul-only','candidate']:
  r=json.loads((p/f'{version}-{league}-neutral.json').read_text());assert r['count']==200 and r['fixtureVersion']==3
  ms=[abs(g['score'][0]-g['score'][1]) for g in r['games']];extra.append(f'| {league} / {version} | 200 | {st.mean(ms):.2f} | {100*st.mean(x>=30 for x in ms):.2f} |')
extra+=['','The isolated fatigue correction is a correctness fix, not an established explanation of the broad blowout problem. The foul correction accounts for most of the observed improvement in the fixed NBA neutral fixture. Nonadditive changes reflect different random branches and contextual interactions.','']
pathlib.Path('docs/PHASE3-COMPETITIVENESS.md').open('a').write('\n'.join(extra)+'\n')
extra=['## Independent strength check','','Four fixed unequal-roster matchups, each repeated 50 times at neutral venue. The roster summary below uses intended minutes; it is not a fitted replacement spread model.','', '| League / fixture | OVR strength gap | Repeated mean home margin | Within-fixture margin SD | Home minutes-weighted 3P attribute | Away minutes-weighted 3P attribute |','|---|---:|---:|---:|---:|---:|']
quality=json.loads((p/'quality-fixtures.json').read_text())
for group in quality:
 league=group['league'];games=json.loads((p/f'baseline-{league}-population-no-home.json').read_text())['games']
 for i,pair in enumerate(group['fixtures']):
  a,b=pair;ms=[g['score'][0]-g['score'][1] for g in games[i*50:(i+1)*50]]
  extra.append(f"| {league} / {i+1} | {a['strength']-b['strength']:+.2f} | {st.mean(ms):+.2f} | {st.pstdev(ms):.2f} | {a['attributes']['tp']:.2f} | {b['attributes']['tp']:.2f} |")
extra+=['','These fixtures show why OVR similarity does not guarantee equivalent offense, defense or rotations. Fifty games per pairing leave wide sampling uncertainty. The evidence supports improving the quality model, not simply multiplying the old spread by the observed regression slope.','']
pathlib.Path('docs/PHASE3-COMPETITIVENESS.md').open('a').write('\n'.join(extra)+'\n')
