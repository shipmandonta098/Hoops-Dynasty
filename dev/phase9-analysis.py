import json,pathlib,gzip,numpy as np,math
P=pathlib.Path('dev/phase9')
def read(p):return json.load(gzip.open(p)if str(p).endswith('.gz')else open(p))
def rate(k,n):
 if not n:return {'k':k,'n':n,'pct':None,'wilson95':None}
 z=1.96;p=k/n;d=1+z*z/n;mid=(p+z*z/(2*n))/d;half=z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
 return {'k':k,'n':n,'pct':100*p,'wilson95':[100*(mid-half),100*(mid+half)]}
o={}
for league in ['nba','wnba']:
 o[league]={}
 for arm in ['production','hold']:
  p=P/f'{arm}-{league}-league-603.json.gz'
  if p.exists():
   gs=read(p)['games'];cohort=[g for g in gs if g['tieUnder24']];o[league][arm]={'games':len(gs),'tiedUnder24':len(cohort),'conditionalOT':rate(sum(g['ot']for g in cohort),len(cohort)),'conditionalRegulationDecision':rate(sum(not g['ot']for g in cohort),len(cohort)),'overallOT':rate(sum(g['ot']for g in gs),len(gs)),'eligibleSeeds':[g['seed']for g in cohort]}
  p=P/f'endings-{league}-{arm}.json'
  if p.exists():
   o[league][arm+'Synthetic']=[{'case':c['name'],'OT':rate(sum(s['ot']for s in c['samples']),len(c['samples'])),'meanFirstShotSeconds':float(np.mean([s['firstShotRemaining']for s in c['samples']if s['firstShotRemaining']is not None]))if any(s['firstShotRemaining']is not None for s in c['samples'])else None}for c in read(p)]
 if 'production'in o[league]and'hold'in o[league]:
  o[league]['sameEligibleGameSeeds']=o[league]['production']['eligibleSeeds']==o[league]['hold']['eligibleSeeds']
  a=read(P/f'production-{league}-league-603.json.gz')['games'];b=read(P/f'hold-{league}-league-603.json.gz')['games'];pairs=[(x,y)for x,y in zip(a,b)if x['tieUnder24']];assert all(x['seed']==y['seed']for x,y in pairs)
  o[league]['pairedChanges']={'regulationToOT':sum(not x['ot']and y['ot']for x,y in pairs),'OTToRegulation':sum(x['ot']and not y['ot']for x,y in pairs)}
paths=[pathlib.Path(f'dev/balance-audit/phase9-wnba-{s}.json')for s in range(101,106)]
if all(p.exists()for p in paths):
 def summary(gs):
  m=np.array([abs(g['score'][0]-g['score'][1])for g in gs]);return {'n':len(gs),'points':float(np.mean([g['score']for g in gs])),'meanMargin':float(m.mean()),'within10':float(100*np.mean(m<=10)),'blow20':float(100*np.mean(m>=20)),'blow30':float(100*np.mean(m>=30)),'OT':rate(sum(g['ot']for g in gs),len(gs))}
 allg=[g for p in paths for g in read(p)['games']];assert len(allg)==1200;o['wnbaSeasons']=summary(allg);o['wnbaSeeds']=[{'seed':s,**summary(read(p)['games'])}for s,p in zip(range(101,106),paths)]
 # Baseline comparison is only four matched Phase 7 seeds, not five.
 a=[g for s in range(101,105)for g in read(f'dev/balance-audit/phase7-wnba-{s}.json')['games']];b=[g for s in range(101,105)for g in read(f'dev/balance-audit/phase9-wnba-{s}.json')['games']];o['matchedFourWNBA']={'phase7':summary(a),'phase8':summary(b)}
(P/'results.json').write_text(json.dumps(o,indent=2));print(json.dumps(o,indent=2))
