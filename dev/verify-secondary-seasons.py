import json,pathlib,collections,hashlib
root=pathlib.Path('dev/balance-audit');manifest=[]
for phase in ['after','secondary']:
 for league,teams,per_team in [('nba',30,82),('wnba',12,40)]:
  for seed in range(101,111):
   p=root/f'{phase}-{league}-{seed}.json';r=json.loads(p.read_text());gs=[g for g in r['games'] if g['stage']=='Regular season'];assert len(gs)==teams*per_team//2,(p,len(gs))
   assert r['seed']==seed and r['label']==phase and r['league']==league
   appearances=collections.Counter();slots=set()
   for g in gs:
    assert g['a']!=g['b'] and g['score'][0]!=g['score'][1]
    for side,t in enumerate([g['a'],g['b']]):
     assert (g['day'],t) not in slots,(p,g['day'],t)
     slots.add((g['day'],t));appearances[t]+=1
     assert g['totals'][side]['pts']==g['score'][side]
     expected_minutes=5*(r['rules']['gamePeriods']*r['rules']['periodMinutes']+max(0,len(g['periodScores'])-r['rules']['gamePeriods'])*r['rules']['overtimeMinutes'])
     assert abs(g['totals'][side]['mp']-expected_minutes)<.1,(p,g['day'],g['totals'][side]['mp'],expected_minutes)
     assert sum(q[side] for q in g['periodScores'])==g['score'][side]
   assert len(appearances)==teams and set(appearances.values())=={per_team},(p,appearances)
   manifest.append({'file':p.name,'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'regularGames':len(gs)})
(pathlib.Path('dev/secondary-shot-audit')/'verified-manifest.json').write_text(json.dumps({'baselineCommit':'e787395998debe5b3678085ef4369fa1b89402a6','runs':manifest,'regularGames':sum(x['regularGames'] for x in manifest)},indent=2)+'\n')
print('PASS 40 complete regular seasons, 29,400 games, per-team totals, no same-day conflicts, box/quarter/final-score agreement')
