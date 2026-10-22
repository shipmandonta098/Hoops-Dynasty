const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

vm.runInContext(`
state=validateCareerData(fresh(defaultTeams().slice(0,8),4));render=()=>{};save=async()=>true;showResult=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};
assert(awardRacesView().includes('opening night'));assert.equal(awardCandidates('mvp').length,0);
const rookie=team().roster[0];rookie.bio.debutYear=state.year;
sim(7);assert.equal(state.awardRaces.weeks.length,1);assert.equal(state.awardRaces.weeks[0].day,7);assert(awardCandidates('mvp').length>0);assert(awardCandidates('roy').some(r=>r.id===rookie.id));assert(awardCandidates('sixth').every(r=>r.gp-r.gs>r.gs));assert(awardCandidates('dpoy').every(r=>Number.isFinite(r.defense)));
const snapshot=JSON.stringify(state.awardRaces);awardRaceDay();assert.equal(JSON.stringify(state.awardRaces),snapshot);state=validateCareerData(copy(state));assert.equal(JSON.stringify(state.awardRaces),snapshot);
sim(1);const prior=state.awardRaces.weeks[0].ranks.mvp;assert.equal(awardTrend('mvp',prior[1],0).text,'▲ +1');assert.equal(awardTrend('mvp',prior[0],1).text,'▼ -1');assert.equal(awardTrend('mvp',999999,0).text,'NEW');assert.equal(awardTrend('mvp',prior[0],0).text,'—');
const initial=JSON.stringify(awardCandidates('mvp').map(r=>[r.id,r.score]));const playoff=copy(state.history[0]);playoff.stage='Semifinal';state.history.unshift(playoff);assert.equal(JSON.stringify(awardCandidates('mvp').map(r=>[r.id,r.score])),initial);state.history.shift();
for(const [key] of AWARD_RACES){switchAwardRace(key);assert(awardRacesView().includes('Eligibility & scoring'))}
assert.throws(()=>readAwardRaces({year:2026,weeks:[{day:7,ranks:{mvp:[1,1]}}]},m=>{throw Error(m)}),/ranking/);
sim(6);assert.equal(state.awardRaces.weeks.length,2);assert.equal(state.awardRaces.weeks[1].day,14);
const r=awardRaceRows().find(r=>r.id===rookie.id);state.statsArchive=[{id:rookie.id,year:state.year-1,gp:2}];assert(!awardCandidates('roy').some(r=>r.id===rookie.id));
state.year++;assert.equal(awardTrend('mvp',prior[0],0).text,'—');assert.equal(awardRaceState().weeks.length,0);
`,context);console.log('Award eligibility, weekly movement, persistence, postseason exclusion, multi-day advancement and season reset passed.');
