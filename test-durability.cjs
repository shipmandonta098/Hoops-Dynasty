const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=validateCareerData(fresh());render=()=>{};save=()=>true;say=()=>{};
const all=[...state.teams.flatMap(t=>t.roster),...state.free];assert(all.every(p=>Number.isInteger(p.attributes.dur)&&p.attributes.dur>=1&&p.attributes.dur<=99));
const raw=JSON.parse(JSON.stringify(state)),skills=JSON.stringify(raw.teams[0].roster[0].attributes);for(const p of [...raw.teams.flatMap(t=>t.roster),...raw.free])delete p.attributes.dur;
const restored=validateCareerData(raw);assert.equal(JSON.stringify(restored.teams[0].roster[0].attributes),skills);assert.equal(restored.teams[0].roster[0].attributes.dur,validateCareerData(raw).teams[0].roster[0].attributes.dur);
for(const dur of [0,100,1.5,null]){const bad=JSON.parse(JSON.stringify(state));bad.teams[0].roster[0].attributes.dur=dur;assert.throws(()=>validateCareerData(bad))}
const p=team().roster[0],lo=JSON.parse(JSON.stringify(p)),hi=JSON.parse(JSON.stringify(p));lo.attributes.dur=20;hi.attributes.dur=95;
assert(durabilityInjuryChance(lo,36,70)>durabilityInjuryChance(hi,36,70));assert(durabilityInjuryChance(lo,40,30)>durabilityInjuryChance(lo,20,90));assert.equal(durabilityInjuryChance(lo,0,0),0);assert(durabilityFatigueMultiplier(lo)>durabilityFatigueMultiplier(hi));assert(durabilityRecoveryMultiplier(lo)<durabilityRecoveryMultiplier(hi));
assert.equal(durabilityInjuryDetails(lo,50,.05).severity,'Severe');assert.equal(durabilityInjuryDetails(hi,50,.05).severity,'Moderate');
lo.age=hi.age=35;developAttributes(lo,-3);developAttributes(hi,-3);assert(hi.attributes.spd>lo.attributes.spd);assert.equal(lo.attributes.dur,20);assert.equal(hi.attributes.dur,95);
const random=Math.random;Math.random=()=>0;p.attributes.dur=20;durabilityMedicalCheck(p,team(),40,20,{rotationEvents:[]});Math.random=random;assert(p.medicalInfo);assert.equal(p.medicalInfo.severity,'Severe');assert(injuryDays(p)>=120);assert.equal(playerMinutes(p,team()),0);
const roundtrip=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(roundtrip.teams[0].roster[0].medicalInfo,p.medicalInfo);
const until=p.medicalInfo.until;p.medicalInfo.until=medicalStamp();p.medicalInfo.rehabUntil=medicalStamp()+14;assert.equal(injuryDays(p),0);const risk=durabilityInjuryChance(p,30,80);delete p.medicalInfo;assert(durabilityInjuryChance(p,30,80)<risk);
const html=playerAttributes({p,own:true,club:team()});assert(html.includes('Durability'));assert(playerOverview({p,own:true,club:team(),starter:true}).includes('Durability'));
console.log('PASS: all players and legacy migration, invalid saves rejected, workload/durability/reinjury probabilities, severity, fatigue/recovery, aging protection, injury exclusion, medical persistence and profile display.');
`,context);
