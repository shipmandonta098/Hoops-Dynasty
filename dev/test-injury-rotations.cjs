const assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');const r=loadLeague({seed:42,strictDOM:false});r.context.assert=assert;
r.run(`
state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));
const club=team(),initial=rotationFromClub(club),hurt=club.roster[0],backup=club.roster[5];
club.rotationPlan={depth:copy(initial.depth),roles:copy(initial.roles),staggerStars:false,foulThreshold:2};
const pos=courtPositions().find(pos=>initial.depth[pos][0]===hurt.id);club.rotationPlan.depth[pos][1]=backup.id;
const allocated=allocateGameMinutes(club);for(const p of club.roster)p.rotationMinutes=allocated.get(p.id);
const before=JSON.stringify(club.rotationPlan),savedMinutes=club.roster.map(p=>p.rotationMinutes);
hurt.medicalInfo={until:medicalStamp()+5,name:'Sprain',severity:'Minor'};
const plan=rotationFromClub(club);assert.equal(plan.targets[hurt.id],0);assert.equal(plan.depth[pos][0],backup.id);
assert.equal(Object.values(plan.targets).reduce((a,b)=>a+b,0),gamePlayerMinutes());assert.deepEqual(Array.from(rotationErrors(plan,club)),[]);
assert(!Object.values(plan.depth).flat().includes(hurt.id));assert.equal(buildRotationTimeline(club,plan).length,gameMinutes());
assert(!buildRotationTimeline(club,plan).flat().includes(hurt.id));
assert(rotationsView().includes('Inactive / IR'));assert(roster().includes('injured-player'));assert(roster().includes('Out — 0 minutes'));
rotationDraft=null;assert.equal(draftRotation().targets[hurt.id],0);
const result=simulateAttributeGame(0,1);assert.equal(result.box.find(p=>p.playerId===hurt.id).mp,0);
assert.equal(JSON.stringify(club.rotationPlan),before);assert.deepEqual(club.roster.map(p=>p.rotationMinutes),savedMinutes);
for(const p of club.roster)delete p.medicalInfo;delete hurt.injuredUntil;
assert.equal(draftRotation().depth[pos][0],hurt.id);assert.equal(playerMinutes(hurt,club),hurt.rotationMinutes);
hurt.medicalInfo={until:medicalStamp()+5};backup.medicalInfo={until:medicalStamp()+5};
for(const count of [3,4,5]){state.leagueSettings.courtPlayers=count;state.leagueSettings.periodMinutes=10;const custom=rotationFromClub(club);assert.equal(Object.values(custom.targets).reduce((a,b)=>a+b,0),gamePlayerMinutes());assert.equal(rotationErrors(custom,club).length,0);assert.equal(buildRotationTimeline(club,custom).length,gameMinutes());}
state.leagueSettings.courtPlayers=5;state.leagueSettings.periodMinutes=12;
for(const p of club.roster)delete p.medicalInfo;
for(const p of club.roster.slice(4))p.medicalInfo={until:medicalStamp()+5};
const short=rotationFromClub(club);assert(rotationErrors(short,club).length>0);assert(injuryRotationAdvice(club).includes('Not enough healthy players'));
assert(Object.values(short.targets).every(n=>Number.isFinite(n)&&n<=gameMinutes()));
`);console.log('PASS injured starter/backup promotion, minutes, depth/timeline, red UI/IR, zero game minutes, recovery, saved-plan preservation and short roster validation');
