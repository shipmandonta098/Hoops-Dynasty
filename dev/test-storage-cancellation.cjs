const assert=require('node:assert/strict');const {loadLeague}=require('./load-league.cjs');
(async()=>{
 const r=loadLeague({seed:177,strictDOM:false});r.run("state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));state.leagueSettings={...leagueRules(),rosterMin:14,rosterMax:15};");
 let stored,writes=0;const backend={get:async()=>stored,put:async record=>{stored=structuredClone(record);writes++}};r.context.backend=backend;
 r.run("activeSaveId='test-only';careerStore=backend;careerStorageError='';");stored={id:'test-only',data:JSON.parse(r.run('JSON.stringify(state)'))};
 assert.equal(await r.run('save()'),true);assert.equal(writes,1);const original=JSON.stringify(stored);
 r.run("simulationExecution.mode='headless';");assert.equal(await r.run('save()'),true);assert.equal(writes,1);assert.equal(JSON.stringify(stored),original);r.run("simulationExecution.mode='normal';");
 const controller=new AbortController();r.context.options={seed:8,signal:controller.signal,log:false,onProgress:p=>{if(p.gamesCompleted>0)controller.abort()},yieldControl:()=>new Promise(setImmediate)};
 const report=await r.run('simulateMultipleSeasonsHeadless(1,options)');assert.equal(report.status,'cancelled');assert.equal(writes,1);assert.equal(JSON.stringify(stored),original);assert.equal(r.run('state.day'),1);assert.equal(r.run('state.history.length'),r.run('state.schedule[0].length'));assert.equal(r.run('simulationBusy'),false);assert.equal(r.run('simulationExecution.mode'),'normal');r.run('validateHeadlessLeague()');
 assert.equal(await r.run('save()'),true);assert.equal(writes,2);assert.equal(stored.data.day,1);r.context.raw=stored.data;r.run('validateCareerData(raw)');
 const bad=loadLeague({seed:8});bad.run("state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));state.teams[1].roster[0]=state.teams[0].roster[0];");assert.throws(()=>bad.run('validateHeadlessLeague()'),/exists in/);
 console.log('PASS: unchanged normal save path/roundtrip, headless writes deferred, cancellation after a complete league day, prior saved career untouched, restored execution mode, duplicate-player detection.');
})().catch(e=>{console.error(e);process.exitCode=1});
