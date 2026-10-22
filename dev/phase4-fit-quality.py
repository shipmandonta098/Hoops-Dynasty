import json,pathlib,numpy as np,math
from scipy.special import ndtr
root=pathlib.Path('dev/phase4');keys=['lay','post','fg','tp','ft','drb','pss','oiq','per','rim','diq','stl','sbl','reb','endu','energy','benchShare','coachOff','coachDef','fit']
models={};reports={}
for l in ['nba','wnba']:
 runs=[json.load(open(root/f'quality-{l}-{seed}.json')) for seed in range(201,209)]
 train=[g for r in runs[:4] for g in r['games']];test=[g for r in runs[4:] for g in r['games']]
 def matrix(gs):return np.array([[g['quality'][0][k]-g['quality'][1][k] for k in keys] for g in gs])
 x=matrix(train);y=np.array([g['score'][0]-g['score'][1] for g in train]);scale=x.std(axis=0);scale[scale<1e-8]=1;z=np.column_stack([np.ones(len(x)),x/scale]);pen=np.eye(len(keys)+1)*20;pen[0,0]=0;b=np.linalg.solve(z.T@z+pen,z.T@y);coefs=b[1:]/scale;sigma=float(np.std(y-z@b));models[l]={'intercept':float(b[0]),'coefficients':dict(zip(keys,map(float,coefs))),'sigma':sigma,'trainingSeeds':[201,202,203,204]}
 oldTrain=np.array([-g['oldSpread'] for g in train]);simple=np.linalg.lstsq(np.column_stack([np.ones(len(train)),oldTrain]),y,rcond=None)[0]
 reports[l]={}
 for label,gs in [('training',train),('heldOut',test)]:
  actual=np.array([g['score'][0]-g['score'][1] for g in gs]);old=np.array([-g['oldSpread'] for g in gs]);new=b[0]+matrix(gs)@coefs
  def metrics(pred):
   e=pred-actual;p=ndtr(pred/sigma);win=actual>0;bins=[]
   for lo,hi in [(0,.3),(.3,.4),(.4,.5),(.5,.6),(.6,.7),(.7,1.01)]:
    mask=(p>=lo)&(p<hi)
    if mask.any():bins.append({'range':[lo,hi],'n':int(mask.sum()),'predicted':float(p[mask].mean()),'actual':float(win[mask].mean())})
   return {'n':len(gs),'MAE':float(np.abs(e).mean()),'RMSE':float(np.sqrt((e*e).mean())),'bias':float(e.mean()),'brier':float(((p-win)**2).mean()),'winCalibration':bins}
  reports[l][label]={'old':metrics(old),'rotation':metrics(new),'fittedOld':metrics(simple[0]+simple[1]*old)}
root.joinpath('quality-model.json').write_text(json.dumps(models,indent=2));root.joinpath('quality-evaluation.json').write_text(json.dumps(reports,indent=2));print(json.dumps(reports,indent=2))
