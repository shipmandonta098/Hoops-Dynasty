// All-Star Weekend on real weekdays: Rising Stars Friday, contests Saturday, the game Sunday (Saturday + Sunday or Sunday
// only for fewer event days), rest before Friday and games resuming Thursday, in NBA and WNBA calendars. The schedule
// shows one weekend block with collapsed rest lines, and in-progress seasons keep their saved break.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const WD=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const wnba="d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0,risingStarsEnabled:true,dunkEnabled:true};";
const build=(code,seed=181)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
 l.run(`render=()=>{};save=async()=>true;toast=()=>{};setupDraft=makeDraft();onSetup=true;document.getElementById=id=>id==='new-team-division'?{value:'southeast'}:null;closeTitleModal=()=>{};renderSetup=()=>{};var d=setupDraft;${code};d.gmName='Weekend';state=validateCareerData(buildSetupCareer(copy(setupDraft)));`);
 return {l,info:JSON.parse(l.run(`JSON.stringify((()=>{const c=state.allStarCalendar,wd=d=>scheduleDate(d).getUTCDay(),r=leagueRules();return {format:state.scheduleFormat,length:state.schedule.length,c,plan:allStarEventPlan().map(e=>[e.key,wd(e.day)]),breakStart:wd(c.breakStart),resume:wd(c.breakEnd+1),lastGame:state.schedule[c.breakStart-2].length>0,resumeGames:state.schedule[c.breakEnd].length>0,empty:state.schedule.slice(c.breakStart-1,c.breakEnd).every(x=>!x.length),pct:r.allStarSchedule==='custom'?r.allStarPercent:65,events:r.allStarEventDays,rest:r.allStarRestLength}})())`))}};
const check=(label,info,{events=3,before=1,dense=true})=>{
 const days=Object.fromEntries(info.plan);assert.equal(WD[days.game],'Sun',label+': All-Star Game on Sunday');
 for(const k of ['three','dunk','skills'])if(k in days)assert.equal(WD[days[k]],events>=2?'Sat':'Sun',label+': '+k);
 if('rising' in days)assert.equal(WD[days.rising],events>=3?'Fri':events===2?'Sat':'Sun',label+': Rising Stars');
 assert.equal(info.c.end-info.c.start+1,events,label+': event days');
 assert(info.empty,label+': the break has no games');// Sparse calendars (WNBA: 40 games over ~150 days) have league-wide idle days, so adjacency is checked only for dense ones.
 if(dense)assert(info.lastGame&&info.resumeGames,label+': games right before and after the break');
 assert.equal(WD[info.resume],'Thu',label+': games resume Thursday');
 assert.equal(info.c.start-info.c.breakStart,(events>=3?0:3-events)+before,label+': rest days before Friday');
 assert(Math.abs(info.c.end-Math.round(info.length*info.pct/100))<=7,label+': near the target point');
};
// NBA 82-game, round-robin (Opening Night adds a first day), NBA-style custom calendar and WNBA.
const nba=build('');check('NBA 82',nba.info,{});assert.equal(nba.info.format,'nba82');assert.equal(WD[nba.info.breakStart],'Thu');
const rr=build('d.meetings=2;');check('Round robin',rr.info,{});assert.equal(rr.info.c.breakEnd-rr.info.c.breakStart+1,7,'Opening Night keeps the full break length');assert.equal(rr.info.format,'roundRobin');
const custom=build("d.meetings='custom';d.leagueSettings={...setupLeagueRules(d),seasonGames:60,divisionGames:12,conferenceGames:24,seasonStart:'10-28',seasonEnd:'04-19'};");check('NBA custom',custom.info,{});assert.equal(custom.info.format,'custom');
assert.match(custom.l.run('scheduleDate(state.allStarCalendar.end).toISOString()'),/^2026-0[1-3]/,'custom NBA weekend falls in the second calendar year');
const w=build(wnba);check('WNBA',w.info,{dense:false});assert.equal(w.info.format,'custom');assert.match(w.l.run('scheduleDate(state.allStarCalendar.end).toISOString()'),/^2024-0[6-8]/);
// Fewer event days: Saturday + Sunday, or Sunday only. Eight-day break: two rest days before Friday.
check('Two event days',build("d.leagueSettings={...setupLeagueRules(d),allStarEventDays:2};").info,{events:2});
check('One event day',build("d.leagueSettings={...setupLeagueRules(d),allStarEventDays:1};").info,{events:1});
check('WNBA two event days',build(wnba+"d.leagueSettings.allStarEventDays=2;").info,{events:2,dense:false});
const eight=build("d.leagueSettings={...setupLeagueRules(d),allStarRestLength:8};").info;check('Eight-day break',eight,{before:2});assert.equal(eight.c.breakEnd-eight.c.breakStart+1,8);
// Custom placement: the Sunday nearest 50% of the season.
const half=build("d.leagueSettings={...setupLeagueRules(d),allStarSchedule:'custom',allStarPercent:50};").info;check('50% target',half,{});
assert(half.c.end<nba.info.c.end,'an earlier target moves the weekend earlier');
// Seeds vary the 82-game calendar; the weekend stays Friday–Sunday.
for(const seed of [3,44,97])check('NBA seed '+seed,build('',seed).info,{});
// Schedule view: one weekend block, collapsed rest lines, no per-day rest rows inside the break.
const html=nba.l.run(`(()=>{scheduleVisibleRows=rows=>rows;return scheduleRowsWithEvents(scheduleRows(),state.day+1)})()`),label=nba.l.run(`scheduleRangeLabel(state.allStarCalendar.start,state.allStarCalendar.end)`);
assert(html.includes('All-Star Weekend · '+label),label);assert.match(label,/^[A-Z][a-z]{2} \d{1,2}–(\d{1,2}|[A-Z][a-z]{2} \d{1,2})$/);
assert.equal((html.match(/schedule-all-star-weekend/g)||[]).length,1);assert.equal((html.match(/All-Star break <small>· no games /g)||[]).length,2,'rest before and after');
const inside=nba.l.run(`(()=>{const c=state.allStarCalendar;return scheduleRows().filter(r=>r.bye&&r.day>=c.breakStart&&r.day<=c.breakEnd).map(r=>scheduleWeekdayDateLabel(r.day))})()`);
for(const day of JSON.parse(JSON.stringify(inside)))assert(!html.includes(day+'</span><span>Rest day'),'no rest-day row for '+day);
for(const key of ['rising','three','dunk','skills','game'])assert(html.includes("runAllStarEvent('"+key+"',"),key+' actions inside the block');
// In-progress seasons keep their saved break (here, an older centered calendar).
const kept=nba.l.run(`(()=>{const raw=JSON.parse(JSON.stringify(state)),c=raw.allStarCalendar,old={...c,start:c.start+1,end:c.end+1};raw.allStarCalendar=old;const v=validateCareerData(raw);return JSON.stringify([v.allStarCalendar,old])})()`);
const [loaded,old]=JSON.parse(kept);assert.deepEqual(loaded,old);
console.log('All-Star Weekend: game Sunday, contests Saturday, Rising Stars Friday in NBA 82, round-robin, custom and WNBA calendars; grouped schedule block; saved seasons unchanged.');
