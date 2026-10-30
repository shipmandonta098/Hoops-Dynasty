// Player profile game log: full regular-season and playoff logs become available once the season (or the player's
// playoff run) concludes; the recent-games view stays the default.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
(async()=>{
const l=loadLeague({seed:161,strictDOM:false});l.setRandomSeed(161);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};renderPlayerProfile=()=>{};var d=makeDraft();d.gmName='Logs';state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';`);
for(let i=0;i<12;i++)await l.run('simulateDayHeadless()');
l.run(`var star=state.teams[controlledTeamId()].roster[0],club=state.teams[controlledTeamId()];`);
// Mid-season: recent games only.
const mid=run(`(()=>{const links=profileGameLogShortcuts(star);return {links,html:playerStats(playerContext(star.id))}})()`);
assert.deepEqual(mid.links,{regular:null,playoffs:null});assert(/RECENT GAME LOG/.test(mid.html)&&!/Full regular season/.test(mid.html));
// Regular season concluded: a full regular-season log with every game played, in order, with venue and result.
const reg=run(`(()=>{state.day=seasonLength();const links=profileGameLogShortcuts(star),played=state.history.filter(h=>h.stage==='Regular season'&&h.box.some(b=>b.playerId===star.id&&b.played!==false)).length;setProfileGameLog('regular');const html=playerStats(playerContext(star.id)),rows=links.regular;
 const check=rows.every(g=>{const h=state.history[g.index],home=state.teams[h.a].abbr===g.team,own=home?h.sa:h.sb,opp=home?h.sb:h.sa;return g.home===home&&g.result===(own>opp?'W ':'L ')+own+'–'+opp&&g.opponent===state.teams[home?h.b:h.a].abbr});
 return {count:rows.length,played,ordered:rows.every((g,i)=>!i||rows[i-1].day<=g.day),check,html,away:rows.some(g=>!g.home),links:{regular:!!links.regular,playoffs:links.playoffs}}})()`);
assert.equal(reg.count,reg.played);assert(reg.ordered&&reg.check);assert.deepEqual(reg.links,{regular:true,playoffs:null});
assert(/REGULAR SEASON GAME LOG/.test(reg.html),'card switches to the full log');assert(new RegExp('Full regular season \\('+reg.count+'\\)').test(reg.html));
assert.equal((reg.html.match(/onclick="showProfileLogGame\(/g)||[]).length,reg.count,'every game links to its box score');
if(reg.away)assert(/<td>@<\/td>/.test(reg.html),'away games are marked @');
assert(/aria-pressed="true"[^>]*>Full regular season/.test(reg.html));
// Playoffs: only once the player's run is over, and only for players who played in the playoffs.
const po=run(`(()=>{const opp=state.teams.find(t=>t.id!==club.id),g={...state.history.find(h=>h.stage==='Regular season'&&h.box.some(b=>b.playerId===star.id)),stage:'First round',day:seasonLength()+1};
 g.a=club.id;g.b=opp.id;g.box=[{...state.history.find(h=>h.box.some(b=>b.playerId===star.id)).box.find(b=>b.playerId===star.id),team:club.abbr}];state.history.unshift(g);
 const before=profileGameLogShortcuts(star).playoffs;state.champion=opp.id;const after=profileGameLogShortcuts(star).playoffs;const other=state.teams.find(t=>t.id!==club.id&&t.id!==opp.id).roster[0];
 setProfileGameLog('playoffs');const html=playerStats(playerContext(star.id));return {before,after:after?.length,other:profileGameLogShortcuts(other).playoffs,html}})()`);
assert.equal(po.before,null,'no playoff log while the run is in progress');assert.equal(po.after,1);assert.equal(po.other,null,'players without playoff games get no playoff link');
assert(/PLAYOFFS GAME LOG/.test(po.html)&&/Playoffs \(1\)/.test(po.html));
// Opening another player's profile starts from recent games; an unavailable scope falls back to recent.
const other=run(`(()=>{const p=club.roster[1];return {scope:profileLogScope(p),html:profileGameLogCard(p,profileSeasonGames(p,false))}})()`);
assert.equal(other.scope,'recent');assert(/RECENT GAME LOG/.test(other.html));
// Box score from the log returns to the game log.
const back=run(`(()=>{const html=[];const el={innerHTML:''};document.getElementById=()=>el;showResult=()=>{el.innerHTML='box'};showProfileLogGame(profileSeasonGames(star,false)[0].index,star.id);return el.innerHTML})()`);
assert(/Back to game log/.test(back)&&/then\(\(\)=>changePlayerTab\('Stats'\)\)/.test(back));
console.log('Season game logs: hidden mid-season, full regular-season log after the season, playoff log after the run, per-player reset passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
