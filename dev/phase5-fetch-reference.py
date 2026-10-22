import json,pathlib,urllib.request,concurrent.futures
root=pathlib.Path('dev/phase5/reference-pbp');root.mkdir(exist_ok=True)
jobs=[]
for league,path in [('nba','dev/phase3/real-nba-2025.json'),('wnba','dev/phase3/real-wnba-2024.json')]:
 r=json.load(open(path))['resultSets'][0]
 rows=[dict(zip(r['headers'],v)) for v in r['rowSet']]
 ids=sorted(set(r['GAME_ID'] for r in rows))
 for i in range(40):jobs.append((league,ids[i*(len(ids)-1)//39]))
def fetch(job):
 league,id=job;p=root/(league+'-'+id+'.json')
 if p.exists():return {'league':league,'id':id,'ok':True,'retained':True}
 url=(f'https://stats.nba.com/stats/playbyplayv3?GameID={id}&StartPeriod=0&EndPeriod=0' if league=='nba' else f'https://cdn.wnba.com/static/json/liveData/playbyplay/playbyplay_{id}.json')
 try:
  data=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':f'https://www.{league}.com/'}),timeout=12).read()
  r=json.loads(data);assert str(r['game']['gameId'])==id and len(r['game']['actions'])>100
  p.write_bytes(data);return {'league':league,'id':id,'url':url,'ok':True}
 except Exception as e:return {'league':league,'id':id,'url':url,'ok':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as ex:results=list(ex.map(fetch,jobs))
(root.parent/'reference-pbp-fetch.json').write_text(json.dumps(results,indent=2))
print({l:sum(r['ok'] for r in results if r['league']==l)for l in ['nba','wnba']})
