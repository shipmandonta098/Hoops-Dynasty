import urllib.request,json,pathlib,concurrent.futures,time
root=pathlib.Path('dev/phase3');out=root/'reference-pbp';out.mkdir(exist_ok=True)
jobs=[]
for l,y in [('nba',2025),('wnba',2024)]:
 j=json.loads((root/f'real-{l}-{y}.json').read_text())['resultSets'][0];rows=[dict(zip(j['headers'],x)) for x in j['rowSet']];ids=sorted({x['GAME_ID'] for x in rows})
 for i in range(20):jobs.append((l,ids[int(i*(len(ids)-1)/19)]))
def fetch(job):
 l,gid=job;p=out/f'{l}-{gid}.json';url=f'https://cdn.{l}.com/static/json/liveData/playbyplay/playbyplay_{gid}.json'
 if p.exists():return {'league':l,'id':gid,'url':url,'ok':True}
 try:
  r=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.nba.com/'}),timeout=20).read();j=json.loads(r);assert j['game']['gameId']==gid;p.write_bytes(r);return {'league':l,'id':gid,'url':url,'ok':True}
 except Exception as e:return {'league':l,'id':gid,'url':url,'ok':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:
 results=list(ex.map(fetch,jobs))
(root/'reference-fetch.json').write_text(json.dumps(results,indent=2));print([(l,sum(r['ok'] for r in results if r['league']==l)) for l in ['nba','wnba']],flush=True)
