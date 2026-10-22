const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){this.open=true},close(){this.open=false},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={FormData:class{constructor(target){return Object.entries(target)}},console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};
const draft=makeDraft();draft.teams=defaultTeams().slice(0,6);draft.meetings=2;draft.gmName='Watch Test';state=validateCareerData(buildSetupCareer(draft));
for(const [i,p] of state.teams.flatMap(t=>t.roster).entries())if(i<12)p.bio.debutYear=state.year-i%2;
await runAllStarEvent('rising',true);assert(allStarSimulationPaused());assert.equal(allStarPlayback,null);await confirmAllStarSelections(true);
const visibleBefore=scheduleVisibleRows;scheduleVisibleRows=rows=>rows;
let scheduleHTML=scheduleRowsWithEvents([],state.day+1);
for(const key of ['rising','three','dunk','skills','game'])for(const watch of [false,true])assert(scheduleHTML.includes("runAllStarEvent('"+key+"',"+watch+")"));
assert.equal((scheduleHTML.match(/>Watch live</g)||[]).length,5);scheduleVisibleRows=visibleBefore;
assert(allStarEventsMarkup().includes('Watch live'));assert(allStarEventsMarkup().includes('>Simulate<'));
for(const key of ['rising','three','dunk','skills','game']){
 await runAllStarEvent(key,true);assert(allStarPlayback);assert.equal(allStarPlayback.index,0);assert(allStarPlayback.lines.length>0);assert(!document.getElementById('profile').innerHTML.includes(escapeHTML(allStarPlayback.summary)));
 const saved=JSON.stringify(state);setAllStarPlaybackSpeed(8);await new Promise(r=>setTimeout(r,150));assert(allStarPlayback.index>0);toggleAllStarPlayback();assert(allStarPlayback.paused);setAllStarPlaybackSpeed(4);assert.equal(allStarPlayback.speed,4);finishAllStarPlayback();assert(document.getElementById('profile').innerHTML.includes(escapeHTML(allStarPlayback.summary)));assert.equal(JSON.stringify(state),saved);closeTitleModal();assert.equal(allStarPlayback,null);
 await runAllStarEvent(key,false);assert.equal(JSON.stringify(state),saved);
}
assert.equal(state.day,seasonMilestones().end);assert.equal(state.allStarEvents.results.length,5);
state=validateCareerData(copy(state));assert(state.allStarEvents.results.find(e=>e.key==='rising').playByPlay.length);assert(state.allStarEvents.results.find(e=>e.key==='game').playByPlay.length);assert(allStarEventsMarkup().includes('Watch replay'));scheduleVisibleRows=rows=>rows;assert.equal((scheduleRowsWithEvents([],state.day+1).match(/>Watch replay</g)||[]).length,5);scheduleVisibleRows=visibleBefore;
const prior=copy(state);state.allStarEvents.results=[];delete state.allStarReport;save=async()=>false;await runAllStarEvent('three',true);assert.equal(state.allStarEvents.results.length,0);assert.equal(allStarPlayback,null);save=async()=>true;state=prior;
const before=JSON.stringify(state);await runAllStarEvent('invalid',true);assert.equal(JSON.stringify(state),before);allStarEventBusy=true;await runAllStarEvent('three',true);assert.equal(allStarPlayback,null);allStarEventBusy=false;
state.leagueSettings.dunkEnabled=false;await runAllStarEvent('dunk',true);assert.equal(allStarPlayback,null);
console.log('PASS: all five event actions, no spoiler playback, controls/cleanup, save-reload, no rerolls or club stats, failed-save rollback, invalid/disabled/busy guards.');
})()`,context)})().catch(e=>{console.error(e);process.exitCode=1});
