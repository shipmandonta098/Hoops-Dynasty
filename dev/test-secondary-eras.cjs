const assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
for(const [league,year,periods,minutes] of [['nba',1997,4,12],['nba',2025,4,12],['wnba',1997,2,20],['wnba',2006,4,10],['wnba',2024,4,10]]){
 const l=loadLeague({seed:19,strictDOM:false});l.context.assert=assert;l.context.eraLeague=league;l.context.eraYear=year;
 l.run(require('./feat-fixture.cjs'));
 l.run(`var w=copy(d);w.year=eraYear;w.leagueGender=eraLeague==='wnba'?'female':'male';var eraPlan=historicalPlan(eraLeague,eraYear,setupLeagueRules(w),w.cap,defaultTeams());w.cap=eraPlan.cap;w.leagueSettings={...eraPlan.rules,playoffFormat:'top4',firstRoundByes:0,splitPlayoffs:false,seasonGames:10,divisionGames:0,conferenceGames:10,seasonStart:'06-01',seasonEnd:'06-30'};state=buildSetupCareer(w);simulationExecution.mode='headless';var g=simulateAttributeGame(0,1);assert(g.summaryData.complete);assert.equal(g.box.reduce((n,p)=>n+p.pts,0),g.sa+g.sb);`);
 assert.equal(l.run('g.gameRules.gamePeriods'),periods);assert.equal(l.run('g.gameRules.periodMinutes'),minutes);console.log('PASS era clock and box/event agreement',league,year);
}
