// Counts CPU transaction activity over full simulated seasons by diffing league state each day.
// Usage (repo root): node dev/cpu-transactions/count.cjs <nba|wnba> <seasons> <label> [seed]
// Writes dev/cpu-transactions/<label>-<league>-<seed>.json
// Moves are detected from state, not news text: a player changing teams on the same day as a
// counterpart (or with picks) is a trade; team → free agency is a waiver/release; free agency →
// team during the regular season is an in-season signing. Offseason free agency is reported separately.
const fs=require('node:fs'),path=require('node:path');
const {loadLeague}=require('../load-league.cjs');
const league=process.argv[2]||'nba',seasons=+(process.argv[3]||3),label=process.argv[4]||'run',seed=+(process.argv[5]||9001);
const out=path.join(__dirname,`${label}-${league}-${seed}.json`);
(async()=>{
 const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.auditLeague=league;
 l.run(`var d=makeDraft();d.gmName='Transaction audit';d.year=auditLeague==='nba'?2025:2024;
  if(auditLeague==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}
  var plan=historicalPlan(auditLeague,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(auditLeague==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};
  state=validateCareerData(buildSetupCareer(d));render=()=>{};`);
 // WNBA only: the existing 2026 rookie-transition gate requires the frozen financial environment to roll past 2025.
 if(league==='wnba')await l.run(`(async()=>{settingsBusy=false;if(state.wnbaFinance?.progression)await toggleWNBAProgression();})()`);
 l.run(`globalThis.txLog={trades:[],signings:[],waivers:[],offseasonSignings:0,offseasonReleases:0,days:0};
  const where=()=>{const m=new Map();state.teams.forEach(t=>t.roster.forEach(p=>m.set(p.id,t.id)));state.free.forEach(p=>m.set(p.id,'FA'));return m};
  const picks=()=>new Map((state.tradePickOwners||[]).map(p=>[tradePickKey(p),p.owner]));
  const record=(before,beforePicks,phase,day)=>{const after=where(),afterPicks=picks(),moved=[];
   for(const [id,from] of before){const to=after.get(id);if(to!==undefined&&to!==from)moved.push({id,from,to})}
   const pickMoves=[];for(const [k,o] of afterPicks){const prev=beforePicks.has(k)?beforePicks.get(k):Number(k.split(':')[1]);if(prev!==o)pickMoves.push({key:k,from:prev,to:o,round:Number(k.split(':')[2])})}
   const date=scheduleDate(Math.max(0,day)),month=date.toISOString().slice(0,7),deadline=seasonMilestones().deadline,weeksToDeadline=phase==='regular'?Math.floor((deadline-day)/7):null;
   const pairs=new Map();for(const m of moved.filter(m=>m.from!=='FA'&&m.to!=='FA')){const k=[m.from,m.to].sort((a,b)=>a-b).join('-');(pairs.get(k)||pairs.set(k,{players:[],picks:[]}).get(k)).players.push(m)}
   for(const m of pickMoves){const k=[m.from,m.to].sort((a,b)=>a-b).join('-');(pairs.get(k)||pairs.set(k,{players:[],picks:[]}).get(k)).picks.push(m)}
   for(const [k,v] of pairs)txLog.trades.push({year:state.year,day,month,phase,weeksToDeadline,teams:k,players:v.players.length,picks:v.picks.length,firstRound:v.picks.filter(p=>p.round===1).length,multiPlayer:v.players.length>2});
   for(const m of moved){if(m.from==='FA'&&m.to!=='FA'){if(phase==='regular')txLog.signings.push({year:state.year,day,month,team:m.to,id:m.id});else txLog.offseasonSignings++}
    if(m.to==='FA'&&m.from!=='FA'){if(phase==='regular')txLog.waivers.push({year:state.year,day,month,team:m.from,id:m.id});else txLog.offseasonReleases++}}};
  const dayBefore=simulateDayHeadless;simulateDayHeadless=async function(){const b=where(),bp=picks(),day=state.day;const r=await dayBefore();txLog.days++;record(b,bp,'regular',day);return r};
  const offBefore=headlessOffseason;headlessOffseason=async function(o){const b=where(),bp=picks(),day=state.day;const r=await offBefore(o);record(b,bp,'offseason',day);return r};`);
 const start=Date.now(),reports=[];
 for(let s=0;s<seasons;s++){const r=await l.run(`simulateMultipleSeasonsHeadless(1,{seed:${seed+s},log:false})`);reports.push({status:r.status,errors:r.errors.map(e=>e.error),games:r.gamesSimulated});if(r.status!=='completed')break;console.log(league,label,'season',s+1,'done',Math.round((Date.now()-start)/1000)+'s')}
 const log=JSON.parse(l.run('JSON.stringify(txLog)'));
 const regularTrades=log.trades.filter(t=>t.phase==='regular'),count=(rows,key)=>rows.reduce((m,r)=>{m[r[key]]=(m[r[key]]||0)+1;return m},{});
 const summary={league,label,seed,seasons:reports.length,seasonStatus:reports,teams:l.run('state.teams.length'),
  trades:{total:log.trades.length,regularSeason:regularTrades.length,offseason:log.trades.length-regularTrades.length,perSeason:+(log.trades.length/Math.max(1,reports.length)).toFixed(2),byMonth:count(log.trades,'month'),byWeeksToDeadline:count(regularTrades.filter(t=>t.weeksToDeadline>=0),'weeksToDeadline'),picksPerTrade:+(log.trades.reduce((n,t)=>n+t.picks,0)/Math.max(1,log.trades.length)).toFixed(2),tradesWithPicks:log.trades.filter(t=>t.picks).length,firstRoundPicksMoved:log.trades.reduce((n,t)=>n+t.firstRound,0),multiPlayer:log.trades.filter(t=>t.multiPlayer).length,shapes:count(log.trades.map(t=>({shape:t.players+'p+'+t.picks+'pk'})),'shape')},
  inSeasonSignings:{total:log.signings.length,byMonth:count(log.signings,'month')},inSeasonWaivers:{total:log.waivers.length,byMonth:count(log.waivers,'month')},offseason:{signings:log.offseasonSignings,releases:log.offseasonReleases},seconds:(Date.now()-start)/1000};
 fs.writeFileSync(out,JSON.stringify({summary,log},null,1)+'\n');console.log(JSON.stringify(require('./summarize.cjs').summarize(out),null,1));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
