const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});


(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};toast=()=>{};ownerCanManage=()=>true;
let d=makeDraft();d.teams=defaultTeams().slice(0,6);d.meetings=2;d.gmName='Watch test';state=validateCareerData(buildSetupCareer(d));
const target=state.teams[1].roster[0],own=team().roster[0];
await watchToggle(target.id);await watchEdit(target.id,'note','3&D <Future Core>');
assert.equal(watchStore().targets.length,1);assert.equal(watchEntry(target.id).note,'3&D <Future Core>');
state=validateCareerData(copy(state));assert.equal(watchStore().targets.length,1);
assert(watchListView().includes('3&amp;D &lt;Future Core&gt;'));
for(const v of WATCH_VIEWS){watchChangeView(v);assert(watchListView().includes('aria-label="Watch list views"'));}
watchBrowse=true;watchChangeView('Draft Prospects');assert(watchListView().includes('Watch player'));
const prospect=state.draft.prospects[0];await watchToggle(prospect.id);await watchScout(prospect.id);assert.equal(watchEntry(prospect.id).due,medicalStamp()+3);
state.day+=3;watchProcess();assert.equal(watchEntry(prospect.id).scouting,25);assert.equal(watchEntry(prospect.id).due,null);
const p=watchFind(target.id).p;p.medicalInfo={name:'ankle sprain',severity:'Minor',until:medicalStamp()+2,rehabUntil:medicalStamp()+16};watchProcess();
let messages=inboxStore().items.filter(m=>m.type==='Watch list');assert(messages.some(m=>m.subject.startsWith('Injury:')));const n=messages.length;watchProcess();assert.equal(inboxStore().items.filter(m=>m.type==='Watch list').length,n);
state.day+=2;watchProcess();assert(inboxStore().items.some(m=>m.subject.startsWith('Recovered:')));
await watchEdit(target.id,'injury',false);p.medicalInfo.until=medicalStamp()+3;const count=inboxStore().items.filter(m=>m.subject.startsWith('Injury:')).length;watchProcess();assert.equal(inboxStore().items.filter(m=>m.subject.startsWith('Injury:')).length,count);
p.gp=1;state.history.push({a:1,b:2,stage:'Regular season',box:[{playerId:p.id,pts:42,fgm:15,fga:25,played:true}]});watchProcess();assert(inboxStore().items.some(m=>m.subject.startsWith('40-point')));watchProcess();assert.equal(inboxStore().items.filter(m=>m.subject.startsWith('40-point')).length,1);
for(let i=0;i<3;i++){p.gp++;state.history.push({a:1,b:2,stage:'Regular season',box:[{playerId:p.id,pts:2,fgm:1,fga:10,played:true}]});watchProcess();}assert(inboxStore().items.some(m=>m.subject.startsWith('Cold streak')));
p.contractThrough=state.year+4;watchProcess();assert(inboxStore().items.some(m=>m.subject.startsWith('Contract update')));
state.history=[];state.day=0;p.gp=0;const seen=[...watchEntry(target.id).seen];state=validateCareerData(copy(state));assert.deepEqual(watchEntry(target.id).seen,seen);
watchTrade(target.id);assert.deepEqual(currentTradeDraft().into,[target.id]);assert.equal(currentTradeDraft().club,1);
watchCompare=[target.id,prospect.id];assert(watchComparison(new Map()).includes(own.name));
const bad=copy(state);bad.watchList.targets.push(copy(bad.watchList.targets[0]));assert.throws(()=>validateCareerData(bad),/watch target/);
watchCompare=[];for(const id of [1,2,3,4])watchSelect(id,true);assert.equal(watchCompare.length,3);
const free=state.free[0],offerBefore=faOfferDialog;let offered=null;faOfferDialog=id=>{offered=id};state.freeAgency={year:state.year,phase:'market',players:[{id:free.id,demand:5}],offers:[],pending:[]};watchOffer(free.id);assert.equal(offered,free.id);faOfferDialog=offerBefore;
const oldSave=save;save=async()=>false;const note=watchEntry(target.id).note;await watchEdit(target.id,'note','must roll back');assert.equal(watchEntry(target.id).note,note);save=oldSave;
await watchToggle(target.id);assert(!watchEntry(target.id));
console.log('PASS: target persistence, escaped notes, all views, scouting time, injury/recovery toggles, milestone/cold alerts, contract changes, deduplication, import validation, comparison and preselected trades.');
})()`,context)})().catch(e=>{console.error(e);process.exitCode=1});
