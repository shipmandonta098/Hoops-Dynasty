const assert=require('node:assert/strict');
const {loadLeague}=require('./load-league.cjs');
const r=loadLeague({seed:2026});r.context.assert=assert;
r.run(`
const setup=makeDraft();setup.teams=setup.teams.slice(0,6);setup.meetings=2;setup.gmName='Aging QA';
state=validateCareerData(buildSetupCareer(setup));simulationExecution.mode='headless';simulationExecution.autopilot=true;
// All dates use the established October 1 season reference, regardless of current day.
const birthdays=['2000-06-20','2000-07-01','2000-08-04','2000-10-01','2000-10-02','2000-10-28','2000-12-31','2000-01-01','2000-02-29'];
for(const birthdate of birthdays){const expected=2026-2000-(birthdate.slice(5)>'10-01'?1:0);assert.equal(agingSeasonAge(birthdate,2026),expected);assert.equal(agingSeasonAge(birthdate,2027),expected+1);}
assert.equal(agingSeasonAge('2001-02-29',2026),null);
for(const p of fastAllPlayers())assert.equal(agingSeasonAge(p.bio.birthdate,state.year),p.age);
internationalOffseason();
const professionals=state.free.filter(p=>p.international?.pathway==='professional');assert(professionals.length);for(const p of professionals)assert.equal(agingSeasonAge(p.bio.birthdate,state.year),p.age);
const prospects=ensureDraft().prospects;
assert(prospects.some(p=>p.international));assert(prospects.some(p=>!p.international));
for(const p of prospects)assert.equal(agingSeasonAge(p.bio.birthdate,state.year),p.age);
const ordinary=prospects.find(p=>!p.international),stash=prospects.find(p=>p.international);
stash.international.country='FR';stash.international.pathway='stash';stash.international.stashUntil=2029;stash.international.lastDevelopment=2026;stash.international.hiddenGrowth=0;
state.draftRights=[{team:0,player:ordinary},{team:0,player:stash}];state.draft=null;
const injured=team().roster[0];injured.injury={type:'Test',days:10};
const retired=copy(state.free[0]);retired.id=999999;retired.name='Already Retired';
const frozen=JSON.stringify(retired);
const trace=traceSeasonAging(),old=state.year;state.year++;advanceSeasonPlayerAges(old,state.year);internationalNewSeason();internationalNewSeason();const ages=trace.finish();
for(const row of ages.values()){assert.equal(row.afterAge,row.beforeAge+1);assert.equal(row.agingApplications,1);assert.equal(row.afterAge,row.birthdateExpectedAge);}
assert.equal(JSON.stringify(retired),frozen);
assert.equal(stash.international.lastDevelopment,2027);
// Retirement after aging: inspect the retained player reference, not a missing roster lookup.
const veteran=copy(team().roster[0]);veteran.id=888888;veteran.name='Retirement QA';veteran.age=43;veteran.bio=generatePlayerBio(veteran,state.year,state.teams);team().roster.push(veteran);
const retirementTrace=traceSeasonAging();state.year++;advanceSeasonPlayerAges(state.year-1,state.year);hallRollover();const retiredRow=retirementTrace.finish().get(veteran.id);
assert.equal(retiredRow.afterStatus,'retired');assert.equal(retiredRow.afterAge,44);assert.equal(retiredRow.agingApplications,1);
// Validator must catch both a missed increment and a double increment with full diagnostics.
state=validateCareerData(buildSetupCareer(setup));
const checks=traceSeasonAging();state.year++;advanceSeasonPlayerAges(state.year-1,state.year);const bad=state.free[0];bad.age++;const rows=checks.finish();
let failure;try{validateHeadlessLeague({ages:rows})}catch(e){failure=e}assert(failure);const issue=failure.issues.find(x=>x.playerId===bad.id&&x.agingApplications===2);assert(issue);assert(issue.birthdate);assert(issue.previousLeagueDate);assert(issue.currentLeagueDate);assert.equal(issue.expectedAge,issue.beforeAge+1);
state=validateCareerData(buildSetupCareer(setup));const missed=traceSeasonAging();state.year++;const missing=missed.finish();assert.throws(()=>validateHeadlessLeague({ages:missing}),/applications 0/);
// Save normalization preserves age and birthdate; it does not silently repair corruption.
state=validateCareerData(buildSetupCareer(setup));const source=copy(state),loaded=validateCareerData(copy(state));assert.equal(loaded.free[0].age,source.free[0].age);assert.equal(loaded.free[0].bio.birthdate,source.free[0].bio.birthdate);
`);
console.log('PASS: season-age date edges, leap day, domestic/international prospects, all live pools, injured players, stash repeat safety, retirement trace, zero/double-aging detection, save age/DOB preservation.');
