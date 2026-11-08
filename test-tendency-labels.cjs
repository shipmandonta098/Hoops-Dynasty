// Tendency labels: 'overplay' is the hold-the-ball / run-the-clock decision (label 'Hold Ball / Run Clock'; the saved key
// is unchanged, so old saves need no conversion) and 'inside' is 'Close Shots'. Both carry help text on the profile and
// in the commissioner editor. Labels only: keys, order and the engine's use are unchanged.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:79,strictDOM:false});l.setRandomSeed(79);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='T';state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});var p=state.teams[0].roster[0];`);
const labels=run(`Object.fromEntries(TENDENCY_GROUPS.flatMap(g=>g[1]).map(([k,l])=>[k,l]))`);
assert.equal(labels.overplay,'Hold Ball / Run Clock');assert.equal(labels.inside,'Close Shots');
assert.deepEqual(run('TENDENCY_KEYS.slice(0,4)'),['drivingLayup','runningLayup','standingDunk','drivingDunk']);assert(run(`TENDENCY_KEYS.includes('overplay')&&TENDENCY_KEYS.includes('inside')`));
assert.match(run('TENDENCY_HELP.inside'),/non-drive, non-post shots come from close range/);assert.match(run('TENDENCY_HELP.overplay'),/run down the shot clock/);assert.match(run('TENDENCY_HELP.overplay'),/not a defensive setting/);
const profile=run('playerTendencies({p})');assert.match(profile,/<strong>Hold Ball \/ Run Clock<\/strong><small class="tendency-help">How often they hold the ball/);assert.match(profile,/<strong>Close Shots<\/strong><small class="tendency-help">/);assert.match(profile,/Close Shots, Midrange and Three Point are relative shot-zone weights/);
assert.doesNotMatch(profile,/Close \/ Rim|Overplay/);
const editor=run('commissionerPlayerForm(p)');assert.match(editor,/<label title="How often they hold the ball[^"]*">Hold Ball \/ Run Clock<input name="t_overplay"[^>]*><small class="tendency-help">/);assert.match(editor,/<label title="How often their non-drive[^"]*">Close Shots<input name="t_inside"/);
// Old saves keep the 'overplay' key and load as before; the editor still saves it.
l.run(`p.tendencies={...generatedTendencies(p),overplay:73};state=validateCareerData(JSON.parse(JSON.stringify(state)));p=state.teams[0].roster[0]`);assert.equal(run('Math.round(tendency(p,"overplay")*100)>0'),true);assert.equal(run("p.tendencies.overplay"),73);
console.log('Tendency labels: Hold Ball / Run Clock and Close Shots with help text on the profile and in the editor; keys unchanged; old saves keep overplay passed.');
