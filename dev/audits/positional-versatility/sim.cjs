// WNBA regular-season parity study (measurement only). Usage: node sim.cjs <repo dir> <first seed> <count> <out.jsonl>
// Each seed builds the same fresh 12-team, 40-game WNBA league (as dev/audit-phase13-season.cjs) and simulates the
// regular season headlessly. Writes one JSON line per season: per team wins, losses, points for/against, preseason
// strength (the engine's strength()) and top-8 average OVR.
const fs=require('fs'),path=require('path');const [dir,first,count,out]=process.argv.slice(2);const {loadLeague}=require(path.resolve(dir,'dev/load-league.cjs'));
(async()=>{for(let seed=Number(first);seed<Number(first)+Number(count);seed++){const t0=Date.now(),l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.auditSeed=seed;l.context.parityMemo=process.env.PARITY_MEMO!=='0';
 l.run(`var d=makeDraft();d.gmName='Parity study';d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};syncAlignment(d);state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';simulationExecution.autopilot=true;render=()=>{};toast=()=>{};
  // Harness-only speedup: allocateGameMinutes is deterministic (no random draws) and was recomputed for every player
  // lookup; cache it per roster, injury state, day and starters. Verified to reproduce uncached seasons exactly.
  if(parityMemo){const base=allocateGameMinutes,cache=new Map();allocateGameMinutes=function(club,starters){const key=state.day+'|'+club.id+'|'+club.roster.map(p=>p.id+':'+injuryDays(p)).join(',')+'|'+(starters?[...starters].join(','):'-');let hit=cache.get(key);if(!hit){if(cache.size>5000)cache.clear();hit=base(club,starters);cache.set(key,hit)}return new Map(hit)}}
  var pre=state.teams.map(t=>({id:t.id,strength:strength(t),top8:[...t.roster].sort((a,b)=>b.ovr-a.ovr).slice(0,8).reduce((n,p)=>n+p.ovr,0)/8}));`);
 const days=l.run('seasonLength()');for(let d=0;d<days;d++)await l.run('simulateDayHeadless()');
 const row=JSON.parse(l.run(`JSON.stringify({seed:${seed},teams:state.teams.map(t=>{const g=state.history.filter(x=>x.stage==='Regular season'&&(x.a===t.id||x.b===t.id));return {id:t.id,w:t.w,l:t.l,pf:g.reduce((n,x)=>n+(x.a===t.id?x.sa:x.sb),0),pa:g.reduce((n,x)=>n+(x.a===t.id?x.sb:x.sa),0),...pre.find(p=>p.id===t.id)}})})`));
 row.seconds=(Date.now()-t0)/1000;fs.appendFileSync(out,JSON.stringify(row)+'\n');}})().catch(e=>{console.error(e);process.exit(1)});
