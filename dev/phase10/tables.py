import json,pathlib,collections,csv
P=pathlib.Path('dev/phase10');out={}
for league,label in [('nba','phase8'),('wnba','phase9')]:
 gs=[g for seed in range(101,106)for g in json.load(open(f'dev/balance-audit/{label}-{league}-{seed}.json'))['games']];out[league]={}
 for sec in [60,30]:
  rows=collections.defaultdict(lambda:dict(n=0,regulationWin=0,OTWin=0,OTLoss=0,regulationLoss=0))
  for g in gs:
   sc=g['late'][f'at{sec}'];diff=sc[0]-sc[1];side=0 if diff<=0 else 1;gap=abs(diff);key='Tied (home perspective)'if gap==0 else f'Down {gap}'if gap<=6 else'Down 7–10'if gap<=10 else'Down 11+'
   r=rows[key];r['n']+=1;win=g['score'][side]>g['score'][1-side];r[('OTWin'if win else'OTLoss')if g['ot']else('regulationWin'if win else'regulationLoss')]+=1
  out[league][str(sec)]=dict(rows)
(P/'outcome-tables.json').write_text(json.dumps(out,indent=2))
with open(P/'outcome-tables.csv','w')as f:
 w=csv.writer(f);w.writerow(['League','Seconds left','Margin perspective','Games','Reg win','OT win','OT loss','Reg loss'])
 for league,secs in out.items():
  for sec,rows in secs.items():
   for key,r in rows.items():w.writerow([league,sec,key,*r.values()])
print(json.dumps(out['nba'],indent=2))
