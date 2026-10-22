import pathlib,json,statistics as st,collections,random,math
P=pathlib.Path('dev/phase13')
def season(path):
 d=json.load(open(path));games=d['games'];teams=collections.defaultdict(list)
 for g in games:
  for i,t in enumerate([g['a'],g['b']]):teams[t].append(g['score'][i]-g['score'][1-i])
 margins=[abs(g['score'][0]-g['score'][1])for g in games];close=[g for g in games if abs(g['late']['at60'][0]-g['late']['at60'][1])<=6]
 counts={k:sum(g['audit'][k]for g in games)for k in games[0]['audit']};counts['FGA']=sum(t['fga']for g in games for t in g['totals']);counts['closeGames']=len(close);counts['closeFinal60Starts']=sum(g['audit']['final60Starts']for g in close)
 return {'seed':d['seed'],'league':d['league'],'games':len(games),'meanMargin':st.mean(margins),'blow20Pct':100*st.mean(m>=20 for m in margins),'within5Pct':100*st.mean(m<=5 for m in margins),'otPct':100*st.mean(g['ot']for g in games),'teamMarginSD':st.pstdev(st.mean(v)for v in teams.values()),'transitionOpportunityPct':100*counts['transitionPossessions']/counts['possessions'],'fastbreakFGAPct':100*counts['fastbreakFGA']/counts['FGA'],'final60Possessions':counts['closeFinal60Starts']/len(close)if close else None,'counts':counts,'teamMeanMargins':{str(t):st.mean(v)for t,v in teams.items()}}
def combine(rows):
 counts={k:sum(r['counts'][k]for r in rows)for k in rows[0]['counts']};n=sum(r['games']for r in rows)
 a={k:sum(r[k]*r['games']for r in rows)/n for k in ['meanMargin','blow20Pct','within5Pct','otPct']};a['teamMarginSD']=st.mean(r['teamMarginSD']for r in rows);a['transitionOpportunityPct']=100*counts['transitionPossessions']/counts['possessions'];a['fastbreakFGAPct']=100*counts['fastbreakFGA']/counts['FGA'];a['final60Possessions']=counts['closeFinal60Starts']/counts['closeGames'];return {'seasons':len(rows),'games':n,**a,'counts':counts}
def summarize(label,league):
 rows=[season(p)for p in sorted(P.glob(f'{label}-{league}-*.json'))]
 if not rows:return None
 pooled=combine(rows);out={'pooled':pooled,'seedRange':{k:[min(r[k]for r in rows),max(r[k]for r in rows)]for k in ['meanMargin','blow20Pct','within5Pct','otPct','teamMarginSD','transitionOpportunityPct','fastbreakFGAPct','final60Possessions']},'perSeed':rows}
 if len(rows)>=2:
  rng=random.Random(130013);boot=[combine(rng.choices(rows,k=len(rows)))for _ in range(4000)]
  out['seedBootstrapCI95']={k:[sorted(x[k]for x in boot)[100],sorted(x[k]for x in boot)[3899]]for k in out['seedRange']}
 return out
if __name__=='__main__':
 out={}
 for label in ['calbaseline','cal135','cal140','cal145','cal160','cal175','holdout']:
  for league in ['nba','wnba']:
   s=summarize(label,league)
   if s:out[f'{label}-{league}']=s;print(label,league,json.dumps(s['pooled']), 'SD range',s['seedRange']['teamMarginSD'])
 (P/'results.json').write_text(json.dumps(out,indent=2))
