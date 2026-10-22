const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`(async()=>{
 const definitions=defaultTeams();assert(nbaAlignment(definitions));
 for(let year=2000;year<2030;year++){
  const teams=year%2?[...definitions].reverse():definitions,calendar=nbaSeasonSchedule(teams,year);
  assert.equal(calendar.length,174);assert.equal(calendar.flat().length,1230);assert.equal(calendar.at(-1).length,15);assert(calendar.filter(g=>!g.length).length<=5);const averageFor=weekdays=>{const selected=calendar.filter((g,d)=>g.length&&weekdays.includes(new Date(Date.UTC(year,9,28+d)).getUTCDay()));return selected.reduce((n,g)=>n+g.length,0)/selected.length};assert(averageFor([5,6])>averageFor([1,4]));assert(validateNBASeason(calendar,teams),'season '+year);
  for(let id=0;id<30;id++){
   const counts=Array(30).fill(0);let home=0,away=0,b2b=0;
   calendar.forEach((games,day)=>{assert.equal(new Set(games.flat()).size,games.flat().length);const pair=games.find(p=>p.includes(id));if(pair){counts[pair.find(i=>i!==id)]++;pair[0]===id?home++:away++;if(day&&calendar[day-1].some(p=>p.includes(id)))b2b++}});
   assert.equal(home,41);assert.equal(away,41);assert(b2b<=16);
   assert.equal(counts.filter(n=>n===3).length,4);assert.equal(counts.filter(n=>n===4).length,10);assert.equal(counts.filter(n=>n===2).length,15);
  }
 }
 assert.notDeepEqual(nbaSeasonSchedule(definitions,2026),nbaSeasonSchedule(definitions,2027));
 assert.deepEqual(nbaSeasonSchedule(definitions,2026),nbaSeasonSchedule(definitions,2026));
 const badAlignment=copy(definitions);badAlignment[0].divisionId='atlantic';assert.equal(nbaAlignment(badAlignment),null);assert.throws(()=>nbaSeasonSchedule(badAlignment,2026));
 const draft=makeDraft();assert.equal(draft.meetings,82);assert.equal(validateDraft(draft),'');draft.teams.pop();assert(validateDraft(draft).includes('82-game'));draft.meetings=2;assert.equal(validateDraft(draft),'');
 state=validateCareerData(fresh(definitions,82,2028));assert.equal(state.year,2028);assert.equal(state.scheduleFormat,'nba82');assert.equal(ownerGames(team()),82);
 const saved=JSON.parse(JSON.stringify(state));assert.deepEqual(validateCareerData(saved).schedule,state.schedule);
 const corrupt=copy(saved);const day=corrupt.schedule.find(d=>d.length);day.push([...day[0]]);assert.throws(()=>validateCareerData(corrupt));
 const short=copy(saved);short.schedule.pop();assert.throws(()=>validateCareerData(short));
 const spoof=copy(saved);delete spoof.scheduleFormat;assert.throws(()=>validateCareerData(spoof));
 for(const count of [4,5,30])for(const cycles of [1,2,4]){const legacy=fresh(definitions.slice(0,count),cycles);delete legacy.scheduleFormat;assert.equal(validateCareerData(legacy).meetings,cycles)}
 render=()=>{};toast=()=>{};save=async()=>true;showResult=()=>{};
 // Simulate calendar days with genuine rest days; records and owner ledger survive import.
 sim(7);assert.equal(state.day,7);assert.deepEqual(validateCareerData(copy(state)).schedule,state.schedule);assert(state.teams.some(t=>t.w+t.l<7));
 ownerCanManage=()=>true;sim(seasonLength()-state.day);assert.equal(state.day,174);assert(state.teams.every(t=>t.w+t.l===82));assert.equal(state.history.filter(g=>g.stage==='Regular season').length,1230);assert.doesNotThrow(()=>validateCareerData(copy(state)));assert(JSON.stringify(state).length<25*1024*1024);console.log('Full 1,230-game season and exported save validated.');
 // A season transition rebuilds dates before creating the new ownership goals.
 const legacyCareer=fresh();delete legacyCareer.scheduleFormat;state=validateCareerData(legacyCareer);state.champion=0;state.day=seasonLength();ownerFinalize=()=>{};ownerCanManage=()=>true;
 const oldYear=state.year;newSeason();assert.equal(state.year,oldYear+1);assert.equal(state.day,0);assert.equal(state.scheduleFormat,'nba82');assert(validateNBASeason(state.schedule,state.teams));assert.doesNotThrow(()=>validateCareerData(copy(state)));
 state=validateCareerData(fresh(definitions,2));state.champion=0;state.day=seasonLength();newSeason();assert.equal(state.meetings,2);assert.equal(state.schedule.length,58);
 state=validateCareerData(fresh(definitions.slice(0,5),2));state.champion=0;state.day=seasonLength();newSeason();assert.equal(state.scheduleFormat,'roundRobin');assert.equal(state.schedule.flat().length,20);assert.doesNotThrow(()=>validateCareerData(copy(state)));
 console.log('PASS: 30 season seeds; 82 games, 41/41, matchup/rest rules; custom/legacy saves; simulation, import and season rollover.');
})().catch(error=>{console.error(error);process.exitCode=1})`,Object.assign(context,{process}));
