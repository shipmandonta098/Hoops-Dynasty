const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
vm.runInContext(`
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};showResult=()=>{};
Math.random=scheduleRandom(771);
const ratings=Array.from({length:20000},()=>generatedOverall()),tierCounts=[0,0,0,0];ratings.forEach(n=>tierCounts[Math.min(3,Math.floor((n-60)/10))]++);
assert(ratings.every(n=>n>=60&&n<=99));assert(Math.abs(ratings.reduce((a,b)=>a+b,0)/ratings.length-75)<1);[.20,.55,.20,.05].forEach((target,i)=>assert(Math.abs(tierCounts[i]/ratings.length-target)<.015));console.log('Population',ratings.reduce((a,b)=>a+b,0)/ratings.length,tierCounts.map(n=>n/ratings.length));
const totals={games:0,fieldGoal:0,freeThrows:0,turnover:0,other:0,poss:0,pts:0,fga:0,fgm:0,tpa:0,tpm:0,fta:0,ftm:0,tov:0,stl:0,ast:0,orb:0,drb:0,teamTO:0,inside:{attempts:0,made:0},mid:{attempts:0,made:0},three:{attempts:0,made:0}};
for(let sample=0;sample<10;sample++){
 state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));Object.assign(leagueRules(),{injuriesEnabled:false});sim(4);
 for(const g of state.history){totals.games++;for(const k of ['fieldGoal','freeThrows','turnover','other'])totals[k]+=g.possessionOutcomes[k];for(const r of g.box)for(const k of ['poss','pts','fga','fgm','tpa','tpm','fta','ftm','tov','stl','ast','orb','drb'])totals[k]+=r[k];totals.teamTO+=g.teamTurnoverEvents.length;for(const k of ['inside','mid','three'])for(const stat of ['attempts','made'])totals[k][stat]+=g.shotDistribution[k][stat];assert.equal(g.box.reduce((n,r)=>n+r.fga,0),Object.values(g.shotDistribution).reduce((n,r)=>n+r.attempts,0));}
 state=validateCareerData(state);assert(state.history.every(g=>g.shotDistribution));
}
const report={games:totals.games,outcomes:Object.fromEntries(['fieldGoal','freeThrows','turnover','other'].map(k=>[k,totals[k]/(totals.poss/5)])),pace:totals.poss/5/totals.games/2,points:totals.pts/totals.games/2,fga:totals.fga/totals.games/2,fta:totals.fta/totals.games/2,turnoverRate:(totals.tov+totals.teamTO)/(totals.poss/5),stolenShare:totals.stl/(totals.tov+totals.teamTO),assisted:totals.ast/totals.fgm,oreb:totals.orb/(totals.orb+totals.drb),shots:Object.fromEntries(['inside','mid','three'].map(k=>[k,{mix:totals[k].attempts/totals.fga,fg:totals[k].made/totals[k].attempts}]))};console.log(JSON.stringify(report,null,2));assert(report.pace>95&&report.pace<105);assert(report.outcomes.fieldGoal>.74&&report.outcomes.fieldGoal<.82);assert(report.outcomes.turnover>.11&&report.outcomes.turnover<.17);assert(report.outcomes.freeThrows>.05&&report.outcomes.freeThrows<.11);assert(report.assisted>.53&&report.assisted<.62);assert(report.oreb>.22&&report.oreb<.28);assert(report.stolenShare>.35&&report.stolenShare<.45);for(const [k,target] of [['inside',.35],['mid',.25],['three',.40]])assert(Math.abs(report.shots[k].mix-target)<.04);for(const [k,lo,hi] of [['inside',.60,.66],['mid',.40,.46],['three',.34,.39]])assert(report.shots[k].fg>lo&&report.shots[k].fg<hi);
`,context);
vm.runInContext(`
const p=team().roster[0],savedAttributes=JSON.stringify(p.attributes);assert.equal(JSON.stringify(withBasketballAttributes(p).attributes),savedAttributes);
const elite={...p,ovr:95,attributes:Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,90])),tendencies:{...p.tendencies,touches:75}},role={...elite,ovr:75,attributes:Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]))};assert(usageWeight(elite)>usageWeight(role)*1.6);
const specialist={...role,attributes:{...role.attributes,pss:99}};assert(playerUsage(specialist)<=14);for(const kind of ['inside','mid','three'])assert(basketballShotProbability({kind},90,60)>basketballShotProbability({kind},60,90));
const healthy=copy(team());healthy.roster.forEach(p=>{delete p.injuredUntil;delete p.rotationMinutes});assert.equal(healthy.roster.reduce((n,p)=>n+defaultMinutes(healthy,p),0),240);assert(healthy.roster.slice(9).every(p=>defaultMinutes(healthy,p)===0));healthy.roster=healthy.roster.slice(0,6);assert.equal(healthy.roster.reduce((n,p)=>n+defaultMinutes(healthy,p),0),240);
const old=copy(state);old.history.forEach(g=>{delete g.shotDistribution;delete g.possessionOutcomes});assert.doesNotThrow(()=>validateCareerData(old));const invalid=copy(state);invalid.history[0].shotDistribution.inside.made=2001;assert.throws(()=>validateCareerData(invalid));
console.log('PASS: seeded population, 120-game statistical targets, usage and matchup weighting, box-score reconciliation, reserve minutes, legacy saves and validation.');
`,context);
