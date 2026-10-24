// Schedule view for any team: the Teams menu lists every club; rows, record, scores and strength of
// schedule follow the selected team, and "My team" / "Entire league" behave as before.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
(async()=>{const l=loadLeague({seed:31,strictDOM:false});l.setRandomSeed(31);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`var d=makeDraft();d.gmName='Schedules';state=validateCareerData(buildSetupCareer(d));render=()=>{};save=async()=>true;simulationExecution.mode='headless';simulationExecution.autopilot=true;`);
for(let i=0;i<12;i++)await l.run('simulateDayHeadless()');
const own=run('controlledTeamId()'),other=run(`state.teams.find(t=>t.id!==controlledTeamId()).id`);
// Menu: my team, entire league, then every other team.
const menu=run(`(()=>{scheduleSelect('scope','season');const h=scheduleView();return [...h.matchAll(/<option value="(team(?::\\d+)?|league)"/g)].map(m=>m[1])})()`);
assert.equal(menu[0],'team');assert.equal(menu[1],'league');assert.equal(menu.length,run('state.teams.length')+1,'every other team is listed');assert(!menu.includes('team:'+own),'own team appears once, as My team');
// Selecting another team: rows are that team's games with its own results and record.
const v=run(`(()=>{scheduleSelect('audience','team:${other}');const id=scheduleTeamId(),rows=scheduleRows().filter(r=>!r.bye),played=rows.filter(r=>r.result),t=state.teams[id];
 const expectGames=state.schedule.flat().filter(p=>p.includes(id)).length,last=played.at(-1);const html=scheduleView();
 return {id,games:rows.length,expectGames,allInvolve:rows.every(r=>r.pair.includes(id)),opponentsOk:rows.every(r=>r.opponent.id!==id),record:last?.record,wl:t.w+'–'+t.l,title:html.includes(t.city+' '+t.name),selected:html.includes('value="team:'+id+'" selected'),note:/Scores show the .* first/.test(html),
  scoreOk:played.every(r=>{const s=r.result,mine=s.a===id?s.sa:s.sb,theirs=s.a===id?s.sb:s.sa;return (s.winner===id)===(mine>theirs)}),top:played.every(r=>!r.top||r.top.team===t.abbr)}})()`);
assert.equal(v.id,other);assert.equal(v.games,v.expectGames);assert(v.allInvolve&&v.opponentsOk&&v.scoreOk&&v.top);assert.equal(v.record,v.wl,'running record matches the team record');assert(v.title&&v.selected&&v.note);
// Strength of schedule summary follows the selected team; playoff filter uses it too.
assert(run(`scheduleStrengthPanel().includes(state.teams[${other}].abbr)`));
// Back to My team / Entire league.
assert.equal(run(`(scheduleSelect('audience','team'),scheduleTeamId())`),own);
assert(run(`(scheduleSelect('audience','league'),scheduleView().includes('League-wide schedule'))`));
assert.equal(run(`(scheduleSelect('audience','team:${own}'),scheduleSettings().teamId)`),null,'choosing your own team is My team');
assert.equal(run(`(scheduleSelect('audience','team:9999'),scheduleTeamId())`),own,'unknown team ids are ignored');
console.log('Team schedules: any team selectable, rows/record/scores/SOS follow the selection, My team and league views unchanged.');
})().catch(e=>{console.error(e);process.exitCode=1});
