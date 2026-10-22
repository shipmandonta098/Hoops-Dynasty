const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
render=()=>{};save=async()=>true;showResult=()=>{};toast=()=>{};
const sold=calculateAttendance(.12,.20,-.05,42,3500,40);
assert.equal(sold.attendance,3500);assert.equal(sold.revenue,147000);assert.equal(sold.fanEnergy,3);
assert.equal(calculateAttendance(-1,0,0,75,3500).attendance,0);assert.equal(updateFanEnergy(0),1);
assert(calculateAttendance(0,0,0,40).attendance>calculateAttendance(0,0,0,140).attendance);
state=validateCareerData(fresh(defaultTeams().slice(0,4),2));ownerCanManage=()=>true;
sim(2);assert(state.history.every(g=>g.gameAtmosphere));
for(const g of state.history){const a=g.gameAtmosphere;assert.equal(a.revenue,updateRevenue(a.attendance,a.ticketPrice));const ledger=financeFor(state.teams[g.a]).season.attendance.find(r=>r.day===g.day);assert.equal(ledger.fans,a.attendance);assert.equal(ledger.occupancy,a.fillRate)}
for(const club of state.teams){const expected=state.history.filter(g=>g.a===club.id).reduce((n,g)=>n+g.gameAtmosphere.revenue/1e6,0);assert(Math.abs(financeFor(club).season.lines.tickets-expected)<1e-9)}
const snap=JSON.stringify(state),g=state.history[0];financeHome(state.teams[g.a],false,g.b,g.day);syncAttendanceWithGMOffice(g.gameAtmosphere,g);displayAttendanceUI(g.gameAtmosphere);displayAttendanceUI(g.gameAtmosphere,'side');displayAttendanceUI(g.gameAtmosphere,'summary');assert.equal(JSON.stringify(state),snap);
const loaded=validateCareerData(copy(state));assert.deepEqual(loaded.history.map(g=>g.gameAtmosphere),state.history.map(g=>g.gameAtmosphere));assert(loaded.history.every(g=>g.attendanceRevenuePosted&&g.attendanceEffectsApplied));
const bad=copy(state);bad.history[0].gameAtmosphere.revenue++;assert.throws(()=>validateCareerData(bad));const legacy=copy(state);legacy.history.forEach(g=>{delete g.gameAtmosphere;delete g.attendanceEffectsApplied;delete g.attendanceRevenuePosted});validateCareerData(legacy);
const old=copy(g.gameAtmosphere);ownerFor(state.teams[g.a]).plan.ticketPrice=150;assert.deepEqual(g.gameAtmosphere,old);
const playoff=play(0,1,'Semifinal'),f=financeFor(team()),tickets=f.season.lines.tickets;assert(playoff.attendanceRevenuePosted);financeHome(team(),true,1,playoff.day,playoff);assert.equal(f.season.lines.tickets,tickets);
assert(displayAttendanceUI(playoff.gameAtmosphere,'side').includes('Revenue This Game'));assert(atmosphereFanDashboard().includes('Regular-season ticket price'));
// Major-trade spike is logged once, with an explicit contextual (not causal) explanation.
state=validateCareerData(fresh(defaultTeams().slice(0,4),2));const home=team();home.roster[0].ovr=90;const d=addDecision({type:'Trade',description:'Acquired a star',players:[{id:home.roster[0].id,name:home.roster[0].name}]});
const low=createGameAtmosphere(home,state.teams[1]);low.fillRate=.5;low.attendance=9000;state.history=[{a:0,b:1,winner:0,gameAtmosphere:low}];const high=createGameAtmosphere(home,state.teams[1]);high.fillRate=1;const event={a:0,b:1,winner:0,gameAtmosphere:high};state.history.unshift(event);syncAttendanceWithGMOffice(high,event);syncAttendanceWithGMOffice(high,event);assert.equal(decisionState().entries.filter(x=>x.type==='Attendance').length,1);
// Owner boost is bounded and applied only once for a qualifying fifth home game.
ownerFor(home).patience=80;state.history=Array.from({length:4},()=>({a:0,b:1,winner:0,gameAtmosphere:low}));const fifth={a:0,b:1,winner:0,gameAtmosphere:high};state.history.unshift(fifth);syncAttendanceWithGMOffice(high,fifth);assert.equal(ownerFor(home).patience,81);syncAttendanceWithGMOffice(high,fifth);assert.equal(ownerFor(home).patience,81);
state.history=Array.from({length:14},()=>({a:0,b:1,winner:0,gameAtmosphere:low}));assert.equal(createGameAtmosphere(home,state.teams[1]).recentHomeAttendance.length,10);
console.log('PASS: bounds/pricing, game snapshots, finance reconciliation, idempotence, save validation/legacy compatibility, postseason revenue, UI markup, trade spike deduplication.');
`,context);
