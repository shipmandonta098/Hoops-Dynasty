const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs'),instrument=require('./phase2-instrument.cjs');
const label=process.argv[2]||'baseline',count=+(process.argv[3]||100),out=[];
for(const league of ['nba','wnba']){
 const l=loadLeague({seed:101,strictDOM:false,sourceTransform:(n,s)=>instrument(n,require('./phase3-candidate.cjs')(n,s))});l.context.league=league;
 l.run(`var d=makeDraft();d.gmName='Phase 2';d.year=league==='nba'?2025:2024;d.leagueGender=league==='nba'?'male':'female';if(league==='wnba'){d.teams=d.teams.slice(0,12);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(league,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(league==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};syncAlignment(d);state=buildSetupCareer(d);var fixture=copy(state);`);
 const totals={},ends={},turnovers={},fouls={},trips={},reboundSources={},shots={},games=[];let slots=0,orb=0,drb=0,failures=0;
 for(let i=0;i<count;i++){
  const g=l.run(`state=copy(fixture);simulationExecution.mode='headless';globalThis.phase2Possessions=[];Math.random=scheduleRandom(${70000+i});play(${i%(league==='nba'?15:6)*2},${i%(league==='nba'?15:6)*2+1})`);
  const rows=l.run('phase2Possessions');
  for(const p of rows){slots++;const delta=k=>p.after.reduce((n,r,j)=>n+(r[k]||0)-(p.before[j][k]||0),0);orb+=delta('orb');drb+=delta('drb');
   const end=Object.keys(p.turnovers).length?'turnover':p.terminal==='made'?'madeFieldGoal':p.terminal==='freeThrow'?'freeThrows':p.terminal==='rebound'?'defensiveRebound':p.terminal;
   ends[end]=(ends[end]||0)+1;for(const [k,v]of Object.entries(p.turnovers))turnovers[k]=(turnovers[k]||0)+v;for(const [k,v]of Object.entries(p.fouls))fouls[k]=(fouls[k]||0)+v;for(const t of p.trips){const k=t.technical?'technical':t.retain?'retained':t.count+'shots';trips[k]=(trips[k]||0)+1}
   for(const r of p.rebounds){const k=r.source;const v=reboundSources[k]??={total:0,offensive:0};v.total++;v.offensive+=r.offensive;}for(const r of p.shots){const k=r.path+':'+r.kind;const v=shots[k]??={attempts:0,made:0};v.attempts++;v.made+=r.made;}
   if(delta('orb')+delta('drb')>delta('fga')-delta('fgm')+delta('fta')-delta('ftm'))failures++;
  }
  assert.equal(g.box.reduce((n,r)=>n+r.pts,0),g.sa+g.sb);
  for(const k of ['pts','fga','fgm','tpa','tpm','fta','ftm','orb','drb','tov','pf','poss'])totals[k]=(totals[k]||0)+g.box.reduce((n,r)=>n+(r[k]||0),0);
  totals.teamOnly=(totals.teamOnly||0)+g.teamTurnoverEvents.length;
  games.push({seed:70000+i,score:[g.sa,g.sb],spread:g.homeSpread});
 }
 out.push({league,count,totals,ends,turnovers,fouls,trips,reboundSources,shots,slots,eligibleRebounds:orb+drb,orbPct:orb/(orb+drb),failures,games});
 fs.mkdirSync('dev/phase3',{recursive:true});fs.writeFileSync('dev/phase3/'+label+'.json',JSON.stringify(out));console.log(league,JSON.stringify(out.at(-1), (k,v)=>k==='games'?undefined:v));
}
