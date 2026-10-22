const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const baseline=(n,s)=>{const p='dev/phase11/baseline-dist/'+n.split('?')[0];return fs.existsSync(p)?fs.readFileSync(p,'utf8'):s};const results=[];
for(const [league,year]of [['nba',1997],['wnba',1997],['wnba',2006],['wnba',2024]]){
 const a=loadLeague({seed:619,strictDOM:false,sourceTransform:baseline}),b=loadLeague({seed:619,strictDOM:false});a.context.league=league;a.context.year=year;a.run(require('./feat-fixture.cjs'));a.run(`d.year=year;d.leagueGender=league==='nba'?'male':'female';var hp=historicalPlan(league,year,setupLeagueRules(d),d.cap,defaultTeams());d.cap=hp.cap;d.leagueSettings={...hp.rules,seasonGames:10,divisionGames:0,conferenceGames:10,playoffFormat:'top4',splitPlayoffs:false,firstRoundByes:0};state=buildSetupCareer(d);`);const fixture=a.run('copy(state)');a.context.fixture=fixture;b.context.fixture=fixture;
 for(let i=0;i<5;i++){const run=l=>JSON.parse(JSON.stringify(l.run(`state=copy(fixture);simulationExecution.mode='headless';Math.random=scheduleRandom(${90200+i});var g=play(0,1);({score:[g.sa,g.sb],box:g.box,summary:g.summaryData})`)));assert.deepEqual(run(a),run(b));}
 results.push({league,year,games:5,identical:true});console.log('PASS unchanged',league,year);
}
fs.writeFileSync('dev/phase11/scope-verification.json',JSON.stringify(results, null,2));
