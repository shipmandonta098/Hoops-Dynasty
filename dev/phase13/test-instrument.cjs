const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('../load-league.cjs');
const checks=[];
for(const [league,year]of [['nba',2025],['wnba',2024]]){
 const base=loadLeague({seed:619,strictDOM:false,sourceTransform:(n,s)=>s}),audit=loadLeague({seed:619,strictDOM:false,sourceTransform:require('./instrument.cjs')});
 base.run(require('../feat-fixture.cjs'));base.run(`d.year=${year};d.leagueGender='${league==='wnba'?'female':'male'}';var hp=historicalPlan('${league}',d.year,setupLeagueRules(d),d.cap,defaultTeams());d.cap=hp.cap;d.leagueSettings={...d.leagueSettings,...hp.rules,seasonGames:10,divisionGames:0,conferenceGames:10,playoffFormat:'top4',firstRoundByes:0,splitPlayoffs:false};state=buildSetupCareer(d);`);
 const fixture=base.run('copy(state)');base.context.fixture=fixture;audit.context.fixture=fixture;
 for(let i=0;i<3;i++){
  const run=l=>JSON.parse(JSON.stringify(l.run(`state=copy(fixture);simulationExecution.mode='headless';Math.random=scheduleRandom(${90100+i});globalThis.p13audit={possessions:0,transitionPossessions:0,primaryFGA:0,fastbreakFGA:0,final60Starts:0};var g=play(0,1);({score:[g.sa,g.sb],box:g.box,summary:g.summaryData})`)));
  assert.deepEqual(run(audit),run(base));const counters=audit.run('p13audit');assert(counters.possessions>100);assert(counters.fastbreakFGA>0&&counters.fastbreakFGA<counters.primaryFGA);assert(counters.final60Starts>0&&counters.final60Starts<20);
 }
 checks.push({league,year,games:3,scoreBoxEventsExact:true});
}
fs.writeFileSync('dev/phase13/instrument-equivalence.json',JSON.stringify(checks,null,2));console.log('PASS passive counters do not alter scores, boxes or events');
