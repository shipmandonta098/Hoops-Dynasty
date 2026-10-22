const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};
let shown=0;showAllStarWeekend=()=>{shown++};
const freshSeason=()=>validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));
state=freshSeason();const initial=copy(state);
await sim(seasonLength()-state.day);
assert.equal(state.day,seasonLength());assert.equal(state.allStarVoting.phase,'final');assert(state.allStarEvents.results.some(r=>r.key==='game'));assert.equal(shown,0);
assert.equal(state.history.length,state.schedule.flat().length);
state=copy(initial);
while(!allStarSimulationPaused()&&state.day<seasonLength())await sim(1);
assert(allStarSimulationPaused());const pausedDay=state.day;
assert.equal(await sim(1),false);assert.equal(state.day,pausedDay);assert.equal(shown,1);
save=async()=>false;assert.equal(await sim(seasonLength()-state.day),false);assert.equal(state.day,pausedDay);assert(allStarSimulationPaused());
save=async()=>true;await sim(seasonLength()-state.day);
assert.equal(state.day,seasonLength());assert.equal(state.allStarVoting.phase,'final');assert(state.allStarEvents.results.some(r=>r.key==='game'));assert.equal(shown,1);
console.log('PASS: full-season advancement, manual ballot pause, resume from ballot, save failure protection and All-Star events.');
})()`,context)})().catch(e=>{console.error(e);process.exitCode=1});
