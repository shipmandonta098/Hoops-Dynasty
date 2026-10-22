const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});


vm.runInContext(`
state=validateCareerData(fresh());const court=createHomeCourt('Regular season');assert(court.strength>0);assert(homeCourtShot(court,0)>0);assert(homeCourtShot(court,1)<0);assert(homeCourtFoul(court,0)<1);assert(homeCourtFoul(court,1)>1);assert(homeCourtRebound(court,true)>0);assert(homeCourtRebound(court,false)<0);
assert.equal(homeCourtProbability(0,court,0),0);assert.equal(homeCourtProbability(1,court,1),1);
const lines=[];homeCourtEvent(court,0,'bucket',(s,t)=>lines.push(t));homeCourtEvent(court,0,'bucket',(s,t)=>lines.push(t));assert.equal(lines.length,1);assert(court.momentum>0);const hot=homeCourtShot(court,0);for(let i=0;i<8;i++)homeCourtTick(court);assert.equal(court.momentum,0);assert(homeCourtShot(court,0)<hot);homeCourtEvent(court,0,'steal',()=>{});assert(court.momentum>0);homeCourtTimeout(court);assert(court.momentum<.5);
assert.equal(createHomeCourt('All-Star Game').strength,0);activeRivalry={split:true};assert.equal(createHomeCourt('Regular season').strength,0);activeRivalry=null;leagueRules().homeAdvantage=0;assert.equal(homeCourtShot(createHomeCourt('Regular season'),0),0);assert.equal(shotMakeProbability(.4,{kind:'three'},createHomeCourt('Regular season'),0),shotMakeProbability(.4,{kind:'three'}));
leagueRules().threeAccuracy=0;assert.equal(shotMakeProbability(.5,{kind:'three'},court,0),0);leagueRules().threeAccuracy=2;assert.equal(shotMakeProbability(.6,{kind:'three'},court,1),1);leagueRules().threeAccuracy=1;
console.log('PASS: bounded home/away probabilities, foul and rebound edges, momentum trigger/decay/timeout, neutral venues, shared crowds and disabled setting.');
`,context);
if(process.argv.includes('--balance'))vm.runInContext(`
Math.random=scheduleRandom(592891);state=validateCareerData(fresh(defaultTeams().slice(0,6),2));leagueRules().injuriesEnabled=false;leagueRules().homeAdvantage=.8;
const base=copy(state.teams[1]);delete base.rotationPlan;for(const p of base.roster){delete p.workload;delete p.medicalInfo;delete p.injuredUntil}const coach=copy(coachFor(base));base.coach=coach;
let wins=0,margin=0;
for(let game=0;game<1000;game++){state.history=[];for(const id of [1,2]){state.teams[id]=copy(base);const t=state.teams[id];t.id=id;t.key='clone-'+id;t.abbr='C'+id;t.w=t.l=0;t.roster.forEach((p,i)=>p.id=id*10000+i)}
 const before=JSON.stringify(state.teams[1].roster.map(p=>p.attributes));const result=simulateAttributeGame(1,2);assert.equal(JSON.stringify(state.teams[1].roster.map(p=>p.attributes)),before);wins+=result.winner===1;margin+=result.sa-result.sb;
 if((game+1)%100===0)console.log('BALANCE',game+1,'games',wins,'home wins');
}
console.log(JSON.stringify({games:1000,homeWins:wins,homeWinRate:wins/1000,meanHomeMargin:margin/1000}));
`,context);
