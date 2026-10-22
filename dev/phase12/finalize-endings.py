import json,pathlib
P=pathlib.Path('dev/phase12');checks=[]
def read(path):return {r['name']:r for r in json.load(open(path))}
for arm in ['port','hq']:
 original=read(P/f'endings-wnba-{arm}.json');short=read(P/f'endings-wnba-{arm}-short.json');endpoint=read(P/f'endings-wnba-{arm}20-regulation.json');check=read(P/f'endings-wnba-{arm}check-regulation.json')['tie_30']
 expected=short['tie_30']['samples']
 for a,b in zip(check['samples'],expected):assert a=={k:v for k,v in b.items()if k!='final'},(arm,a['seed'])
 assert len(check['samples'])==100
 checks.append({'arm':arm,'case':'tie_30','samples':100,'exactRegulationEquality':True})
 selected=[]
 for rows,case,n in [(original,'tie_60',2000),(short,'tie_30',1000),(endpoint,'tie_20',1000)]:
  row=rows[case];assert len(row['samples'])>=n,(case,len(row['samples']));selected.append({**row,'samples':row['samples'][:n]})
 (P/f'endings-wnba-{arm}-accepted.json').write_text(json.dumps(selected))
(P/'regulation-equivalence.json').write_text(json.dumps(checks,indent=2));print('Frozen ending samples; exact regulation equivalence:',checks)
