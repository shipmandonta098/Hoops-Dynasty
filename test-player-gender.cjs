const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
for(const mode of LEAGUE_GENDERS){state=validateCareerData(fresh(defaultTeams(),2,2026,mode));const all=state.teams.flatMap(t=>t.roster).concat(state.free);assert.equal(state.leagueGender,mode);if(mode!=='mixed')assert(all.every(p=>p.gender===mode));else{assert(all.some(p=>p.gender==='male'));assert(all.some(p=>p.gender==='female'));}
for(const p of all.filter(p=>p.gender==='female')){assert(FEMALE_FIRST.includes(p.name.split(' ')[0]));const ranges={PG:[65,71],SG:[67,71],SF:[70,74],PF:[71,74],C:[74,80]},r=ranges[p.pos];assert(p.bio.heightInches>=r[0]&&p.bio.heightInches<=r[1]);assert(p.bio.weightLbs>=115&&p.bio.weightLbs<=209);assert(p.tendencies.drivingDunk<=5);assert.equal(playerPronouns(p).possessive,'her');}
assert.deepEqual(validateCareerData(copy(state)),state);const recruit=player(35001,0);assert.equal(recruit.gender,generatedGender(mode,35001));
const game=play(0,1);assert(game.box.every(p=>Number.isFinite(p.pts)));for(const id of [0,1])assert.equal(game.box.filter(p=>p.team===state.teams[id].abbr).reduce((n,p)=>n+p.pts,0),id===0?game.sa:game.sb);
if(mode==='female'){assert(!game.playByPlay.some(s=>/\bhis\b/.test(s)));assert(game.playByPlay.some(s=>s.includes('her rhythm')));}
}
const old=fresh();delete old.leagueGender;old.teams.forEach(t=>t.roster.forEach(p=>delete p.gender));old.free.forEach(p=>delete p.gender);const loaded=validateCareerData(old);assert.equal(loaded.leagueGender,'male');assert(loaded.teams[0].roster.every(p=>p.gender==='male'));
const malformed=copy(old);malformed.leagueGender='invalid';assert.throws(()=>validateCareerData(malformed));malformed.leagueGender='male';malformed.free[0].gender='invalid';assert.throws(()=>validateCareerData(malformed));
setupDraft=makeDraft();setupDraft.leagueGender='female';assert.equal(presetPayload('settings').leagueGender,'female');assert.equal(validateDraft(setupDraft),'');renderSetup();assert(document.getElementById('app').innerHTML.includes('name="leagueGender"'));
console.log('PASS: male/female/mixed rosters and recruits, names, physical ranges, dunk tendencies, gendered commentary, game totals, save round-trip, legacy migration, validation and setup presets.');
`,context);
