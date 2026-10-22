const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const results=[];
for(const gender of ['male','female']){
 const l=loadLeague({seed:199,strictDOM:false,sourceTransform:(n,s)=>{
  if(!n.startsWith('attributes.js'))return s;
  const a='const start=gameMinutes()+overtime*leagueRules().overtimeMinutes;';assert(s.includes(a));
  return s.replace(a,"if(overtime===10)Object.assign(state.leagueSettings,globalThis.accuracyOriginal);"+a);
 }});l.context.assert=assert;l.context.gender=gender;l.run(require('./feat-fixture.cjs'));
 l.run(`state.leagueGender=gender;state.leagueSettings.periodMinutes=gender==='female'?10:12;simulationExecution.mode='headless';globalThis.accuracyOriginal=Object.fromEntries(['ftAccuracy','threeAccuracy','layupAccuracy','dunkAccuracy','midrangeAccuracy','postAccuracy'].map(k=>[k,leagueRules()[k]]));for(const k of Object.keys(accuracyOriginal))state.leagueSettings[k]=0;state.leagueSettings.foulRate=0;Math.random=scheduleRandom(991);var g=play(0,1);assert(g.summaryData.periods>=leagueRules().gamePeriods+11);assert(g.sa!==g.sb);assert(g.summaryData.complete);readGameSummaryData(g.summaryData,m=>{throw Error(m)});var expected=(gameMinutes()+(g.summaryData.periods-leagueRules().gamePeriods)*leagueRules().overtimeMinutes)*leagueRules().courtPlayers;for(const t of [0,1])assert(Math.abs(g.box.filter(r=>r.team===state.teams[t].abbr).reduce((n,r)=>n+r.mp,0)-expected)<.03);assert(!g.playByPlay.some(s=>s.includes('deciding free throw')));`);
 results.push({gender,periods:l.run('g.summaryData.periods'),score:l.run('[g.sa,g.sb]'),minutes:l.run('expected'),test:'10 zero-accuracy overtime periods followed by restored ordinary accuracy; no forced winner'});
 console.log('PASS',gender,'eleventh overtime, legal scores, minutes and serialization');
}
const versions=[loadLeague({seed:71,strictDOM:false,sourceTransform:(n,s)=>n.startsWith('attributes.js')?fs.readFileSync('dev/phase5/pre-clock-label-attributes.js','utf8'):s}),loadLeague({seed:71,strictDOM:false})];
for(const l of versions){l.run(require('./feat-fixture.cjs'));l.run('var initial=copy(state)');}
for(let seed=1;seed<=20;seed++){
 const gs=versions.map(l=>{l.setRandomSeed(seed);return l.run("state=copy(initial);simulationExecution.mode='normal';simulateAttributeGame(0,1)")});
 for(const key of ['sa','sb','box','summaryData'])assert.deepEqual(JSON.parse(JSON.stringify(gs[0][key])),JSON.parse(JSON.stringify(gs[1][key])));
}
results.push({test:'20 identical-seed games before/after buzzer label correction',scoreBoxSummaryUnchanged:true});
fs.writeFileSync('dev/phase5/integrity.json',JSON.stringify(results,null,2));
console.log('PASS clock-label correction leaves scores, boxes and event records identical');
