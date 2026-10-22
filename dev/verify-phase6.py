import json,pathlib,hashlib
p=pathlib.Path('dev/phase6');manifest=json.load(open(p/'baseline-hashes.json'))
for path,digest in manifest.items():assert hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()==digest,path
checks=[]
for league,total in [('nba',1230),('wnba',240)]:
 for seed in range(101,111):
  a=json.load(open(f'dev/balance-audit/phase5-{league}-{seed}.json'));b=json.load(open(f'dev/balance-audit/phase6-{league}-{seed}.json'))
  assert len(b['games'])==total;assert a['games']==b['games'];checks.append({'league':league,'seed':seed,'games':total,'identical':True})
json.dump({'unchangedProductionAndBaselineFiles':len(manifest),'fullSeasonReproduction':checks,'games':sum(x['games']for x in checks)},open(p/'verification.json','w'),indent=2)
print('PASS 20 full seasons reproduce Phase 5, all production/baseline files unchanged')
