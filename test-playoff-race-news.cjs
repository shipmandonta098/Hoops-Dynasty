// Playoff race news: clinched berths (the first one gets its own wording), clinched No. 1 seeds, eliminations and
// first-round matchups. Records are set by hand on a default 30-team league (two 15-team conferences, eight playoff
// teams each, 82 games); the day's results are history entries, which the news removes to get the status before it.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:11,strictDOM:false});l.setRandomSeed(11);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Race';state=validateCareerData(buildSetupCareer(d));`);
(async()=>{
 // A played day's games carry that day number, so the news can find and remove them.
 await l.run('sim(1)');assert(run(`state.history.length>0&&state.history.every(g=>g.day===state.day)`),'games played on a day carry state.day');
 l.run(`var east=state.teams.filter(t=>t.conference==='Eastern'),west=state.teams.filter(t=>t.conference==='Western');
  var reset=(day,games)=>{state.day=day;state.history=[];state.newsFeed={nextId:1,items:[]};raceNewsDone=null;for(const [w,lo] of games)state.history.unshift({day,stage:'Regular season',a:w,b:lo,winner:w})};
  var rec=(t,w,lo)=>{t.w=w;t.l=lo};var heads=()=>newsStore().items.map(n=>n.headline);var name=t=>t.city+' '+t.name;`);
 assert.equal(run('[east.length,west.length,ownerGames(east[0]),createPlayoffConfig().sides.map(s=>s.teams.length).join()].join()'),'15,15,82,8,8');
 // Day 150, 12 games left. A (East) wins today to reach 48-22: only seven East teams (41-29, max 53) can still reach
 // 48, so A clinches, and no team had clinched before, so it's the first. B loses to fall to 28-42 (max 40): eight
 // East teams now have more than 40 wins, so B is eliminated. Six East teams at 35-35 (max 47) are neither.
 const first=run(`(()=>{const [A,B,...rest]=east;rec(A,48,22);rec(B,28,42);rest.slice(0,7).forEach(t=>rec(t,41,29));rest.slice(7).forEach(t=>rec(t,35,35));west.forEach(t=>rec(t,30,40));
  reset(150,[[A.id,west[0].id],[west[1].id,B.id]]);west[1].w=30;west[1].l=40;west[0].w=30;west[0].l=40;playoffRaceDay();return {heads:heads(),A:name(A),B:name(B)}})()`);
 assert.deepEqual(first.heads.sort(),[`The ${first.A} become the first team to clinch a playoff berth.`,`The ${first.B} have been eliminated from playoff contention.`].sort());
 // Running the same day again (another milestone call) posts nothing new.
 assert.equal(run('(()=>{playoffRaceDay();raceNewsDone=null;playoffRaceDay();return heads().length})()'),2);
 // Already clinched before today: no repeat. Another East team that wins to 42-28 is still short (seven at 41+).
 assert.deepEqual(run(`(()=>{const [A]=east;reset(151,[[A.id,west[2].id]]);rec(A,49,22);playoffRaceDay();return heads()})()`),[]);
 // Two teams clinching together on the first day share one headline.
 const pair=run(`(()=>{const [A,B,...rest]=east;rec(A,48,22);rec(B,48,22);rest.slice(0,6).forEach(t=>rec(t,41,29));rest.slice(6).forEach(t=>rec(t,35,35));reset(150,[[A.id,west[0].id],[B.id,west[1].id]]);playoffRaceDay();return {heads:heads(),A:name(A),B:name(B)}})()`);
 assert.deepEqual(pair.heads,[`The ${pair.A} and the ${pair.B} become the first teams to clinch playoff berths.`]);
 // No. 1 seed: with 12 left, A wins to 60-10; seven East teams are 47-23 (max 59) and seven 40-30, so A had already
 // clinched a berth (only seven could reach 59) and now no one can reach 60: the conference's top seed is the only news.
 const top=run(`(()=>{const [A,...rest]=east;rec(A,60,10);rest.slice(0,7).forEach(t=>rec(t,47,23));rest.slice(7).forEach(t=>rec(t,40,30));reset(150,[[A.id,west[0].id]]);playoffRaceDay();return {heads:heads(),A:name(A)}})()`);
 assert.deepEqual(top.heads,[`The ${top.A} clinch the No. 1 seed in the Eastern Conference.`]);
 // Ties count against a team: at 48 wins with eight others able to reach 48, nothing is clinched.
 assert.deepEqual(run(`(()=>{const [A,...rest]=east;rec(A,48,22);rest.slice(0,8).forEach(t=>rec(t,36,34));rest.slice(8).forEach(t=>rec(t,30,40));reset(150,[[A.id,west[0].id]]);playoffRaceDay();return heads()})()`),[]);
 // Last day: the actual field and seeds decide what the math couldn't. East: seven teams at 50-32 had clinched, two
 // tie at 40-42 for the last spot (one gets in on tiebreakers, the other is out) and six at 30-52 were already out.
 // West: all fifteen tie at 41-41, so the field decides everything. Each conference's top seed is announced, and the
 // eight first-round series read 1 v 8, 2 v 7, 3 v 6, 4 v 5 per conference, East first.
 const final=run(`(()=>{east.slice(0,7).forEach(t=>rec(t,50,32));east.slice(7,9).forEach(t=>rec(t,40,42));east.slice(9).forEach(t=>rec(t,30,52));west.forEach(t=>rec(t,41,41));reset(seasonLength(),[]);
  playoffRaceDay();const c=playoffConfig(),inField=t=>c.sides.some(s=>s.teams.includes(t.id));
  return {heads:heads(),field:c.sides.map(s=>s.teams.map(id=>name(state.teams[id]))),sides:c.sides.map(s=>s.name),tie:east.slice(7,9).map(t=>({name:name(t),in:inField(t)})),westIn:west.filter(inField).map(name),westOut:west.filter(t=>!inField(t)).map(name)}})()`);
 const matchups=final.heads.filter(h=>h.includes('face off'));
 const expected=final.sides.flatMap((side,i)=>[[1,8],[2,7],[3,6],[4,5]].map(([a,b])=>`#${a} ${final.field[i][a-1]} will face off against the #${b} ${final.field[i][b-1]} in the ${side} Conference.`));
 assert.deepEqual(matchups,expected);
 const [inTie,outTie]=final.tie[0].in?final.tie:[final.tie[1],final.tie[0]];assert(inTie.in&&!outTie.in,'one tied team makes it');
 const others=final.heads.filter(h=>!h.includes('face off')).sort();
 const want=[`The ${inTie.name} clinch a playoff berth.`,`The ${outTie.name} have been eliminated from playoff contention.`,
  ...final.westIn.map(t=>`The ${t} clinch a playoff berth.`),...final.westOut.map(t=>`The ${t} have been eliminated from playoff contention.`),
  ...final.sides.map((side,i)=>`The ${final.field[i][0]} clinch the No. 1 seed in the ${side} Conference.`)].sort();
 assert.deepEqual(others,want);
 // League-wide bracket (no conference split): no conference wording.
 l.run(`state.leagueSettings={...state.leagueSettings,splitPlayoffs:false};`);
 const league=run(`(()=>{reset(seasonLength(),[]);playoffRaceDay();return heads()})()`);
 assert(league.some(h=>/^The .+ clinch the No\. 1 seed\.$/.test(h))&&league.filter(h=>h.includes('face off')).every(h=>!h.includes('Conference')),'league-wide wording');
 // When every team makes the playoffs (an 8-slot bracket in an 8-team league), there's no berth or elimination news.
 const full=run(`(()=>{const keep=state.teams;state.teams=keep.slice(0,8);state.teams.forEach((t,i)=>{t.conference='Eastern';rec(t,60-i,22+i)});state.leagueSettings={...state.leagueSettings,playoffFormat:'eight',firstRoundByes:0};reset(seasonLength(),[]);playoffRaceDay();const h=heads();state.teams=keep;return h})()`);
 assert(full.length&&full.every(h=>h.includes('face off')||h.includes('No. 1 seed')),'full field: '+full.join(' | '));
 // Cost per day on a 30-team league stays small.
 const ms=run(`(()=>{state.leagueSettings={...state.leagueSettings,splitPlayoffs:true};const t=Date.now();for(let i=0;i<20;i++){raceNewsDone=null;state.day=100;playoffRaceDay()}return (Date.now()-t)/20})()`);
 assert(ms<50,`playoff race check takes ${ms} ms a day`);
 console.log(`Playoff race news: first clinch, shared first clinch, No. 1 seed, elimination, ties and final-day field/matchups checked (${ms.toFixed(1)} ms a day).`);
})().catch(e=>{console.error(e);process.exit(1)});
