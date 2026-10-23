// Comebacks / blown leads: per-game lead math, record tables and ranks (incl. ties), notes, news,
// Courtside banners, Game Summary, save/load, NBA + WNBA, and no effect on simulated results.
const assert=require('node:assert/strict'),fs=require('node:fs'),{loadLeague}=require('./dev/load-league.cjs');
const setup=(l,league)=>{l.context.L=league;l.run(`var d=makeDraft();d.gmName='Comeback test';d.year=L==='nba'?2025:2024;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};state=validateCareerData(buildSetupCareer(d));render=()=>{};save=async()=>true;simulationExecution.mode='headless';simulationExecution.autopilot=true;`)};
const json=v=>v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v;
(async()=>{
 const l=loadLeague({seed:5,strictDOM:false});l.setRandomSeed(5);setup(l,'nba');const run=c=>json(l.run(c));
 // Synthetic game: segments of [side, points]; 2-point baskets, evenly spaced over 48 minutes.
 l.run(`globalThis.mk=(a,b,segments,{day=1,stage='Regular season'}={})=>{const steps=[];for(const [side,pts] of segments){let left=pts;while(left>0){const p=Math.min(2,left);steps.push([side,p]);left-=p}}
  const score=[0,0],events=steps.map(([side,points],i)=>{score[side]+=points;const seconds=Math.round((i+1)*2880/(steps.length+1));return {index:i+1,seconds,period:Math.min(3,Math.floor(seconds/720)),side,points,playerId:1,paint:false,fast:false,second:false,turnover:false}});
  return {a,b,day,stage,sa:score[0],sb:score[1],winner:score[0]>score[1]?a:b,box:[],playByPlay:Array.from({length:steps.length+1},(_,i)=>'[0–0] Q1 12:00 · X · play '+i),summaryData:{version:1,events,milestones:[],periods:4,complete:true}}};
  globalThis.feed=(r)=>{const c=comebackProcess(r);state.history.push(r);return c};`);
 // Season every franchise past the 20-game threshold with ordinary games (home team leads wire to wire by 6).
 run(`for(let i=0;i<300;i++){const a=i%30,b=(i*7+3)%30;if(a===b)continue;feed(mk(a,b,[[0,20],[1,10],[0,10]],{day:1+i%10}))}`);
 // 1. Normal game: no comeback, no notes, no news.
 const news0=run('state.newsFeed?.items?.length||0');
 let c=run(`feed(mk(0,1,[[0,30],[1,20],[0,10]],{day:12}))`);
 assert.deepEqual([c.largestLeadHome,c.largestLeadAway,c.comebackWinAmount,c.notes.length],[30-0,0,0,0]);
 // 2. 15-point comeback (B down 15, wins): equals A's blown lead; franchise notes once franchises are seasoned.
 c=run(`feed(mk(2,3,[[0,15],[1,25]],{day:13}))`);
 assert.deepEqual([c.largestLeadHome,c.largestLeadAway,c.winningTeamLargestDeficit,c.losingTeamLargestLead,c.comebackWinAmount,c.blownLeadAmount],[15,10,15,15,15,15]);
 assert(c.notes.some(n=>n.kind==='franchise'&&/Largest comeback win in .* franchise history/.test(n.text)),'15-pt franchise comeback note');
 assert(c.notes.some(n=>n.kind==='blown'&&/Largest blown lead in .* franchise history/.test(n.text)),'15-pt blown-lead note');
 // 3. 20-point comeback: news story with lead, flow, players and history.
 c=run(`feed(mk(4,5,[[0,20],[1,30]],{day:14}))`);assert.equal(c.comebackWinAmount,20);
 const story=run('state.newsFeed.items[0]');assert.match(story.headline,/20/);assert.match(story.detail,/led by 20/);assert.match(story.detail,/Historical:/);assert(run('state.newsFeed.items.length')>news0);
 // 4. 25+ comeback becomes the league record; a later equal comeback is a tie in every scope.
 c=run(`feed(mk(6,7,[[0,27],[1,35]],{day:15}))`);assert(c.notes.some(n=>n.kind==='league'&&/^Largest comeback win in league history$/.test(n.text)),JSON.stringify(c.notes));
 c=run(`feed(mk(8,9,[[0,27],[1,31]],{day:16}))`);
 assert(c.notes.some(n=>n.kind==='league'&&n.text==='Tied for the largest comeback win in league history'),JSON.stringify(c.notes));
 assert(c.notes.some(n=>n.kind==='season'&&n.text==='Tied for the largest comeback win of the 2025 season'));
 assert.deepEqual(run(`comebackRank(state.comebackRecords.allTime,20,'x')`),{rank:3,tied:true});
 assert.deepEqual(run(`comebackRank(state.comebackRecords.allTime,21,'x')`),{rank:3,tied:false});
 assert.equal(run(`comebackRankText({rank:3,tied:true},'comeback','x')`),'Tied for 3rd-largest comeback x');
 // 5. Blown lead without losing / 6. comeback attempt that falls short.
 c=run(`feed(mk(10,11,[[0,22],[1,20],[0,6]],{day:17}))`);
 assert.deepEqual([c.comebackWinAmount,c.attempt.side,c.attempt.from,c.attempt.to,c.notes.length],[0,1,22,2,0]);
 // 7. Playoff comeback: playoff table, playoff ranking note, playoff news headline.
 c=run(`feed(mk(12,13,[[0,24],[1,30]],{day:30,stage:'First round'}))`);
 assert(c.notes.some(n=>n.kind==='playoffs'));assert.equal(run('state.comebackRecords.playoffs.length'),1);assert.match(run('state.newsFeed.items[0].headline'),/^Playoff collapse/);
 // 8. Franchise record follows the right club and is not overwritten by a smaller later game.
 const fr=run(`state.comebackRecords.franchise[state.teams[13].key]`);assert.equal(fr.comeback.all.amount,24);assert.equal(fr.comeback.playoffs.amount,24);
 run(`feed(mk(13,12,[[1,16],[0,20]],{day:31}))`);assert.equal(run(`state.comebackRecords.franchise[state.teams[13].key].comeback.all.amount`),24);
 // Game Summary: Game Story with largest leads, comeback, blown lead and notes.
 const sum=run(`gameSummaryMarkup(state.history.find(g=>g.day===15)).replace(/<[^>]+>/g,' ').replace(/\\s+/g,' ')`);
 for(const text of ['Game Story','Largest lead','came back from down 27','led by 27 and lost','Largest comeback win in league history'])assert(sum.includes(text),text);
 // Courtside: lead banner, comeback watch, lead flip, final banner — each once, and only for a window of plays.
 const g15=`state.history.find(g=>g.day===15)`,trig=run(`comebackTriggers(${g15}).map(t=>t.type+':'+t.text)`);
 assert.deepEqual(trig.filter(t=>t.startsWith('lead')).map(t=>t.split(' ').at(-1)),['16','20','26']);
 assert.equal(trig.filter(t=>t.startsWith('watch')).length,1);assert.equal(trig.filter(t=>t.startsWith('flip')).length,1);
 assert.match(run(`comebackWatchBanner(${g15},comebackTriggers(${g15}).find(t=>t.type==='watch').index)`),/Comeback watch: .* has cut a 27-point deficit to [0-9]\b/);
 assert.equal(run(`(()=>{const g=${g15},t=comebackTriggers(g),n=g.playByPlay.length;for(let i=0;i<n;i++){const last=t.filter(x=>x.index<=i).at(-1),want=!!last&&i-last.index<=COMEBACK_CONFIG.bannerPlays;if(want!==(comebackWatchBanner(g,i)!==''))return i}return -1})()`),-1,'live banner shows only within its play window');
 assert.match(run(`comebackWatchBanner(${g15},${g15}.playByPlay.length)`),/led by 27 · .* wins 35–27.*Largest comeback win in league history/s);
 assert.match(run(`comebackPostgameCard(${g15})`),/Comeback from 27/);assert.equal(run(`comebackPostgameCard(state.history.find(g=>g.day===12))`),'');
 // Record tables render; save/load keeps tables and per-game data; a new season keeps all-time records and trims the old season.
 assert.match(run('comebackRecordTables()'),/Comebacks &amp; blown leads.*Franchise records/s);
 const before=run('JSON.stringify(state.comebackRecords)'),games=run('JSON.stringify(state.history.map(g=>g.comeback||null))');
 run('state=validateCareerData(JSON.parse(JSON.stringify(state)))');
 assert.deepEqual(JSON.parse(run('JSON.stringify(state.comebackRecords)')),JSON.parse(before));assert.equal(run('JSON.stringify(state.history.map(g=>g.comeback||null))'),games);
 assert.throws(()=>run(`validateCareerData({...JSON.parse(JSON.stringify(state)),comebackRecords:{...state.comebackRecords,games:-1}})`),/comeback/);
 // Old saves without comeback data still load; the store backfills this season's recorded games.
 const legacy=run(`(()=>{const s=JSON.parse(JSON.stringify(state));delete s.comebackRecords;s.history=s.history.map(({comeback,...g})=>g);return s})()`);
 l.context.legacy=legacy;assert.equal(run('validateCareerData(legacy).comebackRecords'),undefined);
 assert.equal(run('(()=>{state=validateCareerData(legacy);return comebackStore().backfilled})()'),legacy.history.length);assert.equal(run('state.comebackRecords.allTime[0].amount'),27,'backfill rebuilds the record from recorded scoring');
 run(`state.year++;delete state.allStarCalendar;delete state.allStarEvents;delete state.allStarVoting;delete state.openingNight;state.history=[];feed(mk(1,2,[[0,12],[1,20]],{day:2}))`);
 assert.equal(run(`state.comebackRecords.allTime[0].amount`),27);assert(run(`state.comebackRecords.seasons[2025].length<=COMEBACK_CONFIG.keepSeason+1`));
 // 9. Real simulated days, NBA and WNBA: every completed game carries data that matches its own scoring.
 for(const league of ['nba','wnba']){const r=loadLeague({seed:8,strictDOM:false});r.setRandomSeed(8);setup(r,league);for(let i=0;i<6;i++)await r.run('simulateDayHeadless()');
  const check=json(r.run(`state.history.map(g=>{const s=comebackStats(g);return {ok:!!g.comeback&&!!s&&g.comeback.largestLeadHome===s.lead[0]&&g.comeback.largestLeadAway===s.lead[1]&&g.comeback.comebackWinAmount===s.lead[g.sa>g.sb?1:0]}})`));
  assert(check.length>0&&check.every(x=>x.ok),league+' per-game lead math');
  r.run('state=validateCareerData(JSON.parse(JSON.stringify(state)))');assert.equal(r.run('state.comebackRecords.games'),check.length,league+' store counts every game');}
 // 10. Simulated results are unchanged: identical scores and box scores with the module removed.
 const scores=async strip=>{const r=loadLeague({seed:21,strictDOM:false,sourceTransform:(n,s)=>strip&&n.startsWith('comebacks.js')?'function readGameComeback(){} function readComebackRecords(){}':s});r.setRandomSeed(21);setup(r,'nba');for(let i=0;i<4;i++)await r.run('simulateDayHeadless()');return r.run('JSON.stringify(state.history.map(g=>[g.sa,g.sb,g.box.map(p=>p.pts)]))')};
 assert.equal(await scores(false),await scores(true),'comeback tracking does not change simulated games');
 console.log('Comebacks: lead/comeback/blown math, attempts, ranks and ties, franchise/season/playoff/league notes, news, banners, Game Story, save/load, new season, legacy backfill, NBA+WNBA and unchanged results passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
