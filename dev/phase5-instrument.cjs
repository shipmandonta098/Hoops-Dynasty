const fs=require('fs');
module.exports=function(name,s){
 name=name.split('?')[0];
 if(process.env.P5_BASELINE==='1'&&fs.existsSync('dev/phase5/baseline-dist/'+name))s=fs.readFileSync('dev/phase5/baseline-dist/'+name,'utf8');
 const rep=(a,b)=>{if(!s.includes(a))throw Error('Missing instrumentation anchor '+a);s=s.replace(a,b)};
 if(name==='attributes.js'){
  rep('function possession(side){','function possession(side){const auditStart={side,start:elapsedSeconds,end:clockWindow?.end,before:[...scores],fga:[...rows.values()].reduce((n,r)=>n+r.fga,0),fta:[...rows.values()].reduce((n,r)=>n+r.fta,0),action:featActions.length};');
  rep('machine.finish();',`if(globalThis.p5slots)globalThis.p5slots.push({...auditStart,finish:elapsedSeconds,after:[...scores],shotClock:machine.shotClock,consumed:machine.auditConsumed||0,trace:[...machine.trace],fga:[...rows.values()].reduce((n,r)=>n+r.fga,0)-auditStart.fga,fta:[...rows.values()].reduce((n,r)=>n+r.fta,0)-auditStart.fta,events:featActions.slice(auditStart.action).map(e=>({...e}))});machine.finish();`);
  rep('chance*=leagueRules().shootingRate;',`if(globalThis.p5shots)globalThis.p5shots.push({side,kind,key:shot.key,open:!!decision.openLook,contest,assisted:!!decision.lastPasser,selfCreated:!!shot.selfCreated,forced:!!decision.forced,clock:machine.shotClock,off:layupRating(shot,x),def:kind==='inside'?y('rim'):y('per'),fatigue:progress,adjustment:shot.adjustment,probability:chance*leagueRules().shootingRate});chance*=leagueRules().shootingRate;`);
 }
 if(name==='possession-engine.js')rep("transition(next,seconds=0){", "transition(next,seconds=0){this.auditConsumed=(this.auditConsumed||0)+seconds;");
 return s;
};
