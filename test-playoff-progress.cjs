const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerFinalize=()=>{};finalizeRegularAwards=()=>{};toast=()=>{};simulationFailure=()=>{};
const dialog=document.getElementById('simulation-progress');dialog.showModal=function(){this.open=true};dialog.close=function(){this.open=false};
const setup=()=>{state=fresh(defaultTeams().slice(0,6),2);state.day=seasonLength();simulationStopRequested=false;};
let calls=0,fail=false,stopOnSave=false,frames=[];
play=(a,b,stage)=>{assert(dialog.open);assert(dialog.innerHTML.includes('Advancing the league'));assert(dialog.innerHTML.includes('Stop after this game'));calls++;const g={a,b,sa:100,sb:90,winner:a,stage,day:state.day+1,box:[]};state.history.unshift(g);return g};
save=async()=>{if(stopOnSave)stopSimulation();return !fail};
simulationYield=async()=>{frames.push(dialog.innerHTML)};
setup();let slot=playoffSeriesSlots().find(s=>!s.complete);await simulatePlayoffGame(...slot.nextPair);assert.equal(calls,1);assert(!dialog.open);assert(!playoffActionBusy);
setup();calls=0;stopOnSave=true;await playoffs();assert.equal(calls,1);assert.equal(playoffGames().length,1);assert.equal(state.champion,null);assert(!dialog.open);assert(!playoffBatchToken);assert(dialog.textContent.includes('Finishing this game'));
stopOnSave=false;await simulatePlayoffRound();assert(playoffSeriesSlots().filter(s=>s.round===0).every(s=>s.complete));assert(playoffSeriesSlots().filter(s=>s.round===1).every(s=>!s.games.length));assert(!dialog.open);assert(frames.some(x=>x.includes('series completed')));
await playoffs();assert.notEqual(state.champion,null);assert(!dialog.open);
setup();calls=0;fail=true;await playoffs();assert.equal(calls,1);assert.equal(playoffGames().length,0);assert(!dialog.open);assert(!playoffBatchToken);assert(!playoffActionBusy);fail=false;
setup();play=()=>{throw Error('test game failure')};await playoffs();assert.equal(playoffGames().length,0);assert(!dialog.open);assert(!playoffBatchToken);assert(!playoffActionBusy);
simulationStopRequested=false;simulationProgress(3,112,8,4,9);assert(dialog.innerHTML.includes('Day 8 · 4 / 9 games completed today'));assert(dialog.innerHTML.includes('3 / 112 days completed'));assert(dialog.innerHTML.includes('Stop after this day'));stopSimulation();assert.equal(dialog.textContent,'Finishing this day…');
console.log('PASS: single playoff progress, round/full progress, stop after saved game, resume, save/game failures, cleanup, regular-season labels.');
})()`,context)})().catch(e=>{console.error(e);process.exitCode=1});
