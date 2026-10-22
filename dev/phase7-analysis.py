import json,gzip,pathlib,numpy as np
P=pathlib.Path('dev/phase7');rng=np.random.default_rng(71021)
def metric(gs):
 q=np.array([[a-b for a,b in g.get('quarter',g.get('periodScores'))[:4]]for g in gs]);s=np.array([g['score']for g in gs]);m=s[:,0]-s[:,1];c=np.cov(q,rowvar=False,ddof=0)
 ts=[t for g in gs for t in g['totals']];tpa=sum(t['tpa']for t in ts);tp=sum(t['tpm']for t in ts)
 return {'n':len(gs),'points':float(s.mean()),'meanMargin':float(np.abs(m).mean()),'medianMargin':float(np.median(np.abs(m))),'within5':float(100*np.mean(np.abs(m)<=5)),'within10':float(100*np.mean(np.abs(m)<=10)),'blow20':float(100*np.mean(np.abs(m)>=20)),'blow30':float(100*np.mean(np.abs(m)>=30)),'blow40':float(100*np.mean(np.abs(m)>=40)),'OT':float(100*np.mean([g['ot']for g in gs])),'threePct':100*tp/max(1,tpa),'regulationMarginVariance':float(np.var(q.sum(1))),'sumQuarterVariances':float(np.trace(c)),'quarterStacking':float(c.sum()-np.trace(c)),'quarterCovariance':c.tolist(),'Q3blow20':float(100*np.mean(np.abs(q[:,:3].sum(1))>=20))}
def compare(a,b):
 assert len(a)==len(b);n=len(a);ia=np.array([abs(g['score'][0]-g['score'][1])for g in a]);ib=np.array([abs(g['score'][0]-g['score'][1])for g in b]);sample=rng.integers(0,n,(1000,n));d=(ib-ia)[sample].mean(1)
 return {'baseline':metric(a),'candidate':metric(b),'pairedMeanMarginChange':float((ib-ia).mean()),'pairedMeanMargin95':np.quantile(d,[.025,.975]).tolist()}
out={}
for l in ['nba','wnba']:
 out[l]={}
 for label,world in [('identical',901),('league',303),('league',304)]:
  paths=[P/f'{v}-{l}-{label}-{world}.json.gz'for v in ['baseline','candidate']]
  if not all(p.exists()for p in paths):continue
  a,b=[json.load(gzip.open(p,'rt'))['games']for p in paths];out[l][f'{label}-{world}']=compare(a,b)
  if label=='identical':out[l]['mirror-heldout-160plus']=compare(a[160:],b[160:])
 seeds=[101,102]if l=='nba'else[101,102,103,104]
 paths=[pathlib.Path(f'dev/balance-audit/phase7-{l}-{seed}.json')for seed in seeds]
 if all(p.exists()for p in paths):
  a=[g for seed in seeds for g in json.load(open(f'dev/balance-audit/phase5-{l}-{seed}.json'))['games']];b=[g for p in paths for g in json.load(open(p))['games']];out[l]['fullSeasons']=compare(a,b);out[l]['fullSeasons']['pairedMeanMargin95']=None;out[l]['fullSeasons']['uncertaintyNote']='Two NBA/four WNBA season seeds; no independent-game confidence interval claimed.'
  out[l]['fullSeasons']['bySeed']=[{'seed':seed,'baseline':metric(json.load(open(f'dev/balance-audit/phase5-{l}-{seed}.json'))['games']),'candidate':metric(json.load(open(f'dev/balance-audit/phase7-{l}-{seed}.json'))['games'])}for seed in seeds]
(P/'comparison.json').write_text(json.dumps(out,indent=2));print(json.dumps({l:{k:{'base':round(v['baseline']['meanMargin'],2),'new':round(v['candidate']['meanMargin'],2),'baseStack':round(v['baseline']['quarterStacking'],2),'newStack':round(v['candidate']['quarterStacking'],2),'CI':v['pairedMeanMargin95']}for k,v in r.items()}for l,r in out.items()},indent=2))
