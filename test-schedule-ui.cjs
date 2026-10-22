const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=validateCareerData(fresh());render=()=>{};save=()=>true;showResult=()=>{};toast=()=>{};
assert.equal(scheduleDate(1).toISOString().slice(0,10),'2026-10-28');assert.equal(scheduleDate(5).toISOString().slice(0,10),'2026-11-01');
const saved=JSON.stringify(state),rows=scheduleRows();assert.equal(rows.filter(r=>!r.bye).length,58);assert.equal(scheduleVisibleRows(rows).length,4);assert.equal(JSON.stringify(state),saved);
scheduleSelect('scope','week');assert.equal(scheduleVisibleRows(rows).length,7);scheduleNavigate(1);assert.equal(scheduleVisibleRows(rows)[0].day,8);scheduleSelect('scope','season');assert.equal(scheduleVisibleRows(rows).length,58);
scheduleSelect('scope','remaining');state.day=5;assert(scheduleVisibleRows(rows).every(r=>r.day>5));state.day=0;
let calls=[];const engine=sim;sim=n=>calls.push(n);scheduleSimulateNext();assert.equal(calls.pop(),1);scheduleSimulateThrough(12);assert.equal(calls.pop(),12);state.day=8;scheduleSimulateThrough(12);assert.equal(calls.pop(),4);scheduleSimulateThrough(3);assert.equal(calls.length,0);state.day=0;sim=engine;
scheduleUI=null;scheduleSimulateThrough(scheduleMonthEnd());assert.equal(state.day,4);assert.equal(team().w+team().l,4);
const played=scheduleRows().filter(r=>r.result);assert.equal(played.length,4);assert.equal(played[3].record,team().w+'–'+team().l);for(const row of played){assert(row.top);assert.equal(row.home,row.pair[0]===0);assert(row.result.box.some(b=>b.name===row.top.name&&b.team===team().abbr))}
const html=scheduleView();for(const text of ['Schedule &amp; Results','Remaining games','Entire season','Simulate Next Game','Simulate to Playoffs','Top Performer','showResult('])assert(html.includes(text));
scheduleSelect('scope','remaining');assert(!scheduleView().includes('showResult('));
state=validateCareerData(fresh(defaultTeams().slice(0,5)));scheduleUI=null;state.day=0;const nextDay=scheduleRows().find(r=>!r.bye).day;sim=n=>calls.push(n);scheduleSimulateNext();assert.equal(calls.pop(),nextDay);
state.day=seasonLength();scheduleSimulateNext();assert.equal(calls.length,0);scheduleSelect('competition','playoffs');assert(scheduleView().includes('Simulate playoffs'));
console.log('PASS: calendar/month/week filters, unchanged schedule data, result records and top scorers, home/away, month simulation boundaries, future-game simulation through intervening days, byes, and postseason boundary.');
`,context);
