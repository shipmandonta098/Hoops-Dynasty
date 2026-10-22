const assert=require('node:assert/strict'),base=require('./two-point-observers.cjs');
function instrument(name,source){
 let s=base.instrument(name,source);if(name!=='attributes.js')return s;
 function edit(a,b){assert.equal(s.split(a).length-1,1,a);s=s.replace(a,b)}
 edit('const transitionAdvantage=transitionTeam===side;transitionTeam=null;',"const transitionAdvantage=transitionTeam===side;const transitionEntry=__audit.enter(side,transitionAdvantage,machine.shotClock,extraBoards);transitionTeam=null;");
 edit('const shotContext={transition,',"__audit.flags.push({transition,actual:transitionAdvantage,tempo:plans[side].tempo});const shotContext={transition,");
 edit('auditShot.base=chance;',"Object.assign(auditShot,{origin:transitionAdvantage?transitionEntry.origin:transition?'coach tempo':'none',entry:transitionEntry,earlyThree:!!decision.earlyThree,pnrDetails:decision.pickAndRoll?{...decision.pickAndRoll}:null,shotClock:machine.shotClock,trace:[...machine.trace],window:clockWindow?{...clockWindow}:null,finishing:x('lay'),tempo:plans[side].tempo});auditShot.base=chance;");
 edit('auditShot.foul=true;',"auditShot.counterfactual=shotMakeProbability(Math.max(.05,Math.min(.65,(chance-(shot.layup==='Running Layup'?.055*leagueRules().shootingRate:0))*.7)),shot,homeCourt,side);auditShot.foul=true;");
 edit('auditShot.blocked=blocked;',"auditShot.counterfactual=shotMakeProbability(Math.max(.02,Math.min(.88,chance-(shot.layup==='Running Layup'?.055*leagueRules().shootingRate:0))),shot,homeCourt,side);auditShot.blocked=blocked;");
 edit("__audit.event('turnover');", "__audit.turnover(side,type,!!defender);__audit.event('turnover');");
 edit("__audit.event('foul');", "__audit.lastEvent={type:'defensive foul / dead ball',side:1-side};__audit.event('foul');");
 edit("if(!made&&i===count&&!technical&&!retain)finishRebound(side);", "__audit.lastEvent={type:made?'made final free throw':'missed free throw',side,technical,final:i===count};if(!made&&i===count&&!technical&&!retain)finishRebound(side);");
 edit('if(gameBoundary(minute))transitionTeam=null;',"if(gameBoundary(minute)){transitionTeam=null;__audit.pending=null;__audit.lastEvent={type:'start of period'};}");
 const looseReturn=s.includes('if(guiltySide===side)return;')?'if(guiltySide===side)return;':'if(guiltySide===side){terminalNextSide=1-side;return;}';
 edit(looseReturn+"machine.transition('decision');return possessionCore(side);",looseReturn+"__audit.lastEvent={type:'loose-ball foul / same-possession restart',side};machine.transition('decision');return possessionCore(side);");
 return s;
}
function createObserver(){
 const o=base.createObserver(),old={begin:o.begin,board:o.board,resolve:o.resolve};
 Object.assign(o,{flags:[],entries:[],pending:null,lastEvent:{type:'start of game'},
 begin(side){old.begin.call(this,side);this.current.entryCount=0;this.current.preceding={...this.lastEvent};},
 enter(side,actual,clock,extraBoards){
  const r={side,actual,clock,extraBoards,recursive:this.current.entryCount++>0,preceding:{...this.lastEvent},rootPreceding:this.current.preceding,origin:actual?this.pending?.origin:'none'};
  if(actual)assert(this.pending?.side===side,'event transition must have known causal source');
  this.pending=null;this.entries.push(r);return r;
 },
 turnover(side,type,steal){this.lastEvent={type:steal?'steal':'turnover without steal',detail:type,side};if(steal)this.pending={side:1-side,origin:'steal'};},
 board(b,side,source){const previous=this.lastEvent;old.board.call(this,b,side,source);const cause=previous.type==='missed free throw'?'missed free throw':previous.type==='blocked shot'?'blocked shot':previous.path==='putback'||previous.path==='kickout'?'secondary missed shot':'primary missed shot';this.lastEvent={type:b.offensive?'offensive rebound':'defensive rebound',cause,side:b.offensive?side:1-side};if(!b.offensive)this.pending={side:1-side,origin:cause+' + defensive rebound'};},
 resolve(r,made,recorded){old.resolve.call(this,r,made,recorded);this.lastEvent={type:made?'made basket':r.blocked?'blocked shot':'missed basket',side:r.side,path:r.path};}
 });return o;
}
module.exports={instrument,createObserver};
