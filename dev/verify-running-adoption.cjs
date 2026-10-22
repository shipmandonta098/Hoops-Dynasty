const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs'),{instrument,createObserver}=require('./transition-observers.cjs');
const expected=JSON.parse(fs.readFileSync('dev/running-experiment-fixture.json')).experiment;
const plain=loadLeague({strictDOM:false}),obsVM=loadLeague({strictDOM:false,sourceTransform:instrument});
plain.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");obsVM.context.fixture=JSON.parse(plain.run('JSON.stringify(fixture)'));
let circle=Array.from({length:30},(_,i)=>i),pairs=[];for(let round=0;round<10;round++){for(let i=0;i<15;i++){const p=[circle[i],circle[29-i]];pairs.push(round%2?p.reverse():p)}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)]}
const totals=Object.fromEntries(Object.keys(expected.totals).map(k=>[k,0]));let running=0,event=0,tempo=0,pnr=0;const start=performance.now();
for(let i=0;i<150;i++){
 const [a,b]=pairs[i],run=r=>{r.run(`state=copy(fixture);simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);return JSON.parse(JSON.stringify(r.run(`play(${a},${b})`)))};
 const obs=createObserver();obsVM.context.__audit=obs;const result=run(obsVM),direct=run(plain);assert.deepEqual(result,direct);assert.equal(obsVM.run('JSON.stringify(state)'),plain.run('JSON.stringify(state)'));
 const shots=obs.shots.filter(s=>s.name==='Running Layup');running+=shots.length;event+=shots.filter(s=>s.entry.actual).length;tempo+=shots.filter(s=>!s.entry.actual).length;pnr+=shots.filter(s=>s.pnr).length;
 for(const row of result.box)for(const k in totals)totals[k]+=row[k]||0;
 assert.equal((result.sa+result.sb)/2,expected.gameMetrics[i].PPG,'retained per-game score '+i);
 if((i+1)%25===0)console.log('Adoption reproduction '+(i+1)+'/150');
}
assert.deepEqual(totals,expected.totals);assert.equal(running,761);assert.equal(event,761);assert.equal(tempo,0);assert.equal(pnr,0);
const report={games:150,runtimeSeconds:(performance.now()-start)/1000,fullGameAndStateParity:150,retainedCandidateTotals:'EXACT MATCH',retainedPerGamePPG:'EXACT MATCH',running,event,tempo,pnr,totals,league:expected.league};
fs.writeFileSync('dev/running-adopted-baseline.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
