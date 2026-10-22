const assert=require('assert/strict'),fs=require('fs'),{loadLeague}=require('./load-league.cjs');const results=[];
for(const seed of [101,102,103,104,105]){
 const l=loadLeague({seed,strictDOM:false});l.run(fs.readFileSync('dev/phase10/roster.js','utf8'));l.run('var test=fresh(defaultTeams(),2,2025,"male",10);var savedTeams=copy(test.teams);widenInitialRosterQuality(test.teams);');
 const a=l.run('({teams:savedTeams})'),b=l.run('({teams:test.teams,change:globalThis.p10Roster})'),sort=ts=>ts.flatMap(t=>t.roster).sort((a,b)=>a.id-b.id);assert.deepEqual(sort(a.teams),sort(b.teams));for(let i=0;i<a.teams.length;i++)assert.deepEqual(a.teams[i].roster.map(p=>p.pos).sort(),b.teams[i].roster.map(p=>p.pos).sort());assert(b.change.finalSD>=b.change.initialSD);results.push({seed,...b.change});
}
fs.writeFileSync('dev/phase10/roster-verification.json',JSON.stringify(results,null,2));console.log(results);
