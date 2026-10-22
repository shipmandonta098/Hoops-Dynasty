const assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');const r=loadLeague({seed:18,strictDOM:false});r.context.assert=assert;
r.run(`
state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));
assert(state.executiveSeason);const old=copy(state);delete old.executiveSeason;assert(validateCareerData(old).executiveSeason);
state.awardRaces={year:2026,weeks:[{day:7,ranks:{mvp:[],roy:[],dpoy:[],sixth:[],mip:[],coach:[]}}]};assert.equal(readAwardRaces(state.awardRaces,m=>{throw Error(m)}).weeks[0].ranks.executive.length,0);
for(const t of state.teams){t.marketSize='Medium';t.w=40;t.l=42;const b=state.executiveSeason.teams.find(b=>b.key===t.key);b.expectedRate=40/82;b.openingPayroll=ownerPayroll(t);financeFor(t).season.tax=0;financeFor(t).season.settled=true}
let a=executiveCandidates([]).find(r=>r.club===0);assert.equal(a.score,40);
state.executiveSeason.teams[0].expectedRate=20/82;state.teams[0].w=45;state.teams[0].l=37;
a=executiveCandidates([])[0];assert.equal(a.club,0);assert.equal(a.score,82.5);
financeFor(team()).season.tax=10;assert.equal(executiveCandidates([])[0].score,80.5);
team().marketSize='Small';assert.equal(executiveCandidates([])[0].score,88.55);
state.executiveSeason.teams[0].openingPayroll=ownerPayroll(team())+21;assert.equal(executiveCandidates([])[0].cleanBonus,5);
state.executiveSeason.teams[0].injuryGames=40;team().w=50;team().l=32;assert.equal(executiveCandidates([])[0].injuryBonus,5);
state.draftHistory=[{year:2025,picks:[{id:99,team:0}]}];assert.equal(executiveCandidates([{id:99,rookie:true,score:100,gp:82}])[0].draftBonus,5);
state.draftHistory=[];state.day=seasonLength();finalizeRegularAwards();assert(state.regularAwards[0].executive);const winner=JSON.stringify(state.regularAwards[0].executive);finalizeRegularAwards();assert.equal(state.regularAwards.length,1);assert.equal(JSON.stringify(state.regularAwards[0].executive),winner);assert(state.newsFeed.items.some(n=>n.headline.startsWith('Executive of the Year:')));
assert.equal(readLeagueHistory(state.regularAwards,m=>{throw Error(m)})[0].executive.name,state.gmName);awardRaceTab='executive';assert(awardRacesView().includes('Wins / $M'));assert(leagueHistoryView().includes('Executive of the Year'));
state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));const base=copy(state.executiveSeason);const star=team().roster.find(p=>p.id===base.teams[0].starId);star.medicalInfo={until:medicalStamp()+5,rehabUntil:medicalStamp()+5,name:'Sprain',severity:'Minor'};play(0,1);assert.equal(state.executiveSeason.teams[0].injuryGames,1);const checkpoint=fresh(defaultTeams().slice(0,6),2,2026,'male',14);checkpoint.executiveSeason=copy(state.executiveSeason);const roundtrip=validateCareerData(checkpoint);assert.equal(roundtrip.executiveSeason.teams[0].injuryGames,1);assert.equal(JSON.stringify(hdSplit({id:'test',data:state}).leagues[0].core.executiveSeason),JSON.stringify(state.executiveSeason));
const nextData=copy(checkpoint);nextData.year++;nextData.franchiseArchive=[{year:2026,key:nextData.teams[0].key,w:20,l:62}];const baseline=executiveBaseline(nextData);assert.equal(baseline.year,2027);assert.equal(baseline.teams[0].expectedRate,20/82);assert.equal(baseline.teams[0].injuryGames,0);
`);console.log('PASS balanced scoring, tax, small market, clean sheet, injury and draft bonuses; legacy compatibility; announcement once; history/UI; injury tracking and save validation');
