const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
const source=fs.readFileSync('dist/dashboard.js','utf8'),nav=source.match(/const nav=(\[.*?\]);document/)[1];
const pages=vm.runInContext(nav,context).map(x=>x[0]);pages.push('GM Office','GM Inbox','Attendance rankings','Power rankings');
vm.runInContext("state=validateCareerData(fresh(defaultTeams().slice(0,6),2));ownerCanManage=()=>true;notice='';",context);

(async()=>{await vm.runInContext(`(async()=>{
save=async()=>true;render=()=>{};
const club=team(),c=coachFor(club),ct=coachContract(c);assert(coachContractPanel(club).includes('Terminate Contract'));assert(!coachContractPanel(state.teams[1]).includes('onclick='));assert.equal(editableCoach(1,0),null);
const event=(salary,years)=>({preventDefault(){},target:{elements:{salary:{value:salary},years:{value:years}}}});
const oldThrough=ct.through;assert.equal(await submitCoachExtension(event(.5,2),ct.revision),false);assert.equal(ct.through,oldThrough);
assert(await submitCoachExtension(event(coachExtensionDemand(c),2),ct.revision));assert.equal(ct.through,oldThrough+2);assert.equal(ct.revision,1);
assert.equal(await submitCoachExtension(event(10,2),0),false);assert.equal(ct.revision,1);
const cash=financeFor(club).cash,buyout=coachBuyout(c),expected=[...c.assistants].sort((a,b)=>b.rating-a.rating)[0].name;
assert(await terminateCoachContract(ct.revision));assert.equal(coachFor(club).name,expected);assert(coachFor(club).contract.interim);assert(Math.abs(financeFor(club).cash-(cash-buyout))<1e-8);assert.equal(await terminateCoachContract(1),false);
const loaded=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded.teams[0].coach.contract,coachFor(club).contract);
const before=JSON.stringify(state);save=async()=>false;assert.equal(await submitCoachExtension(event(10,1),coachContract(coachFor(team())).revision),false);assert.equal(JSON.stringify(state),before);
const corrupt=JSON.parse(before);corrupt.teams[0].coach.contract.salary=-1;assert.throws(()=>validateCareerData(corrupt),/coach contract/);
})()`,context);console.log('PASS: owner-only controls, declined and accepted offers, stale/double action guards, buyout and assistant promotion, persistence, invalid data, failed-save rollback.');})().catch(error=>{console.error(error);process.exitCode=1});
