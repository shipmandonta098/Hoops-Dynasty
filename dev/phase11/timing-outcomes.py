import json,gzip,pathlib,collections,statistics as st
P=pathlib.Path('dev/phase11');data=json.load(gzip.open(P/'production-nba-league-607.json.gz'));out=collections.defaultdict(list)
for g in data['games']:
 p=[s for s in g['slots']if s['start']<=2820][-1];sc=p['before'].copy()
 for e in p['events']:
  if e['timeMs']<=2820000:sc=e['score'].copy()
 if abs(sc[0]-sc[1])>6:continue
 for s in g['slots']:
  if s['start']<2820 or s['finish']>=2880:continue
  tr=s['trace'];kind='freeThrow'if 'freeThrow'in tr else'turnover'if'turnover'in tr else'fieldGoalOrRebound'
  out[kind].append(s['finish']-s['start'])
r={k:{'n':len(v),'meanSeconds':st.mean(v)}for k,v in out.items()};(P/'sim-timing-outcomes.json').write_text(json.dumps(r,indent=2));print(r)
