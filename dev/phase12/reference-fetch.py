import urllib.request,urllib.parse,json,pathlib,concurrent.futures
P=pathlib.Path('dev/phase12')
def fetch(item):
 name,url=item
 try:
  req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0','Referer':'https://www.wnba.com/'})
  d=json.load(urllib.request.urlopen(req,timeout=25));(P/(name+'.json')).write_text(json.dumps(d));print(name,'OK',len(str(d)))
 except Exception as e:print(name,str(e))
a=[]
for y in [2022,2023,2024,2025]:
 q=urllib.parse.urlencode(dict(LeagueID='10',SeasonYear=str(y),SeasonType='Regular Season',PerMode='Totals',PlayerOrTeam='T',PlayType='Transition',TypeGrouping='offensive'))
 a.append((f'reference-transition-{y}','https://stats.wnba.com/stats/synergyplaytypes?'+q))
 q=urllib.parse.urlencode(dict(LeagueID='10',Season=str(y),SeasonType='Regular Season',PlayerOrTeam='T',Counter=0,Sorter='DATE',Direction='ASC',DateFrom='',DateTo=''))
 if y in [2022,2025]:a.append((f'reference-gamelog-{y}','https://stats.wnba.com/stats/leaguegamelog?'+q))
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as ex:list(ex.map(fetch,a))
