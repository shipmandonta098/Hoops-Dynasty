import json,re,pathlib,statistics as st
P=pathlib.Path('dev/phase11'); checked=json.load(open('dev/phase10/real-possession-summary.json')); valid={x['file'] for x in checked['checks'] if x['valid']}; games=[]
for path in sorted(pathlib.Path('dev/phase6/reference-pbp').glob('nba-*.json')):
 if path.name not in valid:continue
 ev=json.load(open(path))['game']['actions'];score=[0,0];cur=None;poss=[];checkpoint=None;ties=[];ambiguous=0
 def close(t,reason):
  global cur
  if cur is not None:
   cur.update(end=t,reason=reason);poss.append(cur);cur=None
 def begin(team,t):
  global cur,ambiguous
  if cur and cur['team']!=team:
   close(t,'inferred change');ambiguous+=1
  if cur is None:cur={'team':team,'start':t,'before':score.copy(),'shots':[]}
 # Resolve ownership from explicit scoring, rebound and turnover events. Dead-ball time consumes zero game clock.
 ids=list(dict.fromkeys(e['teamId'] for e in ev if e['teamId']));sideByTeam={e['teamId']:(0 if e.get('location')=='h' else 1) for e in ev if e['teamId'] and e.get('location') in ['h','v']}
 def opponent(team):return next((x for x in ids if x!=team),None)
 for idx,e in enumerate(ev):
  if e['period']!=4:continue
  m=re.match(r'PT(\d+)M([\d.]+)S',e['clock']);rem=60*int(m[1])+float(m[2]);t=720-rem
  if rem<60 and checkpoint is None:checkpoint=score.copy()
  typ=e['actionType'].lower();team=e['teamId'];desc=e.get('description','').lower();new=[int(e.get('scoreHome')or score[0]),int(e.get('scoreAway')or score[1])]
  if typ in ['made shot','missed shot','turnover','free throw']:
   admin='technical' in desc or 'defensive 3' in desc
   if not admin:
    begin(team,t)
    if typ in ['made shot','missed shot']:cur['shots'].append({'time':t,'before':score.copy(),'made':typ=='made shot'})
    if typ=='turnover':close(t,'turnover');score=new;begin(opponent(team),t)
    elif typ=='made shot':
     following=[x for x in ev[idx+1:idx+8] if x['period']==4 and x['actionType'].lower() not in ['substitution','timeout','instant replay']]
     andone=any(x['actionType'].lower()=='free throw' and x['teamId']==team and '1 of 1' in x.get('description','').lower() and x['clock']==e['clock'] for x in following)
     if not andone:close(t,'made FG');score=new;begin(opponent(team),t)
    elif typ=='free throw':
     ft=re.search(r'(\d) of (\d)',desc)
     if ft and ft[1]==ft[2] and not desc.startswith('miss') and 'flagrant' not in desc and 'clear path' not in desc:
      close(t,'last made FT');score=new;begin(opponent(team),t)
  elif typ=='rebound':
   owner=team or (e.get('personId') if e.get('personId') in ids else None)
   if owner and cur and owner!=cur['team']:close(t,'defensive rebound');begin(owner,t)
   elif owner:begin(owner,t)
  elif typ=='period' and e.get('subType')=='end':close(t,'period')
  score=new
 close(720,'period');checkpoint=checkpoint or score
 games.append({'file':path.name,'at60':checkpoint,'ot':max(e['period'] for e in ev)>4,'possessions':poss,'ambiguousChanges':ambiguous,'sideByTeam':sideByTeam})
closegames=[g for g in games if abs(g['at60'][0]-g['at60'][1])<=6]
starts=[p for g in closegames for p in g['possessions'] if 660<=p['start']<720]
complete=[p for p in starts if p['reason'] not in ['period','inferred change'] and p['end']>p['start'] and p['end']<720]
tied=[p for g in closegames for p in g['possessions'] if 696<=p['start']<716 and p['before'][0]==p['before'][1] and p['shots']]
result={'sourceGames':len(games),'closeGames':len(closegames),'definition':'absolute margin <=6 at 60 seconds, regulation only; starts in final60; durations exclude incomplete/zero-clock possessions','meanStartsFinal60':st.mean(sum(660<=p['start']<720 for p in g['possessions']) for g in closegames),'completedDurationsN':len(complete),'meanDuration':st.mean(p['end']-p['start'] for p in complete),'medianDuration':st.median(p['end']-p['start'] for p in complete),'tiedUnder24WithShot':len(tied),'tiedLastShotUnder4':sum(p['shots'][0]['time']>=716 for p in tied),'games':games}
result['durationByState']={}
for label in ['tied','leading','trailing']:
 vals=[]
 for g in closegames:
  for p in g['possessions']:
   if p not in complete:continue
   side=g['sideByTeam'].get(p['team']);margin=p['before'][side]-p['before'][1-side] if side is not None else None
   if margin is not None and ('tied' if margin==0 else 'leading' if margin>0 else 'trailing')==label:vals.append(p['end']-p['start'])
 result['durationByState'][label]={'n':len(vals),'mean':st.mean(vals)if vals else None}
(P/'real-timing.json').write_text(json.dumps(result));print({k:v for k,v in result.items() if k!='games'})
