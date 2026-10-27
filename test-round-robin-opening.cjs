// Round-robin leagues (any team count, e.g. 30 teams on two meetings or 31 with a preset added) can start a
// career: Opening Night gets its own first day of featured games, every team debuts by Day 3, matchup counts
// stay balanced, the All-Star break stays empty, and the save loads and simulates.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
(async()=>{
const cases=[['30 teams, two meetings',`setupDraft.meetings=2;`],['31 teams with a preset',`addSetupPreset('OKC');`],['32 teams',`addSetupPreset('OKC');addSetupPreset('TPA');`],['29 teams',`setupDraft.teams.pop();syncAlignment(setupDraft);setupDraft.meetings=2;`],
 ['31 teams, triple-header',`addSetupPreset('OKC');setupDraft.leagueSettings.openingNightFormat='triple';`],['31 teams, no All-Star break',`addSetupPreset('OKC');setupDraft.leagueSettings.allStarEnabled=false;`],['82-game default (unchanged path)','']];
for(const [label,code] of cases){
 const l=loadLeague({seed:81,strictDOM:false});l.setRandomSeed(81);
 l.run(`render=()=>{};toast=()=>{};save=async()=>true;setupDraft=makeDraft();onSetup=true;document.getElementById=id=>id==='new-team-division'?{value:'southeast'}:null;closeTitleModal=()=>{};renderSetup=()=>{};${code}const x=copy(setupDraft);x.gmName='RR';state=validateCareerData(buildSetupCareer(x));simulationExecution.mode='headless';`);
 const r=JSON.parse(l.run(`JSON.stringify((()=>{const s=state,n=s.teams.length,night=s.openingNight,first=s.schedule[0],debut=s.teams.map(t=>s.schedule.findIndex(r=>r.some(p=>p.includes(t.id)))),pairs=new Map();for(const r of s.schedule)for(const p of r){const k=[...p].sort((a,b)=>a-b).join('-');pairs.set(k,(pairs.get(k)||0)+1)}
  const c=s.allStarCalendar,breakEmpty=!c||s.schedule.slice(c.breakStart-1,c.breakEnd).every(r=>!r.length);
  return {format:s.scheduleFormat,night:night?.format,firstIsFeatured:!!night&&first.length===night.games.length&&night.games.every(g=>first.some(p=>p[0]===g.home&&p[1]===g.away)),maxDebut:Math.max(...debut),
   balanced:s.scheduleFormat==='nba82'||new Set(pairs.values()).size===1&&pairs.size===n*(n-1)/2,oncePerDay:s.schedule.every(r=>new Set(r.flat()).size===r.flat().length),breakEmpty}})())`));
 assert.equal(r.night&&r.firstIsFeatured,true,label+': opening night is its own featured day');assert(r.maxDebut<=2,label+': every team debuts by Day 3 ('+r.maxDebut+')');
 assert(r.balanced&&r.oncePerDay&&r.breakEmpty,label+': '+JSON.stringify(r));
 assert.doesNotThrow(()=>l.run('validateCareerData(JSON.parse(JSON.stringify(state)))'),label+': save loads');
 for(let i=0;i<4;i++)await l.run('simulateDayHeadless()');
 assert.doesNotThrow(()=>l.run('validateCareerData(JSON.parse(JSON.stringify(state)))'),label+': save loads after games');
 console.log('ok',label,r.format,'opening',r.night);
}
console.log('Round-robin leagues start with an Opening Night day, debut every team by Day 3 and load cleanly.');
})().catch(e=>{console.error(e);process.exitCode=1});
