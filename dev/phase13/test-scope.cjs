const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('../load-league.cjs'),variant=require('./variant.cjs');const checks=[];
for(const gender of ['male','female'])for(const year of [1997,2024]){
 const states=[];for(const transform of [(n,s)=>s,variant]){const l=loadLeague({seed:222,strictDOM:false,sourceTransform:transform});l.run(`state=fresh(defaultTeams(),2,${year},'${gender}',10)`);states.push(JSON.parse(JSON.stringify(l.run('state'))));}
 const pool=s=>s.teams.flatMap(t=>t.roster).sort((a,b)=>a.id-b.id);assert.deepEqual(pool(states[0]),pool(states[1]));
 for(let i=0;i<states[0].teams.length;i++)assert.deepEqual(states[0].teams[i].roster.map(p=>p.pos).sort(),states[1].teams[i].roster.map(p=>p.pos).sort());
 if(year<2020||gender==='male')assert.deepEqual(states[0].teams,states[1].teams);
 const normalized=[];
 for(const transform of [(n,s)=>s,variant]){const l=loadLeague({seed:222,strictDOM:false,sourceTransform:transform});l.context.saved=JSON.parse(JSON.stringify(states[0]));l.run('state=validateCareerData(saved)');normalized.push(JSON.parse(JSON.stringify(l.run('state.teams.map(t=>t.roster)'))));}
 assert.deepEqual(normalized[1],normalized[0]);
 checks.push({gender,year,poolPreserved:true,positionCountsPreserved:true,existingRosterPreservedOnLoad:true,unchangedTeams:year<2020||gender==='male'});
}
fs.writeFileSync('dev/phase13/scope-verification.json',JSON.stringify({factor:Number(process.env.P13_SPREAD||1.45),checks},null,2));console.log('PASS scope, talent pool, position counts, save rosters');
