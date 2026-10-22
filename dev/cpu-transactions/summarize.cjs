// Summarize a count.cjs log. Usage: node dev/cpu-transactions/summarize.cjs <file.json> [...]
// Trades are counted only on regular-season days (CPU trades run in-season only). Offseason
// team-to-team movement in one window is free agency (released or expired, then signed), and
// offseason departures to free agency include expiring contracts, so both are reported as movement.
const fs=require('node:fs');
function summarize(file){const {summary:old,log}=JSON.parse(fs.readFileSync(file,'utf8'));const seasons=old.seasons;
 const count=(rows,f)=>rows.reduce((m,r)=>{const k=f(r);m[k]=(m[k]||0)+1;return m},{}),trades=log.trades.filter(t=>t.phase==='regular'),per=n=>+(n/Math.max(1,seasons)).toFixed(2);
 return {league:old.league,label:old.label,seed:old.seed,seasons,seasonStatus:old.seasonStatus.map(s=>s.status),teams:old.teams,
  trades:{total:trades.length,perSeason:per(trades.length),byMonth:count(trades,t=>t.month.slice(5)),byWeeksBeforeDeadline:count(trades.filter(t=>t.weeksToDeadline>=0),t=>t.weeksToDeadline<=2?'0–2':t.weeksToDeadline<=5?'3–5':t.weeksToDeadline<=9?'6–9':'10+'),
   picksPerTrade:+(trades.reduce((n,t)=>n+t.picks,0)/Math.max(1,trades.length)).toFixed(2),withPicks:trades.filter(t=>t.picks).length,firstRoundPicksMoved:trades.reduce((n,t)=>n+t.firstRound,0),multiPlayer:trades.filter(t=>t.multiPlayer).length,shapes:count(trades,t=>t.players+' players'+(t.picks?' + '+t.picks+' pick'+(t.picks>1?'s':''):''))},
  inSeasonSignings:{total:log.signings.length,perSeason:per(log.signings.length),byMonth:count(log.signings,s=>s.month.slice(5))},
  inSeasonWaivers:{total:log.waivers.length,perSeason:per(log.waivers.length),byMonth:count(log.waivers,s=>s.month.slice(5))},
  offseasonMovement:{teamToTeamViaFreeAgency:log.trades.filter(t=>t.phase!=='regular').reduce((n,t)=>n+t.players,0),signings:log.offseasonSignings,departuresIncludingExpirations:log.offseasonReleases},seconds:old.seconds}}
if(require.main===module)for(const f of process.argv.slice(2))console.log(JSON.stringify(summarize(f),null,1));
module.exports={summarize};
