const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');
const runtime=loadLeague({strictDOM:false});runtime.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));");
const source=fs.readFileSync('dist/attributes.js','utf8');
const base=source.match(/let chance=basketballShotProbability[^\n]+/)[0];
const start=source.indexOf(' chance+=moraleClutchBonus'),end=source.indexOf(' const seeksContact',start);
const context=source.slice(start,end);assert(context.includes("kind==='three'?0"));
runtime.run(`globalThis.controlShot=function(rating,rim,variant,contested=false,dunkRating=null){
 const p=copy(state.teams[0].roster[0]);p.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,rating]));p.tendencies=Object.fromEntries(TENDENCY_KEYS.map(k=>[k,50]));
 if(dunkRating!==null)p.attributes.dnk=dunkRating;const d=copy(p);d.id=999999;d.attributes.rim=rim;
 const x=k=>p.attributes[k],y=k=>d.attributes[k];
 const ctx={assisted:variant==='cutting',passing:rating,rim,transition:false,contested,action:variant==='driving'?'drive':'shoot'};
 let shot;
 if(['neutral','uncontested','contested','driving','cutting','running'].includes(variant)){
  const opt=layupOptions(p,{...ctx,assisted:variant==='cutting',transition:variant==='running'}).find(o=>o.name===(variant==='cutting'?'Cutting Layup':variant==='running'?'Running Layup':'Driving Layup'));
  shot={...TENDENCY_SHOTS.find(s=>s.key==='drivingLayup'),layup:opt.name,skills:opt.skills,adjustment:opt.adjustment,blockMultiplier:opt.block};
 }else{const key=variant==='dunk'?'standingDunk':variant==='floater'?'floater':'postHook';shot=contextualLayup(p,{...TENDENCY_SHOTS.find(s=>s.key===key)},ctx);}
 const kind=shot.kind,contest=contested,buildMatch=physicalMatchup(p,d,ctx.action,kind,contest),side=0,a=0;
 const gameRotations=[{minute:0},{minute:0}],scores=[0,0],miscommunication=false,isoAdjustment=0,decision={action:ctx.action},workloads=[{shoot:0},{shoot:0}],lineup={shot:0,drive:0,gravity:0},teamIQ=70,offense={id:1},sag=false,defensivePlan=false,plans=[{off:75,def:75,fit:60},{off:75,def:75,fit:60}],adjustments=[0,0];
 ${base}
 const baseValue=chance;
 ${context}
 const final=shotMakeProbability(Math.max(.02,Math.min(.88,chance)),shot,null,0),blockChance=kind==='inside'?Math.max(.005,.025+(y('sbl')+y('hgt')+y('jmp')-x('stre')-x('jmp'))*.0003):.008+y('sbl')*.00015;
 const block=.5*Math.min(.6,blockChance*2*(shot.blockMultiplier||1)*(1+buildMatch.recovery*10));
 return {base:baseValue,context:chance,probability:final,blockRisk:block,expectedNonFoulFG:final*(1-block),adjustment:shot.adjustment,variant:shot.layup||shot.key};
};
globalThis.controlPutback=function(rim,dunk){const p=75;const base=basketballShotProbability({kind:'inside'},p,rim),prob=shotMakeProbability(base*leagueRules().shootingRate,{kind:'inside',skill:dunk?'dnk':'lay'},null,0);const block=dunk?.5*.08:0;return {base,probability:prob,blockRisk:block,expectedNonFoulFG:prob*(1-block)}};
`);
const equal=[];for(const n of [60,70,75,80,90])for(const variant of ['neutral','contested','uncontested','driving','cutting','running','dunk','floater','postHook'])equal.push({rating:n,scenario:variant,...runtime.run(`controlShot(${n},${n},'${variant}',${variant==='contested'})`)});
const putbacks=[];for(const defense of [60,75,90])putbacks.push({defense,uncontested:runtime.run(`controlShot(75,${defense},'uncontested',false)`),contested:runtime.run(`controlShot(75,${defense},'contested',true)`),layupPutback:runtime.run(`controlPutback(${defense},false)`),dunkPutback:runtime.run(`controlPutback(${defense},true)`)});
const sagSource=source.match(/if\(sag\)chance\+=kind==='three'\?0:kind==='inside'\?-\.02:0;/)[0];
for(const kind of ['three','inside','mid'])for(const sag of [false,true]){const actual=new Function('sag','kind',`let chance=.5;${sagSource}return chance`)(sag,kind);assert.equal(actual,kind==='inside'&&sag?.48:.5)}
const dunkSensitivity=[50,60,70,75,80,90,99].map(n=>({dunkRating:n,...runtime.run("controlShot(75,75,'dunk',false,"+n+")")}));
fs.writeFileSync('dev/two-point-controls.json',JSON.stringify({scope:'Actual engine shot construction and extracted primary probability block, neutral context: no fatigue, sag, home court, rivalry, morale clutch, IQ differential, coaching advantage or sliders. Block tendency fixed at 50%. Non-foul attempts. Neutral is a basic uncontested driving layup; engine has no third/neutral contest state.',equal,putbacks,dunkSensitivity},null,2));console.log('PASS: actual engine probability controls, exact sag truth table (six cases).');
