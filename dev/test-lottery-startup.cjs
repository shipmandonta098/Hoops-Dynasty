const assert=require('node:assert/strict'),fs=require('node:fs');
const {loadLeague}=require('./load-league.cjs');const x=loadLeague({strictDOM:false});
const parse=s=>JSON.parse(x.run(`JSON.stringify(parseLotteryChances(${JSON.stringify(s)}))`));
assert.deepEqual(parse('14,14,14,12.5,10.5,9,7.5,6,4.5,3,2,1.5,1,0.5'),[14,14,14,12.5,10.5,9,7.5,6,4.5,3,2,1.5,1,0.5]);
assert.deepEqual(parse(' 20, 12.5,0,0.5 '),[20,12.5,0,0.5]);assert.deepEqual(parse('0.14,0.14,0.125'),[.14,.14,.125]);
for(const s of ['',null,'0,0','-1,2','14%,12%','.5,1','1e2,3','1,,2','1000001',Array(37).fill(1).join(',')])assert.throws(()=>parse(s));
for(const custom of [false,true]){const data=JSON.parse(x.run(`JSON.stringify((()=>{const d=makeDraft();d.gmName='Lottery Regression';${custom?"d.leagueSettings={...d.leagueSettings,lotteryMode:'custom',lotterySelections:3,lotteryChances:'20,18,16,12,10,8,6,4,3,2,1,1,0.5,0.5'};":''}return validateCareerData(buildSetupCareer(d))})())`));assert.equal(data.teams.length,30);assert.equal(data.teams.flatMap(t=>t.roster).length,420);assert.ok(data.schedule.length);assert.equal(data.leagueSettings.lotteryMode,custom?'custom':'weighted');}
console.log('PASS: default/custom league creation without persistence; parser defaults, custom weights, decimal weights, empty/malformed rejection.');
