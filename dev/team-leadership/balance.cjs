// Captain balance check: simulates regular-season days and reports morale distribution and trade requests so captain
// leadership can be compared with no captains (and with an older checkout's morale floor).
// Usage (repo root): node dev/team-leadership/balance.cjs <root> <variant: default|none> <days> <seeds comma-separated>
const path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),variant=process.argv[3]||'default',days=+(process.argv[4]||120),seeds=(process.argv[5]||'31,32,33').split(',').map(Number);
const {loadLeague}=require(path.join(root,'dev/load-league.cjs'));
(async()=>{const totals={players:0,below40:0,below20:0,atZeroish:0,avg:0,requests:0,frustration:0,captains:0};
 for(const seed of seeds){const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
  l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Balance';state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';
   if('${variant}'==='none'){state.leagueSettings.captainDesignations='none';for(const t of state.teams)selectLeadership(t,{silent:true})}
   // Older checkouts: give every team the old floor's best case (the most content veteran as captain).
   if(typeof teamCaptain!=='function')for(const t of state.teams){const p=[...t.roster].sort((a,b)=>b.age-a.age)[0];moraleSystem().captains[t.id]=p.id}`);
  for(let i=0;i<days;i++)await l.run('simulateDayHeadless()');
  const r=JSON.parse(l.run(`JSON.stringify((()=>{const scores=state.teams.flatMap(t=>t.roster.map(p=>moraleDetails(p,t).score));return {players:scores.length,below40:scores.filter(s=>s<40).length,below20:scores.filter(s=>s<20).length,atZeroish:scores.filter(s=>s<=5).length,avg:scores.reduce((a,b)=>a+b,0),requests:state.teams.flatMap(t=>t.roster).concat(state.free).reduce((n,p)=>n+(p.dissatisfaction?.history||[]).filter(e=>e.type==='request').length,0),frustration:state.teams.flatMap(t=>t.roster).reduce((n,p)=>n+(p.dissatisfaction?.history||[]).filter(e=>e.type==='frustration').length,0),captains:typeof teamCaptain==='function'?state.teams.filter(teamCaptain).length:Object.keys(state.moraleSystem?.captains||{}).length}})())`));
  for(const k of Object.keys(totals))totals[k]+=r[k];}
 console.log(JSON.stringify({variant,root:path.basename(root),days,seeds,avgMorale:+(totals.avg/totals.players).toFixed(1),below40:+(totals.below40/totals.players).toFixed(3),below20:+(totals.below20/totals.players).toFixed(3),atOrNearZero:totals.atZeroish,tradeRequests:totals.requests,frustrationEvents:totals.frustration,captains:totals.captains}));
})().catch(e=>{console.error(e);process.exitCode=1});
