// Playoff series news: who advanced (historic upset, sweep, upset or plain advance, by priority) with the series
// score, a star line for a 30-point clincher, the next round's name (conference rounds in a split bracket, league
// rounds otherwise), and one post per finished series in a real playoff run.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const run=(l,c)=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
(async()=>{
 // Built series on the default 30-team league (two 15-team conferences, eight seeds each).
 const a=loadLeague({seed:5,strictDOM:false});a.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Series';state=validateCareerData(buildSetupCareer(d));
  var east=state.teams.filter(t=>t.conference==='Eastern').slice(0,8).map(t=>t.id),west=state.teams.filter(t=>t.conference==='Western').slice(0,8).map(t=>t.id);
  var cfg={split:true,size:16,byes:0,bestOf:7,sides:[{name:'Eastern',teams:east},{name:'Western',teams:west}]},nm=id=>state.teams[id].city+' '+state.teams[id].name;
  var row=(id,pts)=>({name:'Star Player',team:state.teams[id].abbr,played:true,pts,reb:7,ast:6});
  var series=({stage='First round',w,l,wins,lost,pts=20,bestOf=7})=>playoffSeriesNews({complete:true,bye:false,stage,bestOf,pair:[w,l],winner:w,wins:[wins,lost],result:{sa:110,sb:101,box:[row(w,pts),row(l,28)]}},cfg);`);
 const names=run(a,'({e:east.map(nm),w:west.map(nm)})'),E=names.e,W=names.w;
 const h=code=>run(a,code).map(x=>x.headline),dt=code=>run(a,code).map(x=>x.detail);
 // Plain advance: #1 over #8, 4–1.
 assert.deepEqual(h('series({w:east[0],l:east[7],wins:4,lost:1})'),[`#1 ${E[0]} advance to the Eastern Conference Semifinals.`]);
 assert.deepEqual(dt('series({w:east[0],l:east[7],wins:4,lost:1})'),[`Won the series 4–1 over the #8 ${E[7]}.`]);
 // Sweep (no upset): #5 sweeps #4 in the West.
 assert.deepEqual(h('series({w:west[4],l:west[3],wins:4,lost:0})'),[`#5 ${W[4]} sweep the ${W[3]} to move on to the Western Conference Semifinals.`]);
 // Historic upset (6+ seed gap): #8 over #1, and as a sweep.
 assert.deepEqual(h('series({w:west[7],l:west[0],wins:4,lost:3})'),[`#8 ${W[7]} knock out the #1 ${W[0]} in a historic upset.`]);
 assert.deepEqual(h('series({w:west[7],l:west[0],wins:4,lost:0})'),[`#8 ${W[7]} knock out the #1 ${W[0]} in a historic upset sweep.`]);
 assert.match(dt('series({w:west[7],l:west[0],wins:4,lost:3})')[0],/4–3 over the #1 .* and move on to the Western Conference Semifinals\.$/);
 // Upset (3–5 seed gap): #6 over #3.
 assert.deepEqual(h('series({w:east[5],l:east[2],wins:4,lost:2})'),[`#6 ${E[5]} upset the #3 ${E[2]} to reach the Eastern Conference Semifinals.`]);
 // Star line for a 30-point clincher; second round leads to the Conference Finals.
 assert.deepEqual(h('series({stage:"Conference semifinal",w:east[0],l:east[3],wins:4,lost:1,pts:35})'),[`#1 ${E[0]} advance to the Eastern Conference Finals.`,`Star Player drops 35 points in Game 5 to help propel the ${E[0]} into the Eastern Conference Finals.`]);
 assert.equal(h('series({w:east[0],l:east[7],wins:4,lost:1,pts:29})').length,1,'no star line under 30');
 // Conference finals lead to the Finals; the Championship posts only the star line (the title has its own news).
 assert.deepEqual(h('series({stage:"Conference final",w:west[1],l:west[0],wins:4,lost:2})'),[`#2 ${W[1]} advance to the Finals.`]);
 assert.deepEqual(h('series({stage:"Championship",w:west[1],l:east[0],wins:4,lost:2,pts:32})'),[`Star Player drops 32 points in Game 6 to help the ${W[1]} clinch the championship.`]);
 assert.deepEqual(h('series({stage:"Championship",w:west[1],l:east[0],wins:4,lost:2})'),[]);
 // League-wide 8-team bracket: league seeds and league round names; single-game rounds give the score.
 a.run(`cfg={split:false,size:8,byes:0,bestOf:1,sides:[{name:'League',teams:[...east.slice(0,4),...west.slice(0,4)]}]}`);
 assert.deepEqual(h('series({w:east[0],l:west[3],wins:1,lost:0,bestOf:1})'),[`#1 ${E[0]} advance to the Semifinals.`]);
 assert.deepEqual(dt('series({w:east[0],l:west[3],wins:1,lost:0,bestOf:1})'),[`Beat the #8 ${W[3]}, 110–101.`]);
 // A real run: 8-team league, 8-slot bracket. Every finished series before the Finals posts one series headline.
 const l=loadLeague({seed:44,strictDOM:false});l.setRandomSeed(44);
 l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Series Run';d.teams=d.teams.slice(0,8);d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});
  d.leagueSettings={...setupLeagueRules(d),seasonGames:28,divisionGames:0,conferenceGames:28,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0,seriesGames:7,seriesFirstGames:7,seriesSemiGames:7,seriesFinalGames:7};state=validateCareerData(buildSetupCareer(d));`);
 await l.run('sim(seasonLength())');await l.run(`simulatePlayoffBatch(false)`);
 const out=run(l,`(()=>{const slots=playoffSeriesSlots().filter(s=>!s.bye);return {done:slots.filter(s=>s.complete&&s.stage!=='Championship').length,champ:state.champion,
  items:newsStore().items.filter(n=>n.year===state.year&&/ (advance to|sweep the|upset the|knock out the) /.test(n.headline)).map(n=>n.headline),stars:newsStore().items.filter(n=>/ drops \\d+ points/.test(n.headline)).length,
  winners:slots.filter(s=>s.complete&&s.stage!=='Championship').map(s=>state.teams[s.winner].city+' '+state.teams[s.winner].name)}})()`);
 assert.notEqual(out.champ,null);assert.equal(out.done,6);assert.equal(out.items.length,6,'one series headline per finished series: '+out.items.join(' | '));
 for(const name of out.winners)assert(out.items.some(x=>x.includes(' '+name+' ')),name+' has a series headline');
 assert(out.items.filter(x=>/Semifinals|Finals/.test(x)).length===6);
 console.log(`Playoff series news: advance/sweep/upset/historic upset wording, star lines, round names (split and league-wide), and a real run (${out.items.length} series headlines, ${out.stars} star lines).`);
})().catch(e=>{console.error(e);process.exit(1)});
