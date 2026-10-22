import json,gzip,pathlib,statistics as st
P=pathlib.Path('dev/phase11');path=P/'production-nba-league-607.json.gz'
if not path.exists():raise SystemExit('Timing sample still running')
games=json.load(gzip.open(path))['games'];close=[]
for g in games:
 slots=g['slots'];s=next((s['before']for s in slots if s['start']>=2820),None)
 if s is None:continue
 # Score at 60 is derived from actual event timestamps, including a possession crossing checkpoint.
 earlier=[s for s in slots if s['start']<=2820];sc=earlier[-1]['before'].copy()
 for e in earlier[-1]['events']:
  if e['timeMs']<=2820000:sc=e['score'].copy()
 if abs(sc[0]-sc[1])<=6:close.append(g)
starts=[s for g in close for s in g['slots'] if s['start']>=2820];complete=[s for s in starts if s['finish']<2880 and s['finish']>s['start']]
tied=[s for g in close for s in g['slots'] if 2856<=s['start']<2876 and s['before'][0]==s['before'][1] and any(e['type']in ['score','miss','block'] and e['value']>=2 for e in s['events'])]
result={'sourceGames':len(games),'closeGames':len(close),'meanStartsFinal60':st.mean(sum(s['start']>=2820 for s in g['slots'])for g in close),'completedDurationsN':len(complete),'meanDuration':st.mean(s['finish']-s['start']for s in complete),'medianDuration':st.median(s['finish']-s['start']for s in complete),'tiedUnder24WithShot':len(tied),'tiedLastShotUnder4':sum(next(e['timeMs']for e in s['events']if e['type']in ['score','miss','block']and e['value']>=2)>=2876000 for s in tied)}
result['durationByState']={}
for label in ['tied','leading','trailing']:
 vals=[s['finish']-s['start'] for s in complete if ('tied' if s['before'][s['side']]==s['before'][1-s['side']] else 'leading' if s['before'][s['side']]>s['before'][1-s['side']] else 'trailing')==label]
 result['durationByState'][label]={'n':len(vals),'mean':st.mean(vals)if vals else None}
(P/'sim-timing.json').write_text(json.dumps(result,indent=2));print(result)
