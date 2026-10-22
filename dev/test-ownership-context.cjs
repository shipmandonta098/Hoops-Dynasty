const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs'),{candidate}=require('./ownership-candidate.cjs');
const production=process.argv.includes('--production'),old=require('node:child_process').execFileSync('git',['show','cf8e0533593be4920ee22042f205a7480db86795:dist/attributes.js'],{encoding:'utf8'});
const base=loadLeague({strictDOM:false,sourceTransform:(n,s)=>n==='attributes.js'?old:s}),test=loadLeague({strictDOM:false,sourceTransform:production?undefined:((n,s)=>candidate(n,n==='attributes.js'?old:s))});
for(const r of [base,test])r.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.p=state.teams[0].roster[0]");
const j=(r,c)=>JSON.parse(JSON.stringify(r.run(c)));let cases=0;const boundary=[];
for(const clock of [13,14])for(const event of [false,true]){
 const context=`{transition:true,transitionAdvantage:${event},shotClock:${clock},assisted:true,passing:75,rim:75}`;
 const a=j(base,`layupOptions(p,${context})`),b=j(test,`layupOptions(p,${context})`);assert.deepEqual(a,b);assert.equal(b.some(v=>v.name==='Running Layup'),event&&clock>=14);boundary.push({clock,event,running:b.some(v=>v.name==='Running Layup')});
 for(const key of ['three','runningThree','pullupThree','floater','runningFloater','standingDunk','drivingDunk','postHook']){const c=`Math.random=scheduleRandom(552);contextualLayup(p,{...TENDENCY_SHOTS.find(s=>s.key==='${key}')},${context})`;assert.deepEqual(j(base,c),j(test,c));cases++;}
}
const running=j(test,'layupOptions(p,{transitionAdvantage:true,shotClock:14})')[0];assert.equal(running.adjustment,.055);assert.equal(running.block,.5);
console.log(JSON.stringify({result:'PASS',unchangedContextualShots:cases,boundary,runningAccuracy:running.adjustment,runningBlock:running.block},null,2));
