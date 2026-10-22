import json,pathlib,re,statistics,collections
P=pathlib.Path('dev/phase12')
def summary(v):
 if not v:return {'n':0}
 s=sorted(v);return {'n':len(v),'mean':statistics.mean(v),'median':statistics.median(v),'p10':s[int(.1*(len(s)-1))],'p90':s[int(.9*(len(s)-1))],'sd':statistics.pstdev(v)}
seasons=[]
for y,p in [(2022,P/'reference-gamelog-2022.json'),(2023,pathlib.Path('dev/phase4/real-wnba-2023.json')),(2024,pathlib.Path('dev/phase3/real-wnba-2024.json')),(2025,P/'reference-gamelog-2025.json')]:
 d=json.load(open(p)); rs=d['resultSets'][0];rows=[dict(zip(rs['headers'],r))for r in rs['rowSet']];teams=collections.defaultdict(list)
 for r in rows:teams[r['TEAM_NAME']].append(r['PLUS_MINUS'])
 a=[{'team':k,'games':len(v),'meanMargin':statistics.mean(v)}for k,v in teams.items()]
 seasons.append({'season':y,'games':len(rows)//2,'teams':a,'teamMarginSD':statistics.pstdev(t['meanMargin']for t in a),'sourceFile':str(p),'sourceURL':'https://stats.wnba.com/stats/leaguegamelog?'+__import__('urllib.parse',fromlist=['urlencode']).urlencode(d['parameters'])})
(P/'reference-wnba-spread.json').write_text(json.dumps(seasons,indent=2));print('SPREAD',[(x['season'],x['teamMarginSD'])for x in seasons])
valid={x['file']for x in json.load(open('dev/phase10/real-possession-summary.json'))['checks']if x['valid']}
rows=[];counts=collections.Counter()
for f in sorted(list(pathlib.Path('dev/phase6/reference-pbp').glob('*.json'))+list((P/'reference-pbp').glob('*.json'))):
 league='nba' if f.name.startswith('nba-') else 'wnba'
 if league=='nba' and f.name not in valid:continue
 ev=json.load(open(f))['game']['actions'];score=[0,0];sides={};pending=None;period=0;counts[league]+=1
 for e in ev:
  typ=e.get('actionType','').lower().replace(' ','');desc=e.get('description','').lower();sub=e.get('subType','').lower();team=e.get('teamId');p=e['period'];m=re.match(r'PT(\d+)M([\d.]+)S',e['clock']);sec=60*int(m[1])+float(m[2]);new=[int(e.get('scoreHome')or score[0]),int(e.get('scoreAway')or score[1])];delta=[new[i]-score[i]for i in [0,1]]
  if team and max(delta)>0 and typ in ['madeshot','2pt','3pt','freethrow']:sides[team]=delta.index(max(delta))
  score=new
  if p!=period:pending=None;period=p
  if p!=4 or sec>60:continue
  if typ=='foul':
   side=sides.get(team);gap=score[1-side]-score[side]if side is not None else None
   if pending and team==pending['team'] and gap is not None and 3<=gap<=6 and ('personal' in sub or 'take' in sub) and not any(z in sub+' '+desc for z in ['shooting','offensive','technical','flagrant','loose ball']):
    delay=round(pending['sec']-sec,4)
    if 0<=delay<=24:rows.append({'league':league,'game':f.stem,'startClock':pending['sec'],'foulClock':sec,'delay':delay,'deficit':gap,'startKind':pending['kind'],'startDescription':pending['desc'],'foulDescription':e.get('description'),'timeoutBetween':pending['timeout']})
   pending=None
  elif typ in ['madeshot','2pt','3pt','freethrow']:
   made=(e.get('shotResult','').lower()=='made' or typ=='madeshot' or (typ=='freethrow' and 'miss'not in desc and sum(delta)>0))
   finalFT=re.search(r'(\d+) of (\d+)',sub+' '+desc)
   eligible=typ!='freethrow' or (finalFT and finalFT[1]==finalFT[2] and not any(z in desc for z in ['technical','flagrant','clear path']))
   pending={'team':team,'sec':sec,'kind':'finalFT'if typ=='freethrow'else'madeFG','desc':e.get('description'),'timeout':False}if made and eligible else None
  elif typ=='timeout':
   if pending:pending['timeout']=True
  elif typ in ['substitution','instantreplay','replay','stoppage','']:pass
  else:pending=None
out={'method':'Q4 final 60 game-clock seconds, fouling team down 3–6 at foul, personal/take non-shooting foul immediately after that same team made a FG or completed a made ordinary FT trip; substitutions/timeouts/reviews allowed but no intervening live-ball event. Elapsed game clock from score to foul is an inbound-to-foul proxy because clock is stopped before legal inbound touch. PBP does not directly identify intentionality, attempted inbound timing, or referee recognition delay. No fast-delay cutoff used to select intentional events. Max 24 s excludes anomalous intervals; report all selected rows for review. NBA excludes 2 score-invalid reference files per Phase 10 checks. WNBA uses 100 official CDN games in 2022–2025, all passing scoring-accounting checks in reference-transition-summary.json. Sample is retained convenience sample, not full league census.','games':dict(counts),'summary':{l:summary([r['delay']for r in rows if r['league']==l])for l in counts},'byStart':{l:{k:summary([r['delay']for r in rows if r['league']==l and r['startKind']==k])for k in ['madeFG','finalFT']}for l in counts},'events':rows}
(P/'reference-foul-delay.json').write_text(json.dumps(out,indent=2));print('FOUL',out['games'],out['summary']);print('BY START',out['byStart'])
