const assert=require('node:assert/strict');
// Observation-only source instrumentation; never written into the shipped engine.
function instrument(name,source){
 if(name==='pick-and-roll.js'){const anchor='const helpArrives=Math.random()<rotationChance;';assert.equal(source.split(anchor).length-1,1);return source.replace(anchor,anchor+'__audit.help=helpArrives;');}
 if(name!=='attributes.js')return source;
 let s=source;
 s=s.replace('function possessionCore(side){','function possessionCore(side){__audit.help=null;');
 function replace(a,b){assert.equal(s.split(a).length-1,1,'unique observation anchor: '+a.slice(0,75));s=s.replace(a,b)}
 replace("function addScore(side,points){scores[side]+=points;", "function addScore(side,points){__audit.score(side,points);scores[side]+=points;");
 replace("function recordTurnover(side,type,p,defender=null){", "function recordTurnover(side,type,p,defender=null){__audit.event('turnover');");
 replace("function defensiveFoul(side,p,d,label,shots=0,retain=false){", "function defensiveFoul(side,p,d,label,shots=0,retain=false){__audit.event('foul');");
 replace("function possession(side){homeCourtTick(homeCourt);", "function possession(side){__audit.begin(side);homeCourtTick(homeCourt);");
 replace("machine.finish();if(machine.trace", "__audit.end();machine.finish();if(machine.trace");
 replace("const buildMatch=physicalMatchup(p,d,decision.action,kind,contest);", `const buildMatch=physicalMatchup(p,d,decision.action,kind,contest);
 const auditShot=__audit.shot({path:extraBoards?'recursive':'primary',side,kind,skill:shot.skill,key:shot.key,name:shot.layup||shot.key,shot:{...shot},shooter:p.id,defender:d.id,rating:layupRating(shot,x),rawRating:layupRating(shot,k=>p.attributes[k]),dunkRating:p.attributes.dnk,rim:y('rim'),rawRim:d.attributes.rim,defense:(kind==='inside'?y('rim'):y('per'))*buildMatch.contestScale,contest,sag,transition,help:__audit.help,noFatigueRating:layupRating(shot,k=>effectiveAttribute(p,k,0,minuteMap.get(p.id)>=30,moraleModifiers.get(p.id)+(hasTrait(p,'fiery')&&(stage!=='Regular season'||gameProgress>.8&&Math.abs(scores[0]-scores[1])<=8)?3:0))),defenderPosition:d.pos,openLook:!!decision.openLook,action:decision.action,pnr:!!decision.pickAndRoll,progress,defProgress,physical:{...buildMatch},mods:{}});`);
 replace("if(buildMatch.post>0)log", "auditShot.base=chance;auditShot.ratingBase=basketballShotProbability(shot,layupRating(shot,x),(kind==='inside'?y('rim'):y('per'))*buildMatch.contestScale);if(buildMatch.post>0)log");
 const mods=[
 ['moraleClutch',"moraleClutchBonus(p,gameRotations[side].minute,scores[0]-scores[1])"],
 ['miscommunication',"(miscommunication&&kind==='three'?.04:0)"],
 ['isolation','isoAdjustment'],['pickAndRoll',"(decision.pickAndRoll?.shotAdjustment||0)"],['screenBoost',"(decision.pickAndRoll?.boost||0)*.001"],
 ['workload',"(kind==='three'||kind==='mid'?-workloads[side].shoot:0)"],['lineup','lineup.shot'],['shotVariant','shot.adjustment'],['forced',"-(decision.forced?.035:0)"],
 ['individualIQ',"(x('oiq')-y('diq'))*.0004"],['teamIQ',"(teamIQ-70)*.0002"],['rivalry',"(offense.id===a?(activeRivalry?.split?0:rivalryHomeAdjustment()):0)"],
 ['contest',"contest?-(.015+(kind==='three'?y('per')*.0006:0))*(shot.contestMultiplier||1):.015"],
 ['sag',"sag?(kind==='three'?0:kind==='inside'?-.02:0):0"],['defensivePlan',"-(defensivePlan?.018:0)"],
 ['coach',"(plans[side].off-plans[1-side].def)*.0004"],['fit',"Math.max(0,plans[side].fit-60)*.0002"],['timeout',"-(adjustments[1-side]>0?.015:0)"],['focus',"offense.id===0&&state.focus==='Defense'?-.008:0"],
 ['archetype','archetypeShotAdjustment(p,shot,decision,lineup)']];
 // Replace complete context block, preserving arithmetic order and exactly-once evaluation.
 const start=s.indexOf(' chance+=moraleClutchBonus'),end=s.indexOf(' chance*=leagueRules().shootingRate;',start);
 assert(start>0&&end>start);
 const add=(key,expr)=>`chance+=__audit.add(auditShot,'${key}',(${expr}));`;
 s=s.slice(0,start)+' '+mods.map(([key,expr])=>add(key,expr)+(key==='timeout'?'if(adjustments[1-side]>0)adjustments[1-side]--;':'')).join('\n ')+'\n auditShot.context=chance;\n'+s.slice(end);
 replace("const made=Math.random()<shotMakeProbability(Math.max(.05,Math.min(.65,chance*.7)),shot,homeCourt,side);", "auditShot.foul=true;const made=Math.random()<__audit.prob(auditShot,shotMakeProbability(Math.max(.05,Math.min(.65,chance*.7)),shot,homeCourt,side));if(!made)__audit.resolve(auditShot,false,false);");
 replace("if(blocked){dr.blk++;", "auditShot.blocked=blocked;auditShot.blockRisk=tendency(d,'block')*Math.min(.6,blockChance*2*(moraleMatchScore(d)>=90?1.15:1)*(shot.blockMultiplier||1)*(1+buildMatch.recovery*10));auditShot.prob=shotMakeProbability(Math.max(.02,Math.min(.88,chance)),shot,homeCourt,side);if(blocked){dr.blk++;");
 // Primary sites only; secondary uses object literal or kick.
 s=s.replaceAll('trackShot(shot,true);', '__audit.resolve(auditShot,true,true);trackShot(shot,true);');
 replace('trackShot(shot,false);','__audit.resolve(auditShot,false,true);trackShot(shot,false);');
 replace("rebounder=board.player;if(board.offensive)","rebounder=board.player;__audit.board(board,side,'primaryMiss');if(board.offensive)");
 replace("p=board.player,row=rows.get(p.id);row.reb++;", "p=board.player,row=rows.get(p.id);__audit.board(board,side,'finishRebound');row.reb++;");
 replace("if(board.offensive){extraBoards++;machine.shotClock", "if(board.offensive){__audit.route('recursive');extraBoards++;machine.shotClock");
 replace("{machine.shotClock=14;machine.transition('shot');const rr=rows.get(rebounder.id)","{__audit.route('putback');machine.shotClock=14;machine.transition('shot');const rr=rows.get(rebounder.id)");
 replace("rr.fga++;const denied=",`const auditPut=__audit.shot({path:'putback',side,kind:'inside',skill:putbackDunk?'dnk':'lay',key:putbackDunk?'putbackDunk':'putbackLayup',name:finishName,shooter:rebounder.id,defender:d.id,rating:putbackDunk?ar.dnk:ar.lay,rawRating:putbackDunk?ar.dnk:ar.lay,dunkRating:ar.dnk,rim:y('rim'),rawRim:d.attributes.rim,contest:null,blockRisk:putbackDunk?tendency(d,'block')*.08:0,mods:{}});auditPut.base=basketballShotProbability({kind:'inside'},auditPut.rating,y('rim'));auditPut.context=auditPut.base;auditPut.prob=shotMakeProbability(auditPut.base*leagueRules().shootingRate,{skill:auditPut.skill,kind:'inside'},homeCourt,side);rr.fga++;const denied=`);
 replace("if(denied)dr.blk++;", "auditPut.blocked=!!denied;if(denied)dr.blk++;");
 replace("trackShot({kind:'inside'},true);", "__audit.resolve(auditPut,true,true);trackShot({kind:'inside'},true);");
 replace("trackShot({kind:'inside'},false);", "__audit.resolve(auditPut,false,true);trackShot({kind:'inside'},false);");
 replace("else if(offense.roster.includes(rebounder)){machine.shotClock", "else if(offense.roster.includes(rebounder)){__audit.route('kickout');machine.shotClock");
 replace("log(side,rebounder.name+' kicks the ball out", "const auditKick=__audit.shot({path:'kickout',side,kind:kick.kind,skill:kick.skill,key:kick.key,name:kick.layup||kick.key,shooter:receiver.id,defender:d.id,rating:layupRating(kick,k=>receiver.attributes[k]),rawRating:layupRating(kick,k=>receiver.attributes[k]),dunkRating:receiver.attributes.dnk,rim:y('rim'),rawRim:d.attributes.rim,contest:null,mods:{}});log(side,rebounder.name+' kicks the ball out");
 replace("if(Math.random()<shotMakeProbability(success*leagueRules().shootingRate,kick,homeCourt,side))", "auditKick.base=basketballShotProbability(kick,auditKick.rating,kick.kind==='inside'?y('rim'):y('per'));auditKick.context=success;auditKick.prob=shotMakeProbability(success*leagueRules().shootingRate,kick,homeCourt,side);if(Math.random()<shotMakeProbability(success*leagueRules().shootingRate,kick,homeCourt,side))");
 replace('trackShot(kick,true);', '__audit.resolve(auditKick,true,true);trackShot(kick,true);');replace('trackShot(kick,false);', '__audit.resolve(auditKick,false,true);trackShot(kick,false);');
 return s;
}
function createObserver(){return {
 shots:[],boards:[],possessions:[],current:null,totalPoints:0,otherPoints:0,help:null,
 begin(side){this.current={side,points:0,secondPoints:0,boards:[],shots:[],events:[]};this.possessions.push(this.current)},
 end(){this.current=null},
 score(side,points){this.totalPoints+=points;if(this.current?.side!==side)this.otherPoints+=points;if(this.current?.side===side){this.current.points+=points;if(this.current.boards.length)this.current.secondPoints+=points}},
 event(type){if(this.current){this.current.events.push(type);const b=this.current.boards.at(-1);if(b&&!b.nextEvent)b.nextEvent=type}},
 board(b,side,source){const row={offensive:b.offensive,side,source,player:b.player.id,route:null,nextEvent:null};this.boards.push(row);if(b.offensive)this.current?.boards.push(row)},
 route(route){const b=this.current?.boards.at(-1);if(b)b.route=route},
 shot(data){const r={...data,made:false,recorded:false,foul:false,blocked:false};this.shots.push(r);this.current?.shots.push(r);const b=this.current?.boards.at(-1);if(b&&!b.nextEvent){b.nextEvent='shot';b.nextShot=r;}return r},
 add(r,key,value){r.mods[key]=value;return value},prob(r,value){r.prob=value;return value},resolve(r,made,recorded){r.made=made;r.recorded=recorded;r.resolved=true}
}}
module.exports={instrument,createObserver};
