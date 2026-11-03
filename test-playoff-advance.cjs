// Playoff phase keeps the Advance day menu: in page headers and on the Playoffs page while the playoffs are on.
// "Advance day" plays the next game of every series still going in the current round; "end of round" and "end of
// playoffs" finish the round or the bracket. The menu is gone once there's a champion.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:33,strictDOM:false});l.setRandomSeed(33);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Playoff Advance';d.teams=d.teams.slice(0,8);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});
 d.leagueSettings={...setupLeagueRules(d),seasonGames:28,divisionGames:0,conferenceGames:28,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0,seriesGames:7,seriesFirstGames:7,seriesSemiGames:7,seriesFinalGames:7};state=validateCareerData(buildSetupCareer(d));
 var series=()=>playoffSeriesSlots().filter(s=>!s.bye).map(s=>({round:s.round,index:s.index,games:s.games.length,complete:s.complete}));`);
(async()=>{
 // Regular season: the usual calendar menu.
 assert.match(run('advanceControls()'),/Advance to playoffs/);
 await l.run('sim(seasonLength())');assert.equal(run('state.day'),run('seasonLength()'));
 // Playoffs, before any game: header menu (any page but Overview/Playoffs) and Playoffs page menu.
 const menu=run('advanceControls()');
 for(const label of ['Advance day','Advance to end of round','Advance to end of playoffs'])assert(menu.includes('>'+label+'<'),label);
 assert(!/Advance to playoffs|Advance week|type="date"/.test(menu),'no regular-season calendar options');
 assert(run(`(()=>{view='Standings';return renderCareerShell.toString().includes('playoffsInProgress()')})()`),'header renders the menu during the playoffs');
 assert.match(run('playoffsView()'),/advance-menu/);
 // Advance day: one game in each of the four first-round series.
 const before=run('series()');assert.equal(before.length,4);assert(before.every(s=>s.round===0&&s.games===0));
 await l.run(`advanceCalendar('playoffDay')`);
 assert.deepEqual(run('series()').map(s=>s.games),[1,1,1,1],'one game per series');
 await l.run(`advanceCalendar('playoffDay')`);assert.deepEqual(run('series()').map(s=>s.games),[2,2,2,2]);
 // End of round: every first-round series finishes; the next round has not started.
 await l.run(`advanceCalendar('playoffRound')`);
 const afterRound=run('series()');assert(afterRound.filter(s=>s.round===0).every(s=>s.complete),'round complete');
 assert(afterRound.filter(s=>s.round===1).every(s=>s.games===0),'next round not started');
 // A day in round two plays only round-two games (two semifinals).
 await l.run(`advanceCalendar('playoffDay')`);assert.deepEqual(run('series()').filter(s=>s.round===1).map(s=>s.games),[1,1]);
 // End of playoffs: a champion, then the menu is gone and the offseason button shows.
 await l.run(`advanceCalendar('playoffEnd')`);
 assert.notEqual(run('state.champion'),null);assert.equal(run('advanceControls()'),'');
 const page=run('playoffsView()');assert(!/advance-menu/.test(page)&&/Continue offseason/.test(page));
 console.log('Playoff advance: menu in the playoff phase, Advance day plays one game per active series, end of round and end of playoffs, gone after the title.');
})().catch(e=>{console.error(e);process.exit(1)});
