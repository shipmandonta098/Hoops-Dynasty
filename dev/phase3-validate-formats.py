import json
expected={('nba',1997):(4,12),('nba',2025):(4,12),('wnba',1997):(2,20),('wnba',2006):(4,10),('wnba',2024):(4,10)}
rs=json.load(open('dev/phase3/historical.json'));assert len(rs)==5
for r in rs:
 assert len(r['games'])==30
 for g in r['games']:
  q=g['rules'];assert (q['gamePeriods'],q['periodMinutes'])==expected[(r['league'],r['year'])];assert q['overtimeMinutes']==5
print('PASS 150 game formats: NBA 48 minutes, inaugural WNBA two 20-minute halves, later WNBA four 10-minute quarters, five-minute overtime')
