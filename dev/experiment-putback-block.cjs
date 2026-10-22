const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process'),{loadLeague}=require('./load-league.cjs'),{candidate}=require('./putback-block-candidate.cjs'),obs=require('./putback-block-observer.cjs');
const commit='73183bb3b14d9b6852e563420a296de6da485057',old=cp.execFileSync('git',['show',commit+':dist/attributes.js'],{encoding:'utf8'}),mode=process.argv[2]||'baseline';
const baseline=(n,s)=>n==='attributes.js'?old:s,transform=mode==='baseline'?baseline:mode==='production'?((n,s)=>s):((n,s)=>candidate(n,baseline(n,s)));
const raw=loadLeague({strictDOM:false,sourceTransform:transform}),inst=loadLeague({strictDOM:false,sourceTransform:(n,s)=>obs.instrument(n,transform(n,s))});
raw.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");const fixture=JSON.parse(raw.run('JSON.stringify(fixture)'));inst.context.fixture=fixture;
let circle=Array.from({length:30},(_,i)=>i),pairs=[];for(let round=0;round<10;round++){for(let i=0;i<15;i++){const p=[circle[i],circle[29-i]];pairs.push(round%2?p.reverse():p)}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)]}
const reference=mode==='baseline'?null:JSON.parse(fs.readFileSync('dev/putback-block-baseline.json'));
if(reference){assert.equal(reference.baselineReproduction,'EXACT MATCH');assert.equal(reference.parity,150)}
const result={parentCommit:commit,mode,fixture:{creationSeed:61005,seeds:'100000–100149',games:150},games:[],parity:0,totals:{},running:{evaluations:0,FGA:0,makes:0,below14:0,tempoOnly:0,PNR:0},puts:[],secondPoints:0,tokens:{}};
const start=performance.now();
for(let i=0;i<150;i++){
 const [a,b]=pairs[i],o=obs.observer(i);inst.context.__audit=o;
 function run(r,instrumented){r.run(`state=copy(fixture);simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);if(instrumented)r.run('globalThis.seededGameRandom=Math.random;Math.random=()=>{__audit.rngCount++;return seededGameRandom()};');return JSON.parse(JSON.stringify(r.run(`play(${a},${b})`)))}
 const g=run(inst,true),normal=run(raw,false);assert.deepEqual(g,normal);const state=inst.run('JSON.stringify(state)');assert.equal(state,raw.run('JSON.stringify(state)'));o.finish();result.parity++;
 assert.equal(o.mismatches.length,0,'ownership mismatch '+(100000+i)+JSON.stringify(o.mismatches));
 assert(o.opportunities.every(t=>['consumed','unused: period boundary','unused: game ended'].includes(t.status)),'token abandonment');
 for(const t of o.opportunities){result.tokens[t.status]=(result.tokens[t.status]||0)+1;if(t.status==='consumed')assert.equal(t.entry.side,t.side)}
 assert.equal(o.shots.filter(s=>s.recorded).length,g.box.reduce((n,r)=>n+r.fga,0));
 for(const row of g.box)for(const k of ['pts','poss','defPoss','fga','fgm','tpa','tpm','fta','ftm','tov','orb','drb','pf','blk'])result.totals[k]=(result.totals[k]||0)+(row[k]||0);
 for(const s of o.shots.filter(s=>s.name==='Running Layup')){const r=result.running;r.evaluations++;r.FGA+=+s.recorded;r.makes+=+s.made;r.below14+=+(s.clock<14);r.tempoOnly+=+!s.entry.actual;r.PNR+=+s.pnr;assert.equal(s.shot.blockMultiplier,.5)}
 result.secondPoints+=o.secondPoints;
 const first=o.puts.find(p=>!p.dunk),entry=first?{...first,prefixHash:obs.hash(o.events.slice(0,first.eventIndex+1))}:null;
 const row={seed:100000+i,teams:[fixture.teams[a].name,fixture.teams[b].name],score:[g.sa,g.sb],gameHash:obs.hash(g),stateHash:obs.hash(state),firstLayup:entry,slots:o.slots,clock:JSON.parse(JSON.stringify(o.finalClock)),puts:o.puts,blocks:o.puts.filter(p=>!p.dunk&&p.denied).map(p=>({...p,trace:o.events.filter(e=>e.root>=p.root&&e.root<=p.root+1)})),ownershipErrors:0,tokenErrors:0,recursiveEntries:o.events.filter(e=>e.type==='core entry'&&e.recursive).length,secondPoints:o.secondPoints};
 if(reference){const prev=reference.games[i];row.outcomeIdentical=row.gameHash===prev.gameHash&&row.stateHash===prev.stateHash;
  if(!prev.firstLayup){assert(!first);assert(row.outcomeIdentical);row.firstDivergence='none: no changed branch';}
  else {assert(first);for(const k of ['root','side','shotIndex','rngStart','preStateHash','eventIndex','prefixHash'])assert.equal(entry[k],prev.firstLayup[k],'pre-branch parity '+i+' '+k);assert.equal(prev.firstLayup.blockDraws,0);assert(first.blockDraws===1||first.blockDraws===2);row.firstDivergence={root:first.root,rngIndex:first.rngStart+1,reason:'new immediate putback layup block roll',baselineBlockDraws:0,candidateBlockDraws:first.blockDraws};}
  assert.deepEqual(row.slots.filter(s=>s.start<2880).map(({side,...s})=>s),prev.slots.filter(s=>s.start<2880).map(({side,...s})=>s),'regulation slot windows');
 }
 result.puts.push(...o.puts.map(p=>({...p,seed:100000+i})));result.games.push(row);
 if((i+1)%25===0)console.log(mode+' full-state parity '+(i+1)+'/150');
}
assert.equal(result.running.below14+result.running.tempoOnly+result.running.PNR,0);
const t=result.totals,rate=a=>({evaluations:a.length,FGA:a.filter(s=>s.recorded).length,makes:a.filter(s=>s.made).length,FG:a.filter(s=>s.made).length/a.filter(s=>s.recorded).length*100,blocks:a.filter(s=>s.denied).length,blockRate:a.filter(s=>s.denied).length/a.filter(s=>s.recorded).length*100});
result.putback={all:rate(result.puts),layups:rate(result.puts.filter(s=>!s.dunk)),dunks:rate(result.puts.filter(s=>s.dunk))};
result.metrics={PPG:t.pts/300,pace:t.poss/5/300,ORtg:t.pts/(t.poss/5)*100,two:(t.fgm-t.tpm)/(t.fga-t.tpa)*100,three:t.tpm/t.tpa*100,TOV:t.tov/300,OREB:t.orb/300,blocks:t.blk/300,fouls:t.pf/300,secondChancePoints:result.secondPoints/300,RunningFG:result.running.makes/result.running.FGA*100};
if(mode==='baseline'){const expected=JSON.parse(fs.readFileSync('dev/ownership-adopted-baseline.json'));for(const k of Object.keys(t)){if(k in expected.totals)assert.equal(t[k],['poss','defPoss'].includes(k)?expected.totals[k]*5:expected.totals[k]);}assert.deepEqual(result.running,expected.running);result.baselineReproduction='EXACT MATCH';}
result.runtimeSeconds=(performance.now()-start)/1000;
fs.writeFileSync('dev/putback-block-'+mode+'.json',JSON.stringify(result,null,2));console.log(JSON.stringify({metrics:result.metrics,putback:result.putback,running:result.running,parity:result.parity,tokens:result.tokens,runtimeSeconds:result.runtimeSeconds},null,2));
