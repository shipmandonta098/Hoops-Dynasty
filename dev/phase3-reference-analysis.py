import json,glob,statistics as st,collections,pathlib
root=pathlib.Path('dev/phase3');out={}
for league,year in [('nba',2025),('wnba',2024)]:
 j=json.loads((root/f'real-{league}-{year}.json').read_text())['resultSets'][0];rows=[dict(zip(j['headers'],v)) for v in j['rowSet']];games=collections.defaultdict(list)
 for r in rows:games[r['GAME_ID']].append(r)
 assert len(games)==(1230 if league=='nba' else 240) and all(len(x)==2 for x in games.values())
 assert all(x[0]['PTS']-x[1]['PTS']==x[0]['PLUS_MINUS'] for x in games.values())
 metrics={}
 for k,fn in {'FG':lambda r:r['FGM']/r['FGA'],'2P':lambda r:(r['FGM']-r['FG3M'])/(r['FGA']-r['FG3A']),'3P':lambda r:r['FG3M']/r['FG3A'],'eFG':lambda r:(r['FGM']+.5*r['FG3M'])/r['FGA'],'TS':lambda r:r['PTS']/(2*(r['FGA']+.44*r['FTA']))}.items():
  a=sorted(fn(r)*100 for r in rows);metrics[k]={'mean':st.mean(a),'sd':st.pstdev(a),'p10':a[int((len(a)-1)*.1)],'p90':a[int((len(a)-1)*.9)]}
 c=collections.Counter();validated=[]
 for f in sorted((root/'reference-pbp').glob(league+'-*.json')):
  j=json.loads(f.read_text())['game'];a=j['actions'];gid=j['gameId'];assert gid in games
  last=next(x for x in reversed(a) if str(x.get('scoreHome','')).isdigit() and str(x.get('scoreAway','')).isdigit());assert sorted([int(last['scoreHome']),int(last['scoreAway'])])==sorted(x['PTS'] for x in games[gid]);validated.append(gid)
  for x in a:
   if x['actionType'] in ['2pt','3pt']:c[x['actionType']+'FGA']+=1
   if x['actionType']=='foul' and x.get('descriptor')=='shooting':
    c['shooting']+=1
    for q in x.get('qualifiers',[]):
     if 'freethrow' in q:c[q]+=1
 out[league]={'games':len(games),'teamGames':len(rows),'metrics':metrics,'meanMargin':st.mean(abs(r['PLUS_MINUS']) for r in rows),'ppg':st.mean(r['PTS'] for r in rows),'pbpGames':validated,'foulCounts':dict(c),'ftMadeDifferenceSD':st.pstdev(g[0]['FTM']-g[1]['FTM'] for g in games.values())}
(root/'reference-analysis.json').write_text(json.dumps(out,indent=2));print('PASS official complete game-log counts, score margins and 40 sampled PBP final scores')
