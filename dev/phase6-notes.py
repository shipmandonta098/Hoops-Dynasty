import pathlib,re,json,datetime,collections
P=pathlib.Path('dev/phase6');text=(P/'mystics-notes.txt').read_text().split('QUARTER SCORING BREAKDOWN')[1].split('AVG/GAME')[0]
r=json.load(open('dev/phase3/real-wnba-2024.json'))['resultSets'][0];rows=[dict(zip(r['headers'],v))for v in r['rowSet']];out=[]
for line in text.splitlines():
 m=re.match(r'^(\d+/\d+)\s+(.+?)\s+\d+-\d+\s+[WL]\s+(.+)$',line)
 if not m:continue
 month,day=map(int,m[1].split('/'));date=f'2024-{month:02d}-{day:02d}';rr=[r for r in rows if r['TEAM_ABBREVIATION']=='WAS'and r['GAME_DATE'].startswith(date)];assert len(rr)==1
 a=m[3].split();assert len(a)==19,a
 vals=[0 if x=='--'else int(x)for x in a];q=[[vals[i],vals[i+9]]for i in [0,1,3,4]]
 if vals[6]or vals[15]:q.append([vals[6],vals[15]])
 score=[sum(x[0]for x in q),sum(x[1]for x in q)];assert score==[vals[8],vals[17]]
 assert score[0]==rr[0]['PTS'];other=next(r for r in rows if r['GAME_ID']==rr[0]['GAME_ID']and r['TEAM_ABBREVIATION']!='WAS');assert other['PTS']==score[1]
 if ' @ 'in rr[0]['MATCHUP']:score.reverse();q=[v[::-1]for v in q]
 out.append({'id':rr[0]['GAME_ID'],'score':score,'periodScores':q,'source':'Official Mystics game notes Aug 31 2024, page 25'})
assert len(out)==31
(P/'notes-quarter-games.json').write_text(json.dumps(out,indent=2));print('Verified 31 official notes games against retained official final scores')
