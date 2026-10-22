const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
const source=fs.readFileSync('dist/dashboard.js','utf8'),nav=source.match(/const nav=(\[.*?\]);document/)[1];
const pages=vm.runInContext(nav,context).map(x=>x[0]);pages.push('GM Office','GM Inbox','Attendance rankings','Power rankings');
vm.runInContext("state=validateCareerData(fresh(defaultTeams().slice(0,6),2));ownerCanManage=()=>true;notice='';",context);

(async()=>{await vm.runInContext(`(async()=>{
const t=team(),f=financeFor(t);f.level=2;assert.equal(teamStadiumCapacity(t),20000);assert(teamManagementView().includes('name="stadiumCapacity"'));
const values={city:t.city,name:t.name,abbr:t.abbr,marketSize:t.marketSize,logo:defaultTeams().findIndex(l=>l.logoIndex===t.logoIndex&&l.logoAtlas===t.logoAtlas),divisionId:t.divisionId,stadiumCapacity:'3500',...Object.fromEntries(t.colors.flatMap((c,i)=>[['color'+i,c.hex],['colorName'+i,c.name]]))};
applyManagedTeam(0,values);assert.equal(teamStadiumCapacity(t),3500);const a=createGameAtmosphere(t,state.teams[1]);assert.equal(a.capacity,3500);assert(a.attendance<=3500);assert.equal(financeProjection(t).capacity,3500);
assert.equal(validateCareerData(JSON.parse(JSON.stringify(state))).teams[0].stadiumCapacity,3500);
for(const v of ['0','3.5','100001','oops'])assert.throws(()=>applyManagedTeam(0,{...values,stadiumCapacity:v}),/Stadium capacity/);
save=async()=>true;render=()=>{};f.cash=100;await financeUpgrade();assert.equal(teamStadiumCapacity(t),4500);assert.equal(a.capacity,3500);
const before=JSON.stringify(state);save=async()=>false;await financeUpgrade();assert.equal(JSON.stringify(state),before);
})()`,context);console.log('PASS: capacity form, validation, legacy upgrade migration, attendance/projections, save/load, future-only game snapshots, arena upgrade and failed-save rollback.');})().catch(e=>{console.error(e);process.exitCode=1});
