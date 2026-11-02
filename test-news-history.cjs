// News history: game results are rebuilt from the season's games (not stored as news), stored news is kept per season
// (current season in the save, finished seasons in the archive store), and the day picker covers the whole season.
// 1. Day 1 late in the season still shows its results and news after far more than 500 later items.
// 2. A finished season leaves memory after the rollover save and loads from the archive when picked in the Season
//    filter, including a day's game results and the playoffs.
// 3. An old save (500 stored items, stored result headlines, games without story facts) loads unchanged: stored items
//    show as they were, and nothing is invented for days whose items were already trimmed.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const {indexedDB,IDBKeyRange}=require(process.env.HD_TEST_NODE_MODULES?process.env.HD_TEST_NODE_MODULES+'/fake-indexeddb':'fake-indexeddb');
const l=loadLeague({seed:21,strictDOM:false});l.setRandomSeed(21);Object.assign(l.context,{indexedDB,IDBKeyRange});
const settle=async(cond,ms=20000)=>{const end=Date.now()+ms;while(!l.run(cond)){if(Date.now()>end)throw Error('timed out waiting for '+cond);await new Promise(r=>setTimeout(r,10))}};
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
// An 8-team, 28-game league keeps the full season fast.
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='News';d.teams=d.teams.slice(0,8);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});
 d.leagueSettings={...setupLeagueRules(d),seasonGames:28,divisionGames:0,conferenceGames:28,playoffFormat:'top4',splitPlayoffs:false,firstRoundByes:0};state=validateCareerData(buildSetupCareer(d));
 var ids=()=>newsFeedRows().map(n=>n.id),uiMode=on=>{simulationHeadless=on?()=>false:()=>true};var realHeadless=simulationHeadless;`);
(async()=>{
 // 1. Late in the season: day 1 is still there.
 const length=run('seasonLength()');await l.run(`sim(${length})`);assert.equal(run('state.day'),length,'regular season complete');
 const day1=run(`(()=>{const games=state.history.filter(g=>g.day===1),stored=newsStore().items.filter(n=>n.day===1&&n.year===state.year).map(n=>n.id);return {games:games.length,stored}})()`);
 assert(day1.games>0,'day 1 had games');
 assert.equal(run(`newsStore().items.filter(n=>n.category==='Results').length`),0,'results are not stored as news');
 assert(run('state.history.every(g=>g.story&&g.story.W&&g.story.L)'),'every game carries its story facts');
 // A busy stretch: 700 more stored items on the latest day (the old feed kept only the newest 500 updates).
 l.run(`for(let i=0;i<700;i++)addNewsItem({category:'League',headline:'Filler update '+i,teams:[]})`);
 l.run(`newsFeedChange('day','1')`);const rows=run('newsFeedRows()');
 assert.equal(rows.filter(n=>n.category==='Results').length,day1.games,'day 1 shows every game result');
 assert.deepEqual(rows.filter(n=>!n.result).map(n=>n.id).sort(),[...day1.stored].sort(),'day 1 keeps its stored news');
 assert(rows.filter(n=>n.result).every(n=>n.headline.endsWith(n.headline.match(/\d+–\d+$/)[0])&&/PTS · \d+ REB/.test(n.detail)),'rebuilt results have a headline and box-score line');
 // The picker covers every day played so far, plus Pre-season.
 const days=run('newsDateChoices().days');for(let d=1;d<=length;d++)assert(days.includes(String(d)),'day '+d+' in picker');assert(days.includes('Pre-season'));
 // Rebuilt headlines match what the game produced when it was played.
 assert(run(`state.history.slice(0,5).every(g=>headlineFromFacts(g,g.story)===HEADLINE_TEMPLATES[g.story.type][g.story.i]({...g.story,...headlineBase(g,{W:g.story.W,L:g.story.L})}))`));
 l.run(`newsStore().items=newsStore().items.filter(n=>!/^Filler update/.test(n.headline));newsFeedChange('day','all')`);

 // 2. Finish the season (playoffs, offseason), save to the archive store, roll over and save again.
 await l.run(`(async()=>{while(state.champion===null){const slot=playoffSeriesSlots().find(s=>!s.complete);await simulatePlayoffGame(...slot.nextPair)}})()`);
 // Offseason (lottery, draft, free agency) as the headless runner does it.
 l.run(`var savedMode=simulationExecution.mode;Object.assign(simulationExecution,{mode:'headless',autopilot:true})`);
 await l.run(`headlessOffseason({seed:21,boundary:async()=>{}})`);
 l.run(`Object.assign(simulationExecution,{mode:savedMode,autopilot:false})`);
 const year=run('state.year');
 l.run(`var repo;careerStore=null;activeSaveId='news-test';`);
 await l.run(`(async()=>{repo=await openNormalizedCareerDatabase({name:'news-history'});careerStore=repo;await repo.put({id:'news-test',name:'News',data:snapshotState()})})()`);
 const finished=run(`(()=>{const items=newsStore().items.filter(n=>n.year===state.year);return {count:items.length,ids:items.map(n=>n.id).sort((a,b)=>a-b),day1:items.filter(n=>n.day===1).length,playoffGames:state.history.filter(g=>g.stage!=='Regular season').length,day1Games:state.history.filter(g=>g.day===1).length}})()`);
 assert(finished.count>0&&finished.playoffGames>0);
 l.run('uiMode(true)');
 assert.equal(await l.run('save()'),true,'save succeeds');
 l.run('var toasts=[];toast=m=>toasts.push(m)');await l.run('Promise.resolve(newSeason())');assert.deepEqual(run('toasts'),[],'rollover ran');
 assert.equal(run('state.year'),year+1,'season rolled over');
 assert(run(`newsStore().items.some(n=>n.year===${year})`),'finished season stays in memory until the rollover is saved');
 const finishedIds=run(`newsStore().items.filter(n=>n.year===${year}).map(n=>n.id).sort((a,b)=>a-b)`);assert(finishedIds.length>=finished.count);
 assert.equal(await l.run('save()'),true);
 assert.equal(run(`newsStore().items.filter(n=>n.year===${year}).length`),0,'finished season leaves memory after the save');
 // Loading the career brings back only the current season (and undated items).
 assert((await l.run(`repo.get('news-test')`)).data.newsFeed.items.every(n=>n.year===null||n.year===year+1),'load keeps the main save to the current season');
 // Season filter: the archived season loads from the archive store.
 l.run(`view='News feed';newsArchive.league=null;newsFeedUI.season='current';newsFeedUI.day='all';newsDateChoices();newsLoadSelection()`);
 await settle(`newsArchive.years?.status==='ready'`);
 assert(run('newsDateChoices().seasons').includes(String(year)),'archived season is offered');
 l.run(`newsFeedChange('season','${year}')`);await settle(`newsArchive.seasons.get(${year})?.status!=='loading'`);
 assert.equal(run(`newsArchive.seasons.get(${year}).status`),'ready');
 assert.deepEqual(run(`newsFeedRows().map(n=>n.id).sort((a,b)=>a-b)`),finishedIds,'every stored item of the archived season is back');
 assert.match(run('newsFeedView()'),/Pick a day \(or Playoffs\)/);
 const archivedDays=run('newsDateChoices().days');assert(archivedDays.includes('1')&&archivedDays.includes(String(length))&&archivedDays.includes('Playoffs')&&archivedDays.includes('Free Agency'),'archived picker: every day plus phases');
 l.run(`newsFeedChange('day','1')`);await settle(`newsArchive.days.get('${year}:1')?.status==='ready'`);
 const archivedDay1=run('newsFeedRows()');
 assert.equal(archivedDay1.filter(n=>n.result).length,finished.day1Games,'archived day 1 rebuilds every result');
 assert.equal(archivedDay1.filter(n=>!n.result).length,finished.day1,'archived day 1 stored news');
 assert(archivedDay1.filter(n=>n.result).every(n=>/PTS/.test(n.detail)),'box-score lines come from the archived box scores');
 l.run(`newsFeedChange('day','Playoffs')`);await settle(`[...newsArchive.days.keys()].length===2&&[...newsArchive.days.values()].every(d=>d.status==='ready')`);
 assert.equal(run('newsFeedRows().filter(n=>n.result).length'),finished.playoffGames,'playoff results load');
 l.run(`newsFeedChange('season','current')`);

 // 3. Old save: 500 stored items (results included, two seasons), games without story facts.
 l.run(`uiMode(false);careerStore=null;activeSaveId=null;newsArchive.league=undefined;`);
 const old=run(`(()=>{const raw=JSON.parse(JSON.stringify(snapshotState())),y=raw.year;raw.history=raw.history.map(g=>{delete g.story;return g});
  const items=[];for(let i=0;i<500;i++){const prev=i>=300,day=prev?100+(i%60):Math.max(1,30-(i%30));items.push({id:1000-i,year:prev?y-1:y,day,phase:'Regular season',category:i%2?'Results':'Transactions',headline:(i%2?'Old result ':'Old move ')+i,detail:'',teams:[],game:null,...(i%2?{story:'result:1'}:{})})}
  raw.newsFeed={nextId:1001,items};raw.history=[];return raw})()`);
 l.run(`var oldRaw=${JSON.stringify(JSON.stringify(old))};`);
 const checked=run(`(()=>{const v=validateCareerData(JSON.parse(oldRaw));return {same:hdCanonical(v.newsFeed)===hdCanonical(JSON.parse(oldRaw).newsFeed),count:v.newsFeed.items.length}})()`);
 assert.equal(checked.count,500);assert(checked.same,'old news items load unchanged');
 l.run(`state=validateCareerData(JSON.parse(oldRaw));newsFeedUI.season='current';newsFeedUI.day='all';`);
 const oldRows=run('newsFeedRows()');
 assert.equal(oldRows.length,300,'current-season stored items, results included, show as they were');
 assert(oldRows.some(n=>n.category==='Results'&&n.headline.startsWith('Old result')));
 // An old save with story-less games in this season's history: no rebuilt results for them.
 l.run(`newsFeedChange('day','all');state.history=[{...JSON.parse(JSON.stringify(state.history[0]||{})),a:0,b:1,sa:100,sb:90,winner:0,day:3,stage:'Regular season',box:[]}];newsResultMemo=null;`);
 assert.equal(run('newsFeedRows().filter(n=>n.result).length'),0,'games without story facts get no made-up headline');
 // The previous season's old items still show when that season is picked (no archive store here: they're in memory).
 l.run(`newsFeedChange('season',String(state.year-1))`);assert.equal(run('newsFeedRows().length'),200);
 // Its days before the oldest kept item (100) were trimmed long ago: they're in the picker but stay empty.
 assert(run('newsDateChoices().days').includes('50'));l.run(`newsFeedChange('day','50')`);assert.deepEqual(run('newsFeedRows()'),[],'nothing invented for trimmed days');l.run(`newsFeedChange('day','all')`);
 // Through the archive store: an old record's previous-season items move out of memory on load and back on pick.
 l.run(`activeSaveId='old-save';careerStore=repo;uiMode(true);`);
 await l.run(`repo.put({id:'old-save',name:'Old',data:JSON.parse(oldRaw)})`);
 const reopened=await l.run(`repo.get('old-save')`);
 assert.equal(reopened.data.newsFeed.items.length,300,'load brings back the current season');
 l.run(`state=validateCareerData(reopened.data);newsArchive.league=null;newsFeedUI.season=String(state.year-1);newsFeedUI.day='all';newsLoadSelection()`.replace('reopened.data',`JSON.parse(${JSON.stringify(JSON.stringify(reopened.data))})`));
 await settle(`newsArchive.seasons.get(state.year-1)?.status==='ready'`);
 assert.equal(run('newsFeedRows().length'),200,'previous-season items load from the archive, unchanged');
 l.run('repo.close();uiMode(false)');
 console.log(`News history: day 1 late in the season (${day1.games} results, ${day1.stored.length} stored items after 700 later updates), archived season (${finished.count} items, day 1 and playoff results from archived games), old 500-item save unchanged.`);
})().catch(e=>{console.error(e);process.exit(1)});
