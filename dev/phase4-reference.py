import urllib.request,urllib.parse,json,pathlib,concurrent.futures
root=pathlib.Path('dev/phase4')
def run(l,season):
 params={'Counter':'0','DateFrom':'','DateTo':'','Direction':'ASC','LeagueID':'00' if l=='nba' else '10','PlayerOrTeam':'T','Season':season,'SeasonType':'Regular Season','Sorter':'DATE'};url=f'https://stats.{l}.com/stats/leaguegamelog?'+urllib.parse.urlencode(params)
 try:
  data=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':f'https://www.{l}.com/'}),timeout=30).read();r=json.loads(data);assert len(r['resultSets'][0]['rowSet'])>400;root.joinpath(f'real-{l}-{season}.json').write_bytes(data);return {'url':url,'ok':True}
 except Exception as e:return {'url':url,'ok':False,'error':str(e)}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as ex:r=list(ex.map(lambda x:run(*x),[('nba','2023-24'),('wnba','2023')]))
root.joinpath('reference-fetch.json').write_text(json.dumps(r,indent=2));print(r)
