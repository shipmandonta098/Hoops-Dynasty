const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');const {loadLeague}=require('./load-league.cjs');
const realm=loadLeague({seed:2026});
const cases=[
 ['Birthday already occurred','2006-08-04',2027,21],
 ['Birthday not yet occurred','2006-12-31',2027,20],
 ['Birthday on reference date (October 1)','2006-10-01',2027,21],
 ['December birthday','2000-12-31',2026,25],
 ['January birthday','2000-01-01',2026,26],
 ['July 1 birthday, before rollover','2006-07-01',2026,20],
 ['July 1 birthday, after rollover','2006-07-01',2027,21],
 ['Leap day, non-leap season','2000-02-29',2027,27],
 ['Leap day, leap season','2000-02-29',2028,28],
 ['Invalid February 29 rejected','2001-02-29',2027,null]
];
const results=cases.map(([name,dob,season,expected])=>{const actual=realm.run(`agingSeasonAge(${JSON.stringify(dob)},${season})`);assert.equal(actual,expected,name);return {name,dob,referenceDate:season+'-10-01',expected,actual,result:'PASS'};});
realm.run(`state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));globalThis.probe=state.free[0];probe.age=25;probe.bio.birthdate='2000-12-31';`);
for(const date of ['2026-12-31','2027-01-01','2027-07-01']){realm.run(`state.day=Math.round((Date.parse('${date}T00:00:00Z')-Date.UTC(2026,9,28))/86400000)+1;`);assert.equal(realm.run('scheduleDate(state.day).toISOString().slice(0,10)'),date);assert.equal(realm.run('probe.age'),25);assert(realm.run('playerBioFacts(probe).includes("Age at the start of the season (October 1)")'));results.push({name:'Within-season date does not silently change stored season age',leagueDate:date,season:2026,expected:25,actual:25,result:'PASS'});}
console.table(results);fs.writeFileSync(path.join(__dirname,'verification-aging-direct.json'),JSON.stringify({model:'Stored age at October 1 of season year',passed:results.length,failed:0,cases:results},null,2)+'\n');
