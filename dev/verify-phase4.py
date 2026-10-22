import json,pathlib,collections,hashlib,sys
root=pathlib.Path('dev/balance-audit')
for name,digest in json.load(open('dev/phase4/baseline-hashes.json')).items():
 if name in ['dist/attributes.js','dist/home-court.js','dist/index.html']:continue
 assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==digest,name
count=0
for league,teams,gp in [('nba',30,82),('wnba',12,40)]:
 for seed in range(101,111):
  p=root/f'phase4-{league}-{seed}.json'
  if '--partial' in sys.argv and (not p.exists() or pathlib.Path(str(p)+'.running').exists()):continue
  r=json.loads(p.read_text());gs=r['games'];assert len(gs)==teams*gp//2;appearances=collections.Counter();homes=collections.Counter();slots=set()
  for g in gs:
   homes[g['a']]+=1
   assert g['a']!=g['b'] and g['score'][0]!=g['score'][1]
   for side,t in enumerate([g['a'],g['b']]):
    assert (g['day'],t) not in slots;slots.add((g['day'],t));appearances[t]+=1
    s=g['totals'][side];assert s['pts']==g['score'][side];assert sum(q[side] for q in g['periodScores'])==s['pts'];assert s['pts']==2*s['fgm']+s['tpm']+s['ftm']
    for k in ['fgm','fga','ftm','fta','orb','drb','tov','totalTurnovers','teamOnlyTurnovers','pf']:assert s[k]>=0
    assert s['fgm']<=s['fga'] and s['tpm']<=s['tpa'] and s['ftm']<=s['fta'];assert s['totalTurnovers']==s['tov']+s['teamOnlyTurnovers']
    minutes=5*(r['rules']['gamePeriods']*r['rules']['periodMinutes']+max(0,len(g['periodScores'])-r['rules']['gamePeriods'])*r['rules']['overtimeMinutes']);assert abs(s['mp']-minutes)<.1
   count+=1
  assert len(appearances)==teams and set(appearances.values())=={gp}
  assert len(homes)==teams and set(homes.values())=={gp//2}
print('PASS',count,'new full-season games; baseline hashes intact; per-team schedule totals, no same-day duplicates, minutes, scores/quarters/boxes, shooting bounds, total/player turnovers')
