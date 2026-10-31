// Historical presets on leagues whose alignment can't take the proportional split: with 16 vs 15 conferences no
// interconference count is exact, so the preset falls back to the nearest schedulable split instead of failing.
// Balanced leagues keep the proportional split.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:9,strictDOM:false});const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var draft=extra=>{const d=makeDraft();if(extra){const east=d.teams[0];d.teams.push({...copy(east),key:'team-x31',abbr:'XTO',city:'Extra',name:'Team'})}d.meetings='custom';d.leagueSettings={...setupLeagueRules(d),seasonGames:60,divisionGames:8,conferenceGames:22};return d};
 var plan=(d,lg,y)=>{const p=historicalPlan(lg,y,d.leagueSettings,d.cap,d.teams);const s=customSeasonSchedule(d.teams,y,p.rules);return {split:[p.rules.seasonGames,p.rules.divisionGames,p.rules.conferenceGames],games:d.teams.map((_,i)=>s.flat().filter(g=>g.includes(i)).length)}};`);
// Balanced 30 teams: proportional split, unchanged.
assert.deepEqual(run(`plan(draft(false),'wnba',2025).split`),[44,4,16]);assert.deepEqual(run(`plan(draft(false),'nba',2026).split`),[82,10,30]);
// 31 teams (16 vs 15): every preset applies, with all games inside the conference, and every team plays the full count.
for(const [lg,y,want] of [['wnba',2025,[44,4,40]],['wnba',2024,[40,4,36]],['wnba',1997,[28,2,26]],['nba',2026,[82,10,72]]]){
 const r=run(`plan(draft(true),'${lg}',${y})`);assert.deepEqual(r.split,want,lg+' '+y);assert(r.games.every(n=>n===want[0]),lg+' '+y+': every team plays '+want[0]);
}
// The Apply button fills the setup form instead of showing the pairing error.
const applied=run(`(()=>{onSetup=true;setupDraft=draft(true);setupDraft.gmName='Hist';captureSetup=()=>{};renderSetupLeagueSettings=()=>{};const fb={textContent:''},form={};
 document.getElementById=id=>id==='historical-feedback'?fb:id==='historical-league'?{value:'wnba',closest:()=>form}:id==='historical-year'?{value:'2025'}:null;document.querySelector=()=>({});FormData=function(){return []};
 applyHistoricalPreset();return {msg:fb.textContent,gender:setupDraft.leagueGender,games:setupDraft.leagueSettings.seasonGames,year:setupDraft.year}})()`);
assert.match(applied.msg,/^Applied to League Settings/,applied.msg);assert.deepEqual([applied.gender,applied.games,applied.year],['female',44,2025]);
console.log('Historical alignment: presets fall back to a schedulable split for uneven conferences; balanced leagues unchanged; Apply fills the setup form.');
