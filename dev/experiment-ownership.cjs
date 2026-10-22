const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs'),audit=require('./audit-token-order.cjs'),{candidate}=require('./ownership-candidate.cjs');
const affected=[49,63,34,51,101,103,119,136],mode=process.argv[2]||'affected';
const adopted=process.argv.includes('--production');
const oldSource=require('node:child_process').execFileSync('git',['show','cf8e0533593be4920ee22042f205a7480db86795:dist/attributes.js'],{encoding:'utf8'});
const baseTransform=(n,s)=>n==='attributes.js'?oldSource:s;
function observed(transform){return (name,source)=>{
 let s=audit.instrument(name,transform(name,source));
 if(name==='attributes.js'){
  assert.equal(s.split('__audit.begin(side);').length-1,1);
  s=s.replace('__audit.begin(side);','__audit.slot(side,clockWindow,possessions,gameRotations[side].minute);__audit.begin(side);');
  s=s.replace('const result={shotDistribution,','__audit.finalClock={elapsedSeconds,overtime};const result={shotDistribution,');
 }return s;
};}
const transform=adopted?((n,s)=>s):((n,s)=>candidate(n,baseTransform(n,s)));
const base=loadLeague({strictDOM:false,sourceTransform:observed(baseTransform)}),normal=loadLeague({strictDOM:false,sourceTransform:transform}),inst=loadLeague({strictDOM:false,sourceTransform:observed(transform)});
base.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");
const fixture=JSON.parse(base.run('JSON.stringify(fixture)'));normal.context.fixture=fixture;inst.context.fixture=fixture;
let circle=Array.from({length:30},(_,i)=>i),pairs=[];for(let round=0;round<10;round++){for(let i=0;i<15;i++){const p=[circle[i],circle[29-i]];pairs.push(round%2?p.reverse():p)}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)]}
function observe(i){const o=audit.observer(i);o.slots=[];o.slot=(side,window,target,minute)=>o.slots.push({side,...window,target,minute});return o;}
function summary(g,o,a,b){
 const totals={};for(const row of g.box)for(const k of ['pts','poss','defPoss','fgm','fga','tpm','tpa','ftm','fta','tov','orb','drb','blk','pf','mp'])totals[k]=(totals[k]||0)+(row[k]||0);
 totals.poss/=5;totals.defPoss/=5;
 const running=o.shots.filter(s=>s.name==='Running Layup'),rate=r=>({evaluations:r.length,FGA:r.filter(s=>s.recorded).length,makes:r.filter(s=>s.recorded&&s.made).length});
 const tokenErrors=o.opportunities.filter(t=>t.status==='unused: next entry wrong side');
 const trace=root=>o.events.slice(o.roots[root].start,o.roots[Math.min(root+1,o.roots.length-1)].end);
 const opposite=o.events.filter(e=>e.type==='FT start'&&!e.technical&&!e.retain&&e.side!==e.rootSide).map(e=>({...e,trace:trace(e.root)}));
 const byTeam=[a,b].map((id,side)=>{const rosterIds=new Set(fixture.teams[id].roster.map(p=>p.id)),rows=g.box.filter(r=>rosterIds.has(r.playerId));return {teamId:id,name:fixture.teams[id].name,poss:rows.reduce((n,r)=>n+r.poss,0)/5,defPoss:rows.reduce((n,r)=>n+r.defPoss,0)/5,slots:o.slots.filter(s=>s.side===side).length}});
 for(const t of byTeam){assert.equal(t.poss,t.slots);assert.equal(t.defPoss,o.slots.length-t.slots);}
 const tokens={};for(const t of o.opportunities)tokens[t.status]=(tokens[t.status]||0)+1;
 for(const t of o.opportunities.filter(t=>t.status==='consumed')){assert.equal(t.side,t.entry.side);assert(t.entry.actual);}
 assert.equal(o.entries.filter(e=>e.actual).length,tokens.consumed||0);
 return {score:[g.sa,g.sb],totals,running:{...rate(running),below14:running.filter(s=>s.clock<14).length,tempoOnly:running.filter(s=>!s.entry.actual).length,PNR:running.filter(s=>s.pnr).length},earlyThrees:rate(o.shots.filter(s=>s.kind==='three'&&s.earlyThree)),transitionThrees:rate(o.shots.filter(s=>s.kind==='three'&&s.transition)),tokens,tokenErrors:tokenErrors.length,mismatches:o.mismatches,opposite,slots:o.slots,clock:JSON.parse(JSON.stringify(o.finalClock)),byTeam,recursiveEntries:o.events.filter(e=>e.type==='core entry'&&e.recursive).map(e=>({root:e.root,side:e.side,clock:e.clock})),terminalRoots:o.roots.length};
}
const games=[],start=performance.now();
const indices=mode==='full'?Array.from({length:150},(_,i)=>i):mode==='first'?affected.slice(0,2):affected;
for(const i of indices){
 const [a,b]=pairs[i],ob=observe(i),oc=observe(i);base.context.__audit=ob;inst.context.__audit=oc;
 function run(r){r.run(`state=copy(fixture);simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);return JSON.parse(JSON.stringify(r.run(`play(${a},${b})`)))}
 const gb=run(base),gc=run(inst),gn=run(normal);
 assert.deepEqual(gc,gn,'instrumented result parity '+i);assert.equal(inst.run('JSON.stringify(state)'),normal.run('JSON.stringify(state)'),'full-state parity '+i);ob.finish();oc.finish();
 const bsum=summary(gb,ob,a,b),csum=summary(gc,oc,a,b);
 assert.equal(csum.tokenErrors,0,'wrong-side token '+i);assert.equal(csum.mismatches.length,0,'owner mismatch '+i+' '+JSON.stringify(csum.mismatches));
 assert.equal(csum.running.below14+csum.running.tempoOnly+csum.running.PNR,0);
 assert.deepEqual(csum.slots.map(({side,...s})=>s),bsum.slots.map(({side,...s})=>s),'scheduled slots/windows '+i);
 assert.deepEqual(csum.clock,bsum.clock,'game clock/period totals '+i);
 for(const e of csum.recursiveEntries)assert(e.clock<=24&&e.clock>=0);
 if(!bsum.opposite.length){assert.deepEqual(gc,gb,'unaffected game parity '+i);assert.equal(inst.run('JSON.stringify(state)'),base.run('JSON.stringify(state)'));}
 games.push({seed:100000+i,teamIds:[a,b],baseline:bsum,candidate:csum,identicalGame:JSON.stringify(gc)===JSON.stringify(gb),parity:true});
 if(mode!=='full'||(i+1)%25===0)console.log(JSON.stringify({completed:games.length,seed:100000+i,baselineErrors:bsum.mismatches.length,candidateErrors:csum.mismatches.length,score:csum.score}));
}
function aggregate(key){const totals={},running={},earlyThrees={},tokens={},teams={};let slots=0;for(const g of games){const r=g[key];for(const [k,v]of Object.entries(r.totals))totals[k]=(totals[k]||0)+v;for(const [k,v]of Object.entries(r.running))running[k]=(running[k]||0)+v;for(const [k,v]of Object.entries(r.earlyThrees))earlyThrees[k]=(earlyThrees[k]||0)+v;for(const [k,v]of Object.entries(r.tokens))tokens[k]=(tokens[k]||0)+v;for(const t of r.byTeam){teams[t.teamId]??={...t,poss:0,defPoss:0,slots:0};for(const k of ['poss','defPoss','slots'])teams[t.teamId][k]+=t[k]}slots+=r.slots.length;}
 const n=games.length*2;return {totals,running,earlyThrees,tokens,teams:Object.values(teams),slots,metrics:{PPG:totals.pts/n,pace:totals.poss/n,ORtg:totals.pts/totals.poss*100,two:(totals.fgm-totals.tpm)/(totals.fga-totals.tpa)*100,three:totals.tpm/totals.tpa*100,TOV:totals.tov/n,OREB:totals.orb/n,blocks:totals.blk/n,fouls:totals.pf/n,RunningFG:running.makes/running.FGA*100}};}
const result={source:'cf8e0533593be4920ee22042f205a7480db86795',mode,production:adopted,games,baseline:aggregate('baseline'),candidate:aggregate('candidate'),runtimeSeconds:(performance.now()-start)/1000};
if(mode==='full'){
 const accepted=JSON.parse(fs.readFileSync('dev/running-adopted-baseline.json'));for(const k of Object.keys(accepted.totals)){const expected=accepted.totals[k];if(k in result.baseline.totals)assert.equal(result.baseline.totals[k],k==='poss'?expected/5:expected);}
 assert.deepEqual(result.baseline.running,{evaluations:628,FGA:586,makes:394,below14:0,tempoOnly:0,PNR:0});
}
fs.writeFileSync(`dev/ownership-${mode}${adopted?'-production':''}.json`,JSON.stringify(result,null,2));console.log(JSON.stringify({baseline:result.baseline,candidate:result.candidate,parity:games.length,runtimeSeconds:result.runtimeSeconds},null,2));
