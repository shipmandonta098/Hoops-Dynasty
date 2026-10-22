import pathlib,json,gzip,numpy as np
P=pathlib.Path('dev/phase11');real=json.load(open(P/'real-timing.json'));sim=json.load(gzip.open(P/'production-nba-league-607.json.gz'));data={}
for group,raw in [('real',real['games']),('simulation',sim['games'])]:
 values=[]
 for g in raw:
  if group=='real':
   sc=g['at60'];v=g['possessions'];starts=[p for p in v if 660<=p['start']<720];d=[p['end']-p['start']for p in starts if p['reason']not in ['period','inferred change'] and p['end']>p['start'] and p['end']<720]
  else:
   e=[s for s in g['slots']if s['start']<=2820][-1];sc=e['before'].copy()
   for a in e['events']:
    if a['timeMs']<=2820000:sc=a['score'].copy()
   starts=[s for s in g['slots']if s['start']>=2820];d=[s['finish']-s['start']for s in starts if s['finish']<2880 and s['finish']>s['start']]
  if abs(sc[0]-sc[1])<=6:values.append([len(starts),sum(d),len(d)])
 a=np.array(values);rng=np.random.default_rng(711);r=[]
 for _ in range(5000):
  b=a[rng.integers(0,len(a),len(a))];r.append([b[:,0].mean(),b[:,1].sum()/b[:,2].sum()])
 data[group]={'nGames':len(a),'startsCI95':np.quantile(r,[.025,.975],axis=0)[:,0].tolist(),'durationCI95':np.quantile(r,[.025,.975],axis=0)[:,1].tolist()}
(P/'timing-uncertainty.json').write_text(json.dumps(data,indent=2));print(data)
