import pathlib,json,numpy as np
from scipy.stats import binomtest
P=pathlib.Path('dev/phase11');base=P/'endings-nba-production.json'
if not base.exists():raise SystemExit('Baseline still running')
b={r['name']:r for r in json.load(open(base))};out=[]
for p in P.glob('endings-nba-*.json'):
 arm=p.stem.removeprefix('endings-nba-')
 if arm=='production':continue
 for r in json.load(open(p)):
  if r['name']not in b:continue
  a=b[r['name']]['samples'];v=r['samples'];assert len(a)==len(v)==2000
  for metric in ['ot','win','avoidRegLoss']:
   def val(x):return x['ot'] if metric=='ot' else x['final'][0]>x['final'][1] if metric=='win' else x['regulation'][0]>=x['regulation'][1]
   x=np.array([val(t)for t in a],int);y=np.array([val(t)for t in v],int);d=y-x;gain=int(sum(d==1));loss=int(sum(d==-1));se=d.std(ddof=1)/len(d)**.5
   out.append(dict(arm=arm,scenario=r['name'],metric=metric,n=len(x),baseline=float(x.mean()),candidate=float(y.mean()),difference=float(d.mean()),ci95=[float(d.mean()-1.96*se),float(d.mean()+1.96*se)],gains=gain,losses=loss,p=binomtest(gain,gain+loss,.5).pvalue if gain+loss else 1))
order=sorted(range(len(out)),key=lambda i:out[i]['p']);prev=0
for rank,i in enumerate(order):prev=max(prev,min(1,out[i]['p']*(len(order)-rank)));out[i]['holmP']=prev
(P/'ending-comparisons.json').write_text(json.dumps(out,indent=2))
for r in out:
 if r['p']<.05:print(r['arm'],r['scenario'],r['metric'],round(r['baseline']*100,2),round(r['candidate']*100,2),'p',round(r['p'],5),'holm',round(r['holmP'],5))
