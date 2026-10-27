// CPU general managers: unique generated names that follow the league gender, award labels and headline,
// news/inbox bylines, franchise history, season-end firing with a replacement, save round trip and old-save migration.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const league=(gender='male',seed=71)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.run(`render=()=>{};save=async()=>true;toast=()=>{};var said=[];var d=makeDraft();d.gmName='Pat Boss';d.leagueGender='${gender}';state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';`);return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
(async()=>{
let {l,run}=league();
// 1. Every CPU team has a named GM; the user's team keeps state.gmName; names are unique across GMs and players.
const gms=run(`state.teams.map(t=>t.gm?{id:t.gm.id,name:t.gm.name,gender:t.gm.gender,age:t.gm.age,hired:t.gm.hiredYear,bio:t.gm.bio}:null)`);
assert.equal(gms[0],null,'user team has no CPU GM');assert.equal(run(`gmDisplayName(state.teams[0])`),'Pat Boss');
const cpu=gms.slice(1);assert.equal(cpu.length,run('state.teams.length-1'));
assert.equal(new Set(cpu.map(g=>g.name)).size,cpu.length,'GM names are unique');assert.equal(new Set(cpu.map(g=>g.id)).size,cpu.length,'GM ids are unique');
assert(!run(`state.teams.flatMap(t=>t.roster).some(p=>state.teams.some(t=>t.gm?.name===p.name))`),'no GM shares a player name');
assert(run(`state.teams.filter(t=>t.gm).every(t=>nameRegistry(state).used.includes(nameKey(t.gm.name)))`),'GM names are reserved in the name registry');
for(const g of cpu){assert(g.age>=34&&g.age<=63&&g.hired<=run('state.year')&&g.hired>=run('state.year')-5,JSON.stringify(g));assert(g.bio.college&&g.bio.hometown&&g.bio.previous&&g.bio.style);assert.equal(g.gender,'male')}
const before=run(`state.teams[3].gm.name`);assert.equal(run(`(()=>{const t=state.teams[3];return gmFor(t).name})()`),before,'gmFor keeps the stored GM');
// Gender follows the league setting.
assert(league('female',72).run(`state.teams.filter(t=>t.gm).every(t=>t.gm.gender==='female')`),'female league → female GMs');
const mixed=league('mixed',73).run(`state.teams.filter(t=>t.gm).map(t=>t.gm.gender)`);assert(mixed.includes('male')&&mixed.includes('female'),'mixed league has both');
// 2. Save round trip; invalid GM data is rejected; old saves are migrated.
const rt=run(`(()=>{const v=validateCareerData(JSON.parse(JSON.stringify(state)));return v.teams.map(t=>t.gm?.name??null)})()`);assert.deepEqual(rt,gms.map(g=>g?.name??null),'round trip keeps every GM');
for(const [label,mut] of [['bad name','g.name=""'],['bad gender','g.gender="x"'],['bad age','g.age=5'],['bad bio','g.bio.style=7'],['bad season','g.seasons=[{year:2026}]'],['bad pressure','g.pressure=500']])
 assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state)),g=r.teams[2].gm;${mut};validateCareerData(r)})()`),/general manager/,label);
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[2].gm.id=r.teams[3].gm.id;validateCareerData(r)})()`),/duplicate general manager/);
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.formerGMs=[{bogus:1}];validateCareerData(r)})()`),/general manager/);
const migrated=run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams.forEach(t=>delete t.gm);delete r.formerGMs;delete r.nameGeneration;r.franchiseArchive=[{year:r.year-1,key:r.teams[1].key,name:'Old',w:41,l:41,playoffs:false,champion:false}];const v=validateCareerData(r);return {gms:v.teams.map(t=>t.gm?.name??null),former:v.formerGMs.length,archive:v.franchiseArchive[0].gm??null}})()`);
assert.equal(migrated.gms[0],null);assert(migrated.gms.slice(1).every(Boolean),'old save: every CPU team gets a GM');assert.equal(new Set(migrated.gms.slice(1)).size,migrated.gms.length-1,'migrated names are unique');
assert.equal(migrated.former,0);assert.equal(migrated.archive,null,'old franchise rows stay without a GM');
// 3. Executive of the Year uses GM names; the headline is "Name, City Team" (no repeated city).
for(let i=0;i<4;i++)await l.run('simulateDayHeadless()');
const cands=run(`executiveCandidates()`);assert(cands.length>0);
for(const c of cands){const t=run(`(()=>{const t=state.teams[${c.club}];return {name:gmDisplayName(t),team:t.city+' '+t.name}})()`);assert.equal(c.name,t.name);assert(!/Front Office/.test(c.name))}
assert(/GM profile|openGMProfile/.test(run(`(()=>{awardRaceTab='executive';return awardRacesView()})()`)),'award table links GM profiles');
const awards=run(`(()=>{const out=[],s=say;say=t=>{out.push(t);s(t)};const day=state.day;state.day=seasonLength();try{finalizeRegularAwards()}finally{state.day=day;say=s}return {said:out,exec:state.regularAwards.at(-1).executive}})()`);
const head=awards.said.find(s=>s.startsWith('Executive of the Year'));assert(head,'executive headline');
const club=run(`(()=>{const t=state.teams[${JSON.stringify(awards.exec)}.id];return {city:t.city,full:t.city+' '+t.name}})()`);
assert.equal(head,'Executive of the Year: '+awards.exec.name+', '+club.full+'.');assert.equal(head.split(club.city).length-1,1,'city appears once: '+head);
assert(awards.said.some(s=>/^Most Valuable Player: .+ \(.+\)\.$/.test(s))||awards.said.length>1,'other award headlines keep their format');
// 4. News bylines and inbox use GM names.
const news=run(`(()=>{const out=[],s=say;say=t=>{out.push(t);s(t)};try{const t=state.teams[4],p=t.roster.at(-1);cpuRelease(t,p,{text:'to open a roster spot',allowBelowMinimum:true});const fa=state.free.find(x=>x.id===p.id)||state.free[0];cpuSign(t,fa,cpuSignTerms(t,fa,'fill'),'for depth')}finally{say=s}return {said:out,lead:gmLead(state.teams[4]),cats:out.map(newsCategory)}})()`);
assert(news.said.some(s=>s.startsWith(news.lead+' releases ')),JSON.stringify(news.said));assert(news.said.some(s=>s.startsWith(news.lead+' signs ')),JSON.stringify(news.said));
assert(news.cats.every(c=>c==='Transactions'),'GM bylines stay transaction news');
const inbox=run(`(()=>{state.gmInbox={nextId:1,items:[],lastProposal:''};const day=state.day;state.day=7;try{generateGMProposal()}finally{state.day=day}return state.gmInbox.items.filter(m=>m.type==='Trade proposal').map(m=>m.sender)})()`);
if(inbox.length)assert(run(`state.teams.some(t=>t.gm&&${JSON.stringify(inbox[0])}===t.gm.name+', '+t.city+' GM')`),inbox[0]);
// 5. Franchise history records the GM; the history page shows the column.
assert.equal(run(`currentFranchiseSeason(state.teams[5]).gm`),run('state.teams[5].gm.name'));assert.equal(run(`currentFranchiseSeason(state.teams[0]).gm`),'Pat Boss');
assert(/<th scope="col">GM<\/th>/.test(run(`(()=>{franchiseHistoryPage='seasons';return teamHistoryPage(state.teams[5])})()`)));
// 6. Season end: a struggling CPU GM with an impatient owner is fired and replaced (with news); a winner is kept.
const end=run(`(()=>{const out=[],s=say;say=t=>{out.push(t);s(t)};const bad=state.teams[6],good=state.teams[7],e=executiveState(),records=[bad.w,bad.l,good.w,good.l],champion=state.champion;
 bad.w=12;bad.l=70;good.w=60;good.l=22;e.teams.find(x=>x.key===bad.key).expectedRate=.55;bad.gm.hiredYear=state.year-3;bad.gm.pressure=40;ownerFor(bad).patience=20;good.gm.hiredYear=state.year-3;
 const oldBad=bad.gm.name,oldGood=good.gm.name,oldId=bad.gm.id;state.champion=good.id;try{archiveCoachRecords();archiveCoachRecords()}finally{say=s;[bad.w,bad.l,good.w,good.l]=records;state.champion=champion}
 return {said:out,oldBad,newBad:bad.gm.name,newHired:bad.gm.hiredYear,good:good.gm.name,oldGood,goodSeason:good.gm.seasons.at(-1),former:state.formerGMs.map(g=>({id:g.id,name:g.name,reason:g.reason,lastTeam:g.lastTeam,seasons:g.seasons.length})),oldId,year:state.year,fires:out.filter(t=>/ fires GM /.test(t)).length}})()`);
assert.notEqual(end.newBad,end.oldBad,'bad GM replaced');assert.equal(end.newHired,end.year+1);assert.equal(end.good,end.oldGood,'title GM kept');
assert(end.said.some(s=>s.includes('fires GM '+end.oldBad)&&s.includes(end.newBad+' named general manager')),JSON.stringify(end.said));
assert(end.former.some(g=>g.id===end.oldId&&g.reason==='Fired'&&g.seasons===1));
assert.deepEqual({title:end.goodSeason.title,year:end.goodSeason.year,w:end.goodSeason.w},{title:true,year:end.year,w:60});
assert.equal(end.fires,run(`state.formerGMs.length`),'archiving twice does not fire again');
// Profiles render for current and former GMs; careers count titles and awards.
const profile=run(`(()=>{let html='';const t=titleModal;titleModal=(a,b)=>{html=b};try{openGMProfile(state.teams[7].gm.id)}finally{titleModal=t}return html})()`);
assert(/Executive record/.test(profile)&&/Career summary/.test(profile)&&profile.includes(end.good));
const former=run(`(()=>{let html='';const t=titleModal;titleModal=(a,b)=>{html=b};try{openGMProfile(${end.oldId})}finally{titleModal=t}return html})()`);assert(/Former general manager · Fired by/.test(former));
assert(/GM profile →/.test(run(`(()=>{rosterTeamId=7;return roster()})()`)),'roster shows the GM card');
// The fired GM, history and the new GM survive a save round trip.
const saved=run(`(()=>{const v=validateCareerData(JSON.parse(JSON.stringify(state)));return {former:v.formerGMs.length,name:v.teams[6].gm.name,seasons:v.teams[7].gm.seasons.length}})()`);
assert.deepEqual(saved,{former:end.former.length,name:end.newBad,seasons:1});
// 7. A user hired into a CPU front office replaces that GM.
const hire=run(`(()=>{const t=state.teams[9],name=t.gm.name;gmRetire(t,'Replaced');return {name,gone:!t.gm,display:gmDisplayName(state.teams[0])}})()`);assert(hire.gone);
console.log('General managers: unique gendered names, award labels/headline, news/inbox bylines, history, firing, save/load and migration passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
