import pathlib,json,hashlib,datetime
P=pathlib.Path('dev/phase13');assert not(P/'freeze.json').exists(),'Already frozen: cannot tune'
from analyze import summarize
label='cal140';s=summarize(label,'wnba');a=s['pooled'];assert a['seasons']==10
assert 5.3<=a['teamMarginSD']<=6.2,a
ceiling=max(r['blow20Pct']for r in json.load(open(P/'real-seasons.json'))['wnba']);assert a['blow20Pct']<=ceiling,a
tr=json.load(open(P/'real-transition.json'));assert tr['nba']['games']==134 and tr['nba']['fastbreakFGA']>0
assert json.load(open(P/'scope-verification.json'))['factor']==1.4
assert len(json.load(open(P/'instrument-equivalence.json')))==2
base=pathlib.Path('dist/game.js').read_text();(P/'phase12-game.js').write_text(base)
updated=base.replace('if(year>=2020)widenInitialRosterQuality(teams)','if(year>=2020)widenInitialRosterQuality(teams,leagueGender)').replace('function widenInitialRosterQuality(teams){',"function widenInitialRosterQuality(teams,leagueGender='male'){").replace('target=initial*1.15**2',"target=initial*(leagueGender==='female'?1.4:1.15)**2")
assert updated!=base and "leagueGender==='female'?1.4:1.15"in updated
pathlib.Path('dist/game.js').write_text(updated)
p=pathlib.Path('dist/index.html');s=p.read_text();assert 'game.js?v=phase12-1'in s;p.write_text(s.replace('src="game.js?v=phase12-1"','src="game.js?v=phase13-1"'))
decision={'selectedFactor':1.4,'selectedLabel':label,'testedLabels':['calbaseline','cal135','cal140','cal145'],'change':'Modern fictional WNBA initial roster-quality SD target rises from 1.15x to 1.40x its unallocated value, using the existing same-position swap algorithm. NBA stays at 1.15x.','reason':'1.45 reached the spread target but exceeded the real 20+ ceiling; 1.35 respected the ceiling but fell below the SD target; 1.40 was borderline on the initial five seeds (SD 5.299); five additional calibration seeds 116–120 were run without a parameter change. The full ten-season calibration met both gates. No transition tuning.','calibrationSelected':a,'ceiling20Pct':ceiling}
(P/'decision.json').write_text(json.dumps(decision,indent=2))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
production=sorted(p for p in pathlib.Path('dist').iterdir()if p.is_file()and p.suffix in ['.js','.html','.css'])
files=production+[pathlib.Path(p)for p in ['dev/audit-phase13-season.cjs','dev/load-league.cjs','dev/headless-runner.js','dev/phase13/instrument.cjs','dev/phase13/run-holdout.cjs','dev/phase13/analyze.py','dev/phase13/reference.py','dev/phase13/protocol.txt','dev/phase13/reserved-seeds.json','dev/phase13/decision.json','dev/phase13/real-seasons.json','dev/phase13/real-transition.json','dev/phase13/real-timing-nba.json','dev/phase13/real-timing-wnba.json']]
prod={str(p):sha(p)for p in production};buildhash=hashlib.sha256(json.dumps(prod,sort_keys=True,separators=(',',':')).encode()).hexdigest()
freeze={'frozenAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'productionBuildSHA256':buildhash,'productionFiles':prod,'files':{str(p):sha(p)for p in files},'rule':'No production, calibration, metric or input changes after this point. Only report/publishing artifacts may be generated. Holdout inputs and results are never used to tune.'}
(P/'freeze.json').write_text(json.dumps(freeze,indent=2));print('FROZEN',buildhash);print(json.dumps(a))
