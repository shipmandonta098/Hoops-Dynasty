const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});


vm.runInContext(`
state=validateCareerData(fresh());state.day=1;const t=team(),p=t.roster[0],away=state.teams[1];p.attributes.endu=80;p.workload={energy:80,stamp:medicalStamp()-1,minutes:40,home:true,venue:t.key};
let f=b2bFatigue(p,t,t);assert(Math.abs(f.shooting-.10)<1e-8);assert(Math.abs(f.physical-.15)<1e-8);assert.equal(f.travel,1);
p.workload.home=false;p.workload.venue='different-arena';f=b2bFatigue(p,t,away);assert.equal(f.travel,2);assert.equal(f.shooting,.2);assert.equal(f.physical,.3);assert(f.mental<=.10);
p.workload.stamp--;assert.equal(b2bFatigue(p,t,t).minutes,0);p.workload.stamp=medicalStamp()-1;
b2bMatch={players:new Map([[p.id,f]]),weakOpponent:new Set()};assert(b2bInjuryMultiplier(p,35)>=1.5);assert.equal(b2bInjuryMultiplier(p,29),1.5);assert.equal(b2bAttribute(80,'dur',f),80);assert(b2bAttribute(80,'spd',f)<80);b2bMatch=null;
assert.deepEqual(readWorkload(p.workload,m=>{throw Error(m)}),p.workload);const old=JSON.stringify(p.attributes);const r=simulateAttributeGame(0,1);assert.equal(JSON.stringify(p.attributes),old);assert.equal(b2bMatch,null);assert(r.playByPlay.some(x=>x.includes('second night of a back-to-back')));assert.equal(p.workload.home,true);assert.equal(p.workload.venue,t.key);for(const [id,score]of [[0,r.sa],[1,r.sb]])assert.equal(r.box.filter(x=>x.team===state.teams[id].abbr).reduce((n,x)=>n+x.pts,0),score);
state=validateCareerData(fresh());const strong=state.teams[1],weak=state.teams[0];for(const p of strong.roster){p.ovr=90;p.workload={energy:100,stamp:medicalStamp()-1,minutes:35}}for(const p of weak.roster)p.ovr=60;
b2bMatch={players:new Map(strong.roster.map(p=>[p.id,{minutes:35}])),weakOpponent:new Set([1])};const rotation=createGameRotation(strong);assert(strong.roster.every(p=>rotation.plan.targets[p.id]<=26));assert.equal(Object.values(rotation.plan.targets).reduce((n,x)=>n+x,0),gamePlayerMinutes());b2bMatch=null;
console.log('PASS: minutes/stamina formula, travel, recovery day, caps, injury threshold, temporary ratings, game accounting, venue persistence and AI load-management allocation.');
`,context);
