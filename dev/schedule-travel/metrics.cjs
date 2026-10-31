// Road-trip metrics for generated 82-game seasons.
// Usage (repo root): node dev/schedule-travel/metrics.cjs <root> <label> [seeds comma-separated]
// <root> is the checkout to measure (e.g. a main worktree for "before"); geography always comes from this checkout's
// dist/city-geography.js so both sides are measured the same way. Writes dev/schedule-travel/<label>.json.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),label=process.argv[3]||'run',seeds=(process.argv[4]||'1,2,3,4,5').split(',').map(Number);
const {loadLeague}=require(path.join(root,'dev/load-league.cjs')),geoCode=fs.readFileSync(path.join(__dirname,'../../dist/city-geography.js'),'utf8');
const results=[];
for(const seed of seeds){
 const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
 l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Travel';d.year=${2025+seed};state=validateCareerData(buildSetupCareer(d));`);
 if(l.run("typeof leagueGeography")!=='function')l.run(geoCode.replace(/^const /gm,'var '));
 results.push(JSON.parse(l.run(`JSON.stringify((()=>{const geo=leagueGeography(state.teams),trips=[],legs=[],season=[],b2bLegs=[];let flips=0,pairs=0,sameDivision=0,roadPairs=0;
  for(const t of state.teams){const games=state.schedule.flatMap((r,day)=>r.filter(p=>p.includes(t.id)).map(p=>({day,home:p[0]===t.id,opp:p[0]===t.id?p[1]:p[0]})));let run=0,at=geo[t.id],miles=0;
   games.forEach((g,i)=>{const venue=g.home?geo[t.id]:geo[g.opp];if(i){pairs++;if(g.home!==games[i-1].home)flips++;if(!g.home&&!games[i-1].home){roadPairs++;if(state.teams[g.opp].divisionId===state.teams[games[i-1].opp].divisionId)sameDivision++}}
    if(i&&g.day-games[i-1].day===1)b2bLegs.push(venue===at?0:geoMiles(at,venue));if(venue!==at){const m=geoMiles(at,venue);legs.push(m);miles+=m;at=venue}if(g.home){if(run)trips.push(run);run=0}else run++});
   if(run)trips.push(run);if(at!==geo[t.id]){const m=geoMiles(at,geo[t.id]);legs.push(m);miles+=m}season.push(miles)}
  const dist={};for(const n of trips)dist[n]=(dist[n]||0)+1;
  return {seed:${seed},length:state.schedule.length,avgTrip:trips.reduce((a,b)=>a+b,0)/trips.length,singleShare:(dist[1]||0)/trips.length,dist,flipRate:flips/pairs,sameDivisionRoad:sameDivision/roadPairs,milesPerLeg:legs.reduce((a,b)=>a+b,0)/legs.length,b2bMiles:b2bLegs.reduce((a,b)=>a+b,0)/b2bLegs.length,seasonMiles:{min:Math.min(...season),avg:season.reduce((a,b)=>a+b,0)/season.length,max:Math.max(...season)},valid:validateNBASeason(state.schedule,state.teams)}})())`)));
}
const avg=k=>results.reduce((n,r)=>n+r[k],0)/results.length,dist={};for(const r of results)for(const [k,v] of Object.entries(r.dist))dist[k]=(dist[k]||0)+v;const total=Object.values(dist).reduce((a,b)=>a+b,0);
const summary={label,seeds,avgTrip:+avg('avgTrip').toFixed(2),singleShare:+avg('singleShare').toFixed(3),tripDistribution:Object.fromEntries(Object.entries(dist).map(([k,v])=>[k,+(v/total).toFixed(3)])),flipRate:+avg('flipRate').toFixed(3),sameDivisionRoad:+avg('sameDivisionRoad').toFixed(3),milesPerLeg:Math.round(avg('milesPerLeg')),b2bMilesPerHop:Math.round(avg('b2bMiles')),seasonMiles:{min:Math.round(Math.min(...results.map(r=>r.seasonMiles.min))),avg:Math.round(results.reduce((n,r)=>n+r.seasonMiles.avg,0)/results.length),max:Math.round(Math.max(...results.map(r=>r.seasonMiles.max)))},allValid:results.every(r=>r.valid)};
fs.writeFileSync(path.join(__dirname,label+'.json'),JSON.stringify({summary,results},null,1));console.log(JSON.stringify(summary));
