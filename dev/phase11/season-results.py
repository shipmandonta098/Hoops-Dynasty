import json,pathlib,numpy as np
from scipy.stats import t
P=pathlib.Path('dev/phase11');out={}
for label in ['phase10pair','phase11hold','phase11hq']:
 rows=[]
 for p in sorted(pathlib.Path('dev/balance-audit').glob(label+'-nba-*.json')):
  x=json.load(open(p));g=x['games'];m=np.array([abs(a['score'][0]-a['score'][1])for a in g]);ties={}
  for clock in ['at60','at30']:
   v=[a for a in g if a['late'][clock][0]==a['late'][clock][1]];ties[clock]={'n':len(v),'OT':sum(a['ot']for a in v)}
  net={i:[]for i in range(x['teams'])}
  for a in g:net[a['a']].append(a['score'][0]-a['score'][1]);net[a['b']].append(a['score'][1]-a['score'][0])
  rows.append({'teamSD':float(np.std([np.mean(v)for v in net.values()])), 'seed':x['seed'],'n':len(g),'points':float(np.mean([a['score']for a in g])),'margin':float(m.mean()),'blow20':float(np.mean(m>=20)*100),'OT':float(np.mean([a['ot']for a in g])*100),'ties':ties})
 out[label]={'seeds':rows,'means':{k:float(np.mean([r[k]for r in rows]))for k in ['points','margin','blow20','OT','teamSD']} if rows else {}}
for label in ['phase11hold','phase11hq']:
 if len(out[label]['seeds'])!=5:continue
 out[label]['differences']={}
 for k in ['points','margin','blow20','OT','teamSD']:
  d=np.array([b[k]-a[k]for a,b in zip(out['phase10pair']['seeds'],out[label]['seeds'])]);v=float(t.ppf(.975,4)*d.std(ddof=1)/np.sqrt(5));out[label]['differences'][k]={'mean':float(d.mean()),'pairedSeedCI95':[float(d.mean()-v),float(d.mean()+v)]}
(P/'season-results.json').write_text(json.dumps(out,indent=2));print(out)
