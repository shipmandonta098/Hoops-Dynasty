const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

(async()=>{await vm.runInContext(`(async()=>{
state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};
showAllStarWeekend();
let v=allStarVotingStore(),id=team().roster[0].id,votes=v.entries.find(e=>e.id===id).votes,cash=financeFor().cash;
await allStarCampaign(id);assert.equal(allStarVotingStore().entries.find(e=>e.id===id).votes,votes+15000);assert.equal(financeFor().cash,cash-.25);
await allStarCampaign(id);assert.equal(financeFor().cash,cash-.25);
let rollbackId=team().roster[1].id,prior=JSON.stringify(state);save=async()=>false;await allStarCampaign(rollbackId);assert.equal(JSON.stringify(state),prior);save=async()=>true;
state=validateCareerData(copy(state));
await sim(seasonLength());assert.equal(state.day,allStarCloseDay());assert(allStarSimulationPaused());
v=state.allStarVoting;assert(v.snapshot.every(r=>Math.abs(r.score-(r.fanScore*.5+r.mediaScore*.25+r.playerScore*.25))<.00001));
state=validateCareerData(copy(state));v=state.allStarVoting;
let cultGroup=v.groups[0],candidate=v.snapshot.filter(r=>cultGroup.ids.includes(r.id)).sort((a,b)=>a.score-b.score)[0];v.cult=candidate.id;candidate.fanVotes=99999999;assert(allStarStarters(v,cultGroup).some(r=>r.id===candidate.id));assert(!allStarStarters(v,cultGroup,[candidate.id]).some(r=>r.id===candidate.id));
allStarPrepareBallotUI(v);let ctx=allStarBallotContext(v);assert(ctx.rows.every(r=>r.team!==0));allStarBallotUI.ids=ctx.rows.slice(0,ctx.quota).map(r=>r.id);
let reviewBefore=JSON.stringify(state);save=async()=>false;await confirmAllStarSelections();assert.equal(JSON.stringify(state),reviewBefore);save=async()=>true;
await confirmAllStarSelections();assert.equal(state.allStarVoting.phase,'final');v=state.allStarVoting;
assert.equal(new Set(v.selected.map(r=>r.id)).size,v.selected.length);assert.equal(v.selected.length,v.groups.reduce((n,g)=>n+g.count,0));
for(const g of v.groups){let starters=v.selected.filter(r=>r.group===g.name&&r.role==='Starter');assert.equal(starters.length,g.starterCount);if(g.starterCount===5)assert.equal(starters.filter(r=>['PG','SG'].includes(r.pos)).length,2);}
assert(JSON.stringify(state).includes('All-Star selections:'));let announced=JSON.stringify(state);await confirmAllStarSelections();assert.equal(JSON.stringify(state),announced);
state=validateCareerData(copy(state));v=state.allStarVoting;
state.leagueSettings.allStarElam=true;state.leagueSettings.allStarAssignment='draft';allStarAssign(v);assert(v.draftLog.length);let before=JSON.stringify(state.teams),game=simulateAllStarExhibition(v);assert(game.target);assert(Math.max(...game.scores)>=game.target);assert(game.events.some(e=>e.startsWith('Q4 UNTIMED')));assert.equal(JSON.stringify(state.teams),before);
state=validateCareerData(copy(state));
await sim(seasonMilestones().end-state.day);assert(state.allStarReport.length);state=validateCareerData(copy(state));showAllStarWeekend();
state.leagueSettings.allStarEnabled=false;assert(!allStarSimulationPaused());showAllStarWeekend();
console.log('PASS All-Star campaign, duplicate guard, ballot pause, scoring, selection, announcements, saves, draft, Elam and exhibition isolation');
})()`,context)})().catch(e=>{console.error(e);process.exitCode=1});
