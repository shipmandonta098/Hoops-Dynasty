// Free-agent pool check for newly generated leagues.
// Usage (repo root): node dev/fa-pool/check.cjs [leagues=10] [seasonSeed=4100]
// 1) Generates N new NBA and N new WNBA leagues and compares free-agent OVR with rostered players.
// 2) Simulates one full season per league type (regular season, All-Star, playoffs, draft, free agency,
//    rollover) and counts unsigned 75+ free agents on opening night, at the All-Star break and when
//    offseason free agency closes, plus CPU upgrade bids that released a player to make room.
const fs=require('node:fs'),path=require('node:path'),{loadLeague}=require('../load-league.cjs');
const leagues=+(process.argv[2]||10),seasonSeed=+(process.argv[3]||4100),out=path.join(__dirname,'check-results.json');
const setup=(l,league)=>{l.context.L=league;l.run(`var d=makeDraft();d.gmName='FA pool check';d.year=L==='nba'?2025:2024;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};state=validateCareerData(buildSetupCareer(d));render=()=>{};`)};
const q=(a,p)=>{const s=[...a].sort((x,y)=>x-y);return s[Math.round(p*(s.length-1))]};
const dist=o=>({n:o.length,median:q(o,.5),p10:q(o,.1),p90:q(o,.9),max:Math.max(...o),'58-70':+(100*o.filter(x=>x>=58&&x<=70).length/o.length).toFixed(1),'71-74':+(100*o.filter(x=>x>=71&&x<=74).length/o.length).toFixed(1),'75+':+(100*o.filter(x=>x>=75).length/o.length).toFixed(1),'below58':o.filter(x=>x<58).length});
(async()=>{const report={generated:{},season:{}};
 for(const league of ['nba','wnba']){const fa=[],rostered=[],per=[],ages=[],upside=[];
  for(let seed=1;seed<=leagues;seed++){const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);setup(l,league);
   const f=JSON.parse(l.run('JSON.stringify(state.free.map(p=>[p.ovr,p.age,p.pot]))')),r=JSON.parse(l.run('JSON.stringify(state.teams.flatMap(t=>t.roster.map(p=>p.ovr)))'));
   fa.push(...f.map(x=>x[0]));rostered.push(...r);ages.push(...f.map(x=>x[1]));upside.push(...f.filter(x=>x[1]<=24).map(x=>x[2]-x[0]));per.push(f.filter(x=>x[0]>=75).length)}
  report.generated[league]={leagues,freeAgents:dist(fa),rostered:dist(rostered),leaguesWithA75Plus:per.filter(n=>n>0).length,max75PlusInOnePool:Math.max(...per),ages:{'≤24':+(100*ages.filter(a=>a<=24).length/ages.length).toFixed(1),'25–29':+(100*ages.filter(a=>a>=25&&a<=29).length/ages.length).toFixed(1),'30+':+(100*ages.filter(a=>a>=30).length/ages.length).toFixed(1)},youngPotentialHeadroom:{median:q(upside,.5),max:Math.max(...upside),'10+':upside.filter(x=>x>=10).length}};
  console.log(league,'generated',JSON.stringify(report.generated[league]));
  // One full season.
  const l=loadLeague({seed:seasonSeed,strictDOM:false});l.setRandomSeed(seasonSeed);setup(l,league);
  if(league==='wnba')await l.run(`(async()=>{settingsBusy=false;if(state.wnbaFinance?.progression)await toggleWNBAProgression();})()`);
  l.run(`globalThis.fa75={said:[],checkpoints:{}};const s0=say;say=function(t){fa75.said.push(t);return s0(t)};const mark=k=>fa75.checkpoints[k]={day:state.day,unsigned75:state.free.filter(p=>p.ovr>=75).map(p=>p.ovr).sort((a,b)=>b-a),pool:state.free.length};
   mark('openingNight');const dayBefore=simulateDayHeadless;simulateDayHeadless=async function(){const r=await dayBefore();const brk=state.allStarCalendar?.breakStart??seasonMilestones().deadline;if(!fa75.checkpoints.allStarBreak&&state.day>=brk-1)mark('allStarBreak');return r};
   const finishBefore=finishFreeAgency;finishFreeAgency=async function(...a){mark('freeAgencyCloses');return finishBefore(...a)};`);
  const r=await l.run(`simulateMultipleSeasonsHeadless(1,{seed:${seasonSeed},log:false})`);
  const s=JSON.parse(l.run('JSON.stringify(fa75)'));
  report.season[league]={status:r.status,errors:r.errors.map(e=>e.error),checkpoints:s.checkpoints,upgradeSwapReleases:s.said.filter(t=>/releases .* to make room for/.test(t)).length,inSeasonUpgradeSignings:s.said.filter(t=>/as a rotation upgrade/.test(t)).length};
  console.log(league,'season',JSON.stringify(report.season[league]));}
 fs.writeFileSync(out,JSON.stringify(report,null,1)+'\n');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
