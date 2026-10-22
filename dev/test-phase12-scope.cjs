const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs'),variant=require('./phase12/variant.cjs');const checks=[];
for(const gender of ['male','female'])for(const year of [1997,2006,2024]){
 const states=[];for(const mode of ['baseline','pace']){process.env.P12_MODE=mode;const l=loadLeague({seed:222,strictDOM:false,sourceTransform:variant});l.run(`state=fresh(defaultTeams(),2,${year},'${gender}',10)`);states.push(JSON.parse(JSON.stringify(l.run('state'))));if(mode==='pace')for(const lead of [-6,0,1,3,6,7])for(const left of [20,60,61,120]){const p=l.run(`lateGameTimingPlan(${lead},${left},24,64,false)`);assert(p.setup>=0&&p.setup<left);if(year>=2020&&lead>0&&lead<=6&&left<=60)assert(p.setup===4);}}
 const pool=s=>s.teams.flatMap(t=>t.roster).sort((a,b)=>a.id-b.id);assert.deepEqual(pool(states[0]),pool(states[1]));
 for(let i=0;i<states[0].teams.length;i++)assert.deepEqual(states[0].teams[i].roster.map(p=>p.pos).sort(),states[1].teams[i].roster.map(p=>p.pos).sort());
 if(year<2020||gender==='male')assert.deepEqual(states[0].teams,states[1].teams);checks.push({gender,year,poolPreserved:true,positionCountsPreserved:true});
}
fs.writeFileSync('dev/phase12/scope-verification.json',JSON.stringify(checks,null,2));console.log('PASS roster identities/attributes and timing scope');
