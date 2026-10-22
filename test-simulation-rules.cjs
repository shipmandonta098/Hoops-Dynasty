const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};showResult=()=>{};
for(const [periods,length,players] of [[4,12,5],[2,20,3],[4,10,4],[1,6,5]]){
 state=validateCareerData(fresh(defaultTeams().slice(0,6),2));Object.assign(state.leagueSettings,{gamePeriods:periods,periodMinutes:length,courtPlayers:players,overtimeMinutes:3,threePointers:false,injuriesEnabled:false,foulLimit:5,bonusFouls:4});
 assert.equal(simulationClock(0).time,length+':00');assert.equal(simulationClock(periods*length*60).period,'OT1');assert.equal(simulationClock(periods*length*60).time,'3:00');assert.equal(simulationClock((periods*length+3)*60).period,'OT2');
 const plan=rotationFromClub(team());assert.equal(Object.values(plan.targets).reduce((a,b)=>a+b,0),periods*length*players);assert.equal(buildRotationTimeline(team(),plan).length,periods*length);
 await sim(1);assert(state.history.length>0);for(const g of state.history){assert(g.box.every(p=>p.tpa===0&&p.tpm===0));assert.equal(g.gameRules.courtPlayers,players);for(const t of [g.a,g.b]){const rows=g.box.filter(p=>p.team===state.teams[t].abbr),minutes=rows.reduce((s,p)=>s+p.mp,0);assert(minutes>=periods*length*players-.1);assert.equal(rows.filter(p=>p.gs).length,players);assert.equal(rows.filter(p=>p.onCourt).length,players);}assert(g.box.every(p=>p.pf<=5));}state=validateCareerData(state);assert.equal(state.history[0].gameRules.periodMinutes,length);assert.equal(watchClock(state.history[0],0).time,length+':00');assert.equal(durabilityInjuryChance(team().roster[0],30,80),0);
}
state=validateCareerData(fresh(defaultTeams().slice(0,6),2));Object.assign(state.leagueSettings,{gamePeriods:2,periodMinutes:20,courtPlayers:3});rotationDraft=null;autoAllocateRotation();assert.deepEqual(Array.from(rotationErrors(draftRotation(),team())),[]);await applyRotationPlan();state=validateCareerData(state);assert(rotationValid(team()));assert.equal(buildRotationTimeline(team(),rotationFromClub(team())).length,40);
state.leagueSettings.bonusFouls=3;assert(!gameInBonus(2));assert(gameInBonus(3));assert(!gameInBonus(0));
assert.throws(()=>readLeagueSettings({...leagueRules(),gamePeriods:8,periodMinutes:20}));assert.throws(()=>readLeagueSettings({...leagueRules(),courtPlayers:6}));assert.throws(()=>readLeagueSettings({...leagueRules(),foulLimit:0}));
console.log('PASS: regulation/OT clocks, 3/4/5-player lineups, rotation minute allocation and save/reload, no three-point attempts, foul caps, injuries toggle, persisted game rules and validation.');
})()`,context);})().catch(e=>{console.error(e);process.exitCode=1});
