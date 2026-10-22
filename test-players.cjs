const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=fresh(defaultTeams().slice(0,4),2);render=()=>{};
const before=JSON.stringify(state);assert.equal(playerDirectoryRows().length,70);
updatePlayersFilter('team','free');assert.equal(playerDirectoryRows().length,30);
updatePlayersFilter('team','1');assert(playerDirectoryRows().every(r=>r.club.id===1));
updatePlayersFilter('position','PG');assert(playerDirectoryRows().every(r=>r.p.pos==='PG'));
updatePlayersFilter('query','no such name 123');assert(playersDirectoryTable().includes('No players match'));
assert.equal(JSON.stringify(state),before);
const id=state.teams[1].roster[0].id;viewDirectoryPlayer(id,'Attributes');assert.equal(activePlayerId,id);assert.equal(playerTab,'Attributes');
viewDirectoryPlayer(id,'Tendencies');assert.equal(playerTab,'Tendencies');
viewDirectoryPlayer(id,'Overview');assert.equal(playerTab,'Overview');assert(document.getElementById('profile').innerHTML.includes('Hometown'));
`,context);console.log('PASS: all rosters/free agents, combined filters, empty results, read-only filtering and direct profile tabs');
