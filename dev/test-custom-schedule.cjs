const assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');
const l=loadLeague({seed:1997,strictDOM:false});l.context.assert=assert;
l.run(`(()=>{
function checkCalendar(cal,teams,rules,year){
 assert.ok(validateCustomSeason(cal,teams,rules,year));
 const matrix=teams.map(()=>teams.map(()=>0)),home=teams.map(()=>0),categories=teams.map(()=>[0,0,0]);
 cal.forEach(round=>{const seen=new Set();round.forEach(([a,b])=>{assert.notEqual(a,b);assert.ok(!seen.has(a)&&!seen.has(b));seen.add(a);seen.add(b);matrix[a][b]++;matrix[b][a]++;home[a]++;const c=customCategory(teams[a],teams[b]);categories[a][c]++;categories[b][c]++})});
 assert.equal(cal.flat().length,teams.length*rules.seasonGames/2);
 teams.forEach((t,i)=>{assert.equal(matrix[i].reduce((a,b)=>a+b,0),rules.seasonGames);assert.ok(Math.abs(2*home[i]-rules.seasonGames)<=1);for(let j=0;j<teams.length;j++){assert.equal(matrix[i][j],matrix[j][i]);const h=cal.flat().filter(p=>p[0]===i&&p[1]===j).length;assert.ok(Math.abs(2*h-matrix[i][j])<=1)}});
 return {matrix,home,categories};
}
const d=makeDraft();d.year=1997;d.gmName='Schedule Test';d.teams=d.teams.slice(0,8);d.selectedKey=d.teams[0].key;d.conferences=[{id:'east',name:'Eastern'},{id:'west',name:'Western'}];d.divisions=[];d.teams.forEach((t,i)=>{t.divisionId='';t.conferenceId=i<4?'east':'west'});d.meetings='custom';d.leagueGender='female';d.leagueSettings={...LEAGUE_SETTING_DEFAULTS,seasonGames:28,divisionGames:0,conferenceGames:14,seasonStart:'06-21',seasonEnd:'08-31',playoffFormat:'top4'};syncAlignment(d);
assert.equal(validateDraft(d,true),'');const created=buildSetupCareer(d);state=created;
const result=checkCalendar(created.schedule,created.teams,created.leagueSettings,1997);
assert.equal(created.schedule.length,72);result.categories.forEach(c=>assert.deepEqual(c,[0,14,14]));
created.teams.forEach((t,i)=>{for(const [category,expected] of [[1,[4,5,5]],[2,[3,3,4,4]]])assert.deepEqual(created.teams.map((o,j)=>i!==j&&customCategory(t,o)===category?result.matrix[i][j]:null).filter(x=>x!==null).sort((a,b)=>a-b),expected)});
const reloaded=validateCareerData(JSON.parse(JSON.stringify(created)));assert.equal(reloaded.divisions.length,0);assert.ok(reloaded.teams.every(t=>t.divisionId===''));assert.deepEqual(reloaded.schedule,created.schedule);
console.log('PASS 1997 career creation + JSON reload: 112 games; all 8 teams 28 total / 14 conference / 14 interconference / 14 home / 14 away; 5/5/4 and 4/4/3/3; reciprocal, unique daily games, June 21–August 31');
const repeated=customSeasonSchedule(d.teams,1997,d.leagueSettings);assert.deepEqual(repeated,customSeasonSchedule(d.teams,1997,d.leagueSettings));assert.deepEqual(checkCalendar(repeated,d.teams,d.leagueSettings,1997).matrix,result.matrix);
const next=checkCalendar(customSeasonSchedule(d.teams,1998,d.leagueSettings),d.teams,d.leagueSettings,1998);assert.notDeepEqual(next.matrix,result.matrix);
console.log('PASS deterministic same-year reproduction and next-year matchup rotation');
for(const [games,conf] of [[24,12],[35,15],[56,28]]){const rules={...d.leagueSettings,seasonGames:games,conferenceGames:conf};checkCalendar(customSeasonSchedule(d.teams,1997,rules),d.teams,rules,1997)}
const standard=defaultTeams(),rules={...LEAGUE_SETTING_DEFAULTS};checkCalendar(customSeasonSchedule(standard,2026,rules),standard,rules,2026);assert.ok(validateNBASeason(nbaSeasonSchedule(standard,2026),standard));
console.log('PASS even, odd, repeated-cycle, 30-team custom 82-game and standard NBA schedules');
assert.throws(()=>customPairings(d.teams.slice(0,7),[0,14,14],scheduleRandom(1)),/endpoints/);
assert.throws(()=>customPairings(d.teams.slice(0,3),[0,3,0],scheduleRandom(1)),/odd/);
assert.throws(()=>customSeasonSchedule(d.teams,1997,{...d.leagueSettings,divisionGames:15,conferenceGames:15}),/exceeds/);
console.log('PASS explicit mathematical impossibility diagnostics');
const originalEight=defaultTeams().slice(0,8);checkCalendar(customSeasonSchedule(originalEight,1997,d.leagueSettings),originalEight,d.leagueSettings,1997);
const fixedPairs=customPairings(d.teams,[0,14,14],scheduleRandom(19));
const homeOne=orientSeasonPairs(fixedPairs,8,1997),homeTwo=orientSeasonPairs(fixedPairs,8,1998);
for(let a=0;a<8;a++)for(let b=a+1;b<8;b++)assert.equal(homeOne.filter(p=>p[0]===a&&p[1]===b).length,homeTwo.filter(p=>p[0]===b&&p[1]===a).length);
assert.ok(divisionOptions('@east',d).includes('value="@east" selected>No division'));
console.log('PASS reproduced first-eight-team alignment, necessary uneven-category allocation, extra-home rotation, conference-only selector');


for(const n of [4,6,8,10])for(let y=1997;y<2002;y++){const ts=defaultTeams().slice(0,n).map(t=>({...t,conference:'C',divisionId:''})),r={...d.leagueSettings,allStarEnabled:false,seasonGames:n-1,conferenceGames:n-1,seasonStart:'06-01',seasonEnd:'06-'+String(n-1).padStart(2,'0')};checkCalendar(customSeasonSchedule(ts,y,r),ts,r,y)}
console.log('PASS 20 tight-calendar regressions (including former greedy false rejections)');

// Exhaustive small-graph oracle independently checks the exact degree-factor solver.
for(let n=2;n<=5;n++)for(let seed=1;seed<=20;seed++){
 const rng=scheduleRandom(seed),edges=[];for(let a=0;a<n;a++)for(let b=a+1;b<n;b++)if(rng()<.75)edges.push([a,b]);
 const possible=new Set();for(let mask=0;mask<2**edges.length;mask++){const degrees=Array(n).fill(0);edges.forEach(([a,b],i)=>{if(mask&2**i){degrees[a]++;degrees[b]++}});possible.add(degrees.join(','))}
 for(let k=0;k<30;k++){const demand=Array.from({length:n},()=>Math.floor(rng()*n)),found=scheduleDegreeFactor(edges,demand);assert.equal(found!==null,possible.has(demand.join(',')));if(found){const actual=Array(n).fill(0);found.forEach(([a,b])=>{actual[a]++;actual[b]++});assert.deepEqual(actual,demand)}}
}
console.log('PASS 2,400 independent degree-factor cases vs exhaustive graph enumeration');
})();`);
