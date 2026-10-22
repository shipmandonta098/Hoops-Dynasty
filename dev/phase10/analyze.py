import json,gzip,pathlib,numpy as np,collections,math
from scipy.stats import t
P=pathlib.Path('dev/phase10')
def read(p):return json.load(gzip.open(p)if str(p).endswith('.gz')else open(p))
def metrics(gs):
 margin=np.array([abs(g['score'][0]-g['score'][1])for g in gs]);teams=collections.defaultdict(list)
 for g in gs:
  for side,tid in enumerate([g['a'],g['b']]):teams[tid].append(g['score'][side]-g['score'][1-side])
 assert len(gs)==1230 and len(teams)==30 and all(len(v)==82 for v in teams.values())
 return dict(games=len(gs),points=float(np.mean([g['score']for g in gs])),meanMargin=float(margin.mean()),blow20=float(np.mean(margin>=20)*100),teamMarginSD=float(np.std([np.mean(v)for v in teams.values()])),OT=float(np.mean([g['ot']for g in gs])*100))
o={}
for label in ['phase8','phase10pair']:
 paths=[pathlib.Path(f'dev/balance-audit/{label}-nba-{seed}.json')for seed in range(101,106)]
 if not all(p.exists()for p in paths):continue
 rows=[dict(seed=seed,**metrics(read(p)['games']))for seed,p in zip(range(101,106),paths)];means={k:float(np.mean([r[k]for r in rows]))for k in rows[0]if k not in ['seed','games']};interval={k:[means[k]-t.ppf(.975,4)*np.std([r[k]for r in rows],ddof=1)/np.sqrt(5),means[k]+t.ppf(.975,4)*np.std([r[k]for r in rows],ddof=1)/np.sqrt(5)]for k in means};o[label]={'seeds':rows,'means':means,'seasonMeanT95':interval,'games':sum(r['games']for r in rows)}
if 'phase10pair'in o:
 m=o['phase10pair']['means'];o['gates']={'meanMargin':12<=m['meanMargin']<=13.5,'blow20':18<=m['blow20']<=24,'teamMarginSD':5<=m['teamMarginSD']<=6};o['jointGate']=all(o['gates'].values())
o['possessions']={}
for arm in ['production','pair']:
 p=P/f'{arm}-nba-league-604.json.gz'
 if not p.exists():continue
 gs=read(p)['games'];ps=[p for g in gs for p in g['possessions']];v=np.array([p['after'][p['side']]-p['before'][p['side']]for p in ps]);assert sum(sum(p['after'])-sum(p['before'])for p in ps)==sum(sum(g['score'])for g in gs)
 o['possessions'][arm]={'games':len(gs),'n':len(ps),'mean':float(v.mean()),'variance':float(v.var()),'transitionUsedPct':float(np.mean([p['transitionUsed']for p in ps])*100),'shotTransitionPct':float(np.mean([p['shotTransition']for p in ps])*100),'distribution':{str(i)if i<4 else'4+':float(np.mean(v==i if i<4 else v>=4)*100)for i in range(5)}}
o['lateTests']={}
for mode in ['production','foul','quick','timeout','combined']:
 p=P/f'endings-nba-{mode}.json'
 if not p.exists():continue
 o['lateTests'][mode]=[]
 for c in read(p):
  s=c['samples'];o['lateTests'][mode].append({'case':c['name'],'n':len(s),'wins':sum(x['final'][0]>x['final'][1]for x in s),'OT':sum(x['ot']for x in s),'regulationWins':sum(x['regulation'][0]>x['regulation'][1]for x in s),'FT':sum(x['ft']for x in s),'timeouts':sum(x['timeouts']for x in s)})
o['bonusTests']={}
for mode in ['production','combined']:
 p=P/f'bonus-endings-nba-{mode}.json'
 if p.exists():o['bonusTests'][mode]=[dict(case=c['name'],n=len(c['samples']),wins=sum(x['final'][0]>x['final'][1]for x in c['samples']),OT=sum(x['ot']for x in c['samples']))for c in read(p)]
(P/'results.json').write_text(json.dumps(o,indent=2));print(json.dumps({k:v for k,v in o.items()if k not in ['lateTests','bonusTests']},indent=2))
