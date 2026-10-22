import urllib.request,json,concurrent.futures,pathlib
P=pathlib.Path('dev/phase12');out=P/'reference-pbp';out.mkdir(exist_ok=True)
items=[]
for y,p in [(2022,P/'reference-gamelog-2022.json'),(2023,pathlib.Path('dev/phase4/real-wnba-2023.json')),(2025,P/'reference-gamelog-2025.json')]:
 d=json.load(open(p))['resultSets'][0];idx=d['headers'].index('GAME_ID');ids=sorted(set(r[idx]for r in d['rowSet']));chosen=[ids[round(i*(len(ids)-1)/19)]for i in range(20)];items +=[(y,i)for i in chosen]
def f(item):
 y,i=item;u=f'https://cdn.wnba.com/static/json/liveData/playbyplay/playbyplay_{i}.json';p=out/(i+'.json')
 try:
  if p.exists():d=json.load(open(p))
  else:
   d=json.load(urllib.request.urlopen(u,timeout=25));p.write_text(json.dumps(d))
  return {'season':y,'game':i,'url':u,'file':str(p),'actions':len(d['game']['actions']),'ok':True}
 except Exception as e:return {'season':y,'game':i,'url':u,'ok':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as ex:r=list(ex.map(f,items))
(P/'reference-pbp-fetch.json').write_text(json.dumps(r,indent=2));print('downloaded',sum(x['ok']for x in r),'/',len(r));print([x for x in r if not x['ok']])
