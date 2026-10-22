const fs=require('node:fs'),assert=require('node:assert/strict');
const retained=JSON.parse(fs.readFileSync('dev/running-clock-experiment.json'));
let source=fs.readFileSync('dev/experiment-running-clock.cjs','utf8');
const old="const plain=loadLeague({strictDOM:false}),base=loadLeague({strictDOM:false,sourceTransform:instrument}),rawExp=loadLeague({strictDOM:false,sourceTransform:candidate}),exp=loadLeague({strictDOM:false,sourceTransform:(n,s)=>candidate(n,instrument(n,s))});";
assert.equal(source.split(old).length-1,1);
source=source.replace(old,`function previous(name,s){
 if(name==='attributes.js'){const a='const shotContext={transition,transitionAdvantage,shotClock:machine.shotClock,';assert.equal(s.split(a).length-1,1);s=s.replace(a,'const shotContext={transition,transitionAdvantage,');}
 if(name==='tendencies.js'){const a='if(context.transitionAdvantage&&context.shotClock>=14)return';assert.equal(s.split(a).length-1,1);s=s.replace(a,'if(context.transitionAdvantage)return');}return s;
}
const plain=loadLeague({strictDOM:false,sourceTransform:previous}),base=loadLeague({strictDOM:false,sourceTransform:(n,s)=>instrument(n,previous(n,s))}),rawExp=loadLeague({strictDOM:false}),exp=loadLeague({strictDOM:false,sourceTransform:instrument});`);
source=source.replace("'dev/running-clock-experiment.json'","'dev/running-clock-adoption-verification.json'");
// The historical comparison must not depend on the now-promoted production baseline.
source=source.replace("JSON.parse(fs.readFileSync('dev/running-adopted-baseline.json'))","JSON.parse(fs.readFileSync('dev/running-clock-experiment.json')).baseline");
new Function('require',source)(require);
const actual=JSON.parse(fs.readFileSync('dev/running-clock-adoption-verification.json'));
assert.deepEqual(actual.candidate,retained.candidate,'production must reproduce every retained candidate measurement and per-game score');
assert.deepEqual(actual.boundary,retained.boundary,'boundary descriptors must match');
assert.deepEqual(actual.controls,retained.controls,'all deterministic controls must match');
actual.acceptedCandidateReproduction='EXACT MATCH';
actual.controls.productionUnmodified=false;
actual.controls.productionChange='Only approved Running eligibility clock gate';
fs.writeFileSync('dev/running-clock-adoption-verification.json',JSON.stringify(actual,null,2));
console.log('PASS: adopted production exactly reproduces retained experimental candidate');
