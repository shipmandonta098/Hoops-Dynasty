import pathlib,json,zipfile
P=pathlib.Path('dev/phase13');files=[]
files += [p for p in P.rglob('*')if p.is_file()and p.suffix in ['.json','.py','.cjs','.txt']and '__pycache__'not in p.parts and not p.name.startswith('probe-') and p.name!='nba-cdn-probe.json']
files += [pathlib.Path(x)for x in ['docs/PHASE13-FINAL-HOLDOUT.txt','dev/audit-phase13-season.cjs','dev/load-league.cjs','dev/headless-runner.js','dev/phase11/reference-timing.py','dev/phase10/real-transition.json','dev/phase10/real-possession-summary.json','dev/phase12/reference-transition-summary.json','dev/phase12/reference-pbp-fetch.json']]
refs=json.load(open(P/'real-seasons.json'))
files += [pathlib.Path(r['source'])for rows in refs.values()for r in rows]
for league,v in json.load(open(P/'real-transition.json')).items():
 for r in v.get('rows',[]):files += [pathlib.Path(r['file']),pathlib.Path(r['legacyFile'])]
files += [pathlib.Path(p)for p in json.load(open(P/'freeze.json'))['productionFiles']]
with zipfile.ZipFile('dist/audits/phase13.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in sorted(set(files)):assert p.exists(),p;z.write(p,str(p))
print('Audit bundle:',len(set(files)),'files;',pathlib.Path('dist/audits/phase13.zip').stat().st_size,'bytes')
