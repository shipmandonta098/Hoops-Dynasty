// Functional season check (branch code): crashes, starting-lineup validity, team minutes, rotation sanity, balance.
// Usage: node func.cjs <repo> <nba|wnba> <first seed> <count> <out.jsonl>
const fs=require('fs'),path=require('path');const [dir,lg,first,count,out]=process.argv.slice(2);const {loadLeague}=require(path.resolve(dir,'dev/load-league.cjs'));
(async()=>{for(let seed=+first;seed<+first+ +count;seed++){const t0=Date.now();let row;try{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.lg=lg;
 l.run(`var d=makeDraft();d.gmName='Functional';d.year=lg==='nba'?2025:2024;if(lg==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(lg,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(lg==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};syncAlignment(d);state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';simulationExecution.autopilot=true;render=()=>{};toast=()=>{};
 `);l.run(fs.readFileSync(path.join(__dirname,'inject.js'),'utf8'));
 const days=l.run('seasonLength()');for(let d=0;d<days;d++)await l.run('simulateDayHeadless()');
 row=JSON.parse(l.run(`JSON.stringify((()=>{const w=state.teams.map(t=>t.w/(t.w+t.l)),m=w.reduce((a,b)=>a+b)/w.length,sd=Math.sqrt(w.reduce((n,x)=>n+(x-m)**2,0)/w.length);
  const top3=Object.values(F.top3Mp).filter(a=>a.length>=10).map(a=>a.reduce((x,y)=>x+y)/a.length);const sm=F.starterMp;
  return {seed:${seed},lg,games:F.games,issues:F.issues.slice(0,20),issueCount:F.issues.length,winSD:sd,best:Math.max(...state.teams.map(t=>t.w)),worst:Math.min(...state.teams.map(t=>t.w)),gp:state.teams[0].w+state.teams[0].l,
   avgUsed:F.used.reduce((a,b)=>a+b)/F.used.length,minRot:F.minRot,maxRot:F.maxRot,maxMpReg:F.maxMp,starterMpg:sm.reduce((a,b)=>a+b)/sm.length,top3Mpg:top3.reduce((a,b)=>a+b,0)/top3.length,top3Under15:top3.filter(x=>x<15).length,top3Count:top3.length,outOfPosPerTeamGame:F.outOfPos/F.teamGames}})())`));
 }catch(e){row={seed,lg,crash:String(e&&e.stack||e).slice(0,600)}}
 row.seconds=(Date.now()-t0)/1000;fs.appendFileSync(out,JSON.stringify(row)+'\n');console.error(lg,seed,row.crash?'CRASH':'ok',row.issueCount)}})();
