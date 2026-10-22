import json,pathlib,statistics as st,math,ast,collections,re
import numpy as np
ROOT=pathlib.Path('dev/phase5')
ns={'st':st,'math':math};tree=ast.parse(pathlib.Path('dev/report-phase2.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='metrics');exec(compile(ast.Module(body=[fn],type_ignores=[]),'metrics','exec'),ns);base_metrics=ns['metrics']
def corr(a,b):
 return float(np.corrcoef(a,b)[0,1]) if len(a)>1 and np.std(a)>0 and np.std(b)>0 else None
def cov(a,b):return float(np.cov(a,b,ddof=0)[0,1])
def variance(gs):
 a=np.array([g['score'][0] for g in gs],float);b=np.array([g['score'][1] for g in gs],float)
 out={'scoreCorrelation':corr(a,b),'scoreCovariance':cov(a,b),'teamVariance':float(np.var(np.r_[a,b])),'totalVariance':float(np.var(a+b)),'marginVariance':float(np.var(a-b)),'homeVariance':float(np.var(a)),'awayVariance':float(np.var(b))}
 out['covarianceIdentityError']=out['marginVariance']-(out['homeVariance']+out['awayVariance']-2*out['scoreCovariance'])
 if not gs or 'totals' not in gs[0]:return out
 for key in ['fga','fta','orb','totalTurnovers','poss','estimatedPossessions']:
  if all(key in t for g in gs for t in g['totals']):out[key+'Correlation']=corr([g['totals'][0][key]for g in gs],[g['totals'][1][key]for g in gs])
 if all('estimatedPossessions'in t for g in gs for t in g['totals']):
  p=np.array([[t['estimatedPossessions']for t in g['totals']]for g in gs]);rate=np.c_[a,b]/p;shared=p.mean(axis=1);diff=(p[:,0]-p[:,1])/2
  volume=diff*(rate[:,0]+rate[:,1]);efficiency=shared*(rate[:,0]-rate[:,1]);assert np.max(np.abs(volume+efficiency-(a-b)))<1e-8
  out.update(efficiencyCorrelation=corr(rate[:,0],rate[:,1]),sharedEstimatedPaceVariance=float(np.var(shared)),marginDecomposition={'unequalPossessionComponentVariance':float(np.var(volume)),'efficiencyDifferenceComponentVariance':float(np.var(efficiency)),'twiceComponentCovariance':2*cov(volume,efficiency),'identityError':float(np.var(volume)+np.var(efficiency)+2*cov(volume,efficiency)-np.var(a-b))})
 return out
def metric(gs):
 m=base_metrics(gs);m.update(variance(gs));m['close10%']=m['margin1-5']+m['margin6-10'];m['OTcount']=sum(g['ot']for g in gs)
 for q in range(4):m['q'+str(q+1)+'Correlation']=corr([g['periodScores'][q][0]for g in gs],[g['periodScores'][q][1]for g in gs])
 for n in [2,3]:m['marginAfter'+str(n)]=st.mean(abs(sum(v[0]-v[1]for v in g['periodScores'][:n]))for g in gs)
 m['q4Close5%']=100*st.mean(abs(sum(v[0]-v[1]for v in g['periodScores'][:3]))<=5 for g in gs)
 m['q4Already20%']=100*st.mean(abs(sum(v[0]-v[1]for v in g['periodScores'][:3]))>=20 for g in gs)
 if all('late'in g for g in gs):
  m['within5Final120%']=100*st.mean(g['late']['within5Final120']or abs(g['late']['at120'][0]-g['late']['at120'][1])<=5 for g in gs)
  m['tiedFinal60%']=100*st.mean(g['late']['tiedFinal60']or g['late']['at60'][0]==g['late']['at60'][1]for g in gs)
 return m
def interval(v):
 mu=st.mean(v);n=len(v);half=(2.262 if n==10 else 2.8)*st.stdev(v)/math.sqrt(n) if n>1 else 0
 return {'mean':mu,'CI95':[mu-half,mu+half],'range':[min(v),max(v)],'n':n}
summary={}
keys=['points','meanMargin','margin1-5','close10%','blow20','blow30','blow40','blow50','OT%','scoreCorrelation','teamVariance','totalVariance','marginVariance','3P%','homeWin%','MAE']
for league in ['nba','wnba']:
 summary[league]={}
 for phase in ['phase4','phase5']:
  paths=[pathlib.Path(f'dev/balance-audit/{phase}-{league}-{seed}.json')for seed in range(101,111)];runs=[json.load(open(p))for p in paths if p.exists()]
  if not runs:continue
  by=[metric(r['games'])for r in runs];summary[league][phase]={'seeds':[r['seed']for r in runs],'aggregate':metric([g for r in runs for g in r['games']]),'bySeed':by,'uncertainty':{k:interval([v[k]for v in by])for k in keys}}
 if 'phase5'in summary[league] and len(summary[league]['phase5']['bySeed'])==10:
  a,b=summary[league]['phase4']['bySeed'],summary[league]['phase5']['bySeed'];summary[league]['pairedChange']={k:interval([y[k]-x[k]for x,y in zip(a,b)])for k in keys}
(ROOT/'summary.json').write_text(json.dumps(summary,indent=2))
def flow_stats(flow,reg,final):
 def at(t):
  a=[0,0]
  for e in flow:
   if e['seconds']<=t:
    if 'score'in e:a=e['score']
    else:a[e['side']]+=e['points']
  return a
 s120=at(reg-120);s60=at(reg-60);late=[s120]+[at(e['seconds'])for e in flow if reg-120<=e['seconds']<=reg];last=[s60]+[at(e['seconds'])for e in flow if reg-60<=e['seconds']<=reg]
 return {'close5Final120':any(abs(x[0]-x[1])<=5 for x in late),'close3Final60':any(abs(x[0]-x[1])<=3 for x in last),'tiedFinal60':any(x[0]==x[1]for x in last),'margin120':abs(s120[0]-s120[1]),'margin60':abs(s60[0]-s60[1]),'regulationTie':at(reg)[0]==at(reg)[1]}
diagnostics={}
for p in ROOT.glob('*-diagnostics.json'):
 r=json.load(open(p));gs=r['games'];slots=r['slots'];shots=r['shots'];margins=[abs(g['score'][0]-g['score'][1])for g in gs];late=[flow_stats(g['flow'],g['rules']['gamePeriods']*g['rules']['periodMinutes']*60,g['score'])for g in gs]
 out={'n':len(gs),'meanMargin':st.mean(margins),'signedMarginSD':st.pstdev(g['score'][0]-g['score'][1]for g in gs),'points':st.mean(sum(g['score'])/2 for g in gs),'OT%':100*st.mean(g['periods']>g['rules']['gamePeriods']for g in gs),'close10%':100*st.mean(x<=10 for x in margins),**{f'blow{x}':100*st.mean(v>=x for v in margins)for x in [20,30,40]},**{k:100*st.mean(x[k] for x in late)for k in ['close5Final120','close3Final60','tiedFinal60','regulationTie']}}
 out['three%']=100*sum(p['tpm']for g in gs for p in g['totals'])/max(1,sum(p['tpa']for g in gs for p in g['totals']))
 out['slots']=len(slots);out['actionOverruns']=sum(x.get('end') is not None and x['consumed']>x['end']-x['start'] for x in slots)
 out['zeroTimeBoardThenScore']=sum(x.get('end') is not None and any(e['type']=='offensiveRebound'and e['seconds']>=x['end']for e in x['events'])and any(e['type']=='score'and e['seconds']>=x['end']for e in x['events'])for x in slots)
 out['lateBackwardsEvents']=sum(any(b['timeMs']<a['timeMs']for a,b in zip(x['events'],x['events'][1:]))for x in slots)
 out['threeDecisionGroups']={}
 for name,predicate in [('open',lambda s:s['open']),('contested',lambda s:s['contest']),('assisted',lambda s:s['assisted']),('selfCreated',lambda s:s['selfCreated']),('lateClock',lambda s:s['clock']<=5)]:
  q=[s for s in shots if s['kind']=='three'and predicate(s)]
  if q:out['threeDecisionGroups'][name]={'n':len(q),**{k:st.mean(x[k]for x in q)for k in ['probability','off','def','fatigue','adjustment']}}
 diagnostics[p.stem]=out
(ROOT/'diagnostics-summary.json').write_text(json.dumps(diagnostics,indent=2))
# Official event samples: deterministic, evenly spaced game IDs; no selection
# by score. Validate final scores against the retained league game logs.
real={}
for league,source in [('nba','dev/phase3/real-nba-2025.json'),('wnba','dev/phase3/real-wnba-2024.json')]:
 r=json.load(open(source))['resultSets'][0];lookup=collections.defaultdict(list)
 for row in r['rowSet']:
  v=dict(zip(r['headers'],row));lookup[v['GAME_ID']].append(v)
 games=[];late=[];grid=collections.defaultdict(list)
 for p in sorted((ROOT/'reference-pbp').glob(league+'-*.json')):
  g=json.load(open(p))['game'];rows=sorted(lookup[g['gameId']],key=lambda x:' @ 'in x['MATCHUP']);expected=[x['PTS']for x in rows];periodSeconds=720 if league=='nba'else 600;reg=4*periodSeconds;flow=[];score=[0,0]
  for e in g['actions']:
   c=re.match(r'PT(\d+)M([\d.]+)S',e['clock']);remaining=int(c[1])*60+float(c[2]);t=(e['period']*periodSeconds if e['period']<=4 else reg+(e['period']-4)*300)-remaining
   if str(e.get('scoreHome',''))!='':score=[int(e['scoreHome']),int(e['scoreAway'])]
   flow.append({'seconds':t,'score':score.copy(),'period':e['period'],'type':e['actionType'],'team':e.get('teamId')})
  # Cup neutral-site logs can label BOTH clubs as away. In that case the
  # official PBP home/away orientation is authoritative; still verify totals.
  if all(' @ 'in row['MATCHUP']for row in rows):assert sorted(score)==sorted(expected),(p,score,expected)
  else:assert score==expected,(p,score,expected)
  late.append(flow_stats([e for e in flow if e['period']<=4],reg,score));periodScores=[];prior=[0,0]
  for q in range(1,max(e['period']for e in flow)+1):
   end=[e['score']for e in flow if e['period']==q][-1];periodScores.append([end[j]-prior[j]for j in [0,1]]);prior=end
  games.append({'score':score,'periodScores':periodScores,'ot':len(periodScores)>4})
  for sec in [60,30,15,5]:
   snap=[e for e in flow if e['seconds']<=reg-sec];a=snap[-1]['score']if snap else [0,0]
   for side in [0,1]:
    deficit=a[1-side]-a[side]
    if deficit in [1,2,3]:grid[f'down{deficit}-{sec}'].append({'game':g['gameId'],'side':side,'ot':len(periodScores)>4,'score':a})
 real[league]={'n':len(games),'sampleSelection':'40 evenly spaced sorted regular-season game IDs, not random or outcome stratified','late':{k:100*st.mean(x[k]for x in late)for k in ['close5Final120','close3Final60','tiedFinal60','regulationTie']},'quarterCorrelation':[corr([g['periodScores'][q][0]for g in games],[g['periodScores'][q][1]for g in games])for q in range(4)],'q4Close5%':100*st.mean(abs(sum(q[0]-q[1]for q in g['periodScores'][:3]))<=5 for g in games),'q4Already20%':100*st.mean(abs(sum(q[0]-q[1]for q in g['periodScores'][:3]))>=20 for g in games),'grid':{k:{'n':len(v),'OT%':100*st.mean(x['ot']for x in v)}for k,v in grid.items()},'games':games}
(ROOT/'real-pbp-analysis.json').write_text(json.dumps(real,indent=2))
print('Full-season sample sizes:',{l:{p:v['aggregate']['games']for p,v in s.items()if p in ['phase4','phase5']}for l,s in summary.items()})
print('Official PBP sample sizes:',{l:r['n']for l,r in real.items()})
