import pathlib,zipfile
P=pathlib.Path('dev/phase12');files=[]
for name in ['source-hashes.json','results.json','paired-results.json','experiment-manifest.json','regulation-equivalence.json','production-equivalence.json','scope-verification.json','save-verification.json','endings-wnba-port-accepted.json','endings-wnba-hq-accepted.json','analyze.py','paired.py','finalize-endings.py','variant.cjs','variant-8second-pilot.cjs','foul-instrument.cjs','reference-notes.md']:
 p=P/name;assert p.exists(),p;files.append(p)
files+=list(P.glob('reference*.json'))+list(P.glob('reference*.py'))+list(P.glob('reference-pbp/*.json'))+list(P.glob('baseline-dist/*.js'))+list(P.glob('*-league-*.json.gz'))+list(pathlib.Path('dev/balance-audit').glob('phase12port-wnba-*.json'))
files+=[pathlib.Path(p)for p in ['docs/PHASE12-WNBA-PACE.txt','dev/phase12-matches.cjs','dev/test-phase12-regulation.cjs','dev/load-phase12-timeout.cjs','dev/run-phase12-seasons.cjs','dev/test-phase12-endings.cjs','dev/test-phase12-short-endings.cjs','dev/test-phase12-scope.cjs','dev/test-phase12-save.cjs','dev/test-phase12-production.cjs','dev/phase3/real-wnba-2024.json','dev/phase4/real-wnba-2023.json']]
with zipfile.ZipFile('dist/audits/phase12.zip','w',zipfile.ZIP_DEFLATED,compresslevel=6)as z:
 for p in sorted(set(files)):z.write(p,str(p))
print('Audit bundle',len(set(files)),'files',pathlib.Path('dist/audits/phase12.zip').stat().st_size,'bytes')
