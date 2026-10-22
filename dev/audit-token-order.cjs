const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs'),prior=require('./lifetime-observers.cjs');
function instrument(name,s){s=prior.instrument(name,s);if(name!=='attributes.js')return s;
 function edit(a,b){assert.equal(s.split(a).length-1,1,a);s=s.replace(a,b)}
 edit('function possessionCore(side){','function possessionCore(side){__audit.coreStart(side,machine.shotClock,transitionTeam);try{');
 edit(' }\n function finishRebound(side)'," }finally{__audit.coreEnd(side,machine.shotClock,[...scores]);}}\n function finishRebound(side)");
 edit('function freeThrows(side,p,count,technical=false,retain=false){',"function freeThrows(side,p,count,technical=false,retain=false){__audit.ftStart(side,p.name,count,technical,retain);");
 edit("__audit.lastEvent={type:made?'made final free throw':'missed free throw'", "__audit.ftResult(side,p.name,i,count,made,technical,retain,machine.shotClock);__audit.lastEvent={type:made?'made final free throw':'missed free throw'");
 edit("const bonus=personal(guiltySide,offender,'loose ball personal');", "const bonus=personal(guiltySide,offender,'loose ball personal');__audit.loose(side,guiltySide,bonus,offender.name,recipient.name);");
 edit("transitionTeam=null;__audit.clearPending('period boundary');", "transitionTeam=null;__audit.clearPending('period boundary');__audit.expected=null;");
 return s;
}
function observer(game){const o=prior.createObserver(game),old={};for(const k of ['begin','end','board','turnover','resolve','score','semantic'])old[k]=o[k];
 Object.assign(o,{events:[],stack:[],expected:null,roots:[],mismatches:[],
 log(type,data={}){const x={index:this.events.length,root:this.current?.rootId??null,rootSide:this.current?.side??null,coreSide:this.stack.at(-1)?.side??null,depth:this.stack.length,...data,type};this.events.push(x);return x},
 begin(side){old.begin.call(this,side);const root={id:this.current.rootId,side,start:this.events.length,points:[0,0]};this.roots.push(root);this.log('root start',{side,expected:this.expected?{...this.expected}:null});},
 end(){this.log('root end',{expected:this.expected?{...this.expected}:null});this.roots.at(-1).end=this.events.length;old.end.call(this);},
 coreStart(side,clock,token){const e=this.log('core entry',{side,clock,token,recursive:this.stack.length>0,expected:this.expected?{...this.expected}:null});if(this.expected&&this.expected.side!==side){this.mismatches.push({...e});}this.stack.push({side,index:e.index});this.expected={side,reason:'core active',event:e.index};},
 coreEnd(side,clock,scores){this.log('core exit',{side,clock,scores,expected:this.expected?{...this.expected}:null});this.stack.pop();},
 board(b,side,source){old.board.call(this,b,side,source);const owner=b.offensive?side:1-side,e=this.log(b.offensive?'OREB':'DREB',{shootingSide:side,owner,source,player:b.player.name,token:this.pending?{...this.pending}:null});this.expected={side:owner,reason:e.type,event:e.index};},
 turnover(side,type,steal){old.turnover.call(this,side,type,steal);const e=this.log('turnover',{side,turnover:type,steal,token:this.pending?{...this.pending}:null});this.expected={side:1-side,reason:'turnover',event:e.index};},
 resolve(r,made,recorded){old.resolve.call(this,r,made,recorded);const e=this.log('shot result',{side:r.side,name:r.name,path:r.path,made,recorded,blocked:r.blocked,foul:r.foul,clock:r.clock,actual:r.entry?.actual});if(made)this.expected={side:1-r.side,reason:'made FG',event:e.index};},
 score(side,points){old.score.call(this,side,points);this.log('score',{side,points});if(this.roots.length)this.roots.at(-1).points[side]+=points;},
 ftStart(side,player,count,technical,retain){this.log('FT start',{side,player,count,technical,retain});},
 ftResult(side,player,number,count,made,technical,retain,clock){const e=this.log('FT result',{side,player,number,count,made,technical,retain,clock});if(number===count&&!technical&&!retain&&made)this.expected={side:1-side,reason:'made final FT',event:e.index};},
 loose(side,guiltySide,bonus,offender,recipient){const e=this.log('loose-ball foul',{side,guiltySide,bonus,offender,recipient});if(!bonus)this.expected={side:1-guiltySide,reason:'nonbonus loose-ball foul',event:e.index};},
 semantic(type,data){old.semantic.call(this,type,data);this.log(type,data);}
 });return o;
}
module.exports={instrument,observer};
if(require.main===module){
const expected=JSON.parse(fs.readFileSync('dev/running-adopted-baseline.json'));
assert.equal(JSON.parse(fs.readFileSync('dev/running-clock-adoption-verification.json')).acceptedCandidateReproduction,'EXACT MATCH');
const raw=loadLeague({strictDOM:false}),vm=loadLeague({strictDOM:false,sourceTransform:instrument});
raw.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");const fixture=JSON.parse(raw.run('JSON.stringify(fixture)'));vm.context.fixture=fixture;
let circle=Array.from({length:30},(_,i)=>i),pairs=[];for(let round=0;round<10;round++){for(let i=0;i<15;i++){const p=[circle[i],circle[29-i]];pairs.push(round%2?p.reverse():p)}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)]}
const result={tokens:[],wrongSide:[],ownershipMismatches:[],oppositeFT:[],running:{evaluations:0,FGA:0,makes:0,below14:0,tempoOnly:0,PNR:0},totals:Object.fromEntries(Object.keys(expected.totals).map(k=>[k,0])),parity:0};
const start=performance.now();
for(let i=0;i<150;i++){
 const [a,b]=pairs[i],run=r=>{r.run(`state=copy(fixture);simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);return JSON.parse(JSON.stringify(r.run(`play(${a},${b})`)))};
 const o=observer(i);vm.context.__audit=o;const g=run(vm);assert.deepEqual(g,run(raw));assert.equal(vm.run('JSON.stringify(state)'),raw.run('JSON.stringify(state)'));o.finish();result.parity++;
 const meta={seed:100000+i,teamIds:[a,b],teams:[fixture.teams[a].name,fixture.teams[b].name],score:[g.sa,g.sb]};
 const traceFor=root=>{const from=Math.max(0,root-1),to=Math.min(o.roots.length-1,root+2);return o.events.slice(o.roots[from].start,o.roots[to].end)};
 for(const t of o.opportunities){const compact={...meta,id:t.id,origin:t.origin,side:t.side,status:t.status,triggerRoot:t.trigger.root,entrySide:t.entry?.side??null,recursive:t.entry?.recursive??null};result.tokens.push(compact);if(t.status==='unused: next entry wrong side')result.wrongSide.push({...compact,trace:traceFor(t.trigger.root)});}
 for(const m of o.mismatches)result.ownershipMismatches.push({...meta,...m,trace:traceFor(m.root)});
 for(const e of o.events.filter(e=>e.type==='FT start'&&!e.technical&&!e.retain&&e.side!==e.rootSide))result.oppositeFT.push({...meta,...e,trace:traceFor(e.root)});
 for(const s of o.shots.filter(s=>s.name==='Running Layup')){let r=result.running;r.evaluations++;r.FGA+=+s.recorded;r.makes+=+s.made;r.below14+=+(s.clock<14);r.tempoOnly+=+!s.entry.actual;r.PNR+=+s.pnr;}
 for(const row of g.box)for(const k in result.totals)result.totals[k]+=row[k]||0;
 if((i+1)%25===0)console.log('Token audit full-state parity '+(i+1)+'/150');
}
assert.deepEqual(result.totals,expected.totals);assert.deepEqual(result.running,{evaluations:628,FGA:586,makes:394,below14:0,tempoOnly:0,PNR:0});
result.runtimeSeconds=(performance.now()-start)/1000;
fs.writeFileSync('dev/token-order-audit.json',JSON.stringify(result,null,2));console.log(JSON.stringify({parity:result.parity,running:result.running,tokens:result.tokens.length,wrongSide:result.wrongSide.map(x=>({seed:x.seed,origin:x.origin,side:x.side,root:x.triggerRoot})),mismatches:result.ownershipMismatches.map(x=>({seed:x.seed,root:x.root,side:x.side,expected:x.expected,recursive:x.recursive})),oppositeFT:result.oppositeFT.length},null,2));
}
