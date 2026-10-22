import gzip,sys
import json,pathlib,statistics as st,math,collections,re,ast
import numpy as np
P=pathlib.Path('dev/phase6')
def mean(x):return float(np.mean(x)) if len(x)else None
def corr(a,b):return float(np.corrcoef(a,b)[0,1])if len(a)>1 and np.std(a)>0 and np.std(b)>0 else None
def stats(v):
 x=np.array(v);a=np.abs(x)
 return {'n':len(v),'meanAbs':mean(a),'medianAbs':float(np.median(a)),'signedSD':float(np.std(x)),'absSD':float(np.std(a)),**{f'within{k}%':100*mean(a<=k)for k in [5,10]},**{f'over{k}%':100*mean(a>=k)for k in [20,30,40,50]}}
def stages(gs):
 checkpoints=[[sum(q[0]-q[1]for q in g['periodScores'][:n])for g in gs]for n in [1,2,3]]+[[g['score'][0]-g['score'][1]for g in gs]]
 transitions={}
 for i,name in enumerate(['Q1closeToHalfBlowout','HalfCloseToQ3Blowout','Q3closeToFinalBlowout']):
  v=[abs(x)<=10 for x in checkpoints[i]];hit=[c and abs(y)>=20 for c,y in zip(v,checkpoints[i+1])];transitions[name]={'count':sum(hit),'all%':100*mean(hit),'amongClose%':100*sum(hit)/max(1,sum(v)),'eligible':sum(v)}
 v=[abs(x)>=20 for x in checkpoints[2]];hit=[c and abs(y)<=10 for c,y in zip(v,checkpoints[3])];transitions['Q3blowoutToFinalClose']={'count':sum(hit),'all%':100*mean(hit),'amongBlowouts%':100*sum(hit)/max(1,sum(v)),'eligible':sum(v)}
 quarters=[]
 for i in range(4):
  a=[g['periodScores'][i][0]for g in gs];b=[g['periodScores'][i][1]for g in gs];quarters.append({'homeVar':float(np.var(a)),'awayVar':float(np.var(b)),'covariance':float(np.cov(a,b,ddof=0)[0,1]),'correlation':corr(a,b)})
 return {'checkpoints':dict(zip(['Q1','Half','Q3','Final'],map(stats,checkpoints))),'transitions':transitions,'quarterScoring':quarters}
def runs(events):
 result=[];side=None;points=0;period=None;changes=0;ties=0;lastLeader=None;score=[0,0]
 for e in events:
  if e['side']!=side:
   if points:result.append({'points':points,'period':period})
   side=e['side'];points=0;period=e['period']
  points+=e['points'];score[e['side']]+=e['points'];leader=0 if score[0]>score[1] else 1 if score[1]>score[0]else None
  if leader is None:ties+=1
  elif lastLeader is not None and leader!=lastLeader:changes+=1
  if leader is not None:lastLeader=leader
 if points:result.append({'points':points,'period':period})
 return {'count':len(result),'max':max((r['points']for r in result),default=0),'mean':mean([r['points']for r in result]),'changes':changes,'ties':ties,'runs':result}
def runsummary(rs):return {k:mean([r[k]for r in rs])for k in ['count','max','mean','changes','ties']}
full={}
ns={'st':st,'math':math};fn=next(n for n in ast.parse(pathlib.Path('dev/report-phase2.py').read_text()).body if isinstance(n,ast.FunctionDef)and n.name=='metrics');exec(compile(ast.Module(body=[fn],type_ignores=[]),'metrics','exec'),ns)
for league in ['nba','wnba']:
 gs=[g for seed in range(101,111)for g in json.load(open(f'dev/balance-audit/phase5-{league}-{seed}.json'))['games']]
 full[league]={'phase5':{'metrics':ns['metrics'](gs),'stages':stages(gs)}}
 paths=[pathlib.Path(f'dev/balance-audit/phase6-{league}-{seed}.json')for seed in range(101,111)]
 if all(p.exists()for p in paths):
  now=[g for p in paths for g in json.load(open(p))['games']];assert now==gs,'Unchanged production full-season reproduction differs'
  full[league]['phase6']={'metrics':ns['metrics'](now),'stages':stages(now),'exactGameReproduction':True}
(P/'full-season-analysis.json').write_text(json.dumps(full,indent=2))
if '--full-only' in sys.argv:print('Full-season analysis updated');sys.exit(0)
real={}
for league,src in [('nba','dev/phase3/real-nba-2025.json'),('wnba','dev/phase3/real-wnba-2024.json')]:
 r=json.load(open(src))['resultSets'][0];lookup=collections.defaultdict(list)
 for row in r['rowSet']:
  v=dict(zip(r['headers'],row));lookup[v['GAME_ID']].append(v)
 games=[];rs=[];quarterRuns=[[] for _ in range(4)];bad=[];corrections=[]
 for path in sorted((P/'reference-pbp').glob(league+'-*.json')):
  g=json.load(open(path))['game'];rows=sorted(lookup[g['gameId']],key=lambda x:' @ 'in x['MATCHUP']);expected=[x['PTS']for x in rows];score=[0,0];periodEnds={};events=[];corrected=False
  for e in g['actions']:
   if str(e.get('scoreHome',''))!='':
    new=[int(e['scoreHome']),int(e['scoreAway'])]
    for side in [0,1]:
     delta=new[side]-score[side]
     if delta>0:events.append({'side':side,'points':delta,'period':e['period']-1})
     if delta<0:corrected=True
    score=new
   periodEnds[e['period']]=score.copy()
  if sorted(score)!=sorted(expected):bad.append(path.name);continue
  previous=[0,0];q=[]
  for n,end in sorted(periodEnds.items()):q.append([end[j]-previous[j]for j in [0,1]]);previous=end
  if len(q)<4 or any(x<0 for v in q for x in v):bad.append(path.name);continue
  games.append({'id':g['gameId'],'score':score,'periodScores':q})
  if corrected:corrections.append(path.name)
  else:
   rs.append(runs(events))
   for qi in range(4):quarterRuns[qi].append(runs([e for e in events if e['period']==qi]))
 pbpN=len(games)
 if league=='wnba':
  for note in json.load(open(P/'notes-quarter-games.json')):
   prior=next((g for g in games if g['id']==note['id']),None)
   if prior:assert prior['periodScores']==note['periodScores']
   else:games.append(note)
 real[league]={'pbpN':pbpN,'n':len(games),'stages':stages(games),'runs':runsummary(rs),'quarterRuns':[runsummary(q)for q in quarterRuns],'runsN':len(rs),'scoreCorrectionsExcludedFromRuns':corrections,'invalid':bad,'games':games,'selection':'All official game IDs attempted; successful/retained downloads only. Availability-biased, not a random sample.'}
(P/'real-analysis.json').write_text(json.dumps(real,indent=2))
# Scoring draws are sequential conditional expectations, NOT pregame predictions.
def extract(g):
 score=np.array(g['score']);draws=g['draws'];slots=g['slots'];qseconds=g['rules']['periodMinutes']*60;reg=g['rules']['gamePeriods']*qseconds
 groups=[];quarters=[]
 for cutoff in [None,3*qseconds]:
  ss=[s for s in slots if cutoff is None or s['start']<cutoff];ds=[d for sl in ss for d in draws[sl['drawStart']:sl['drawEnd']]]
  totals=[collections.Counter(),collections.Counter()];teamTO=[0,0]
  for sl in ss:
   for side in [0,1]:totals[side].update(sl['stats'][side])
   if 'turnover'in sl['trace']and sum(t['tov']for t in sl['stats'])==0:teamTO[sl['side']]+=1
  exp=np.array([sum(d['value']*d['prob']for d in ds if d['side']==i)for i in [0,1]])
  actual=np.array([sum(d['value']*d['made']for d in ds if d['side']==i)for i in [0,1]])
  variance=sum(d['value']**2*d['prob']*(1-d['prob'])for d in ds)
  poss=np.array([t['fga']+.44*t['fta']-t['orb']+t['tov']+teamTO[i]for i,t in enumerate(totals)])
  groups.append({'score':actual.tolist(),'expected':exp.tolist(),'margin':float(actual[0]-actual[1]),'expectedMargin':float(exp[0]-exp[1]),'residual':float((actual-exp)[0]-(actual-exp)[1]),'conditionalVariance':variance,'poss':poss.tolist(),'efficiency':(100*actual/np.maximum(1,poss)).tolist(),'expectedEfficiency':(100*exp/np.maximum(1,poss)).tolist(),'totals':[dict(t)for t in totals]})
 for q in range(g['rules']['gamePeriods']):
  ss=[sl for sl in slots if q*qseconds<=sl['start']<(q+1)*qseconds];ts=[collections.Counter(),collections.Counter()]
  for sl in ss:
   for side in [0,1]:ts[side].update(sl['stats'][side])
  # Within-quarter estimator; team-only turnovers are counted from recorded transitions.
  p=[t['fga']+.44*t['fta']-t['orb']+t['tov']+sum('turnover'in sl['trace']and sum(v['tov']for v in sl['stats'])==0 and sl['side']==i for sl in ss)for i,t in enumerate(ts)]
  quarters.append({'points':[t['pts']for t in ts],'poss':p,'rating':[100*t['pts']/max(1,p[i])for i,t in enumerate(ts)]})
 return {'full':groups[0],'early':groups[1],'quarters':quarters}
def diagstats(games,ex):
 score=[g['score']for g in games];m=[x[0]-x[1]for x in score];r=stats(m)
 r.update(points=mean([sum(x)/2 for x in score]),OTpct=100*mean([g['periods']>g['rules']['gamePeriods']for g in games]),scoreCorrelation=corr([x[0]for x in score],[x[1]for x in score]))
 for era in ['full','early']:
  a=[x[era]for x in ex];res=[x['residual']for x in a];v=[x['conditionalVariance']for x in a];r[era]={'meanExpectedMargin':mean([x['expectedMargin']for x in a]),'meanActualMargin':mean([x['margin']for x in a]),'residualMean':mean(res),'residualVariance':float(np.var(res)),'meanConditionalVariance':mean(v),'residualMSEtoConditionalVariance':mean(np.square(res))/mean(v),'expectedMarginVariance':float(np.var([x['expectedMargin']for x in a])),'actualMarginVariance':float(np.var([x['margin']for x in a])),'meanRatingDifference':mean([x['efficiency'][0]-x['efficiency'][1]for x in a])}
 return r
results={};modelrows=[]
for path in sorted(P.glob('*-*-*.json*')):
 if not re.match(r'(nba|wnba)-[a-z-]+-\d+\.json(?:\.gz)?$',path.name):continue
 if path.suffix=='.json' and path.with_name(path.name+'.gz').exists():continue
 r=json.load(gzip.open(path,'rt')if path.suffix=='.gz'else open(path));games=r['games'];ex=[extract(g)for g in games];key=path.name.removesuffix('.gz').removesuffix('.json')
 result=diagstats(games,ex);result['league']=r['league'];result['label']=r['label'];result['world']=r['world'];result['runs']=runsummary([runs(g['events'])for g in games]);result['quarterRuns']=[runsummary([runs([e for e in g['events']if e['period']==q])for g in games])for q in range(4)];result['shots']={}
 ds=[d for g in games for d in g['draws']]
 predicates={**{k:(lambda d,k=k:d.get('kind')==k and d['origin']!='ft')for k in ['inside','mid','three']},**{k:(lambda d,k=k:bool(d.get(k)))for k in ['open','contest','assisted','selfCreated','transition','late']},'secondChance':lambda d:d['origin']in ['putback','kickout','blockPutback','blockKickout'],'freeThrow':lambda d:d['origin']=='ft'}
 for name,pred in predicates.items():
  q=[d for d in ds if pred(d)]
  if not q:continue
  result['shots'][name]={'draws':len(q),'FGA':sum(x['origin']!='ft'and(x['origin']!='foul'or x['made'])for x in q),'expectedMake%':100*mean([d['prob']for d in q]),'actualMake%':100*mean([d['made']for d in q]),'pointsPerDraw':mean([d['value']*d['made']for d in q]),'expectedPointsPerDraw':mean([d['value']*d['prob']for d in q]),'off':mean([d['off']for d in q if 'off'in d]),'def':mean([d['def']for d in q if 'def'in d]),'fatigue':mean([d['fatigue']for d in q if 'fatigue'in d])}
 result['primaryClamp%']=100*mean([d['raw']<=.02 or d['raw']>=.88 for d in ds if 'raw'in d])
 result['perGame']=[{'seed':g['seed'],'quality':g['quality'],'spread':g['spread'],**x}for g,x in zip(games,ex)]
 results[key]=result
 if r['label']=='league':modelrows.extend({'league':r['league'],'world':r['world'],**x}for x in result['perGame'])
(P/'diagnostics-analysis.json.gz').write_bytes(gzip.compress(json.dumps(results,indent=2).encode(),mtime=0));(P/'model-rows.json.gz').write_bytes(gzip.compress(json.dumps(modelrows).encode(),mtime=0))
print('Analyzed',len(results),'controlled datasets',sum(r['n']for r in results.values()),'games; official coverage',{l:r['n']for l,r in real.items()})
