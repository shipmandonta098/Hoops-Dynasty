// WNBA / custom calendars: modern WNBA seasons run mid-May to mid-September with a Thursday–Monday All-Star break on
// the third weekend of July; dates are placed per team under rest rules (back-to-backs about 2 per team and at most 4,
// no 3 games in 4 nights, never 3 straight days, no break over a week outside the All-Star break). Opening Night and the
// first-week repair keep those rules. Existing WNBA careers on the old May 1 – Sep 30 window move at their next season.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const build=(year,n,seed)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.Y=year;l.context.N=n;
 l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Sched';d.year=Y;d.teams=d.teams.slice(0,N);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'east',name:'Eastern'},{id:'west',name:'Western'}];d.divisions=[];d.teams.forEach((t,i)=>{t.conferenceId=i<Math.ceil(N/2)?'east':'west';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules};syncAlignment(d);state=validateCareerData(buildSetupCareer(d));`);
 return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
const CHECK=`(()=>{const r=leagueRules(),{start,days}=seasonDateRange(state.year,r),date=i=>new Date(start.getTime()+i*86400000),w=state.allStarCalendar,iso=i=>date(i).toISOString().slice(0,10);
 const rep=customRestReport(state.schedule,state.teams.length,w,customRestLimits(r.seasonGames,days-(w.breakEnd-w.breakStart+1)));let max7=0;for(const t of rep.teams)for(let k=0;k<t.days.length;k++){let c=0;for(let j=k;j<t.days.length&&t.days[j]-t.days[k]<7;j++)c++;max7=Math.max(max7,c)}
 const played=state.schedule.flatMap((g,d)=>g.length?[d]:[]);
 return {format:state.scheduleFormat,valid:validateCustomSeason(state.schedule,state.teams,r,state.year),start:iso(played[0]),end:iso(played.at(-1)),breakStart:iso(w.breakStart-1),breakEnd:iso(w.breakEnd-1),breakDays:[w.breakStart-1,w.breakEnd-1].map(i=>date(i).getUTCDay()),game:iso(w.end-1),
  breakEmpty:state.schedule.slice(w.breakStart-1,w.breakEnd).every(g=>!g.length),b2b:rep.teams.map(t=>t.b2b),threeInFour:rep.teams.reduce((n,t)=>n+t.threeInFour,0),threeStraight:rep.teams.reduce((n,t)=>n+t.threeStraight,0),maxGap:Math.max(...rep.teams.map(t=>t.maxGap)),max7,opening:!!state.openingNight&&!state.openingNight.constrained,rest:rep.valid}})()`;
for(const [year,n,games,asb] of [[2024,12,40,['2024-07-18','2024-07-22','2024-07-21']],[2025,13,44,['2025-07-17','2025-07-21','2025-07-20']]]){
 const {run}=build(year,n,year);const r=run(CHECK);
 assert.equal(r.format,'custom');assert(r.valid,'matchups valid');assert.equal(run('leagueRules().seasonGames'),games);
 assert.deepEqual([r.start,r.end],[year+'-05-16',year+'-09-11'],'mid-May to mid-September');
 assert.deepEqual([r.breakStart,r.breakEnd,r.game],asb,'All-Star break Thu–Mon around the third weekend of July');assert.deepEqual(r.breakDays,[4,1]);assert(r.breakEmpty);
 const avg=r.b2b.reduce((a,b)=>a+b,0)/n;assert(Math.max(...r.b2b)<=4,'≤4 back-to-backs per team: '+r.b2b);assert(avg>=.8&&avg<=2.6,'about 2 back-to-backs per team: '+avg);
 assert.equal(r.threeStraight,0);assert.equal(r.threeInFour,0,'no 3 games in 4 nights');assert(r.maxGap<=7,'no break over a week outside the All-Star break: '+r.maxGap);assert(r.max7<=4);assert(r.rest,'rest report valid');assert(r.opening,'Opening Night still placed');
}
// Early WNBA era (28–32 games): mid-June to late August.
assert.deepEqual((()=>{const {run}=build(1997,8,5);return [run('leagueRules().seasonStart'),run('leagueRules().seasonEnd'),run('leagueRules().allStarRestLength')]})(),['06-10','08-24',5]);
// Rest limits scale with density; dense (NBA-like) custom seasons keep the 82-game back-to-back limit.
{const {run}=build(2025,13,9);assert.deepEqual(run('customRestLimits(44,114)'),{sparse:true,b2b:4,b2bTarget:2,maxGap:7,threeInFour:0});assert.equal(run('customRestLimits(82,165).b2b'),16);
 // The All-Star break length setting accepts 5 days.
 assert.equal(run(`readLeagueSettings({...leagueRules(),allStarRestLength:5}).allStarRestLength`),5);assert.throws(()=>run(`readLeagueSettings({...leagueRules(),allStarRestLength:4})`),/All-Star break length/);
 // Existing careers: the old WNBA window moves to the era window for the next season; other custom windows stay.
 assert.equal(run(`(()=>{const r={historicalSource:'wnba',seasonStart:'05-01',seasonEnd:'09-30',seasonGames:44,allStarRestLength:7};modernizeWnbaCalendarRules(r);return [r.seasonStart,r.seasonEnd,r.allStarRestLength].join()})()`),'05-16,09-11,5');
 assert.equal(run(`(()=>{const r={historicalSource:'custom',seasonStart:'05-01',seasonEnd:'09-30',seasonGames:44,allStarRestLength:7};return modernizeWnbaCalendarRules(r)+','+r.seasonStart})()`),'false,05-01');
 // A calendar generated before this change still loads (saved seasons keep their dates).
 run(`(()=>{const old={...leagueRules(),seasonStart:'05-01',seasonEnd:'09-30'};const s=JSON.parse(JSON.stringify(state));s.leagueSettings=old;const {days}=seasonDateRange(s.year,old);s.schedule=Array.from({length:days},(_,i)=>i<state.schedule.length?state.schedule[i]:[]);delete s.allStarCalendar;return true})()`);
 run('validateCareerData(JSON.parse(JSON.stringify(state)))');}
console.log('WNBA schedule rest: 2024 (12/40) and 2025 (13/44) May 16 – Sep 11, All-Star Thu–Mon in July, ≤4 back-to-backs, no 3-in-4, breaks ≤7 days, Opening Night kept; 1997 window; density limits; 5-day break setting; old-window migration passed.');
