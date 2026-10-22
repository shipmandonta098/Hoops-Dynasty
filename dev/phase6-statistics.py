import gzip,re
import pathlib,json,numpy as np
P=pathlib.Path('dev/phase6');d=json.load(gzip.open(P/'diagnostics-analysis.json.gz','rt'));rng=np.random.default_rng(1606);out={}
for league in ['nba','wnba']:
 base=d.get(f'{league}-identical-901')
 if not base:continue
 out[league]={}
 for key,r in d.items():
  if r['league']!=league or r['label']=='league':continue
  a=r['perGame'];b=base['perGame'];n=len(a)
  if n!=len(b):continue
  delta=np.array([abs(x['full']['margin'])-abs(y['full']['margin'])for x,y in zip(a,b)]);res=np.array([x['early']['residual']for x in a]);v=np.array([x['early']['conditionalVariance']for x in a]);sample=rng.integers(0,n,(1000,n));boot=delta[sample].mean(1);ratio=(res[sample]**2).mean(1)/v[sample].mean(1)
  out[league][r['label']]={'pairedMeanAbsMarginChange':float(delta.mean()),'pairedBootstrap95':np.quantile(boot,[.025,.975]).tolist(),'earlyResidualVarianceRatio':float(np.mean(res**2)/np.mean(v)),'ratioBootstrap95':np.quantile(ratio,[.025,.975]).tolist(),'n':n}
(P/'controlled-uncertainty.json').write_text(json.dumps(out,indent=2))
# Context association; conditioning on a timeout/substitution is NOT causal.
contexts={}
for file in P.glob('context-*.json*'):
 if not re.match(r'context-(nba|wnba)-[a-z-]+-\d+\.json(?:\.gz)?$',file.name):continue
 if file.suffix=='.json' and file.with_name(file.name+'.gz').exists():continue
 r=json.load(gzip.open(file,'rt')if file.suffix=='.gz'else open(file));sums={k:[]for k in ['timeout','substitution','turnover','offensiveRebound']}
 for g in r['games']:
  slots=g['slots']
  for e in g['contexts']:
   kind='timeout'if 'timeout'in e['text'].lower()else'substitution';following=slots[e['slot']:e['slot']+6]
   if following:sums[kind].append(sum(sl['stats'][1-e['side']]['pts']-sl['stats'][e['side']]['pts']for sl in following))
  for i,sl in enumerate(slots):
   kind='turnover'if 'turnover'in sl['trace']else'offensiveRebound'if any(t['orb']for t in sl['stats'])else None
   if kind and i+1<len(slots):sums[kind].append(sum(t['stats'][1-sl['side']]['pts']-t['stats'][sl['side']]['pts']for t in slots[i+1:i+7]))
 contexts[r['league']]={k:{'n':len(v),'meanOpponentNetPointsNext6RecordedPossessions':float(np.mean(v))if v else None}for k,v in sums.items()}
(P/'context-associations.json').write_text(json.dumps(contexts,indent=2));print('Controlled uncertainty and contextual associations written')
