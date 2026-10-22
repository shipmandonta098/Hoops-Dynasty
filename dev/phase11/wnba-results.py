import json,pathlib,numpy as np
P=pathlib.Path('dev/phase11');out={}
for label in ['phase9','phase11hq']:
 rows=[]
 for p in sorted(pathlib.Path('dev/balance-audit').glob(label+'-wnba-*.json')):
  x=json.load(open(p));g=x['games'];m=np.array([abs(t['score'][0]-t['score'][1])for t in g]);rows.append({'seed':x['seed'],'n':len(g),'points':float(np.mean([t['score']for t in g])),'margin':float(m.mean()),'blow20':float(np.mean(m>=20)*100),'OT':float(np.mean([t['ot']for t in g])*100)})
 out[label]={'seeds':rows,'means':{k:float(np.mean([r[k]for r in rows]))for k in ['points','margin','blow20','OT']}if rows else {}}
(P/'wnba-results.json').write_text(json.dumps(out,indent=2));print(out)
