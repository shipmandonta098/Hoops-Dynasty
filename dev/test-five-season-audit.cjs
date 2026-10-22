const assert=require('node:assert/strict'),fs=require('node:fs');const {loadLeague}=require('./load-league.cjs');
const r=loadLeague({seed:2026});r.setRandomSeed(2026);r.run("const setup=makeDraft();setup.gmName='Benchmark GM';state=validateCareerData(buildSetupCareer(setup));");r.run(fs.readFileSync(require('node:path').join(__dirname,'five-season-audit.js'),'utf8'));
assert.equal(r.run('auditSchedule().games'),1230);assert.equal(r.run('auditContracts().failures'),0);
assert.throws(()=>r.run('state.teams[0].roster[0].contractThrough=2025;auditContracts()'),/expired contract/);
assert.throws(()=>r.run('state.schedule[0].push([...state.schedule[0][0]]);auditSchedule()'),/duplicate daily appearance/);
r.run('auditIdentity();state.teams[0].roster[0].name="Wrong identity";');assert.throws(()=>r.run('auditIdentity()'),/ID reused/);
console.log('PASS: valid baseline, expired contract rejected, duplicate schedule appearance rejected, reused identity rejected.');
