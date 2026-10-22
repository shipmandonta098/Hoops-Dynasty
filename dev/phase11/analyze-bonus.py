import json,pathlib,numpy as np
from scipy.stats import binomtest
P=pathlib.Path('dev/phase11');paths=[P/f'bonus-endings-nba-{v}.json' for v in ['production','combined']]
if not all(p.exists()for p in paths):raise SystemExit('Pending')
a,b=[json.load(open(p))for p in paths];rows=[]
for x,y in zip(a,b):
 assert x['name']==y['name']
 for metric in ['ot','win','avoidRegLoss']:
  def val(t):return t['ot'] if metric=='ot' else t['final'][0]>t['final'][1]if metric=='win' else t['regulation'][0]>=t['regulation'][1]
  u=np.array([val(t)for t in x['samples']],int);v=np.array([val(t)for t in y['samples']],int);d=v-u;gain=int(sum(d==1));loss=int(sum(d==-1));se=d.std(ddof=1)/len(d)**.5
  rows.append({'scenario':x['name'],'metric':metric,'n':len(d),'baseline':float(u.mean()),'candidate':float(v.mean()),'difference':float(d.mean()),'ci95':[float(d.mean()-1.96*se),float(d.mean()+1.96*se)],'p':binomtest(gain,gain+loss).pvalue if gain+loss else 1})
(P/'bonus-comparisons.json').write_text(json.dumps(rows,indent=2));print(rows)
