const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
updateWatchShell=(dialog,html)=>{dialog.innerHTML=html};
state=fresh(defaultTeams(),82);const pair=state.schedule[0].find(p=>p.includes(0));const g=simulateAttributeGame(...pair);
assert(g.boxTimeline.length>100);assert.equal(g.boxTimeline.length,g.playByPlay.length);
const accumulated=g.box.map(p=>Object.fromEntries(LIVE_BOX_KEYS.map(k=>[k,0])));
for(let i=0;i<g.boxTimeline.length;i++){
 const frame=g.boxTimeline[i];for(let j=0;j<frame.length;j+=3)accumulated[frame[j]][LIVE_BOX_KEYS[frame[j+1]]]=frame[j+2];
 const score=watchFrame(g,i+1);for(const [side,id] of [g.a,g.b].entries())assert.equal(accumulated.reduce((n,p,j)=>n+(g.box[j].team===state.teams[id].abbr?p.pts:0),0),side===0?score.a:score.b,'scoreboard and live points agree for every event');
}
for(let i=0;i<g.box.length;i++)for(const k of LIVE_BOX_KEYS)assert.equal(accumulated[i][k],g.box[i][k],'final live stat matches saved box');
assert(watchBoxRows(g,0).every(p=>LIVE_BOX_KEYS.filter(k=>k!=='onCourt').every(k=>p[k]===0)));
const halfway=watchBoxRows(g,Math.floor(g.playByPlay.length/2));assert(halfway.reduce((n,p)=>n+p.pts,0)<g.sa+g.sb);
const bad=m=>{throw Error(m)};assert.deepEqual(readBoxTimeline(g,bad),g.boxTimeline);
assert.throws(()=>readBoxTimeline({...g,boxTimeline:[[999,0,1]]},bad));
const legacy={...g};delete legacy.boxTimeline;assert.equal(watchBoxRows(legacy,1),null);assert.deepEqual(watchBoxRows(legacy,g.playByPlay.length),g.box);
liveWatch={result:g,index:5,paused:true,speed:1};renderWatchGame();assert(document.getElementById('game-watch').innerHTML.includes('Live box score'));
const saved=JSON.stringify(g);finishWatchGame();assert(document.getElementById('game-watch').innerHTML.includes('Final box score'));assert.equal(JSON.stringify(g),saved);
state.history=[g];showResult(0);assert(document.getElementById('profile').innerHTML.includes('Final box score'));assert(document.getElementById('profile').innerHTML.includes('3PT'));
const button=watchGameButton(g.day,[g.a,g.b],g);assert(button.includes('View results'));assert(!button.includes('Replay'));assert(button.includes('viewScheduledResults'));
const beforeResults=JSON.stringify(state);viewScheduledResults(g.day,g.a,g.b);const resultHTML=document.getElementById('profile').innerHTML;assert(resultHTML.includes(g.sa+' : '+g.sb));assert(resultHTML.includes('Final box score'));assert(g.box.every(p=>resultHTML.includes(escapeHTML(p.name))));assert.equal(JSON.stringify(state),beforeResults);
const withoutFeed={...g,playByPlay:[]};assert(watchGameButton(g.day,[g.a,g.b],withoutFeed).includes('View results'));
console.log('PASS: every live score and final stat, zero/partial/legacy frames, timeline validation, automatic final box and simulation result tables.');
`,context);
