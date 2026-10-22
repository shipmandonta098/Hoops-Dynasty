import json,gzip,pathlib,numpy as np
P=pathlib.Path('dev/phase8');rng=np.random.default_rng(81021)
def read(p):return json.load(gzip.open(p)if str(p).endswith('.gz')else open(p))['games']
def metrics(gs):
 s=np.array([g['score']for g in gs]);m=np.abs(s[:,0]-s[:,1]);q=np.array([[a-b for a,b in g.get('quarter',g.get('periodScores'))[:4]]for g in gs]);v=np.var(q.sum(1));t=[t for g in gs for t in g['totals']]
 return dict(n=len(gs),points=float(s.mean()),meanMargin=float(m.mean()),within10=float(100*np.mean(m<=10)),blow20=float(100*np.mean(m>=20)),blow30=float(100*np.mean(m>=30)),OT=float(100*np.mean([g['ot']for g in gs])),regulationVariance=float(v),stacking=float(v-np.var(q,axis=0).sum()),threePct=100*sum(x['tpm']for x in t)/sum(x['tpa']for x in t))
a=read('dev/phase7/candidate-nba-identical-901.json.gz');b=read(P/'no-momentum-nba-identical-901.json.gz');out={'phase7Mirror':metrics(a),'noMomentumMirror':metrics(b),'momentumExactScoreReplay':all(x['score']==y['score']and x['quarter']==y['quarter']for x,y in zip(a,b))}
p=P/'candidate-nba-identical-901.json.gz'
if p.exists():
 c=read(p);out['candidateMirror']=metrics(c);ar=np.array([sum(x-y for x,y in g['quarter'][:4])for g in a]);cr=np.array([sum(x-y for x,y in g['quarter'][:4])for g in c]);ix=rng.integers(0,len(a),(2000,len(a)));out['pairedVarianceChange95']=np.quantile(np.var(cr[ix],axis=1)-np.var(ar[ix],axis=1),[.025,.975]).tolist();out['mirrorGatePassed']=out['candidateMirror']['regulationVariance']<=160
paths=[pathlib.Path(f'dev/balance-audit/phase8-nba-{seed}.json')for seed in range(101,106)]
if all(p.exists()for p in paths):
 gs=[g for p in paths for g in read(p)];assert len(gs)==6150;out['fiveSeasons']=metrics(gs);out['seeds']=[{'seed':seed,**metrics(read(p))}for seed,p in zip(range(101,106),paths)]
 # Report season variation rather than pretending each game is independent.
 out['seedRanges']={k:[min(x[k]for x in out['seeds']),max(x[k]for x in out['seeds'])]for k in ['meanMargin','blow20','OT']}
 out['OTGatePassed']=4<=out['fiveSeasons']['OT']<=6
(P/'results.json').write_text(json.dumps(out,indent=2));print(json.dumps(out,indent=2))
