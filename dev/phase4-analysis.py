import json, pathlib, statistics as st, math, ast, collections, numpy as np
root=pathlib.Path('dev/phase4');ns={'st':st,'math':math};tree=ast.parse(pathlib.Path('dev/report-phase2.py').read_text());fn=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='metrics');exec(compile(ast.Module(body=[fn],type_ignores=[]),'metrics','exec'),ns);metrics=ns['metrics']
def dist(v):
 v=list(v);return {'mean':st.mean(v),'sd':st.pstdev(v),'p10':float(np.percentile(v,10)),'p90':float(np.percentile(v,90)),'min':min(v),'max':max(v)}
def efficiency(gs):
 teams=collections.defaultdict(lambda:collections.defaultdict(float));shoots=collections.defaultdict(list)
 for g in gs:
  for i,t in enumerate(g['totals']):
   o=g['totals'][1-i];key=(g.get('seed',0),g[['a','b'][i]]);s=teams[key]
   for k in ['pts','fgm','fga','tpm','tpa','fta','ftm','orb','drb','totalTurnovers']:s[k]+=t[k]
   s['oppPts']+=o['pts'];s['oppFgm']+=o['fgm'];s['oppTpm']+=o['tpm'];s['oppFga']+=o['fga'];s['oppDrb']+=o['drb'];s['pos']+=(t['estimatedPossessions']+o['estimatedPossessions'])/2;s['gp']+=1
   for k,num,den in [('FG',t['fgm'],t['fga']),('3P',t['tpm'],t['tpa']),('eFG',t['fgm']+.5*t['tpm'],t['fga']),('TS',t['pts'],2*(t['fga']+.44*t['fta']))]:
    if den:shoots[k].append(100*num/den)
 vals=collections.defaultdict(list)
 for t in teams.values():
  for k,n,d in [('ORtg',t['pts']*100,t['pos']),('DRtg',t['oppPts']*100,t['pos']),('net',100*(t['pts']-t['oppPts']),t['pos']),('eFG',100*(t['fgm']+.5*t['tpm']),t['fga']),('oppEFG',100*(t['oppFgm']+.5*t['oppTpm']),t['oppFga']),('TOV%',100*t['totalTurnovers'],t['pos']),('ORB%',100*t['orb'],t['orb']+t['oppDrb']),('FTr',t['fta'],t['fga'])]:vals[k].append(n/d)
 return {'teams':len(teams),'teamSeason':{k:dist(v) for k,v in vals.items()},'teamGame':{k:dist(v) for k,v in shoots.items()},'scoreCorrelation':float(np.corrcoef([g['score'][0] for g in gs],[g['score'][1] for g in gs])[0,1]),'scoreCovariance':float(np.cov([g['score'][0] for g in gs],[g['score'][1] for g in gs],ddof=0)[0,1]),'homeScoreVariance':float(np.var([g['score'][0] for g in gs])),'awayScoreVariance':float(np.var([g['score'][1] for g in gs])),'signedMarginVariance':float(np.var([g['score'][0]-g['score'][1] for g in gs])),'sharedEstimatedPace':dist((g['totals'][0]['estimatedPossessions']+g['totals'][1]['estimatedPossessions'])/2 for g in gs)}
def official(path):
 r=json.load(open(path))['resultSets'][0];rows=[dict(zip(r['headers'],v)) for v in r['rowSet']];pairs=collections.defaultdict(list)
 for r in rows:pairs[r['GAME_ID']].append(r)
 gs=[]
 for id,rs in pairs.items():
  if len(rs)!=2:continue
  rs.sort(key=lambda r:' @ ' in r['MATCHUP']);ts=[]
  for r in rs:
   t={k:r[v] for k,v in {'pts':'PTS','fgm':'FGM','fga':'FGA','tpm':'FG3M','tpa':'FG3A','ftm':'FTM','fta':'FTA','orb':'OREB','drb':'DREB','totalTurnovers':'TOV','pf':'PF'}.items()};t['estimatedPossessions']=t['fga']-t['orb']+t['totalTurnovers']+.44*t['fta'];ts.append(t)
  gs.append({'a':rs[0]['TEAM_ID'],'b':rs[1]['TEAM_ID'],'score':[t['pts'] for t in ts],'totals':ts})
 ms=[abs(g['score'][0]-g['score'][1]) for g in gs];ts=[t for g in gs for t in g['totals']];out={'games':len(gs),'points':st.mean(t['pts'] for t in ts),'meanMargin':st.mean(ms),'medianMargin':st.median(ms),'homeWin%':100*st.mean(g['score'][0]>g['score'][1] for g in gs),'3P%':100*sum(t['tpm'] for t in ts)/sum(t['tpa'] for t in ts)}
 for n in [20,30,40,50]:out['blow'+str(n)]=100*st.mean(m>=n for m in ms)
 for a,b in [(1,5),(6,10),(11,19)]:out[f'margin{a}-{b}']=100*st.mean(a<=m<=b for m in ms)
 tot=lambda k:sum(t[k]for t in ts)
 for k in ['fga','fta','orb','pf']:out[k]=tot(k)/len(ts)
 out['totalTov']=tot('totalTurnovers')/len(ts);out['estimatedPoss']=tot('estimatedPossessions')/len(ts);out['estimatedORtg']=100*tot('pts')/tot('estimatedPossessions');out['FG%']=100*tot('fgm')/tot('fga');out['eFG%']=100*(tot('fgm')+.5*tot('tpm'))/tot('fga');out['TS%']=100*tot('pts')/(2*(tot('fga')+.44*tot('fta')));out['OT%']=100*st.mean(r['MIN']>(200 if 'wnba' in str(path) else 240)for r in rows)
 return {'aggregate':out,**efficiency(gs)}
refs={}
for l,year,p in [('nba',2025,'dev/phase3/real-nba-2025.json'),('nba',2024,'dev/phase4/real-nba-2023-24.json'),('wnba',2024,'dev/phase3/real-wnba-2024.json'),('wnba',2023,'dev/phase4/real-wnba-2023.json')]:refs[f'{l}-{year}']=official(p)
(root/'reference-analysis.json').write_text(json.dumps(refs,indent=2))
controls={}
for p in root.glob('*-*.json'):
 try:r=json.load(open(p))
 except:continue
 if not isinstance(r,dict) or r.get('fixtureVersion')!=4:continue
 gs=r['games'];ds=[g['score'][0]-g['score'][1] for g in gs];ts=[t for g in gs for t in g['totals']];m={'n':len(gs),'meanHomeMargin':st.mean(ds),'meanMargin':st.mean(map(abs,ds)),'marginSD':st.pstdev(ds),'absoluteMarginSD':st.pstdev(map(abs,ds)),'homeWin%':100*st.mean(d>0 for d in ds),'points':st.mean(t['pts'] for t in ts),'FG%':100*sum(t['fgm'] for t in ts)/sum(t['fga'] for t in ts),'3P%':100*sum(t['tpm'] for t in ts)/sum(t['tpa'] for t in ts),'close10%':100*st.mean(abs(d)<=10 for d in ds),'rawSlots':st.mean(t['poss'] for t in ts),'PF':st.mean(t['pf'] for t in ts),'TOV':st.mean(t['tov'] for t in ts)}
 for n in [20,30,40]:m['blow'+str(n)]=100*st.mean(abs(d)>=n for d in ds)
 for key in ['pf','tov','fga','fgm','pts','stamina']:m[key+'HomeAway']=[st.mean(g['totals'][s][key] for g in gs) for s in [0,1]]
 controls[p.stem]=m
(root/'controlled-summary.json').write_text(json.dumps(controls,indent=2))
paired={}
for name in controls:
 variant,league,scenario=name.split('-',2)
 ref=('baseline-'+league+'-'+scenario) if variant=='candidate' else 'baseline-'+league+'-neutral'
 if ref==name or ref not in controls:continue
 aa=json.load(open(root/(name+'.json')))['games'];bb=json.load(open(root/(ref+'.json')))['games']
 ds=[abs(a['score'][0]-a['score'][1])-abs(b['score'][0]-b['score'][1])for a,b in zip(aa,bb)];mu=st.mean(ds);h=1.96*st.stdev(ds)/len(ds)**.5
 paired[name]={'reference':ref,'n':len(ds),'meanMarginDelta':mu,'CI95':[mu-h,mu+h]}
(root/'controlled-comparisons.json').write_text(json.dumps(paired,indent=2))

summary={}
for l in ['nba','wnba']:
 summary[l]={}
 for phase in ['phase3','phase4']:
  paths=[pathlib.Path(f'dev/balance-audit/{phase}-{l}-{seed}.json') for seed in range(101,111)];paths=[p for p in paths if p.exists()];runs=[json.load(open(p)) for p in paths]
  if not runs:continue
  gs=[{**g,'seed':r['seed']} for r in runs for g in r['games']];m=metrics(gs);by=[metrics(r['games']) for r in runs];ci={}
  if len(by)>1:
   for k in ['points','meanMargin','blow20','blow30','blow40','blow50','homeWin%','3P%','MAE']:
    v=[r[k] for r in by];h=2.262*st.stdev(v)/len(v)**.5;ci[k]=[st.mean(v)-h,st.mean(v)+h]
  q={}
  for count in [2,3,4]:q['marginAfter'+str(count)]=dist(abs(sum(p[0]-p[1] for p in g['periodScores'][:count])) for g in gs)
  q['q4ScoreCorrelation']=float(np.corrcoef([g['periodScores'][3][0] for g in gs],[g['periodScores'][3][1] for g in gs])[0,1]);q['benchMinutes']=st.mean(t['benchMinutes'] for g in gs for t in g['totals']);q['garbageGames%']=100*st.mean(g['garbage']>0 for g in gs)
  q['q4Margins']=[]
  for lo,hi in [(0,5),(5,10),(10,20),(20,30),(30,1000)]:
   group=[g for g in gs if lo<=abs(sum(p[0]-p[1] for p in g['periodScores'][:3]))<hi]
   if not group:continue
   q['q4Margins'].append({'entering':[lo,hi],'n':len(group),'finalMean':st.mean(abs(g['score'][0]-g['score'][1]) for g in group),'trailerWin%':100*st.mean(sum(p[0]-p[1] for p in g['periodScores'][:3])*(g['score'][0]-g['score'][1])<0 for g in group)})
  summary[l][phase]={'aggregate':m,'bySeed':by,'seedCI95':ci,'efficiency':efficiency(gs),'development':q}
for l,v in summary.items():
 if 'phase4' not in v or len(v['phase4']['bySeed'])!=10:continue
 v['pairedSeasonChangeCI95']={}
 for k in ['points','meanMargin','blow20','blow30','blow40','blow50','homeWin%','3P%','MAE']:
  ds=[b[k]-a[k]for a,b in zip(v['phase3']['bySeed'],v['phase4']['bySeed'])];mu=st.mean(ds);h=2.262*st.stdev(ds)/len(ds)**.5;v['pairedSeasonChangeCI95'][k]={'delta':mu,'CI95':[mu-h,mu+h]}
(root/'summary.json').write_text(json.dumps(summary,indent=2));print('Analyzed',[(l,p,r['aggregate']['games'])for l,v in summary.items()for p,r in v.items()if 'aggregate' in r])
