import json,pathlib,re,collections,numpy as np
P=pathlib.Path('dev/phase10');allposs=[];checks=[];tables={60:collections.defaultdict(lambda:[0,0,0]),30:collections.defaultdict(lambda:[0,0,0])}
for path in sorted(pathlib.Path('dev/phase6/reference-pbp').glob('nba-*.json')):
 ev=json.load(open(path))['game']['actions'];pos=[];cur=None;score=[0,0];admin=0;period=0;timeline=[];errors=[]
 def close():
  global cur
  if cur is not None:pos.append(cur);cur=None
 def owner(team):
  global cur
  if cur is not None and cur['team']!=team:close()
  if cur is None:cur={'team':team,'points':0}
 for e in ev:
  typ=e['actionType'].lower();team=e['teamId'];desc=e.get('description','').lower();p=e['period'];clock=e['clock'];m=re.match(r'PT(\d+)M([\d.]+)S',clock);remain=60*int(m[1])+float(m[2]);sec=(p-1)*720+720-remain if p<=4 else 2880+(p-5)*300+300-remain
  if p!=period:close();period=p
  new=[int(e.get('scoreHome')or score[0]),int(e.get('scoreAway')or score[1])];delta=sum(new)-sum(score)
  if delta<0:errors.append('score correction')
  if typ in ['made shot','missed shot','free throw','turnover']:
   technical=typ=='free throw' and ('technical' in desc or 'defensive 3' in desc)
   if technical:admin+=delta
   else:
    owner(team);cur['points']+=delta
    if typ=='turnover':close()
  elif typ=='rebound' and team:
   # Defensive rebound switches control; offensive rebound continues possession.
   owner(team)
  elif delta:errors.append('unclassified score')
  score=new;timeline.append((sec,p,score.copy()))
  if typ=='period' and e.get('subType')=='end':close()
 close()
 valid=not errors and sum(x['points']for x in pos)+admin==sum(score)
 checks.append({'file':path.name,'valid':valid,'errors':errors,'points':sum(score),'accounted':sum(x['points']for x in pos)+admin,'administrativeFT':admin,'possessions':len(pos)})
 if valid:allposs.extend(x['points']for x in pos)
 ot=max(e['period']for e in ev)>4
 for checkpoint in [60,30]:
  s=[0,0]
  for sec,p,sc in timeline:
   if p<=4 and sec<=2880-checkpoint:s=sc
  diff=s[0]-s[1]
  if diff==0:bucket='tie';out=0 if ot else 1 # regulation home/away wins split for ties
  else:bucket=str(abs(diff))if abs(diff)<=6 else '7+';trailer=0 if diff<0 else 1;out=0 if ot else 1 if score[trailer]>score[1-trailer]else 2
  tables[checkpoint][bucket][out]+=1
vals=np.array(allposs);out={'games':len(checks),'validatedGames':sum(c['valid']for c in checks),'possessions':len(vals),'mean':float(vals.mean()),'variance':float(vals.var()),'distribution':{str(i)if i<4 else'4+':float(np.mean(vals==i if i<4 else vals>=4)*100)for i in range(5)},'checks':checks,'transitionTables':{str(k):dict(v)for k,v in tables.items()},'method':'Reconstructed from retained official PBP: offensive event or rebound control switches; offensive rebounds retained; consecutive same-team made FG and FT retained; technical FT excluded as administrative points; period endings close control. Not official Synergy possession segmentation; team rebounds and retained-ball violations can differ.'}
(P/'real-possession-summary.json').write_text(json.dumps(out,indent=2));print({k:v for k,v in out.items()if k not in ['checks','transitionTables']})
