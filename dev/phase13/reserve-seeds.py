import pathlib,json,gzip,re,datetime
P=pathlib.Path('dev/phase13');out=P/'reserved-seeds.json'
assert not out.exists()
seeds={'nba':list(range(3101300001,3101300011)),'wnba':list(range(3101300101,3101300111))};pattern=re.compile(rb'\b(?:'+b'|'.join(str(s).encode()for a in seeds.values()for s in a)+rb')\b');matches=[];files=0
for p in pathlib.Path('dev').rglob('*'):
 if not p.is_file()or 'phase13'in p.parts:continue
 if p.suffix not in ['.json','.gz','.cjs','.js','.py','.txt','.log']:continue
 data=gzip.decompress(p.read_bytes())if p.suffix=='.gz'else p.read_bytes();files+=1
 if pattern.search(data):matches.append(str(p))
assert not matches,matches
out.write_text(json.dumps({'reservedAtUTC':datetime.datetime.now(datetime.timezone.utc).isoformat(),'seeds':seeds,'priorAuditFilesChecked':files,'priorMatches':matches,'scope':'All retained dev JSON/gzip source, logs and scripts outside this phase; no claim about discarded unrecorded runs. Seeds are uint32 and never used by calibration or smoke tests.'},indent=2));print('Reserved20 seeds; prior files checked',files)
