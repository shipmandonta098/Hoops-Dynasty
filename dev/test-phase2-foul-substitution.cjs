const assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
for(const gender of ['male','female']){
 const l=loadLeague({seed:920,strictDOM:false,sourceTransform:(name,s)=>{
  if(name.split('?')[0]!=='attributes.js')return s;
  const before="  if(defensiveFoul(side,p,d,'off-ball defensive personal'))return;";
  assert(s.includes(before));s=s.replace(before,"  if(!globalThis.forcedContact){rows.get(d.id).pf=leagueRules().foulLimit-1;globalThis.forcedContact={id:d.id,side:1-side};}\n"+before);
  const after='  machine.shotClock=Math.max(machine.shotClock,Math.min(possessionEnvironment().defensiveReset,possessionEnvironment().shotClock));';
  assert(s.includes(after));return s.replace(after,"  if(globalThis.forcedContact&&!globalThis.forcedContact.checked){assert(!gameRotations[1-side].court.has(globalThis.forcedContact.id));assert(gameRotations[1-side].court.has(d.id));assert.notEqual(d.id,globalThis.forcedContact.id);assert.equal(dr,rows.get(d.id));assert.equal(defProgress,(100-gameRotations[1-side].stamina.get(d.id))/30);globalThis.forcedContact.checked=true;}\n"+after);
 }});l.context.assert=assert;l.context.gender=gender;l.run(require('./feat-fixture.cjs'));l.run(`d.leagueGender=gender;state=buildSetupCareer(d);var fixture=copy(state);`);
 for(let i=0;i<5;i++)l.run(`state=copy(fixture);globalThis.forcedContact=null;Math.random=scheduleRandom(${93000+i});simulationExecution.mode='headless';play(0,1);assert(globalThis.forcedContact?.checked);`);
 console.log('PASS',gender,'5 forced non-bonus disqualifications: replacement defender, box row and stamina used on the retained possession');
}
