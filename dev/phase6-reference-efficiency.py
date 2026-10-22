import json,pathlib,collections,numpy as np
out={}
for league,source in [('nba','dev/phase3/real-nba-2025.json'),('wnba','dev/phase3/real-wnba-2024.json')]:
 r=json.load(open(source))['resultSets'][0];games=collections.defaultdict(list)
 for v in r['rowSet']:
  row=dict(zip(r['headers'],v));games[row['GAME_ID']].append(row)
 real=[]
 for id,rows in games.items():
  rows.sort(key=lambda x:' @ 'in x['MATCHUP']);p=[r['FGA']+.44*r['FTA']-r['OREB']+r['TOV']for r in rows];rating=[100*r['PTS']/p[i]for i,r in enumerate(rows)];real.append({'id':id,'poss':p,'ratings':rating,'gap':rating[0]-rating[1]})
 sim=[g for seed in range(101,111)for g in json.load(open(f'dev/balance-audit/phase5-{league}-{seed}.json'))['games']];sg=[100*g['score'][0]/g['totals'][0]['estimatedPossessions']-100*g['score'][1]/g['totals'][1]['estimatedPossessions']for g in sim]
 out[league]={'realN':len(real),'simN':len(sim),'realMeanAbsoluteEfficiencyGap':float(np.mean([abs(g['gap'])for g in real])),'simMeanAbsoluteEfficiencyGap':float(np.mean(np.abs(sg))),'realEfficiencyGapSD':float(np.std([g['gap']for g in real])),'simEfficiencyGapSD':float(np.std(sg)),'games':real,'definition':'100*points/(FGA+0.44*FTA-OREB+team turnovers); full games including overtime, not official possession count'}
pathlib.Path('dev/phase6/reference-efficiency.json').write_text(json.dumps(out,indent=2))
print({l:{k:v for k,v in r.items()if k!='games'}for l,r in out.items()})
