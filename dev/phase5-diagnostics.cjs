const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const league=process.argv[2]||'nba',n=+(process.argv[3]||300),label=process.env.P5_CASE|| (process.env.P5_BASELINE==='1'?'baseline':'candidate');
const l=loadLeague({seed:901,strictDOM:false,sourceTransform:(name,s)=>{
 s=require('./phase5-instrument.cjs')(name,s);
 if(name.split('?')[0]==='late-game.js'){
  if(['no-fouling','timing-only'].includes(label))s+='\nlateGameFoulChance=()=>0;';
  if(['no-choice','timing-only'].includes(label))s+='\ntendencyPossession=possessionBeforeLateGame;';
  if(label==='timing-only')s+='\nconst auditTiming=lateGameTimingPlan;lateGameTimingPlan=(...a)=>({...auditTiming(...a),hold:false});';
 }
 return s;
}});l.context.league=league;
l.run(require('./feat-fixture.cjs'));
l.run(`d.year=league==='nba'?2025:2024;d.leagueGender=league==='nba'?'male':'female';var plan=historicalPlan(league,d.year,setupLeagueRules(d),d.cap,defaultTeams());d.cap=plan.cap;d.leagueSettings={...d.leagueSettings,...plan.rules,seasonGames:10,divisionGames:0,conferenceGames:10,playoffFormat:'top4',firstRoundByes:0,splitPlayoffs:false};state=buildSetupCareer(d);var fixture=copy(state);`);
const games=[],shots=[],slots=[];
if(label.includes('identical'))l.run(`
 const basePersonality=personality;personality=p=>basePersonality({...p,id:p.auditOriginalId||p.id});
 const baseCourt=createHomeCourt;createHomeCourt=(...a)=>({...baseCourt(...a),strength:0,roadShot:0,roadFoul:0,roadTurnover:0});
 restDays=()=>1;playerEnergy=()=>100;teamBackToBack=()=>false;rivalryHomeAdjustment=()=>0;rivalryFoulMultiplier=()=>1;
 for(let i=0;i<6;i+=2){const a=state.teams[i],b=state.teams[i+1];coachFor(a);for(const p of a.roster){p.bio??=generatePlayerBio(p,2025,[{abbr:'FA'}]);delete p.medicalInfo;p.injury=0;delete p.workload;p.moraleAdjustment=0;}b.roster=copy(a.roster).map((p,j)=>({...p,auditOriginalId:p.id,id:900000+i*100+j}));b.coach=copy(a.coach);delete a.rotationPlan;delete b.rotationPlan;a.elevationFt=b.elevationFt=0;}fixture=copy(state);
`);
for(let i=0;i<n;i++){
 const g=l.run(`state=copy(fixture);simulationExecution.mode='headless';globalThis.p5shots=[];globalThis.p5slots=[];Math.random=scheduleRandom(${91000+i});play(${i%3*2},${i%3*2+1})`);
 assert.equal(g.box.reduce((n,r)=>n+r.pts,0),g.sa+g.sb);
 const ss=l.run('p5slots');slots.push(...ss.filter(s=>s.start>=g.gameRules.gamePeriods*g.gameRules.periodMinutes*60-120).map(s=>({...s,seed:i})));
 shots.push(...l.run('p5shots'));
 games.push({seed:i,score:[g.sa,g.sb],periods:g.summaryData.periods,rules:g.gameRules,flow:g.summaryData.events,totals:g.box});
 if(i%50===49)console.log(label,league,i+1);
}
fs.writeFileSync(`dev/phase5/${label}-${league}-diagnostics.json`,JSON.stringify({league,n,games,slots,shots}));
