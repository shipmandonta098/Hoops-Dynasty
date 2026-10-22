import json,time,os,signal,pathlib
for mode,pid in [('port',22606),('hq',22607)]:
 p=pathlib.Path(f'dev/phase12/endings-wnba-{mode}.json')
 while True:
  try:
   rows=json.load(open(p))
   if any(r['name']=='tie_60' and len(r['samples'])==2000 for r in rows):
    os.kill(pid,signal.SIGTERM);print('Retained completed 2000-seed tie60 arm',mode,flush=True);break
  except (OSError,json.JSONDecodeError):pass
  time.sleep(2)
