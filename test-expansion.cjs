const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;
const completeSeason=()=>{state.schedule.forEach(round=>round.forEach(([a,b])=>{state.teams[a].w++;state.teams[b].l++}));state.day=state.schedule.length;state.champion=0};
state=fresh(defaultTeams(),82);completeSeason();const calendar=JSON.stringify(state.schedule);state.teams.forEach(t=>t.roster.forEach(p=>p.salary=3));
const values={city:'Austin',name:'Armadillos',abbr:'AUS',arenaName:'Austin Arena',divisionId:state.divisions[0].id,newDivision:'',conferenceId:state.conferences[0].id,marketSize:'Medium',primary:'#FF6600',secondary:'#112233',cap:'reduced',seed:'fourth',capacity:19000,ticket:90,protect:8,maximum:2,target:14,fee:900,hype:90,rebuild:'on'};
await beginExpansion({preventDefault(){},target:values});assert(state.expansion.active);assert.equal(state.teams.length,30);state=validateCareerData(copy(state));
await lockExpansionProtections();assert.equal(state.expansion.active.phase,'draft');const protectedID=state.expansion.active.protected[0][0];assert.throws(()=>expansionSelection(protectedID));
for(let i=0;i<14;i++)expansionSelection(expansionAvailable()[0].p.id);
assert.equal(state.expansion.active.picks.length,14);assert(state.teams.every(t=>state.expansion.active.picks.filter(p=>p.from===t.id).length<=2));
const first=state.expansion.active.picks[0],cash=financeFor(state.teams[0]).cash;state=validateCareerData(copy(state));await finishExpansion();assert.equal(state.teams.length,31);assert.equal(state.teams[30].roster.length,14);assert.equal(state.expansion.active,null);assert.equal(financeFor(state.teams[0]).cash,cash+30);assert.equal(JSON.stringify(state.schedule),calendar);assert.equal(expansionCap(state.teams[30],state.year+1),salaryCap()*.8);assert.equal(financeProjection(state.teams[30]).capacity,19000);assert.equal(state.teams[first.from].roster.length,8);state=validateCareerData(copy(state));
await runDraftLottery();assert.equal(state.draft.order[3],30);assert.equal(new Set(state.draft.order).size,31);await autoDraft(false);assert(draftComplete());state=validateCareerData(copy(state));
// Isolate rollover from the independent bidding workflow, retaining valid rosters.
state.freeAgency={year:state.year,phase:'complete',round:1,players:[],offers:[],pending:[],mle:{},log:[]};ownerFinalize=()=>{};newSeason();assert.equal(state.year,2027);assert.equal(state.scheduleFormat,'roundRobin');assert.equal(state.schedule.length,62);assert(state.schedule.every(r=>new Set(r.flat()).size===r.flat().length));state=validateCareerData(copy(state));assert.equal(state.expansion.history.length,1);
// Additional franchise next year produces an even league and retains historic draft rounds.
completeSeason();values.city='Richmond';values.name='Ravens';values.abbr='RIC';values.cap='standard';values.seed='equal';values.protect=0;await beginExpansion({preventDefault(){},target:values});assert(state.expansion.active);await lockExpansionProtections();for(let i=0;i<14;i++){const pool=expansionAvailable().sort((a,b)=>a.p.salary-b.p.salary);expansionSelection(pool[0].p.id)}await finishExpansion();assert.equal(state.teams.length,32);state=validateCareerData(copy(state));await runDraftLottery();assert.equal(new Set(state.draft.order).size,32);state=validateCareerData(copy(state));
await autoDraft(false);await beginFreeAgency();assert(faActive());
for(let n=0;n<45&& (state.freeAgency.phase==='resign'||state.teams.some(t=>t.roster.length<8));n++){
 for(const sheet of [...state.freeAgency.pending])await matchFreeAgent(sheet.id,false);
 if(team().roster.length<8){for(const p of state.free.slice().sort((a,b)=>a.salary-b.salary)){const o={id:p.id,team:0,salary:Math.round(Math.max(faMinimum(p),faEntry(p.id).demand*1.15)*10)/10,years:2,minutes:32,route:faRoute(p,team(),faEntry(p.id).demand)};if(!faOfferCheck(p,team(),o)){state.freeAgency.offers.push(o);break}}}
 await advanceFreeAgency();
}
for(const sheet of [...state.freeAgency.pending])await matchFreeAgent(sheet.id,false);await finishFreeAgency();assert.equal(state.freeAgency.phase,'complete');newSeason();assert.equal(state.year,2028);assert.equal(state.schedule.length,62);sim(1);assert.equal(state.history.length,16);state=validateCareerData(copy(state));

})()`,context);console.log('Expansion staging, protection limits, finances, reload, lottery, 31-team schedule, and second expansion passed.');})().catch(e=>{console.error(e);process.exitCode=1});
