import json,pathlib,statistics as st,collections,hashlib
P=pathlib.Path('dev/phase13')
def save(name,x): (P/name).write_text(json.dumps(x,indent=2))
files={'wnba':{2022:'dev/phase12/reference-gamelog-2022.json',2023:'dev/phase4/real-wnba-2023.json',2024:'dev/phase3/real-wnba-2024.json',2025:'dev/phase12/reference-gamelog-2025.json'},'nba':{2024:'dev/phase4/real-nba-2023-24.json',2025:'dev/phase3/real-nba-2025.json'}}
refs={}
for league,years in files.items():
 refs[league]=[]
 for y,f in years.items():
  raw=json.load(open(f));rs=raw['resultSets'][0];rows=[dict(zip(rs['headers'],r))for r in rs['rowSet']];teams=collections.defaultdict(list);games=collections.defaultdict(list)
  for r in rows:teams[r['TEAM_ID']].append(r['PLUS_MINUS']);games[r['GAME_ID']].append(r)
  assert all(len(g)==2 and g[0]['PLUS_MINUS']==-g[1]['PLUS_MINUS'] for g in games.values())
  margins=[abs(g[0]['PLUS_MINUS'])for g in games.values()];o={'season':y,'games':len(games),'meanMargin':st.mean(margins),'blow20Pct':100*st.mean(m>=20 for m in margins),'within5Pct':100*st.mean(m<=5 for m in margins),'otPct':100*st.mean(g[0]['MIN']>(200 if league=='wnba'else 240)for g in games.values()),'teamMarginSD':st.pstdev(st.mean(m)for m in teams.values()),'source':f,'sha256':hashlib.sha256(pathlib.Path(f).read_bytes()).hexdigest()};refs[league].append(o)
save('real-seasons.json',refs)
valid={x['file']for x in json.load(open('dev/phase10/real-possession-summary.json'))['checks']if x['valid']}
nbafiles=[p for p in sorted(pathlib.Path('dev/phase6/reference-pbp').glob('nba-*.json'))if p.name in valid]
assert len(nbafiles)==134
wnbafiles=sorted(pathlib.Path('dev/phase6/reference-pbp').glob('wnba*.json'))+sorted(pathlib.Path('dev/phase12/reference-pbp').glob('*.json'))
trans={}
for league,paths in [('nba',nbafiles),('wnba',wnbafiles)]:
 games=[]
 for original in paths:
  p=(P/'nba-tagged-pbp'/original.name)if league=='nba'else original
  d=json.load(open(p));ev=d['game']['actions'];assert all('qualifiers'in e for e in ev if e.get('isFieldGoal')),str(p);fga=[e for e in ev if e.get('isFieldGoal')];fb=[e for e in fga if 'fastbreak'in [q.lower()for q in e.get('qualifiers',[])]]
  legacy=json.load(open(original))['game']['actions'];final=lambda events:next((int(e['scoreHome']),int(e['scoreAway']))for e in reversed(events)if e.get('scoreHome')and e.get('scoreAway'));legacyFGA=sum(bool(e.get('isFieldGoal'))for e in legacy)
  games.append({'legacyFile':str(original),'legacyFGA':legacyFGA,'FGAChangeFromLegacy':len(fga)-legacyFGA,'scoreMatchesRetained':final(ev)==final(legacy),'taggedFinalScore':final(ev),'retainedFinalScore':final(legacy),'file':str(p),'gameId':d['game']['gameId'],'FGA':len(fga),'fastbreakFGA':len(fb),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()})
 total=sum(g['FGA']for g in games);n=sum(g['fastbreakFGA']for g in games);trans[league]={'games':len(games),'FGA':total,'fastbreakFGA':n,'fastbreakFGAPct':100*n/total,'rows':games,'scoreMatchingSensitivity':{'games':sum(g['scoreMatchesRetained']for g in games),'fastbreakFGAPct':100*sum(g['fastbreakFGA']for g in games if g['scoreMatchesRetained'])/sum(g['FGA']for g in games if g['scoreMatchesRetained'])}}
rs=json.load(open('dev/phase10/real-transition.json'))['resultSets'][0];sy=[dict(zip(rs['headers'],r))for r in rs['rowSet']]
trans['synergyNBA']={'season':'2024-25','teams':len(sy),'meanTeamTransitionPossPct':100*st.mean(r['POSS_PCT']for r in sy),'estimatedPooledPossPct':100*sum(r['POSS']for r in sy)/sum(r['POSS']/r['POSS_PCT']for r in sy),'note':'Pooled denominator inferred from team POSS / rounded POSS_PCT, hence approximate. Full-season Synergy play-type share differs from the 134-game CDN fastbreak-FGA sample and denominator; not a conversion factor.','source':'dev/phase10/real-transition.json'}
save('real-transition.json',trans)
# Reuse the accepted Phase 11 possession reconstruction, normalize the two official PBP schemas.
base=pathlib.Path('dev/phase11/reference-timing.py').read_text()
for league,paths in [('nba',nbafiles),('wnba',wnbafiles)]:
 code=base.replace("for path in sorted(pathlib.Path('dev/phase6/reference-pbp').glob('nba-*.json')):","for path in INPUT_PATHS:")
 code=code.replace(" if path.name not in valid:continue\n",'')
 code=code.replace("ev=json.load(open(path))['game']['actions'];", "ev=json.load(open(path))['game']['actions'];normalize(ev);")
 code=code.replace("(P/'real-timing.json').write_text(json.dumps(result));print({k:v for k,v in result.items() if k!='games'})",'')
 if league=='wnba':
  code=code.replace('720','600').replace('660','540').replace('696','576').replace('716','596')
 def normalize(ev):
  for e in ev:
   t=e.get('actionType','').lower().replace(' ','')
   if t in ['2pt','3pt']:e['actionType']='made shot'if e.get('shotResult','').lower()=='made'else'missed shot'
   elif t=='freethrow':e['actionType']='free throw'
   elif t=='instantreplay':e['actionType']='instant replay'
   e.setdefault('teamId',0)
 ns={'INPUT_PATHS':paths,'normalize':normalize};exec(code,ns);res=ns['result'];save(f'real-timing-{league}.json',res)
 print(league,'timing',{k:v for k,v in res.items()if k not in ['games','durationByState']})
print('SEASONS',refs)
print('TRANSITION',{k:{x:y for x,y in v.items()if x!='rows'}for k,v in trans.items()})
