// Long-career health run: simulates seasons headlessly and reports, per season, save size, sim time, retirements,
// free agents, unsigned draft rights, average OVR, 85+ players, average age and average payroll.
// Usage: node dev/long-career.cjs [seasons=10] [teams=30|small] [seed=2026] [out=dev/long-career/report.json]
// "small" is a 10-team, 36-game league for fast runs (CI uses it through test-long-career.cjs).
const fs=require('node:fs'),path=require('node:path'),{loadLeague}=require('./load-league.cjs');
const SMALL="d.teams=d.teams.slice(0,10);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});d.leagueSettings={...setupLeagueRules(d),seasonGames:36,divisionGames:0,conferenceGames:36,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};";
function seasonMetrics(run){return JSON.parse(run(`JSON.stringify((()=>{const active=state.teams.flatMap(t=>t.roster),avg=(list,f)=>list.length?list.reduce((n,p)=>n+f(p),0)/list.length:0,json=JSON.stringify(state);
 return {year:state.year,saveMB:+(json.length/1e6).toFixed(3),sections:Object.fromEntries(Object.keys(state).map(k=>[k,JSON.stringify(state[k]??null).length]).filter(([,n])=>n>5e4).sort((a,b)=>b[1]-a[1]).map(([k,n])=>[k,+(n/1e6).toFixed(2)])),
  players:active.length,freeAgents:state.free.length,draftRights:(state.draftRights||[]).length,avgOVR:+avg(active,p=>p.ovr).toFixed(2),ovr85:active.filter(p=>p.ovr>=85).length,avgAge:+avg(active,p=>p.age).toFixed(2),age35:active.filter(p=>p.age>=35).length,
  avgPayroll:+avg(state.teams,t=>ownerPayroll(t)).toFixed(2),payrollRange:[Math.min(...state.teams.map(t=>ownerPayroll(t))),Math.max(...state.teams.map(t=>ownerPayroll(t)))].map(n=>+n.toFixed(1)),salaryByBand:Object.fromEntries([60,70,80,90].map(b=>{const ps=active.filter(p=>p.ovr>=b&&p.ovr<b+10);return [b+'s',ps.length?+(ps.reduce((n,p)=>n+p.salary,0)/ps.length).toFixed(1):null]})),cap:salaryCap(),retiredLastSeason:(state.hallOfFame?.people||[]).filter(p=>p.kind==='Player'&&p.retired===state.year-1).length}})())`))}
async function runLongCareer({seasons=10,teams=30,seed=2026,onSeason=null,log=true}={}){
 const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
 l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Long Career';${teams==='small'?SMALL:''}state=validateCareerData(buildSetupCareer(d));`);
 l.context.options={seed,log:false,yieldControl:()=>new Promise(r=>setImmediate(r))};
 const run=c=>l.run(c),rows=[{season:0,simSeconds:0,...seasonMetrics(run)}];if(log)console.log(JSON.stringify(rows[0]));
 for(let s=1;s<=seasons;s++){const t=performance.now(),report=await l.run('simulateMultipleSeasonsHeadless(1,options)');
  const row={season:s,simSeconds:+((performance.now()-t)/1000).toFixed(1),status:report.status,errors:report.errors.map(e=>e.error),retirements:report.seasons[0]?.aging?.retired??null,...seasonMetrics(run)};
  rows.push(row);if(log)console.log(JSON.stringify({...row,sections:undefined}));onSeason?.(row,rows);if(report.status!=='completed')break;}
 return rows;
}
module.exports={runLongCareer,seasonMetrics};
if(require.main===module){const [seasons='10',teams='30',seed='2026',out='dev/long-career/report.json']=process.argv.slice(2);
 runLongCareer({seasons:Number(seasons),teams:teams==='small'?'small':Number(teams),seed:Number(seed),onSeason:(row,rows)=>{fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(rows,null,1))}}).catch(e=>{console.error(e);process.exit(1)});}
