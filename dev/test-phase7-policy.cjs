const assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');const l=loadLeague({seed:812,strictDOM:false});l.context.assert=assert;l.run(require('./feat-fixture.cjs'));
l.run(`state=buildSetupCareer(d);
assert.equal(rotationScoreState(36,-20).settled,false);
assert.equal(rotationScoreState(36,-20).pursue,true);
assert.equal(rotationScoreState(40,20).restLead,true);
assert.equal(rotationScoreState(40,-20).restLead,false);
assert.equal(rotationScoreState(47,-20).settled,true);
assert.equal(rotationScoreState(49,25).settled,false);
assert.equal(rotationScoreState(18,-20).pursue,false);
for(const time of [3,10,30,60,120])for(const margin of [-12,-3,-2,0,2,8]){
 const p=lateGameTimingPlan(margin,time,24,64,false);assert(p.setup>=0&&p.setup<time);assert.equal(p.hold,margin>0&&time<24);
}
assert(lateGameTimingPlan(4,60,24,64).setup>lateGameTimingPlan(0,60,24,64).setup);
assert.equal(lateGameTimingPlan(-3,15,24,64).needThree,true);
assert.equal(lateGameTimingPlan(-2,10,24,64).needThree,false);
assert.equal(lateGameFoulChance(-3,10,24,90),0);
assert.equal(lateGameFoulChance(20,10,24,90),0);
assert.equal(lateGameTimingPlan(4,60,14,64).setup,7);
`);console.log('PASS score-state rotation, clock conservation, shot choice and foul guards');
