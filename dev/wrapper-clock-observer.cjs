const prior=require('./putback-block-observer.cjs'),assert=require('assert/strict');
function instrument(n,s){s=prior.instrument(n,s);
 if(n==='tendencies.js'){
 const edits=[["c.machine.transition('pass',3)","__audit.wrapperMove(c.machine,'pass',3,{early,pass,handler:handler.id,shooter:shooter.id})"],["c.machine.transition('shot',early?3:5)","__audit.wrapperMove(c.machine,'shot',early?3:5,{early,pass,handler:handler.id,shooter:shooter.id})"]];
 for(const [a,b] of edits){assert.equal(s.split(a).length-1,1,a);s=s.replace(a,b)}
 }
 if(n==='attributes.js'){
 const a='function possessionCore(side){';assert.equal(s.split(a).length-1,1);s=s.replace(a,`__audit.snapshot=()=>({scores:[...scores],rows:[...rows],state,extraBoards,terminalNextSide,crossSideBonus,transitionTeam,clock:machine.shotClock,phase:machine.phase,window:clockWindow,elapsedSeconds,rotations:gameRotations.map(r=>({...r,court:[...r.court],stamina:[...r.stamina]}))});\n${a}`);
 }
 return s;
}
function observer(game){const o=prior.observer(game),oldEnd=o.end,oldBegin=o.begin,oldTurn=o.turnover;
 Object.assign(o,{wrapper:[],rootHashes:[],clockTurns:[],
 begin(side){oldBegin.call(this,side);this.rootShotStart=this.shots.length;this.rootRng=this.rngCount},
 wrapperMove(machine,phase,seconds,details){const before=machine.shotClock,ok=machine.transition(phase,seconds);const e=this.log('wrapper transition',{phase,seconds,before,after:machine.shotClock,ok,...details,rng:this.rngCount});this.wrapper.push(e);if(!ok){e.snapshotHash=prior.hash(this.snapshot());e.prefixHash=prior.hash(this.events.slice(0,e.index+1));e.shotCount=this.shots.length;}return ok},
 turnover(side,type,steal){oldTurn.call(this,side,type,steal);if(type==='shotClock')this.clockTurns.push({root:this.current.rootId,side,steal,pending:this.pending?{side:this.pending.side,origin:this.pending.origin}:null,rng:this.rngCount,index:this.events.length-1})},
 end(){const root=this.current.rootId,start=this.roots.at(-1).start;const ev=this.events.slice(start).map(({index,root,...e})=>e);this.rootHashes.push({root,side:this.current.side,rngStart:this.rootRng,rngEnd:this.rngCount,traceHash:prior.hash(ev),shotHash:prior.hash(this.shots.slice(this.rootShotStart).map(({entry,at,opportunityId,window,trace,...s})=>s)),points:this.roots.at(-1).points});oldEnd.call(this)}
 });return o;
}module.exports={instrument,observer,hash:prior.hash};
