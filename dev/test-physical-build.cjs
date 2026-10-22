const assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');const r=loadLeague({seed:12,strictDOM:false});r.context.assert=assert;
r.run(`
state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));
const short=copy(state.teams[0].roster[0]),tall=copy(short);
short.bio.heightInches=73;short.bio.weightLbs=180;tall.bio.heightInches=86;tall.bio.weightLbs=280;
for(const p of [short,tall])p.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));
const small=derivedPhysicalAttributes(short),big=derivedPhysicalAttributes(tall);
assert(small.spd>big.spd);assert(big.stre>small.stre);assert(small.jmp>big.jmp);assert(small.endu>big.endu);assert(big.sbl>small.sbl);
assert.equal(playerBuild(short).speed,1.2);assert.equal(playerBuild(tall).speed,.8);
assert(physicalMatchup(tall,short,'post','inside',true).post>0);assert(physicalMatchup(tall,short,'shoot','mid',true).contestScale<1);assert(physicalMatchup(short,tall,'drive','inside',true).drive>0);assert(physicalMatchup(short,tall,'shoot','three',true).recovery>0);
assert.equal(physicalMatchup(short,short,'post','inside',true).post,0);
assert(physicalAttributeBounds(tall).spd.max<physicalAttributeBounds(short).spd.max);assert(physicalAttributeBounds(tall).sbl.max>physicalAttributeBounds(short).sbl.max);assert(physicalReboundScore(tall)>physicalReboundScore(short));
assert.deepEqual(generatedAttributes(short),generatedAttributes(short));
for(const gender of ['male','female'])for(const height of [48,73,86,100])for(const weight of [80,180,280,500]){const p={...short,gender,bio:{...short.bio,heightInches:height,weightLbs:weight}},b=playerBuild(p);for(const key of ['speed','agility','strength','vertical','endurance','reachFactor'])assert(b[key]>=.8&&b[key]<=1.2);for(const value of Object.values(derivedPhysicalAttributes(p)))assert(Number.isFinite(value)&&value>=1&&value<=99);}
const missing={...short};delete missing.bio;assert.deepEqual(playerBuild(missing),playerBuild(missing));assert.equal(missing.bio,undefined);
tall.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,99]));developAttributes(tall,2);for(const [k,b]of Object.entries(physicalAttributeBounds(tall)))assert(tall.attributes[k]<=b.max);
const originals=state.teams.flatMap(t=>t.roster).map(p=>JSON.stringify(p.attributes));simulateAttributeGame(0,1);assert.deepEqual(state.teams.flatMap(t=>t.roster).map(p=>JSON.stringify(p.attributes)),originals);
`);console.log('PASS physical trade-offs, extremes, generation/development caps, matchups, both gender baselines, deterministic fallback, and base-rating restoration');
