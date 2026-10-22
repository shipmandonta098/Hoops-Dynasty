const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};showResult=()=>{};
Math.random=scheduleRandom(771);state=validateCareerData(fresh(defaultTeams().slice(0,6),2));const base=copy(state),r=leagueRules();
for(const [key,shot] of [['threeAccuracy',{kind:'three',skill:'tp'}],['layupAccuracy',{kind:'inside',skill:'lay'}],['dunkAccuracy',{kind:'inside',skill:'dnk'}],['midrangeAccuracy',{kind:'mid',skill:'fg'}],['postAccuracy',{kind:'mid',skill:'post'}],['postAccuracy',{kind:'mid',skill:'fg',key:'turnaround'}]]){assert.equal(shotAccuracySetting(shot),key);r[key]=0;assert.equal(shotMakeProbability(.7,shot),0);r[key]=2;assert.equal(shotMakeProbability(.7,shot),1);r[key]=1;assert.equal(shotMakeProbability(.7,shot),.7);}
r.ftAccuracy=0;assert.equal(leagueProbability(.8,'ftAccuracy'),0);r.assistTendency=0;assert.equal(leagueAssist(1),false);r.assistTendency=2;assert(leagueAssist(.8));
state=copy(base);Object.assign(leagueRules(),{foulRate:0,assistTendency:0,blockTendency:0,stealTendency:0,offRebTendency:0,threeAccuracy:0,injuriesEnabled:false});Math.random=scheduleRandom(719);sim(1);for(const g of state.history){assert(g.box.every(p=>p.pf===0&&p.tech===0&&p.ast===0&&p.blk===0&&p.stl===0&&p.orb===0&&p.tpm===0));}state=validateCareerData(state);assert.equal(leagueRules().offRebTendency,0);
state=copy(base);Object.assign(leagueRules(),{ftAccuracy:0,injuriesEnabled:false});Math.random=scheduleRandom(999);sim(1);assert(state.history.flatMap(g=>g.box).every(p=>p.ftm===0));
const possessions=rate=>{state=copy(base);Object.assign(leagueRules(),{paceMultiplier:rate,injuriesEnabled:false,foulRate:0});Math.random=scheduleRandom(700);sim(1);return state.history.flatMap(g=>g.box).reduce((sum,p)=>sum+p.poss,0)};const slow=possessions(.65),fast=possessions(1.4);assert(fast>slow*1.5);
state=copy(base);leagueRules().threeTendency=0;Math.random=scheduleRandom(71);sim(1);assert(state.history.flatMap(g=>g.box).every(p=>p.tpa===0));
assert.throws(()=>readLeagueSettings({...leagueRules(),paceMultiplier:0}));assert.throws(()=>readLeagueSettings({...leagueRules(),dunkAccuracy:3}));
console.log('PASS: shooting-category accuracy and clamps, zero steals/blocks/fouls/assists/offensive rebounds/three-point makes, zero free throws made, pace comparison, zero three-point attempts, save/reload and validation.');
})()`,context);})().catch(e=>{console.error(e);process.exitCode=1});
