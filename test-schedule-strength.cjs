const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

vm.runInContext(`
state=fresh(defaultTeams().slice(0,4),2);scheduleSettings().scope='season';
let rows=scheduleStrengthRows();assert.equal(rows.length,4);assert(rows.every(r=>r.projected));assert(scheduleStrengthPanel().includes('Preseason projection'));
state.schedule=[[[0,1],[2,3]]];scheduleSettings().scope='season';
state.history=[{a:1,b:2,winner:1,stage:'Regular season'},{a:1,b:3,winner:3,stage:'Regular season'},{a:3,b:2,winner:3,stage:'Regular season'}];
rows=scheduleStrengthRows();assert.equal(rows.find(r=>r.club.id===0).score,.5);assert.equal(rows[0].club.id,2);assert.equal(rows[0].score,1);assert.equal(rows[0].tier,'hard');assert.equal(rows.at(-1).club.id,3);assert.equal(rows.at(-1).tier,'easy');assert(rows.find(r=>r.club.id===0).tied);
const snapshot=JSON.stringify(state);scheduleStrengthPanel();assert.equal(JSON.stringify(state),snapshot);
scheduleSettings().scope='remaining';state.day=1;assert.equal(scheduleStrengthRows().length,0);assert(scheduleStrengthPanel().includes('No scheduled games'));
state.day=0;state.history=[];state.teams.forEach(t=>t.roster.forEach(p=>p.ovr=75));rows=scheduleStrengthRows();assert(rows.every(r=>r.tier==='balanced'&&r.rank===1));
`,context);console.log('SOS weighting, head-to-head exclusion, ranks, tiers, empty views and state preservation passed.');
