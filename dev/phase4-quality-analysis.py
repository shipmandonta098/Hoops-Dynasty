import json,pathlib,numpy as np,collections,statistics as st,math
root=pathlib.Path('dev/phase4');out={}
for l in ['nba','wnba']:
 paths=sorted(root.glob(f'quality-{l}-2*.json'))
 if len(paths)!=8:continue
 runs=[json.load(open(p))for p in paths];teams={};gaps=[]
 for r in runs:
  for g in r['games']:
   for side,k in enumerate(['a','b']):
    # Omit deliberately injured observations from the healthy roster snapshot.
    if side==0 and g['i']%4==0:continue
    teams[(r['seed'],g[k])]=g['quality'][side]
   gaps.append(abs(g['quality'][0]['ovr']-g['quality'][1]['ovr']))
 def d(v):return {'mean':float(np.mean(v)),'sd':float(np.std(v)),'p10':float(np.percentile(v,10)),'p90':float(np.percentile(v,90)),'min':min(v),'max':max(v)}
 out[l]={'teams':len(teams),'roster':{k:d([t[k] for t in teams.values()])for k in ['ovr','benchShare','lay','tp','per','rim','reb','energy']},'matchupQualityGap':d(gaps)}
 if not (root/'quality-model.json').exists():continue
 model=json.load(open(root/'quality-model.json'))[l];seedDeltas=[];groups={}
 for r in runs[4:]:
  ds=[]
  for g in r['games']:
   pred=model['intercept']+sum(v*(g['quality'][0][k]-g['quality'][1][k])for k,v in model['coefficients'].items());actual=g['score'][0]-g['score'][1];old=-g['oldSpread'];delta=abs(pred-actual)-abs(old-actual);ds.append(delta)
   label='injury' if g['i']%4==0 else 'healthy';a=groups.setdefault(label,{'old':[],'rotation':[]});a['old'].append(abs(old-actual));a['rotation'].append(abs(pred-actual))
  seedDeltas.append(st.mean(ds))
 half=3.182*st.stdev(seedDeltas)/2;out[l]['heldOutMAEDeltaBySeed']=seedDeltas;out[l]['heldOutDeltaSeedCI95']=[st.mean(seedDeltas)-half,st.mean(seedDeltas)+half];out[l]['heldOutByAvailability']={k:{'n':len(v['old']),'oldMAE':st.mean(v['old']),'rotationMAE':st.mean(v['rotation'])}for k,v in groups.items()}
 for name in ['old','rotation']:
  bins=[]
  for lo,hi in [(0,3),(3,6),(6,10),(10,1000)]:
   vals=[]
   for run in runs[4:]:
    for g in run['games']:
     pred=-g['oldSpread'] if name=='old' else model['intercept']+sum(v*(g['quality'][0][k]-g['quality'][1][k])for k,v in model['coefficients'].items())
     if lo<=abs(pred)<hi:vals.append((pred,g['score'][0]-g['score'][1]))
   if vals:bins.append({'absolutePredictedMargin':[lo,hi],'n':len(vals),'MAE':st.mean(abs(a-b)for a,b in vals),'actualMeanMargin':st.mean(abs(b)for a,b in vals),'blow30%':100*st.mean(abs(b)>=30 for a,b in vals)})
  out[l][name+'HeldOutMarginBins']=bins
(root/'quality-analysis.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
