const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs'),{instrument,createObserver}=require('./two-point-observers.cjs');
const count=Number(process.argv[2]||150),plain=loadLeague({strictDOM:false}),audited=loadLeague({strictDOM:false,sourceTransform:instrument});
plain.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.fixture=copy(state)");
const fixture=JSON.parse(plain.run('JSON.stringify(fixture)'));audited.context.fixture=fixture;
const totals={pts:0,fga:0,fgm:0,tpa:0,tpm:0,fta:0,ftm:0,orb:0,drb:0,poss:0,blk:0,tov:0};const all={shots:[],boards:[],possessions:[]},games=[],appearances=Array(30).fill(0);let circle=Array.from({length:30},(_,i)=>i),pairs=[];
for(let round=0;round<10;round++){for(let i=0;i<15;i++){const pair=[circle[i],circle[29-i]];pairs.push(round%2?pair.reverse():pair);}circle=[circle[0],circle.at(-1),...circle.slice(1,-1)];}
const start=performance.now();
for(let i=0;i<count;i++){
 const [a,b]=pairs[i];appearances[a]++;appearances[b]++;
 const run=r=>{r.run(`state=copy(fixture);simulationExecution.mode='normal';Math.random=scheduleRandom(${100000+i});`);return JSON.parse(JSON.stringify(r.run(`play(${a},${b})`)))};
 const expected=run(plain),obs=createObserver();audited.context.__audit=obs;const result=run(audited);
 assert.deepEqual(result,expected,'full game parity '+i);assert.equal(audited.run('JSON.stringify(state)'),plain.run('JSON.stringify(state)'),'full league parity '+i);
 const box=result.box,shots=obs.shots.filter(s=>s.recorded);assert(obs.shots.every(s=>s.resolved),'all shots resolved');
 for(const [key,value]of [['fga',shots.length],['fgm',shots.filter(s=>s.made).length],['tpa',shots.filter(s=>s.kind==='three').length],['tpm',shots.filter(s=>s.kind==='three'&&s.made).length]])assert.equal(box.reduce((n,r)=>n+r[key],0),value,key+' reconciliation game '+i);
 assert.equal(obs.boards.filter(b=>b.offensive).length,box.reduce((n,r)=>n+r.orb,0));assert.equal(obs.boards.length,box.reduce((n,r)=>n+r.reb,0));
 assert.equal(obs.totalPoints,result.sa+result.sb,'score accounting');assert.equal(obs.possessions.reduce((n,p)=>n+p.points,0)+obs.otherPoints,obs.totalPoints,'possession and technical/extra-period points accounting');
 for(const row of box)for(const key in totals)totals[key]+=row[key]||0;
 for(const key of ['shots','boards','possessions'])all[key].push(...obs[key]);
 games.push({seed:100000+i,a,b,sa:result.sa,sb:result.sb});if((i+1)%25===0)console.log('Verified '+(i+1)+' games');
}
if(count===150)assert(appearances.every(n=>n===10));
const mean=(a,k)=>a.length?a.reduce((n,r)=>n+(typeof k==='function'?k(r):r[k]||0),0)/a.length:null;
const ratio=(a,b)=>b?a/b:null;
function group(a){const f=a.filter(s=>s.recorded),makes=f.filter(s=>s.made).length;return {evaluations:a.length,attempts:f.length,made:makes,FG:ratio(makes,f.length),share:ratio(f.length,all.shots.filter(s=>s.recorded).length),rating:mean(f,'rating'),rawRating:mean(f,'rawRating'),rim:mean(f,'rim'),rawRim:mean(f,'rawRim'),base:mean(f,'base'),context:mean(f,'context'),final:mean(f,'prob'),contextDelta:mean(f,r=>r.context-r.base),contest:mean(f,r=>Number(r.contest)),blocks:f.filter(s=>s.blocked).length,blockRate:mean(f,r=>Number(r.blocked)),foulRate:mean(a,r=>Number(r.foul)),foulEvaluations:a.filter(s=>s.foul).length,makeRollMisses:f.filter(s=>!s.made&&!s.blocked).length,blockRisk:mean(f,'blockRisk'),effectiveVsRawDelta:mean(f,r=>r.rating-r.rawRating),fatigueOnlyDelta:mean(f.filter(r=>r.noFatigueRating!==undefined),r=>r.rating-r.noFatigueRating)}}
const cat=s=>s.kind==='three'?'three':s.skill==='dnk'?'dunk':s.skill==='post'?'post':s.kind==='mid'?'midrange':/Float|Floating/.test(s.name)?'floater':'rim';
const initial=all.shots.filter(s=>s.path==='primary'),rim=initial.filter(s=>cat(s)==='rim'),put=all.shots.filter(s=>s.path==='putback'),off=all.boards.filter(b=>b.offensive),poss=all.possessions;
const dictionary=(rows,key)=>Object.fromEntries([...new Set(rows.map(key))].map(k=>[k,group(rows.filter(r=>key(r)===k))]));
const band=n=>n<60?'<60':n<70?'60–69':n<80?'70–79':n<90?'80–89':'90+';
const mods={};for(const r of rim){for(const [k,v] of Object.entries(r.mods)){const m=mods[k]??={applied:0,sum:0,min:Infinity,max:-Infinity};if(v){m.applied++;m.sum+=v;m.min=Math.min(m.min,v);m.max=Math.max(m.max,v);}}}
for(const m of Object.values(mods)){m.meanApplied=m.applied?m.sum/m.applied:0;m.contribution=m.sum/rim.length;if(!m.applied){m.min=0;m.max=0}}
const withO=poss.filter(p=>p.boards.length),withoutO=poss.filter(p=>!p.boards.length),half=withoutO.filter(p=>!p.shots.some(s=>s.transition));
const afterO={};for(const p of withO)for(const b of p.boards){const key=b.route==='recursive'?(b.nextShot?.foul&&!b.nextShot.recorded?'foul':b.nextEvent||'no shot'):'immediate '+b.route;afterO[key]=(afterO[key]||0)+1;}
const report={fixture:{creationSeed:61005,gameSeedStart:100000,teams:30,games:count,rosterSize:15,reset:'preseason per game',matchups:'circle schedule first ten rounds, venue alternates by round',appearances},runtimeSeconds:(performance.now()-start)/1000,checks:{fullGameAndStateParity:count,boxReconciliation:count,reboundReconciliation:count,scoreReconciliation:count},totals,league:{PPG:totals.pts/count/2,pace:totals.poss/5/count/2,ORtg:totals.pts/(totals.poss/5)*100,FG:totals.fgm/totals.fga,twoP:(totals.fgm-totals.tpm)/(totals.fga-totals.tpa),threeP:totals.tpm/totals.tpa},rebounds:{total:off.length,perTeamGame:off.length/count/2,rate:totals.orb/(totals.orb+totals.drb),routes:Object.fromEntries(['putback','kickout','recursive'].map(k=>[k,off.filter(b=>b.route===k).length])),recursiveFirstEvents:afterO,putbacksPerOreb:put.length/off.length,putbacksPerTeamGame:put.length/count/2},putbacks:dictionary(put,r=>r.skill),paths:dictionary(all.shots,s=>s.path),categories:dictionary(all.shots,cat),primaryCategories:dictionary(initial,cat),primaryRim:group(rim),rimVariants:dictionary(rim,r=>r.name),rimContest:dictionary(rim,r=>r.contest?'contested':'uncontested'),rimHelp:dictionary(rim,r=>r.help===null?'not PNR help decision':r.help?'help arrived':'help did not arrive'),rimDefenderPosition:dictionary(rim,r=>r.defenderPosition),rimModifiers:mods,dunkBands:dictionary(all.shots.filter(s=>cat(s)==='dunk'),s=>band(s.dunkRating)),primaryDunkBands:dictionary(initial.filter(s=>cat(s)==='dunk'),s=>band(s.dunkRating)),secondChance:{points:withO.reduce((n,p)=>n+p.secondPoints,0),perTeamGame:withO.reduce((n,p)=>n+p.secondPoints,0)/count/2,pointsPerOreb:withO.reduce((n,p)=>n+p.secondPoints,0)/off.length,withOrebPossessions:withO.length,withOrebPPP:mean(withO,'points'),withoutOrebPossessions:withoutO.length,withoutOrebPPP:mean(withoutO,'points'),halfCourtWithoutOrebPossessions:half.length,halfCourtWithoutOrebPPP:mean(half,'points')},games};
fs.writeFileSync('dev/two-point-audit-results.json',JSON.stringify(report,null,2));
if(process.env.AUDIT_OBSERVATIONS)fs.writeFileSync(process.env.AUDIT_OBSERVATIONS,JSON.stringify(all));
console.log(JSON.stringify({league:report.league,rebounds:report.rebounds,secondChance:report.secondChance,checks:report.checks,runtime:report.runtimeSeconds},null,2));
