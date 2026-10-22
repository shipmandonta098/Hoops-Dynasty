const assert=require('node:assert/strict'),crypto=require('node:crypto'),prior=require('./audit-token-order.cjs');
const hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function instrument(n,s){s=prior.instrument(n,s);if(n!=='attributes.js')return s;
 function edit(a,b){assert.equal(s.split(a).length-1,1,a);s=s.replace(a,b)}
 edit('__audit.begin(side);','__audit.slot(side,clockWindow,possessions,gameRotations[side].minute);__audit.begin(side);');
 edit('rr.fga++;const denied=',`rr.fga++;
 const putProgress=(100-gameRotations[side].stamina.get(rebounder.id))/30;
 const putPhysical=k=>effectiveAttribute(rebounder,k,putProgress,minuteMap.get(rebounder.id)>=30,moraleModifiers.get(rebounder.id));
 __audit.beforePut(auditPut,{dunk:putbackDunk,blockTendency:tendency(d,'block'),rim:y('rim'),sbl:y('sbl'),hgt:y('hgt'),jmp:y('jmp'),rawRim:d.attributes.rim,rawBlock:d.attributes.sbl,defenderName:d.name,shooterName:rebounder.name,strength:putPhysical('stre'),jump:putPhysical('jmp'),highMorale:moraleMatchScore(d)>=90},{scores:[...scores],rows:[...rows],extraBoards,clock:machine.shotClock,phase:machine.phase,stamina:gameRotations.map(g=>[...g.stamina])});
 const denied=`);
 edit('auditPut.blocked=!!denied;','__audit.afterBlock(auditPut,!!denied);auditPut.blocked=!!denied;');
 edit('const result={shotDistribution,','__audit.finalClock={elapsedSeconds,overtime};const result={shotDistribution,');
 return s;
}
function observer(game){const o=prior.observer(game),old={};for(const k of ['begin','board','score','resolve','coreStart','turnover','ftStart'])old[k]=o[k];
 Object.assign(o,{rngCount:0,slots:[],puts:[],secondPoints:0,scSide:null,activeBlocked:[],awaitingBoard:null,
 slot(side,window,target,minute){this.slots.push({side,...window,target,minute})},
 begin(side){this.scSide=null;this.activeBlocked=[];old.begin.call(this,side)},
 coreStart(side,...args){if(this.scSide!==side)this.scSide=null;if(this.activeBlocked.length&&this.activeBlocked[0].side!==side)this.activeBlocked=[];for(const b of this.activeBlocked)if(b.nextBoard?.offensive)b.recursiveAfter=true;old.coreStart.call(this,side,...args)},
 beforePut(shot,inputs,snapshot){const r={...inputs,side:shot.side,root:this.current.rootId,shotIndex:this.shots.indexOf(shot),rngStart:this.rngCount,clock:snapshot.clock,preStateHash:hash(snapshot)};
  const chance=Math.max(.005,.025+(inputs.sbl+inputs.hgt+inputs.jmp-inputs.strength-inputs.jump)*.0003);
  r.primaryLayupConditional=Math.min(.6,chance*2*(inputs.highMorale?1.15:1));r.primaryLayupBlockRate=inputs.blockTendency*r.primaryLayupConditional;
  shot.putbackRecord=r;this.puts.push(r);for(const b of this.activeBlocked)b.repeatPutbacks++;
  const e=this.log('putback resolution boundary',{...r});r.eventIndex=e.index;
 },
 afterBlock(shot,denied){const r=shot.putbackRecord;r.blockDraws=this.rngCount-r.rngStart;r.denied=denied;shot.blockRisk=r.dunk?r.blockTendency*.08:(r.blockDraws?r.primaryLayupBlockRate:0);this.log('putback block resolved',{denied,draws:r.blockDraws});},
 resolve(s,made,recorded){old.resolve.call(this,s,made,recorded);if(s.path==='putback'){const r=s.putbackRecord;Object.assign(r,{made,recorded,makeProbability:s.prob,blockRate:s.blockRisk,postRng:this.rngCount});if(s.blocked){r.repeatPutbacks=0;r.recursiveAfter=false;this.activeBlocked.push(r);this.awaitingBoard=r;}}
  if(made)this.activeBlocked=[];
 },
 board(b,side,source){old.board.call(this,b,side,source);if(this.awaitingBoard){this.awaitingBoard.nextBoard={offensive:b.offensive,owner:b.offensive?side:1-side,player:b.player.name,source,clock:14};this.awaitingBoard=null;}
  if(b.offensive)this.scSide=side;else {this.scSide=null;this.activeBlocked=[];}
 },
 score(side,points){if(this.scSide===side)this.secondPoints+=points;old.score.call(this,side,points)},
 turnover(...args){this.scSide=null;this.activeBlocked=[];old.turnover.call(this,...args)},
 ftStart(side,...args){if(side!==this.scSide)this.scSide=null;old.ftStart.call(this,side,...args)}
 });return o;
}
module.exports={instrument,observer,hash};
