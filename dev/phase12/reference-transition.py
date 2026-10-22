import json,pathlib,collections
P=pathlib.Path('dev/phase12');paths=list(pathlib.Path('dev/phase6/reference-pbp').glob('wnba*.json'))+list((P/'reference-pbp').glob('*.json'));years=collections.defaultdict(list)
for f in paths:
 d=json.load(open(f));gid=d['game']['gameId'];year=2000+int(gid[3:5]);ev=d['game']['actions'];pos=[];cur=None;period=0;score=[0,0];admin=0;errors=[];fga=fbfga=0
 def close():
  global cur
  if cur is not None:pos.append(cur);cur=None
 def owner(team):
  global cur
  if cur is not None and cur['team']!=team:close()
  if cur is None:cur={'team':team,'points':0,'fastbreak':False}
 for e in ev:
  typ=e.get('actionType','').lower().replace(' ','');team=e.get('teamId');desc=e.get('description','').lower();p=e['period'];qual=[q.lower()for q in e.get('qualifiers',[])];new=[int(e.get('scoreHome')or score[0]),int(e.get('scoreAway')or score[1])];delta=sum(new)-sum(score)
  if delta<0:errors.append('score correction')
  if p!=period:close();period=p
  if e.get('isFieldGoal'):fga+=1;fbfga+=('fastbreak'in qual)
  if typ in ['2pt','3pt','madeshot','missedshot','freethrow','turnover']:
   if typ=='freethrow' and ('technical'in desc or 'defensive 3'in desc):admin+=delta
   elif team:
    owner(team);cur['points']+=delta;cur['fastbreak']|=('fastbreak'in qual)
    if typ=='turnover':close()
  elif typ=='rebound' and team:owner(team)
  elif delta:errors.append('unclassified score')
  score=new
  if typ=='period' and e.get('subType')=='end':close()
 close();valid=not errors and sum(x['points']for x in pos)+admin==sum(score)
 years[year].append({'gameId':gid,'file':str(f),'valid':valid,'errors':errors,'FGA':fga,'fastbreakFGA':fbfga,'reconstructedPossessions':len(pos),'taggedPossessions':sum(x['fastbreak']for x in pos)})
out={'method':'Official CDN fastbreak qualifier on field-goal attempts: fastbreakFGA/allFGA. Also tagged-possession proxy: at least one official fastbreak shot/FT tag within offensive-control sequence; offensive events and rebounds establish control, opponent control or turnover or period end closes sequence, offensive rebounds retained, technical FT excluded. This proxy is NOT Synergy Transition frequency: different tagging and segmentation, untagged early turnovers may be missed. Simulation transition opportunity frequency must not be declared calibrated against this as if definitions were identical. 2022/2023/2025 use 20 evenly spaced regular-season game IDs; 2024 uses retained 40-game convenience sample.','seasons':[]}
for y,g in sorted(years.items()):
 valid=[x for x in g if x['valid']];s={k:sum(x[k]for x in valid)for k in ['FGA','fastbreakFGA','reconstructedPossessions','taggedPossessions']};out['seasons'].append({'season':y,'games':len(g),'validatedGames':len(valid),**s,'fastbreakFGAPct':100*s['fastbreakFGA']/s['FGA']if s['FGA']else None,'taggedPossessionPct':100*s['taggedPossessions']/s['reconstructedPossessions']if s['reconstructedPossessions']else None,'checks':g})
(P/'reference-transition-summary.json').write_text(json.dumps(out,indent=2));print([{k:v for k,v in s.items()if k!='checks'}for s in out['seasons']])
