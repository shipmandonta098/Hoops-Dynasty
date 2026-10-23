// Late-period strategy counters over part of a season.
// Usage (repo root): node dev/late-period/check.cjs <nba|wnba> [days=60] [seed=7001] [year]
// Prints per-game 2-for-1 pushes, extra possessions earned, end-of-quarter possessions, last-shot holds,
// heaves, intentional fouls, plus pace (possessions per team), FTA/FGA, mean margin and OT share.
const {loadLeague}=require('../load-league.cjs');
const league=process.argv[2]||'nba',days=+(process.argv[3]||60),seed=+(process.argv[4]||7001),year=process.argv[5]?+process.argv[5]:(league==='nba'?2025:2024);
(async()=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.L=league;l.context.Y=year;
 l.run(`var d=makeDraft();d.gmName='Late period check';d.year=Y;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};state=validateCareerData(buildSetupCareer(d));render=()=>{};simulationExecution.mode='headless';
  globalThis.lpGames=[];const before=play;play=function(...a){const g=before.apply(this,a);if(g&&g.box)lpGames.push({s:g.lateStrategy||null,sa:g.sa,sb:g.sb,ot:g.summaryData.periods>g.gameRules.gamePeriods,poss:g.box.reduce((n,p)=>n+(p.poss||0),0)/leagueRules().courtPlayers/2,fta:g.box.reduce((n,p)=>n+p.fta,0),fga:g.box.reduce((n,p)=>n+p.fga,0)});return g};`);
 for(let d=0;d<days;d++)await l.run('simulateDayHeadless()');
 const g=JSON.parse(l.run('JSON.stringify(lpGames)')),n=g.length,sum=f=>g.reduce((t,x)=>t+f(x),0),pair=k=>sum(x=>x.s?x.s[k][0]+x.s[k][1]:0)/n;
 const out={league,year,seed,games:n,perGame:g[0].s?{twoForOne:pair('twoForOne'),twoForOneLastPossession:pair('twoForOneLastPossession'),endQuarterPossessions:sum(x=>x.s.endQuarterPossessions)/n,lastShotHolds:pair('lastShotHolds'),heaves:pair('heaves'),heaveMakes:pair('heaveMakes'),intentionalFouls:pair('intentionalFouls'),hackSubOuts:pair('hackSubOuts')}:null,
  pace:sum(x=>x.poss)/n,fgaPerGame:sum(x=>x.fga)/n,ftaPerGame:sum(x=>x.fta)/n,ftaRate:sum(x=>x.fta)/sum(x=>x.fga),meanMargin:sum(x=>Math.abs(x.sa-x.sb))/n,blow20:100*g.filter(x=>Math.abs(x.sa-x.sb)>=20).length/n,otPct:100*g.filter(x=>x.ot).length/n};
 console.log(JSON.stringify(out));})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
