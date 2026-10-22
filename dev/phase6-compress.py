import pathlib,re,gzip,json,hashlib,math
P=pathlib.Path('dev/phase6');results=json.load(open(P/'raw-data-manifest.json'))if(P/'raw-data-manifest.json').exists()else[]
for path in sorted(P.glob('*.json')):
 if not re.match(r'(?:context-)?(?:nba|wnba)-[a-z-]+-\d+\.json$',path.name):continue
 raw=path.read_bytes();r=json.loads(raw)
 for g in r['games']:
  assert all(math.isfinite(d['prob'])and 0<=d['prob']<=1 for d in g['draws'])
  for side in [0,1]:assert sum(d['value']*d['made']for d in g['draws']if d['side']==side)==g['score'][side]
 packed=gzip.compress(raw,compresslevel=6,mtime=0);assert gzip.decompress(packed)==raw
 target=path.with_name(path.name+'.gz');target.write_bytes(packed)
 results=[x for x in results if x['file']!=target.name]
 results.append({'file':target.name,'games':len(r['games']),'rawSHA256':hashlib.sha256(raw).hexdigest(),'bytes':len(packed)})
 path.unlink()
(P/'raw-data-manifest.json').write_text(json.dumps(results,indent=2));print('Validated and losslessly compressed',len(results),'datasets',sum(x['games']for x in results),'games')
