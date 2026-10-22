const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const versions=[loadLeague({seed:71,strictDOM:false}),loadLeague({seed:71,strictDOM:false,sourceTransform:require('./phase6-instrument.cjs')})];
for(const l of versions){l.run(require('./feat-fixture.cjs'));l.run('var initial=copy(state)');}
for(let seed=1;seed<=30;seed++){
 const gs=versions.map(l=>{l.setRandomSeed(seed);return l.run("state=copy(initial);globalThis.p6draws=[];globalThis.p6slots=[];simulationExecution.mode='normal';simulateAttributeGame(0,1)")});
 for(const key of ['sa','sb','box','summaryData','playByPlay'])assert.deepEqual(JSON.parse(JSON.stringify(gs[0][key])),JSON.parse(JSON.stringify(gs[1][key])));
}
fs.writeFileSync('dev/phase6/instrument-verification.json',JSON.stringify({games:30,identicalScoresBoxesSummaryPlayByPlay:true}));console.log('PASS 30 games instrumentation preserves RNG, scores, boxes, summary and PBP');
const l=versions[0],grid=[];
for(const kind of ['inside','mid','three'])for(const off of [60,65,70,75,80,85,90,95])for(const def of [60,65,70,75,80,85,90,95]){l.context.k=kind;l.context.o=off;l.context.d=def;grid.push({kind,off,def,probability:l.run('basketballShotProbability({kind:k},o,d)')});}
fs.writeFileSync('dev/phase6/attribute-grid.json',JSON.stringify(grid));
