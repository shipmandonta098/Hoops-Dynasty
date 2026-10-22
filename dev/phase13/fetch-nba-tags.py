import json,pathlib,urllib.request,concurrent.futures
P=pathlib.Path('dev/phase13');out=P/'nba-tagged-pbp';out.mkdir(exist_ok=True)
valid=[x['file']for x in json.load(open('dev/phase10/real-possession-summary.json'))['checks']if x['valid']]
def fetch(name):
 gid=name.removeprefix('nba-').removesuffix('.json');u=f'https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_{gid}.json';p=out/name
 try:
  if p.exists():d=json.load(open(p))
  else:
   req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.nba.com/','Accept':'application/json'});data=urllib.request.urlopen(req,timeout=25).read();d=json.loads(data)
   assert str(d['game']['gameId'])==gid
   assert all('qualifiers'in e for e in d['game']['actions']if e.get('isFieldGoal'))
   p.write_bytes(data)
  return {'file':str(p),'url':u,'gameId':gid,'ok':True}
 except Exception as e:return {'file':str(p),'url':u,'gameId':gid,'ok':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=8)as ex:r=list(ex.map(fetch,valid))
(P/'nba-tags-fetch.json').write_text(json.dumps(r,indent=2));print('FETCH',sum(x['ok']for x in r),len(r),flush=True);print([x for x in r if not x['ok']],flush=True)
