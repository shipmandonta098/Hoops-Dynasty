// Read-only instrumentation. Draw wrappers consume exactly the original RNG draw.
module.exports=function(name,s){
 if(name.split('?')[0]!=='attributes.js')return s;
 const rep=(a,b)=>{if(!s.includes(a))throw Error('Missing '+a);s=s.replace(a,b)};
 rep('function freeThrows(side,p,count,technical=false,retain=false){',`function auditDraw(prob,meta){const u=Math.random(),made=u<prob;if(globalThis.p6draws)globalThis.p6draws.push({...meta,prob,made,time:elapsedSeconds});return made;}
 function auditSnapshot(){return clubs.map(c=>Object.fromEntries(['pts','fga','fgm','tpa','tpm','fta','ftm','orb','drb','tov','pf'].map(k=>[k,c.roster.reduce((n,p)=>n+(rows.get(p.id)[k]||0),0)])))}
 function freeThrows(side,p,count,technical=false,retain=false){`);
 const calls=[
 ['homeCourtProbability(leagueProbability(.40+p.attributes.ft*.005,\'ftAccuracy\'),homeCourt,side,true)',"{side,origin:'ft',value:1,player:p.id,kind:'ft'}"],
 ["shotMakeProbability(Math.max(.05,Math.min(.65,chance*(modernFoulContext?(state.leagueGender==='female'?.35:.45):.7))),shot,homeCourt,side)","{side,origin:'foul',value:shotValue,kind,player:p.id,off:layupRating(shot,x),def:kind==='inside'?y('rim'):y('per'),contest,open:!!decision.openLook,assisted:!!decision.lastPasser,selfCreated:!!shot.selfCreated,transition,late:machine.shotClock<=5,fatigue:progress,coachOff:plans[side].off,coachDef:plans[1-side].def}"],
 ["shotMakeProbability(Math.max(.02,Math.min(.88,chance)),shot,homeCourt,side)","{side,origin:'primary',value:shotValue,kind,player:p.id,off:layupRating(shot,x),def:kind==='inside'?y('rim'):y('per'),contest,open:!!decision.openLook,assisted:!!decision.lastPasser,selfCreated:!!shot.selfCreated,transition,late:machine.shotClock<=5,fatigue:progress,raw:chance,coachOff:plans[side].off,coachDef:plans[1-side].def}"],
 ["shotMakeProbability(basketballShotProbability({kind:'inside'},finish(putbackDunk?'dnk':'lay'),y('rim'))*leagueRules().shootingRate,{skill:putbackDunk?'dnk':'lay',kind:'inside'},homeCourt,side)","{side,origin:'putback',value:2,kind:'inside',player:rebounder.id,off:finish(putbackDunk?'dnk':'lay'),def:y('rim')}"],
 ["shotMakeProbability(success*leagueRules().shootingRate,kick,homeCourt,side)","{side,origin:'kickout',value,kind:kick.kind,player:receiver.id,off:layupRating(kick,finish),def:kick.kind==='inside'?y('rim'):y('per')}"],
 ];
 for(const [call,meta]of calls)rep('Math.random()<'+call,'auditDraw('+call+','+meta+')');
 rep('if(blocked){featAction',"if(blocked){if(globalThis.p6draws)globalThis.p6draws.push({side,origin:'block',kind,value:shotValue,prob:0,made:false,time:elapsedSeconds});featAction");
 rep('if(denied){dr.blk++',"if(denied){if(globalThis.p6draws)globalThis.p6draws.push({side,origin:'blockPutback',kind:'inside',value:2,prob:0,made:false,time:elapsedSeconds});dr.blk++");
 rep('if(kickBlocked){dr.blk++',"if(kickBlocked){if(globalThis.p6draws)globalThis.p6draws.push({side,origin:'blockKickout',kind:kick.kind,value,prob:0,made:false,time:elapsedSeconds});dr.blk++");
 rep('function possession(side){',`function possession(side){const p6start=elapsedSeconds,p6before=auditSnapshot(),p6drawStart=globalThis.p6draws?.length||0;`);
 rep('machine.finish();',`if(globalThis.p6slots)globalThis.p6slots.push({side,start:p6start,end:elapsedSeconds,score:[...scores],stats:auditSnapshot().map((t,i)=>Object.fromEntries(Object.keys(t).map(k=>[k,t[k]-p6before[i][k]]))),trace:[...machine.trace],drawStart:p6drawStart,drawEnd:globalThis.p6draws?.length||0});machine.finish();`);
 return s;
};
