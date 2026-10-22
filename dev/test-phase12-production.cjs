const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs'),variant=require('./phase12/variant.cjs');const results=[];
for(const [league,year]of [['nba',2025],['wnba',2024],['wnba',2006]]){
 process.env.P12_MODE='pace';const candidate=loadLeague({seed:619,strictDOM:false,sourceTransform:variant}),production=loadLeague({seed:619,strictDOM:false,sourceTransform:(n,s)=>s});
 candidate.run(require('./feat-fixture.cjs'));candidate.run(`d.year=${year};d.leagueGender='${league==='wnba'?'female':'male'}';var hp=historicalPlan('${league}',d.year,setupLeagueRules(d),d.cap,defaultTeams());d.cap=hp.cap;d.leagueSettings={...d.leagueSettings,...hp.rules,seasonGames:10,divisionGames:0,conferenceGames:10,playoffFormat:'top4',firstRoundByes:0,splitPlayoffs:false};state=buildSetupCareer(d);`);
 const fixture=candidate.run('copy(state)');production.context.fixture=fixture;candidate.context.fixture=fixture;
 for(let i=0;i<5;i++){const run=l=>JSON.parse(JSON.stringify(l.run(`state=copy(fixture);simulationExecution.mode='headless';Math.random=scheduleRandom(${90100+i});var g=play(0,1);({score:[g.sa,g.sb],box:g.box,summary:g.summaryData})`)));assert.deepEqual(run(candidate),run(production));}
 results.push({league,year,games:5,exactCandidateEquality:true});
}
fs.writeFileSync('dev/phase12/production-equivalence.json',JSON.stringify(results,null,2));console.log('PASS exact candidate/production score, box and summary equality,15 full games');
