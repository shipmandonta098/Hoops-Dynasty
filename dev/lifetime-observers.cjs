const assert=require('node:assert/strict'),prior=require('./transition-observers.cjs');
function instrument(name,source){let s=prior.instrument(name,source);
 function edit(a,b){assert.equal(s.split(a).length-1,1,'lifetime anchor '+a);s=s.replace(a,b)}
 if(name==='possession-engine.js')edit('transition(next,seconds=0){','transition(next,seconds=0){__audit.phase(this,next,seconds);');
 if(name==='attributes.js'){
  edit('auditShot.base=chance;','__audit.bindShot(auditShot,{shooterName:p.name,defenderName:d.name,finishing:x(\'lay\'),defense:y(\'rim\'),clock:machine.shotClock});auditShot.base=chance;');
  edit('if(iso){','if(iso){__audit.semantic(\'ISO\',{post:!!iso.post,reason:iso.reason});');
  edit('if(help){d=help;','if(help){__audit.semantic(\'help defense\',{defender:help.id});d=help;');
  edit("function defensiveFoul(side,p,d,label,shots=0,retain=false){","function defensiveFoul(side,p,d,label,shots=0,retain=false){__audit.semantic('foul',{label,shots,retain});");
  edit("transitionTeam=null;__audit.pending=null;","transitionTeam=null;__audit.clearPending('period boundary');");
 }
 if(name==='pick-and-roll.js'){
  edit('const machine=context.machine,advance=',"__audit.semantic('PNR start',{});const machine=context.machine,advance=");
  edit("const screen=pnrScreen(screener,onBall,coachFor(offense).attributes.discipline);","const screen=pnrScreen(screener,onBall,coachFor(offense).attributes.discipline);__audit.semantic('screen',{quality:screen.quality});");
 }return s;
}
function createObserver(game){const o=prior.createObserver(),old=Object.fromEntries(['begin','end','enter','turnover','board'].map(k=>[k,o[k]]));
 Object.assign(o,{game,opportunities:[],timeline:[],rootSequence:0,
  push(e){const r={i:this.timeline.length,root:this.current?.rootId??null,side:this.current?.side??null,...e};this.timeline.push(r);this.current?.actions.push(r);return r;},
  begin(side){old.begin.call(this,side);Object.assign(this.current,{rootId:this.rootSequence++,actions:[],opportunities:[],activeOpportunity:null});},
  phase(machine,next,seconds){this.push({type:'phase',phase:next,seconds,before:machine.shotClock,after:Math.max(0,machine.shotClock-seconds)});},
  semantic(type,detail){this.push({type,...detail});},
  originate(){const token=this.pending;if(!token)return;const marker=this.push({type:'trigger',origin:token.origin,targetSide:token.side});const op={id:this.opportunities.length,game,origin:token.origin,side:token.side,trigger:marker,status:'pending',root:null,entry:null};token.id=op.id;this.opportunities.push(op);},
  clearPending(reason){if(this.pending?.id!==undefined){const op=this.opportunities[this.pending.id];if(op.status==='pending')op.status='unused: '+reason;}this.pending=null;},
  enter(side,actual,clock,extraBoards){const token=this.pending,entryIndex=this.timeline.length;
   const entry=old.enter.call(this,side,actual,clock,extraBoards);entry.timelineIndex=entryIndex;
   if(token?.id!==undefined){const op=this.opportunities[token.id];if(actual){op.status='consumed';op.root=this.current;op.entry=entry;entry.opportunityId=op.id;this.current.opportunities.push(op.id);this.current.activeOpportunity=op.id;}else op.status='unused: next entry wrong side';}
   this.push({type:'core entry',actual,recursive:entry.recursive,clock,extraBoards});return entry;
  },
  turnover(side,type,steal){this.push({type:'turnover',turnover:type,steal,offenseSide:side});if(steal)this.clearPending('overwritten by steal');old.turnover.call(this,side,type,steal);if(steal)this.originate();},
  board(board,side,source){if(!board.offensive)this.clearPending('overwritten by defensive rebound');old.board.call(this,board,side,source);this.push({type:board.offensive?'OREB':'DREB',source,player:board.player.id});if(!board.offensive)this.originate();},
  bindShot(shot,detail){Object.assign(shot,detail,{opportunityId:this.current?.activeOpportunity,at:this.timeline.length});this.push({type:'shot evaluation',name:shot.name,clock:shot.clock,actual:shot.entry?.actual});},
  end(){if(this.current){this.current.endEvent={...this.lastEvent};this.current.endIndex=this.timeline.length;}old.end.call(this);},
  finish(){this.clearPending('game ended');assert(this.opportunities.every(p=>p.status!=='pending'));}
 });return o;
}
module.exports={instrument,createObserver};
