import json,pathlib,hashlib,collections
root=pathlib.Path('.')
manifest=json.load(open('dev/phase5/baseline-hashes.json'))
print(type(manifest),list(manifest)[:3])
results=[]
for league,count,perteam in [('nba',1230,82),('wnba',240,40)]:
 for seed in range(101,111):
  p=root/f'dev/balance-audit/phase5-{league}-{seed}.json'
  if not p.exists():continue
  r=json.load(open(p));gs=r['games'];assert len(gs)==count
  played=collections.Counter()
  for g in gs:
   played.update([g['a'],g['b']]);assert g['a']!=g['b']
   assert g['score'][0]!=g['score'][1]
   for side,t in enumerate(g['totals']):
    assert t['pts']==g['score'][side]==2*t['fgm']+t['tpm']+t['ftm']
    assert sum(x[side]for x in g['periodScores'])==g['score'][side]
    assert 0<=t['tpm']<=t['fgm']<=t['fga'] and 0<=t['ftm']<=t['fta']
    expected=5*((48 if league=='nba'else 40)+5*(len(g['periodScores'])-4))
    assert abs(t['mp']-expected)<.04,(league,seed,t['mp'],expected)
   assert bool(g['ot'])==(len(g['periodScores'])>4)
   if g['ot']:assert sum(v[0]-v[1]for v in g['periodScores'][:4])==0
  assert set(played.values())=={perteam}
  results.append({'league':league,'seed':seed,'games':len(gs),'checks':'schedule totals, scoring identity, period totals, shooting counts, overtime, minutes'})
assert len(results)==20,len(results)
allowed={'dist/attributes.js','dist/possession-engine.js','dist/index.html'}
entries=manifest.get('files',manifest)
if isinstance(entries,dict):
 for name,digest in entries.items():
  if name in allowed:continue
  if isinstance(digest,dict):digest=digest.get('sha256')
  if not isinstance(digest,str):continue
  assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==digest,name
json.dump({'passed':True,'seasons':results,'games':sum(r['games']for r in results),'baselinePreservedExcept':sorted(allowed)},open('dev/phase5/verification.json','w'),indent=2)
print('PASS all 20 full seasons, preserved prior files and photographs')
