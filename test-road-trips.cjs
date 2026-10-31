// Road trips and homestands in generated 82-game seasons: matchups and rest rules still hold, trips are mostly 2–5
// games with few one-game trips, home/away flips less than a geography-blind calendar, the same seed gives the same
// calendar, and custom cities get coordinates from the team (editable) or nearby teams. Custom formats are untouched.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const build=(code='',seed=211)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
 l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Road';${code};state=validateCareerData(buildSetupCareer(d));`);
 return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
const tripStats=`(()=>{const trips=[];let flips=0,pairs=0;for(const t of state.teams){const g=state.schedule.flatMap((r,day)=>r.filter(p=>p.includes(t.id)).map(p=>p[0]===t.id));let run=0;
 g.forEach((home,i)=>{if(i){pairs++;if(home!==g[i-1])flips++}if(home){if(run)trips.push(run);run=0}else run++});if(run)trips.push(run)}
 const share=f=>trips.filter(f).length/trips.length;return {single:share(n=>n===1),core:share(n=>n>=2&&n<=5),long:share(n=>n>6),avg:trips.reduce((a,b)=>a+b,0)/trips.length,flips:flips/pairs,
  valid:validateNBASeason(state.schedule,state.teams),rest:state.teams.every(t=>scheduleRestValid(state.schedule.map(r=>r.some(p=>p.includes(t.id))))),fmt:state.scheduleFormat,sig:state.schedule.map(r=>r.map(p=>p.join('-')).join(',')).join('|')}})()`;
// 1. A default league: valid NBA season, trip-shaped calendar.
const a=build(),s=a.run(tripStats);
assert.equal(s.fmt,'nba82');assert.equal(s.valid,true,'matchup counts, home balance, calendar length');assert.equal(s.rest,true,'no three games in three nights, back-to-back cap');
assert(s.single<0.25,'one-game trips are uncommon: '+s.single);assert(s.core>0.6,'most trips are 2–5 games: '+s.core);assert(s.long<0.02,'trips over 6 games are rare: '+s.long);
assert(s.avg>2.4,'average trip length '+s.avg);assert(s.flips<0.42,'home/away flips fall well below the ~51% of a geography-blind calendar: '+s.flips);
// All-Star break still has no games, and the season still ends on a full slate.
assert.equal(a.run(`(()=>{const c=state.allStarCalendar;return state.schedule.slice(c.breakStart-1,c.breakEnd).every(x=>!x.length)&&state.schedule.at(-1).length===state.teams.length/2})()`),true);
// 2. Deterministic for a seed.
assert.equal(build().run(tripStats).sig,s.sig,'same seed, same calendar');
// 3. Geography: known cities, presets, user coordinates and estimates for custom cities.
const geo=a.run(`(()=>{const g=leagueGeography(state.teams);return {sources:[...new Set(g.map(x=>x.source))],bos:g[state.teams.findIndex(t=>t.city==='Boston')]}})()`);
assert.deepEqual(geo.sources,['city']);assert.equal(geo.bos.timeZone,'America/New_York');assert(Math.abs(geo.bos.lat-42.37)<0.05);
const est=a.run(`(()=>{const teams=copy(state.teams),t=teams.find(x=>x.city==='Denver');t.city='Springfield';t.arenaCity='';const g=leagueGeography(teams)[t.id],
 mates=teams.filter(x=>x!==t&&x.divisionId===t.divisionId),near=nearestKnownCity(g);t.lat=36.17;t.lon=-86.78;delete t.timeZone;const own=leagueGeography(teams)[t.id];
 return {source:g.source,mates:mates.length,inside:g.lat>Math.min(...mates.map(m=>leagueGeography([m])[0].lat))-1,tz:g.timeZone===near.timeZone,own}})()`);
assert.equal(est.source,'estimate','a custom city is placed near its division');assert(est.mates>0&&est.inside&&est.tz);
assert.deepEqual(est.own,{lat:36.17,lon:-86.78,timeZone:'America/Chicago',source:'team'},'user coordinates win; time zone from the nearest known city');
assert.equal(a.run(`leagueGeography([{city:'Calgary'}])[0].timeZone`),'America/Edmonton','franchise preset cities carry their own geography');
// 4. Team editor: coordinate fields, validation, and a city move dropping stale coordinates.
assert.match(a.run(`altitudeEditorFields({lat:40.5,lon:-80.1})`),/name="lat"[^>]*value="40.5"[\s\S]*name="lon"[^>]*value="-80.1"/);
const t0=`({...copy(state.teams[0]),lat:40.5,lon:-80.1})`;
assert.deepEqual(a.run(`(()=>{const t=altitudeEditedTeam(${t0},{lat:'41.25',lon:'-81.5'});return [t.lat,t.lon]})()`),[41.25,-81.5]);
assert.deepEqual(a.run(`(()=>{const t=altitudeEditedTeam(${t0},{lat:'',lon:''});return [t.lat,t.lon]})()`),[null,null]);
assert.deepEqual(a.run(`(()=>{const t=${t0},n=altitudeEditedTeam(t,{city:'Elsewhere',lat:'40.5',lon:'-80.1'});return [n.lat,n.lon]})()`),[null,null],'moving keeps no stale coordinates');
assert.deepEqual(a.run(`(()=>{const t=${t0},n=altitudeEditedTeam(t,{city:'Elsewhere',lat:'35',lon:'-90'});return [n.lat,n.lon]})()`),[35,-90]);
const bad=c=>{try{a.l.run(`readTeamBrand(${c},m=>{throw Error(m)})`);return ''}catch(e){return e.message}};
assert.match(bad(`{lat:40,lon:null}`),/both latitude and longitude/);assert.match(bad(`{lat:95,lon:10}`),/between -90 and 90/);assert.match(bad(`{lat:40,lon:-80,timeZone:'Mars/Olympus'}`),/time zone/);
assert.deepEqual(a.run(`readTeamBrand({lat:40,lon:-80,timeZone:'America/New_York'},m=>{throw Error(m)})`),{lat:40,lon:-80,timeZone:'America/New_York'});
// Saved coordinates round-trip through a save and drive the next calendar.
const saved=a.run(`(()=>{const raw=JSON.parse(JSON.stringify(state));raw.teams[0].lat=21.3;raw.teams[0].lon=-157.86;const v=validateCareerData(raw);return [v.teams[0].lat,v.teams[0].lon,leagueGeography(v.teams)[0].source]})()`);
assert.deepEqual(saved,[21.3,-157.86,'team']);
// Older saves without coordinates load unchanged.
assert.equal(a.run(`(()=>{const raw=JSON.parse(JSON.stringify(state));const v=validateCareerData(raw);return v.teams.every(t=>t.lat===undefined)})()`),true);
// 5. Custom and round-robin formats keep their own date assignment (the trip optimizer is 82-game only).
const custom="d.meetings='custom';d.leagueSettings={...setupLeagueRules(d),seasonGames:60,divisionGames:12,conferenceGames:24};";
for(const code of [custom,'d.meetings=2;']){const on=build(code,57).run(tripStats),off=build('optimizeRoadTrips=()=>{throw Error("optimizer ran")};'+code,57).run(tripStats);assert.notEqual(on.fmt,'nba82');assert.equal(on.sig,off.sig,on.fmt+' calendar unchanged')}
console.log('Road trips: valid 82-game seasons built from 2–5 game trips and homestands, fewer flips, deterministic, team/city/estimated geography, editable coordinates, other formats untouched.');
