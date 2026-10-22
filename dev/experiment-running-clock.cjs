const fs=require('node:fs'),assert=require('node:assert/strict');
const {loadLeague}=require('./load-league.cjs'),obs=require('./lifetime-observers.cjs');
function candidate(name,s){
 const replace=(a,b)=>{assert.equal(s.split(a).length-1,1);s=s.replace(a,b)};
 if(name==='attributes.js')replace('const shotContext={transition,transitionAdvantage,','const shotContext={transition,transitionAdvantage,shotClock:machine.shotClock,');
 if(name==='tendencies.js')replace('if(context.transitionAdvantage)return','if(context.transitionAdvantage&&context.shotClock>=14)return');
 return s;
}
function instrument(name,s){s=obs.instrument(name,s);if(name==='attributes.js'){
 const a='const buildMatch=physicalMatchup(p,d,decision.action,kind,contest);';assert.equal(s.split(a).length-1,1);
 s=s.replace(a,a+"__audit.selection={event:transitionAdvantage,clock:machine.shotClock,sourceKey:shot.key,eligibleRim:shot.skill==='lay'&&!['floater','runningFloater'].includes(shot.key)};");
 s=s.replace('auditShot.base=chance;','auditShot.selection={...__audit.selection};auditShot.base=chance;');
 }return s;}
const plain=loadLeague({strictDOM:false}),base=loadLeague({strictDOM:false,sourceTransform:instrument}),rawExp=loadLeague({strictDOM:false,sourceTransform:candidate}),exp=loadLeague({strictDOM:false,sourceTransform:(n,s)=>candidate(n,instrument(n,s))});
plain.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");
const fixture=JSON.parse(plain.run('JSON.stringify(fixture)'));for(const r of [base,rawExp,exp])r.context.fixture=fixture;
let circle=Array.from({length:30},(_,i)=>i),pairs=[];for(let round=0;round<10;round++){for(let i=0;i<15;i++){const p=[circle[i],circle[29-i]];pairs.push(round%2?p.reverse():p)}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)]}
const tally=(a,f)=>a.reduce((d,x)=>{const k=f(x);d[k]=(d[k]||0)+1;return d},{}),mean=(a,f)=>a.length?a.reduce((n,x)=>n+f(x),0)/a.length:null;
const median=a=>{const b=[...a].sort((a,b)=>a-b);return b.length?b.length%2?b[(b.length-1)/2]:(b[b.length/2-1]+b[b.length/2])/2:null};
const bucket=c=>c>=20?'20+':c>=17?'17–19':c>=14?'14–16':c>=10?'10–13':c>=5?'5–9':'0–4';
const rim=s=>s.skill==='lay'&&!/Float/.test(s.name);
const group=a=>{const f=a.filter(s=>s.recorded);return{evaluations:a.length,FGA:f.length,made:f.filter(s=>s.made).length,FG:mean(f,s=>+s.made),perTeamGame:f.length/300,probability:mean(a,s=>s.prob),blocks:f.filter(s=>s.blocked).length,fouled:a.filter(s=>s.foul).length}};
const totals=()=>Object.fromEntries(['pts','poss','fga','fgm','tpa','tpm','fta','ftm','tov','orb','pf','blk'].map(k=>[k,0]));
const bags=[0,1].map(()=>({totals:totals(),shots:[],running:[],origins:{},status:{},flags:[],recursive:0,gameMetrics:[]}));
function summarize(b){const t=b.totals,p=b.shots.filter(s=>s.path==='primary'),r=b.running,three=b.shots.filter(s=>s.kind==='three'),tt=three.filter(s=>s.earlyThree||s.key==='runningThree'&&s.transition),denied=p.filter(s=>s.selection?.event&&s.selection.clock<14&&s.selection.eligibleRim);
 const variants=Object.fromEntries([...new Set(p.filter(s=>s.skill==='lay').map(s=>s.name))].map(k=>[k,group(p.filter(s=>s.name===k))]));
 return{totals:t,metrics:{PPG:t.pts/300,pace:t.poss/5/300,ORtg:t.pts/(t.poss/5)*100,twoP:(t.fgm-t.tpm)/(t.fga-t.tpa),threeP:t.tpm/t.tpa,FGA:t.fga/300,TOV:t.tov/300,PF:t.pf/300,OREB:t.orb/300,BLK:t.blk/300},primaryRim:group(p.filter(rim)),allRim:group(b.shots.filter(rim)),variants,dunks:group(b.shots.filter(s=>s.skill==='dnk')),primaryDunks:group(p.filter(s=>s.skill==='dnk')),floaters:group(b.shots.filter(s=>/Float/.test(s.name))),primaryFloaters:group(p.filter(s=>/Float/.test(s.name))),threes:{allTransition:group(tt),early:group(tt.filter(s=>s.earlyThree)),other:group(tt.filter(s=>!s.earlyThree))},running:{...group(b.shots.filter(s=>s.name==='Running Layup')),origins:Object.fromEntries([...new Set(r.map(s=>s.origin))].map(k=>[k,group(r.filter(s=>s.origin===k))])),clock:tally(r,s=>s.clock),buckets:tally(r,s=>bucket(s.clock)),depth:tally(r,s=>s.depth),meanClock:mean(r,s=>s.clock),medianClock:median(r.map(s=>s.clock)),meanDepth:mean(r,s=>s.depth),depthClock:Object.fromEntries([...new Set(r.map(s=>s.depth))].sort().map(k=>[k,tally(r.filter(s=>s.depth===k),s=>bucket(s.clock))])),tempoOnly:r.filter(s=>!s.entry.actual).length,PNR:r.filter(s=>s.pnr).length,below14:r.filter(s=>s.clock<14).length},replacements:{...group(denied),byVariant:Object.fromEntries([...new Set(denied.map(s=>s.name))].map(k=>[k,group(denied.filter(s=>s.name===k))])),allResolved:denied.every(s=>s.resolved),examples:denied.slice(0,12).map(s=>({seed:s.seed,shooter:s.shooterName,clock:s.clock,origin:s.origin,variant:s.name,recorded:s.recorded,foul:s.foul,made:s.made,blocked:s.blocked}))},tokens:{origins:b.origins,status:b.status,recursiveEntries:b.recursive},putback:group(b.shots.filter(s=>s.path==='putback')),putbackLayupBlocks:b.shots.filter(s=>s.path==='putback'&&s.skill==='lay'&&s.blocked).length,gameMetrics:b.gameMetrics};}
const start=performance.now();
// Finish ALL baseline parity/reproduction checks before candidate simulation.
for(const variant of [0,1]){
 const vm=variant?exp:base,raw=variant?rawExp:plain,b=bags[variant];
 for(let i=0;i<150;i++){
  const [a,c]=pairs[i],run=r=>{r.run(`state=copy(fixture);simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);return JSON.parse(JSON.stringify(r.run(`play(${a},${c})`)))};
  const o=obs.createObserver(i);vm.context.__audit=o;const game=run(vm);assert.deepEqual(game,run(raw));assert.equal(vm.run('JSON.stringify(state)'),raw.run('JSON.stringify(state)'));o.finish();
  assert.equal(o.shots.filter(s=>s.recorded).length,game.box.reduce((n,s)=>n+s.fga,0));assert.equal(o.totalPoints,game.sa+game.sb);
  for(const row of game.box)for(const k in b.totals)b.totals[k]+=row[k]||0;
  for(const s of o.shots){s.seed=100000+i;if(s.name==='Running Layup'){
   assert(s.entry.actual);assert(!s.pnr);if(variant)assert(s.clock>=14);assert.equal(s.shot.blockMultiplier,.5);
   const op=o.opportunities[s.entry.opportunityId];assert(op);const actions=o.timeline.slice(op.trigger.i+1,s.at).filter(x=>x.side===s.side);
   s.depth=actions.filter(x=>x.type==='ISO'||x.type==='screen'||x.type==='phase'&&x.seconds>0&&['pass','drive','post','decision'].includes(x.phase)).length;b.running.push(s);
  }}
  b.shots.push(...o.shots);b.flags.push(...o.flags);b.recursive+=o.entries.filter(s=>s.recursive).length;
  for(const op of o.opportunities){b.origins[op.origin]=(b.origins[op.origin]||0)+1;b.status[op.status]=(b.status[op.status]||0)+1;}
  b.gameMetrics.push({seed:100000+i,PPG:(game.sa+game.sb)/2});
  if((i+1)%25===0)console.log((variant?'Candidate':'Baseline')+' parity '+(i+1)+'/150');
 }
 if(!variant){const retained=JSON.parse(fs.readFileSync('dev/running-adopted-baseline.json'));for(const k in retained.totals)assert.equal(b.totals[k],retained.totals[k]);assert.equal(b.running.length,761);assert.equal(b.running.filter(s=>s.clock<14).length,126);console.log('BASELINE EXACT MATCH — candidate may now run');}
}
// Deterministic boundary/pathway controls use actual engine functions.
const j=(r,code)=>JSON.parse(JSON.stringify(r.run(code)));
for(const r of [plain,rawExp])r.run('state=copy(fixture);globalThis.p=state.teams[0].roster[0]');
const boundary=[];let sameOtherShots=0;
for(const clock of [13,14])for(const event of [false,true]){
 const context=`{transition:true,transitionAdvantage:${event},shotClock:${clock},assisted:true,passing:75,rim:75}`;
 const a=j(plain,`layupOptions(p,${context})`),b=j(rawExp,`layupOptions(p,${context})`);
 assert.equal(b.some(v=>v.name==='Running Layup'),event&&clock>=14);
 if(clock>=14||!event)assert.deepEqual(a,b);else assert.deepEqual(b,j(plain,`layupOptions(p,{...${context},transitionAdvantage:false})`));
 const code=`Math.random=scheduleRandom(552);contextualLayup(p,{...TENDENCY_SHOTS.find(s=>s.key==='layup')},${context})`;
 // Pick a real non-floater layup descriptor rather than inventing a shot key.
 const actual=code.replace("s.key==='layup'","s.skill==='lay'&&!['floater','runningFloater'].includes(s.key)");
 boundary.push({clock,event,baseline:j(plain,actual),candidate:j(rawExp,actual)});
 for(const key of ['three','runningThree','pullupThree','floater','runningFloater','standingDunk','drivingDunk','postHook']){const c=`Math.random=scheduleRandom(552);contextualLayup(p,{...TENDENCY_SHOTS.find(s=>s.key==='${key}')},${context})`;assert.deepEqual(j(plain,c),j(rawExp,c));sameOtherShots++;}
}
const runningOpt=j(rawExp,'layupOptions(p,{transitionAdvantage:true,shotClock:14})')[0];assert.equal(runningOpt.adjustment,.055);assert.equal(runningOpt.block,.5);
const result={fixture:{creationSeed:61005,games:150,seeds:'100000–100149',teams:30,playersPerTeam:15,preseasonReset:true},runtimeSeconds:(performance.now()-start)/1000,parity:{baseline:150,candidate:150,fullPostGameState:true,baselineReproduction:'EXACT MATCH'},baseline:summarize(bags[0]),candidate:summarize(bags[1]),boundary,controls:{unchangedOtherShotCases:sameOtherShots,runningAccuracy:.055,runningBlock:.5,productionUnmodified:true}};
fs.writeFileSync('dev/running-clock-experiment.json',JSON.stringify(result,null,2));console.log(JSON.stringify({baseline:result.baseline.metrics,candidate:result.candidate.metrics,running:[result.baseline.running.evaluations,result.candidate.running.evaluations],replacement:result.candidate.replacements,controls:result.controls},null,2));
