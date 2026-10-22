const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
render=()=>{};save=async()=>true;showResult=()=>{};toast=()=>{};
state=validateCareerData(fresh(defaultTeams().slice(0,4),2));
const offense=team(),defense=state.teams[1],handler=offense.roster[0],screener=offense.roster[1],onBall=defense.roster[0],big=defense.roster[1],defenders=defense.roster.slice(0,5);
for(const p of [...offense.roster,...defense.roster]){for(const k of ATTRIBUTE_KEYS)p.attributes[k]=75;for(const k of TENDENCY_KEYS)p.tendencies[k]=70}
const originalRandom=Math.random,originalScreen=pnrScreen,originalCoverage=pnrCoverageWeights,originalActions=pnrActionWeights;
assert.equal(pnrScreen(screener,onBall,70,()=>0).quality,'illegal');
screener.attributes.stre=screener.attributes.oiq=99;onBall.attributes.per=onBall.attributes.spd=30;assert.equal(pnrScreen(screener,onBall,70,()=>.5).quality,'excellent');
screener.attributes.stre=screener.attributes.oiq=30;onBall.attributes.per=onBall.attributes.spd=99;assert.equal(pnrScreen(screener,onBall,70,()=>.5).quality,'soft');
for(const p of [handler,screener,onBall,big])for(const k of ATTRIBUTE_KEYS)p.attributes[k]=75;
const screen={quality:'excellent',boost:14,edge:20};
assert(pnrActionWeights(handler,screener,onBall,big,'drop',screen).pullup>pnrActionWeights(handler,screener,onBall,big,'blitz',screen).pullup);
screener.attributes.tp=69;assert.equal(pnrActionWeights(handler,screener,onBall,big,'drop',screen).pop,0);screener.attributes.tp=90;
const baseline=JSON.stringify([...offense.roster,...defense.roster].map(p=>p.attributes));
function run(coverage,choice,random=()=>.99){
 pnrScreen=()=>screen;pnrCoverageWeights=()=>Object.fromEntries(PNR_COVERAGES.map(k=>[k,+(k===coverage)]));pnrActionWeights=()=>Object.fromEntries(['pullup','drive','roll','pop'].map(k=>[k,+(k===choice)]));Math.random=random;
 const machine=createPossessionMachine();machine.transition('decision');const events=[],turnovers=[];
 const result=playPickAndRoll(handler,screener,onBall,big,offense,defense,defenders,{machine,recordTurnover:(type,p,d)=>{machine.transition('turnover');turnovers.push({type,p,d})}},s=>events.push(s));return {result,events,turnovers,machine};
}
for(const coverage of PNR_COVERAGES)for(const choice of ['pullup','drive','roll','pop']){const r=run(coverage,choice);assert(r.result);assert.equal(r.machine.phase,'shot');assert.equal(r.result.pickAndRoll.choice,choice);assert(defenders.some(d=>d.id===r.result.defenderId));assert.equal(r.result.lastPasser?.id,['roll','pop'].includes(choice)?handler.id:undefined);assert.equal(r.result.p.id,['roll','pop'].includes(choice)?screener.id:handler.id);assert.equal(r.result.shotOverride.kind,choice==='pop'?'three':choice==='pullup'?'mid':'inside');assert(r.events.some(t=>t.includes('Pick-and-roll')))}
assert.equal(JSON.stringify([...offense.roster,...defense.roster].map(p=>p.attributes)),baseline);
big.attributes.rim=30;const weakRim=run('drop','drive').result.pickAndRoll.shotAdjustment;big.attributes.rim=99;const strongRim=run('drop','drive').result.pickAndRoll.shotAdjustment;assert(weakRim>strongRim);big.attributes.rim=75;
const illegalMachine=createPossessionMachine();illegalMachine.transition('decision');let illegalCredit=null;pnrScreen=()=>({quality:'illegal'});assert.equal(playPickAndRoll(handler,screener,onBall,big,offense,defense,defenders,{machine:illegalMachine,recordTurnover:(type,p,d)=>{illegalCredit={type,id:p.id,steal:d};illegalMachine.transition('turnover')}},()=>{}),null);assert.equal(illegalCredit.type,'illegalScreen');assert.equal(illegalCredit.id,screener.id);assert.equal(illegalCredit.steal,undefined);

assert.equal(run('blitz','roll',()=>0).turnovers[0].type,'lostBall');assert.equal(run('hedge','roll',()=>0).turnovers[0].type,'badPass');
let draws=[.5,.5,.5,.99,0];const catchFailure=run('hedge','roll',()=>draws.shift()??.99);assert.equal(catchFailure.turnovers[0].type,'lostBallOut');assert.equal(catchFailure.turnovers[0].p.id,screener.id);
pnrScreen=originalScreen;pnrCoverageWeights=originalCoverage;pnrActionWeights=originalActions;Math.random=originalRandom;
// Real games exercise the integration, foul/turnover accounting, assists and saved feeds.
let pnrGames=0,totalPicks=0,illegalScreens=0;
for(let i=0;i<24;i++){
 state=validateCareerData(fresh(defaultTeams().slice(0,4),2));watchCapture={day:1,a:0,b:1};const attributes=JSON.stringify(state.teams.map(t=>t.roster.map(p=>p.attributes)));const g=play(0,1);watchCapture=null;
 assert.equal(JSON.stringify(state.teams.map(t=>t.roster.map(p=>p.attributes))),attributes);
 const picks=g.playByPlay.filter(s=>s.includes('Pick-and-roll:')).length;totalPicks+=picks;if(picks)pnrGames++;illegalScreens+=g.playByPlay.filter(s=>s.includes('Illegal Screen')).length;
 for(const [id,score] of [[0,g.sa],[1,g.sb]]){const rows=g.box.filter(p=>p.team===state.teams[id].abbr);assert.equal(rows.reduce((n,p)=>n+p.pts,0),score);assert(rows.reduce((n,p)=>n+p.ast,0)<=rows.reduce((n,p)=>n+p.fgm,0));for(const r of rows){assert.equal(r.pts,r.fgm*2+r.tpm+r.ftm);assert(r.fgm<=r.fga);assert(r.tpm<=r.tpa);assert(r.ftm<=r.fta);assert(r.pf<=6);if(!r.played)assert.equal(r.pts+r.tov+r.ast+r.pf,0)}}
 assert.equal(g.boxTimeline.length,g.playByPlay.length);const final=watchFrame(g,g.playByPlay.length);assert.equal(final.a,g.sa);assert.equal(final.b,g.sb);
 const live=watchBoxRows(g,g.playByPlay.length);for(let j=0;j<live.length;j++)for(const key of ['pts','ast','tov','pf','stl','fgm','fga'])assert.equal(live[j][key],g.box[j][key]);
}
assert.equal(pnrGames,24);assert(totalPicks>100);
state=validateCareerData(fresh(defaultTeams().slice(0,4),2));sim(1);const loaded=validateCareerData(copy(state));assert.deepEqual(loaded.history.map(g=>g.playByPlay),state.history.map(g=>g.playByPlay));
console.log('PASS: 16 coverage/action branches, screening ratings, legacy ratings, trap/interception/catch failures, no rating mutation, 24 games, score/assist/foul/turnover/live-box consistency, save round trip. PnR possessions:',totalPicks,'illegal screens:',illegalScreens);
`,context);
