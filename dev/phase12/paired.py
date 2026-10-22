import json,gzip,pathlib,statistics as st,math,random
P=pathlib.Path('dev/phase12');out={}
for league,world,a,b in [('nba',714,'baseline','pace'),('wnba',713,'port','hq'),('wnba',713,'hq','pace')]:
 pa,pb=[P/f'{x}-{league}-league-{world}.json.gz'for x in [a,b]]
 if not pa.exists()or not pb.exists():continue
 xs,ys=[json.load(gzip.open(p))['games']for p in [pa,pb]];end=2880 if league=='nba'else 2400
 def sc(g):
  s=[s for s in g['slots']if s['start']<=end-60][-1];v=s['before']
  for e in s['events']:
   if e['timeMs']<=(end-60)*1000:v=e['score']
  return v
 dif=[];same=0;counts=[0,0]
 for x,y in zip(xs,ys):
  assert x['seed']==y['seed'];sx,sy=sc(x),sc(y);same+=sx==sy
  if sx==sy and abs(sx[0]-sx[1])<=6:dif.append(sum(s['start']>=end-60 for s in y['slots'])-sum(s['start']>=end-60 for s in x['slots']))
  counts[0]+=not x['ot']and y['ot'];counts[1]+=x['ot']and not y['ot']
 n=len(xs);d=(counts[0]-counts[1])/n;se=math.sqrt(max(0,(sum(counts)/n-d*d)/n))
 out[f'{league}-{a}-{b}']={'n':n,'sameScoreAt60':same,'pairedCloseN':len(dif),'startsDifference':st.mean(dif)if dif else None,'startsDifferenceCI95':[st.mean(dif)+q*st.stdev(dif)/math.sqrt(len(dif))for q in [-1.96,1.96]]if len(dif)>1 else None,'OTGained':counts[0],'OTLost':counts[1],'OTdifferencePP':100*d,'OTdifferenceCI95pp':[100*(d-1.96*se),100*(d+1.96*se)]}
for a,b in [('port','hq')]:
 paths=[P/f'endings-wnba-{x}-accepted.json'for x in [a,b]]
 if not all(p.exists()for p in paths):continue
 left,right=[{r['name']:r for r in json.load(open(p))}for p in paths]
 for k in left.keys()&right.keys():
  x,y=left[k]['samples'],right[k]['samples'];n=len(x);up=sum(not a['ot']and b['ot']for a,b in zip(x,y));down=sum(a['ot']and not b['ot']for a,b in zip(x,y));d=(up-down)/n;se=math.sqrt(max(0,((up+down)/n-d*d)/n))
  out['tie-'+k]={'n':n,'OTGained':up,'OTLost':down,'OTdifferencePP':100*d,'OTdifferenceCI95pp':[100*(d-1.96*se),100*(d+1.96*se)]}
(P/'paired-results.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
