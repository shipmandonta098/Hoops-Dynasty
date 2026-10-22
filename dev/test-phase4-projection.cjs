const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs'),results=[];
for(const gender of ['male','female']){
 const l=loadLeague({seed:413,strictDOM:false});l.run(require('./feat-fixture.cjs'));l.context.gender=gender;l.run(`state.leagueGender=gender;state.year=gender==='female'?2024:2025;state.leagueSettings.periodMinutes=gender==='female'?10:12;state.leagueSettings.gamePeriods=4;state.teams.forEach(t=>{coachFor(t);t.roster.forEach(p=>{p.bio??=generatePlayerBio(p,state.year,[{abbr:'FA'}])})});var fixture=copy(state);`);l.run(fs.readFileSync('dev/rotation-quality-diagnostic.js','utf8'));
 for(const scenario of ['healthy','injured','fatigued']){
  l.context.scenario=scenario;l.run(`state=copy(fixture);var t=state.teams[2],p=t.roster[0];if(scenario==='injured')p.medicalInfo={...p.medicalInfo,until:medicalStamp()+10};if(scenario==='fatigued')p.workload={stamp:medicalStamp(),energy:40,minutes:36};var before=JSON.stringify(state),originalRNG=Math.random;Math.random=()=>{throw Error('Consumed RNG')};var projection;try{projection=projectedRotationQuality(t)}finally{Math.random=originalRNG};if(before!==JSON.stringify(state))throw Error('State changed');`);
  const q=l.run('projection'),id=l.run('p.id');assert.equal(q.minutes.reduce((s,p)=>s+p.minutes,0),gender==='male'?240:200);if(scenario==='injured')assert(!q.minutes.some(p=>p.id===id));if(scenario==='fatigued')assert(q.energy<100);results.push({gender,scenario,minutes:q.minutes,quality:q.ovr,energy:q.energy});
 }
}
fs.writeFileSync('dev/phase4/projection-regression.json',JSON.stringify(results));console.log('PASS six projections: NBA/WNBA minutes, unavailable exclusion, fatigue response, unchanged state and RNG');
