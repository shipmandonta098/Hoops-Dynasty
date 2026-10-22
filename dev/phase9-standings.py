import json,collections,numpy as np,pathlib
P=pathlib.Path('dev/phase9')
def summary(rows):
 a=np.array([x['wins']/x['games']for x in rows]);wins=np.array([x['wins']for x in rows]);return {'teams':len(a),'winPctSD_pp':float(np.std(a)*100),'minPct':float(a.min()*100),'maxPct':float(a.max()*100),'p10':float(np.quantile(a,.1)*100),'p90':float(np.quantile(a,.9)*100),'minWins':int(wins.min()),'maxWins':int(wins.max()),'teams60plus':int(sum(wins>=60)),'teams25orFewer':int(sum(wins<=25))}
real=[]
for season,path in [('2024-25','dev/phase3/real-nba-2025.json'),('2023-24','dev/phase4/real-nba-2023-24.json')]:
 r=json.load(open(path))['resultSets'][0];teams={}
 for row in r['rowSet']:
  x=dict(zip(r['headers'],row));t=teams.setdefault(x['TEAM_ID'],{'name':x['TEAM_NAME'],'wins':0,'games':0});t['games']+=1;t['wins']+=x['WL']=='W'
 assert len(teams)==30 and all(t['games']==82 for t in teams.values())and sum(t['wins']for t in teams.values())==1230
 real.append({'season':season,**summary(list(teams.values())),'standings':sorted(teams.values(),key=lambda x:-x['wins'])})
sim=[]
for seed in range(101,106):
 gs=json.load(open(f'dev/balance-audit/phase8-nba-{seed}.json'))['games'];teams={}
 for g in gs:
  for side,id in enumerate([g['a'],g['b']]):
   t=teams.setdefault(id,{'id':id,'wins':0,'games':0,'initialStrength':g['strengths'][side]});t['wins']+=g['score'][side]>g['score'][1-side];t['games']+=1
 rows=list(teams.values());assert len(rows)==30 and all(x['games']==82 for x in rows)
 sim.append({'seed':seed,**summary(rows),'initialOVRWinCorrelation':float(np.corrcoef([x['initialStrength']for x in rows],[x['wins']for x in rows])[0,1]),'standings':sorted(rows,key=lambda x:-x['wins'])})
matched=[]
for seed in [101,102]:
 teams={}
 for g in json.load(open(f'dev/balance-audit/phase7-nba-{seed}.json'))['games']:
  for side,id in enumerate([g['a'],g['b']]):
   t=teams.setdefault(id,{'wins':0,'games':0});t['games']+=1;t['wins']+=g['score'][side]>g['score'][1-side]
 matched.append({'seed':seed,'phase7':summary(list(teams.values())),'phase8':next(x for x in sim if x['seed']==seed)['winPctSD_pp']})
o={'matchedPhase7Seeds':matched,'real':real,'simulation':sim,'simulationMeanSD_pp':float(np.mean([x['winPctSD_pp']for x in sim])),'simulationSDRange_pp':[min(x['winPctSD_pp']for x in sim),max(x['winPctSD_pp']for x in sim)]}
(P/'standings.json').write_text(json.dumps(o,indent=2));print(json.dumps({**{x['season']:{k:v for k,v in x.items()if k!='standings'}for x in real},'sim':[{k:v for k,v in x.items()if k!='standings'}for x in sim],'meanSD':o['simulationMeanSD_pp']},indent=2))
