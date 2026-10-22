const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs'),{candidate}=require('./running-eligibility-candidate.cjs');
const a=loadLeague({strictDOM:false}),b=loadLeague({strictDOM:false,sourceTransform:candidate});
for(const r of [a,b])r.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));globalThis.p=state.teams[0].roster[0]");
const json=(r,s)=>JSON.parse(JSON.stringify(r.run(s)));
for(const transition of [false,true])for(const event of [false,true]){
 const options=json(b,`layupOptions(p,{transition:${transition},transitionAdvantage:${event}})`);
 assert.equal(options.some(v=>v.name==='Running Layup'),event);
 assert.deepEqual(options,json(a,`layupOptions(p,{transition:${event}})`));
}
let threeCases=0;
for(const event of [false,true])for(const transition of [false,true])for(const earlyThree of [false,true])for(const key of ['three','runningThree','pullupThree']){
 const code=`Math.random=scheduleRandom(552);contextualLayup(p,{...TENDENCY_SHOTS.find(s=>s.key==='${key}')},{transitionAdvantage:${event},transition:${transition},earlyThree:${earlyThree},openLook:true,assisted:true,passing:75})`;
 assert.deepEqual(json(a,code),json(b,code));threeCases++;
}
for(const key of ['floater','runningFloater','standingDunk','drivingDunk','postHook']){
 const code=`Math.random=scheduleRandom(552);contextualLayup(p,{...TENDENCY_SHOTS.find(s=>s.key==='${key}')},{transition:true,transitionAdvantage:false,assisted:true,passing:75})`;
 assert.deepEqual(json(a,code),json(b,code));
}
for(const r of [a,b])assert.equal(r.run("layupOptions(p,{transition:true,transitionAdvantage:true})[0].adjustment"),.055);
assert.equal(b.run("layupOptions(p,{transition:true,transitionAdvantage:true})[0].block"),.5);
for(const transition of [false,true])assert.deepEqual(json(a,`tendencyShotWeights(p,{transition:${transition}})`),json(b,`tendencyShotWeights(p,{transition:${transition}})`));
// Reuse the prior actual-engine probability harness, changing only temporary
// control inputs: layup rating varies, all other attributes stay 75.
let setup=fs.readFileSync('dev/two-point-controls.cjs','utf8').split('const equal=[];')[0];
setup=setup.replace("loadLeague({strictDOM:false})","loadLeague({strictDOM:false,sourceTransform:require('./running-eligibility-candidate.cjs').candidate})")
 .replace('ATTRIBUTE_KEYS.map(k=>[k,rating])','ATTRIBUTE_KEYS.map(k=>[k,75])')
 .replace('const x=k=>p.attributes[k]','p.attributes.lay=rating;const x=k=>p.attributes[k]')
 .replace("transition:variant==='running'","transition:variant==='running',transitionAdvantage:variant==='running'")
 .replace("action:variant==='driving'?'drive':'shoot'","action:['driving','running'].includes(variant)?'drive':'shoot'");
const controlled=new Function('require',setup+'return runtime;')(require),curves=[];
for(const rating of [50,60,70,75,80,90,99])for(const variant of ['driving','running'])curves.push({rating,variant,...controlled.run(`controlShot(${rating},75,'${variant}',false)`)});
for(const variant of ['Driving Layup','Running Layup']){const rows=curves.filter(x=>x.variant===variant);assert(rows.every((r,i)=>i===0||r.probability>rows[i-1].probability));}
const result={eligibilityTruthTable:'PASS: all four merged/event combinations',transitionThreeParityCases:threeCases,otherShotParityCases:5,shotWeightParityCases:2,runningCoefficients:'PASS: .055 accuracy and .5 block multiplier unchanged',curves};
fs.writeFileSync('dev/running-experiment-unit.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
