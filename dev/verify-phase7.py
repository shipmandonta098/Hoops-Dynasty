import pathlib,json,hashlib,gzip
P=pathlib.Path('dev/phase7');changed={'dist/rotations.js','dist/late-game.js'}
m=json.load(open('dev/phase6/baseline-hashes.json'))
for name,digest in m.items():
 if name not in changed:assert hashlib.sha256(pathlib.Path(name).read_bytes()).hexdigest()==digest,name
for league in ['nba','wnba']:
 for variant in ['baseline','candidate']:
  for label,world,n in [('identical',901,400),('league',303,160),('league',304,160)]:
   r=json.load(gzip.open(P/f'{variant}-{league}-{label}-{world}.json.gz'));assert len(r['games'])==n
 for seed in ([101,102]if league=='nba'else[101,102,103,104]):
  count=1230 if league=='nba'else 240
  r=json.load(open(f'dev/balance-audit/phase7-{league}-{seed}.json'));assert len(r['games'])==count
 endings=json.load(open(P/f'endings-{league}.json'));assert len(endings)==21
 for r in endings:assert len(r['samples'])==40
assert json.load(open(P/'save-verification.json'))['passed']
h=json.load(open(P/'historical.json'));assert len(h)==5 and all(len(x['games'])==30 for x in h)
assert sum(x['games'] for x in json.load(open(P/'player-feat-simulation-results.json')))==40
assert 'PASS production day progression, career save/load and repeat finalization' in (P/'feats.log').read_text()
json.dump({'passed':True,'productionFilesChanged':sorted(changed),'preservedFilesChecked':len(m)-2,'fullSeasonGames':3420,'pairedMatchupGames':2880,'syntheticEndings':1680,'historicalGames':150},open(P/'verification.json','w'),indent=2)
print('PASS preserved baseline/photos, all matchup/full-season outputs, save compatibility and historical formats')
