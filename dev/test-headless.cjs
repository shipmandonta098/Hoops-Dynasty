const assert=require('node:assert/strict');const {loadLeague}=require('./load-league.cjs');
const r=loadLeague({seed:821,strictDOM:false});r.context.assert=assert;
(async()=>{
 r.run("state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));state.leagueSettings={...leagueRules(),rosterMin:14,rosterMax:15};globalThis.baseline=copy(state);");
 function runGame(mode,seed,a,b){r.run(`state=copy(baseline);simulationExecution.mode='${mode}';`);r.setRandomSeed(seed);return JSON.parse(JSON.stringify(r.run(`(()=>{const g=play(${a},${b});return {g,state}})()`)));}
 const strip=x=>{for(const g of x.state.history){delete g.playByPlay;delete g.boxTimeline;}delete x.g.playByPlay;delete x.g.boxTimeline;return x};
 for(const [a,b] of [[0,1],[2,3]])for(const seed of [17,82,991]){const normal=runGame('normal',seed,a,b),headless=runGame('headless',seed,a,b);assert(normal.g.playByPlay.length);assert.equal(headless.g.playByPlay.length,0);assert.equal(headless.g.boxTimeline.length,0);assert.deepEqual(strip(headless),strip(normal));}
 r.run("state=copy(baseline);simulationExecution.mode='headless';simulationExecution.autopilot=true;");
 // A failed game restores state; serious failures are visible rather than swallowed.
 r.run("globalThis.originalPlay=play;play=()=>{state.teams[0].w++;throw Error('injected game failure')};globalThis.beforeFailure=JSON.stringify(state);");
 assert.throws(()=>r.run('simulateGameHeadless(0,1)'),/injected game failure/);assert(r.run('JSON.stringify(state)===beforeFailure'));r.run('play=originalPlay;simulationExecution.mode="normal";simulationExecution.autopilot=false;');
 const original=r.run('JSON.stringify(state)'),controller=new AbortController();controller.abort();r.context.options={signal:controller.signal,log:false};const cancelled=await r.run('simulateMultipleSeasonsHeadless(1,options)');assert.equal(cancelled.status,'cancelled');assert.equal(r.run('JSON.stringify(state)'),original);assert.equal(r.run('simulationExecution.mode'),'normal');
 const isolated=loadLeague({seed:911});isolated.run("state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));simulationExecution.mode='headless';simulationExecution.autopilot=true;");await isolated.run('simulateDayHeadless()');assert.equal(isolated.run('state.day'),1);
 console.log('PASS: seeded full-state normal/headless parity (six games), full box/stat/standings/morale/injury/finance/rivalry equality, no replay storage, failure rollback, cancellation restoration, strict zero-DOM headless day.');
})().catch(e=>{console.error(e);process.exitCode=1});
