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
 const ctx={assisted:variant==='cutting',passing:rating,rim,transition:false,contested,action:['driving','running'].includes(variant)?'drive':'shoot'};
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

const results=[];for(const contest of [false,true])for(const variant of ['driving','running'])results.push({contest,variant,...runtime.run(`controlShot(75,75,'${variant}',${contest})`)});
fs.writeFileSync('dev/transition-probability-controls.json',JSON.stringify({scope:'Same 75-rated cloned shooter/defender, identical drive action and build, 50% block tendency, default sliders, neutral home court/context. No full-game simulation.',results},null,2));console.log(JSON.stringify(results,null,2));
