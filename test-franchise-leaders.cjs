const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=fresh(defaultTeams().slice(0,4),2);render=()=>{};
const originalEntries=statsEntries;const base={playerId:1,name:'Test Player',pts:20,reb:8,ast:5,stl:2,blk:1,mp:30,orb:2,drb:6,fgm:8,tpm:2,ftm:2,tov:3,pf:2};
let entries=[{...base,teamId:0},{...base,teamId:1,pts:40},{...base,teamId:0,pts:10}];statsEntries=()=>entries;
assert.equal(franchiseLeaderRows(state.teams[0])[0].pts,30);assert.equal(franchiseLeaderRows(state.teams[1])[0].pts,40);
archiveFranchiseLeaders();archiveFranchiseLeaders();assert.equal(state.franchiseLeadersArchive.length,1);assert.equal(franchiseLeaderRows(state.teams[0])[0].pts,30);
state.year++;entries=[{...base,teamId:0}];state.teams[0].city='Renamed';assert.equal(franchiseLeaderRows(state.teams[0])[0].pts,50);assert.equal(franchiseLeaderRows(state.teams[0])[0].years.size,2);
state.teams.forEach(t=>coachFor(t));const before=JSON.stringify(state);setFranchiseHistoryPage('leaders');assert(teamHistoryPage(state.teams[0]).includes('FRANCHISE LEADERS'));assert(!teamHistoryPage(state.teams[0]).includes('SEASON-BY-SEASON RECORD'));setFranchiseLeaderStat('reb');assert.equal(franchiseLeaderRows(state.teams[0])[0].reb,24);assert.equal(JSON.stringify(state),before);
statsEntries=originalEntries;const reload=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(reload.franchiseLeadersArchive,state.franchiseLeadersArchive);
const bad=JSON.parse(JSON.stringify(state));bad.franchiseLeadersArchive[0].players[0].pts=-5;assert.throws(()=>validateCareerData(bad));
`,context);console.log('PASS: franchise-only traded player totals, rollover, renames, save validation, read-only rendering, leaders navigation and category selection');
