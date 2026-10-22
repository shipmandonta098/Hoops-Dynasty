import json,gzip,pathlib,statistics as st,math,random
P=pathlib.Path('dev/phase12')
def timing(path):
 x=json.load(gzip.open(path));end=2880 if x['league']=='nba' else 2400;close=[];dur=[];fouls=[];inboundFouls=[]
 for g in x['games']:
  prior=[s for s in g['slots'] if s['start']<=end-60]
  if not prior:continue
  last=prior[-1];score=last['before']
  for e in last['events']:
   if e['timeMs']<=(end-60)*1000:score=e['score']
  g['at60']=score
  if abs(score[0]-score[1])<=6:
   close.append(g)
   dur.extend(s['finish']-s['start'] for s in g['slots'] if end-60<=s['start']<s['finish']<end)
  for f in g.get('fouls',[]):
   if f['remaining']>=60 or not 3<=f['lead']<=6:continue
   slots=[s for s in g['slots'] if s['start']<=f['time']<=s['finish'] and s['side']==f['side']]
   if slots:
    slot=slots[-1];delay=f['time']-slot['start'];fouls.append(delay);idx=g['slots'].index(slot)
    if idx>0:
     prev=g['slots'][idx-1];events=prev['events']
     if prev['side']!=f['side'] and events and events[-1]['type']=='score' and events[-1]['side']==prev['side'] and abs(events[-1]['timeMs']/1000-prev['finish'])<.001 and abs(prev['finish']-slot['start'])<.001:inboundFouls.append(delay)
 starts=[sum(end-60<=s['start']<end for s in g['slots'])for g in close]
 rng=random.Random(202612);boots=[st.mean(rng.choices(starts,k=len(starts)))for _ in range(2000)] if starts else [0]
 trans=[p for g in x['games'] for p in g['transition']];shots=[s for g in x['games'] for s in g.get('primaryShots',[])];fga=sum(t['fga']for g in x['games']for t in g['totals'])
 return {'games':len(x['games']),'OT':sum(g['ot']for g in x['games']),'OTpct':100*st.mean(g['ot']for g in x['games']),'closeGames':len(close),'startsMean':st.mean(starts),'startsCI95':[sorted(boots)[50],sorted(boots)[1949]],'durationMean':st.mean(dur),'durationN':len(dur),'inboundFoulDelayProxy':{'n':len(inboundFouls),'mean':st.mean(inboundFouls)if inboundFouls else None,'median':st.median(inboundFouls)if inboundFouls else None},'intentionalFoulDelay':{'n':len(fouls),'mean':st.mean(fouls)if fouls else None,'median':st.median(fouls)if fouls else None},'transitionPossessions':len(trans),'opportunityPct':100*st.mean(t['used']for t in trans),'shotFlagPossessionPct':100*st.mean(t['shot']for t in trans),'FGA':fga,'primaryTransitionFGA':sum(s['transition']for s in shots),'primaryOpportunityFGA':sum(s['opportunity']for s in shots),'primaryTransitionAllFGAPct':100*sum(s['transition']for s in shots)/fga if shots else None,'primaryOpportunityAllFGAPct':100*sum(s['opportunity']for s in shots)/fga if shots else None}
out={'matches':{p.name:timing(p)for p in P.glob('*-league-*.json.gz')},'seasons':[],'ties':{}}
for p in sorted(pathlib.Path('dev/balance-audit').glob('phase12port-wnba-*.json')):
 x=json.load(open(p));ds={}
 for g in x['games']:
  for side,t in enumerate([g['a'],g['b']]):ds.setdefault(t,[]).append(g['score'][side]-g['score'][1-side])
 out['seasons'].append({'seed':x['seed'],'games':len(x['games']),'teamMarginSD':st.pstdev(st.mean(v)for v in ds.values()),'OTpct':100*st.mean(g['ot']for g in x['games'])})
for p in P.glob('endings-*-accepted.json'):
 out['ties'][p.stem]=[{'name':r['name'],'n':len(r['samples']),'OTpct':100*st.mean(s['ot']for s in r['samples']),'regWinPct':100*st.mean(s['regulation'][0]>s['regulation'][1]for s in r['samples']),'regLossPct':100*st.mean(s['regulation'][0]<s['regulation'][1]for s in r['samples'])}for r in json.load(open(p))]
(P/'results.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
