const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
state=validateCareerData(fresh(defaultTeams().slice(0,4),2));render=()=>{};save=async()=>true;toast=()=>{};ownerCanManage=()=>true;
const defaults={...leagueRules()},only=(...keys)=>{state.leagueSettings={...defaults,...Object.fromEntries(TIEBREAKERS.map(([key])=>[key,0])),...Object.fromEntries(keys.map((key,i)=>[key,i+1]))}};
const [a,b,c,d]=state.teams;for(const t of state.teams){t.conference='East';t.divisionId=t.id<2?'A':'B';t.w=t.l=1}
state.history=[[0,1,110,100],[1,2,120,100],[2,3,105,100],[3,0,102,100]].map(([a,b,sa,sb])=>({a,b,sa,sb,winner:a,stage:'Regular season',day:1}));
only('tieHeadToHead');assert.equal(rankStandings([b,a])[0].id,0);assert.equal(rankStandings([c,b])[0].id,1);
only('tieDivisionLeader');assert.equal(rankStandings([b,c])[0].id,2);
only('tieDivisionRecord');assert.equal(rankStandings([b,a])[0].id,0);
d.conference='West';only('tieConferenceRecord');assert.equal(rankStandings([b,a])[0].id,0);
only('tiePointDifferential');assert.deepEqual(rank().map(t=>t.id),[1,0,3,2]);only('tiePointRatio');assert.deepEqual(rank().map(t=>t.id),[1,0,3,2]);
only('tieHeadToHead','tiePointDifferential');assert.equal(rank().length,4);assert.deepEqual(rank().map(t=>t.id),rankStandings([...state.teams].reverse()).map(t=>t.id));
only();const coin=rank().map(t=>t.id);assert.deepEqual(rank().map(t=>t.id),coin);assert.deepEqual(rankStandings([...state.teams].reverse()).map(t=>t.id),coin);
state.history=[];only('tieHeadToHead','tiePointDifferential');assert.deepEqual(rank().map(t=>t.id),coin);
assert.throws(()=>readLeagueSettings({...defaults,tiePointRatio:1}));assert.throws(()=>readLeagueSettingsForm({rule_tieHeadToHead:'0'}));
state=validateCareerData(fresh(defaultTeams().slice(0,4),2));const baseline=JSON.stringify(leagueRules());await saveStandingsTiebreakers({preventDefault(){},target:{rule_tieHeadToHead:'0',rule_tiePointRatio:'1'}});assert.equal(leagueRules().tiePointRatio,1);assert.equal(leagueRules().tieHeadToHead,0);state=validateCareerData(copy(state));assert.equal(leagueRules().tiePointRatio,1);
save=async()=>false;await saveStandingsTiebreakers({preventDefault(){},target:{rule_tiePointRatio:'0'}});assert.equal(leagueRules().tiePointRatio,1);save=async()=>true;
const old=copy(state);for(const [key] of TIEBREAKERS)delete old.leagueSettings[key];state=validateCareerData(old);assert.equal(leagueRules().tieHeadToHead,1);assert(standings().includes('Tiebreaker settings'));assert(!standings(true).includes('Tiebreaker settings'));
setupDraft=makeDraft();setupPage='settings';renderSetup();assert(document.getElementById('app').innerHTML.includes('rule_tiePointRatio'));assert.equal(presetPayload('settings').leagueSettings.tieHeadToHead,1);
console.log('PASS: head-to-head, division winner, division/conference records, scoring metrics, multi-team ordering, stable coin toss, missing history, unique priorities, locking, rollback, save migration and new-career controls.');
})()`,context);})().catch(e=>{console.error(e);process.exitCode=1});
