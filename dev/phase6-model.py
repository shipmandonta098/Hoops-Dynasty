import gzip
import json,pathlib,numpy as np
P=pathlib.Path('dev/phase6');prior=json.load(open('dev/phase4/quality-model.json'));rows=json.load(gzip.open(P/'model-rows.json.gz','rt'));out={}
keys=['ovr','lay','post','fg','tp','ft','drb','pss','oiq','per','rim','diq','stl','sbl','reb','endu','energy','benchShare','coachOff','coachDef','fit','tempo']
def quality(r):return [r['quality'][0][k]-r['quality'][1][k]for k in keys]
def qmean(r):return (r['quality'][0]['ovr']-r['quality'][1]['ovr'])
def fit(train,test,features,target):
 a=np.array([features(r)for r in train]);b=np.array([features(r)for r in test]);mu=a.mean(0);sd=a.std(0);sd[sd<1e-8]=1
 a=np.c_[np.ones(len(a)),(a-mu)/sd];b=np.c_[np.ones(len(b)),(b-mu)/sd];y=np.array([target(r)for r in train]);z=np.array([target(r)for r in test]);pen=np.eye(a.shape[1])*10;pen[0,0]=0;coef=np.linalg.solve(a.T@a+pen,a.T@y);pred=b@coef;err=z-pred
 return {'MAE':float(np.abs(err).mean()),'RMSE':float(np.sqrt(np.mean(err**2))),'bias':float(err.mean()),'R2':float(1-np.sum(err**2)/np.sum((z-z.mean())**2)),'trainN':len(train),'testN':len(test),'pred':pred.tolist(),'actual':z.tolist(),'coef':coef.tolist(),'featureMean':mu.tolist(),'featureSD':sd.tolist()}
for league in ['nba','wnba']:
 r=[r for r in rows if r['league']==league];train=[r for r in r if r['world']in [301,302]];test=[r for r in r if r['world']in [303,304]]
 if not train or not test:continue
 result={}
 for era in ['full','early']:
  target=lambda r:r[era]['efficiency'][0]-r[era]['efficiency'][1]
  result[era]={}
  for name,features in [('projectedOVR',lambda r:[qmean(r)]),('rotation',quality),('rotationAndObservedShotQuality',lambda r:quality(r)+[r[era]['expectedEfficiency'][0]-r[era]['expectedEfficiency'][1]]),('observedBox',lambda r:quality(r)+[r[era]['expectedEfficiency'][0]-r[era]['expectedEfficiency'][1]]+[r[era]['totals'][0].get(k,0)-r[era]['totals'][1].get(k,0)for k in ['tov','orb','fta']])]:
   result[era][name]=fit(train,test,features,target)
  pred=result[era]['rotation']['pred']
  for x,p in zip(test,pred):x[era]['rosterExpectedEfficiencyGap']=p;x[era]['rosterResidualEfficiencyGap']=target(x)-p
 result['marginPrediction']=fit(train,test,quality,lambda r:r['full']['margin'])
 result['oldSpread']={'MAE':float(np.mean([abs(r['full']['margin']+r['spread'])for r in test])),'RMSE':float(np.sqrt(np.mean([(r['full']['margin']+r['spread'])**2 for r in test])))}
 
 oldModel=prior[league]
 oldPrediction=lambda r:oldModel['intercept']+sum(v*(r['quality'][0][k]-r['quality'][1][k])for k,v in oldModel['coefficients'].items())
 err=np.array([r['full']['margin']-oldPrediction(r)for r in test]);result['retainedPhase4Model']={'MAE':float(np.abs(err).mean()),'RMSE':float(np.sqrt(np.mean(err**2))),'bias':float(err.mean())}
 result['qualityGroups']={}
 for lo,hi in [(0,2),(2,5),(5,10),(10,100)]:
  group=[r for r in test if lo<=abs(oldPrediction(r)-oldModel['intercept'])<hi]
  if group:result['qualityGroups'][f'{lo}-{hi}']={'n':len(group),'meanMargin':float(np.mean([abs(r['full']['margin'])for r in group])),'over20%':100*float(np.mean([abs(r['full']['margin'])>=20 for r in group])),'efficiencyGapSD':float(np.std([r['full']['efficiency'][0]-r['full']['efficiency'][1]for r in group]))}
 result['heldOutGames']=test;out[league]=result
(P/'model-analysis.json.gz').write_bytes(gzip.compress(json.dumps(out,indent=2).encode(),mtime=0));print('Model split worlds 301–302 training, 303–304 evaluation',[(l,v['marginPrediction']['testN'])for l,v in out.items()])
