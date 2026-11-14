// Timeouts: rules (NBA since 2017–18: 7, 4 into the fourth, 2 after its 3:00 mark, 2 per overtime; mandatory at the
// first stoppage past 7:00 and 3:00 charged home then away unless a team called one), era/WNBA presets, effects (rest,
// final-play shot bonus), coach reasons in the play-by-play, counters, and limits never exceeded in real games.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:21,strictDOM:false});l.setRandomSeed(21);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='TO';state=validateCareerData(buildSetupCareer(d));`);
// 1. Settings and presets.
const r=run('leagueRules()');assert.deepEqual([r.timeoutsPerGame,r.timeoutsFourthMax,r.timeoutsLateMax,r.timeoutsLateWindow,r.timeoutsOvertime,r.mandatoryTimeouts],[7,4,2,3,2,'two'],'NBA defaults');
const preset=(lg,y)=>run(`(p=>[p.timeoutsPerGame,p.timeoutsFourthMax,p.timeoutsLateMax,p.timeoutsLateWindow,p.timeoutsOvertime,p.mandatoryTimeouts])(historicalPreset('${lg}',${y}).rules)`);
assert.deepEqual(preset('nba',2024),[7,4,2,3,2,'two']);assert.deepEqual(preset('nba',2017),[9,9,3,2,2,'two'],'2016–17 (before the change)');assert.deepEqual(preset('nba',2018),[7,4,2,3,2,'two'],'2017–18');assert.deepEqual(preset('wnba',2024),[5,5,2,3,2,'wnba']);
assert.equal(run("readLeagueSettings({},state).timeoutsPerGame"),7,'old saves get the defaults');assert.throws(()=>run("readLeagueSettings({timeoutsPerGame:40},state)"));assert.throws(()=>run("readLeagueSettings({mandatoryTimeouts:'x'},state)"));
console.log('PASS settings: NBA 2017–18+ 7/4/2/2, earlier 9 with 3 in the last 2:00, WNBA 5 with 1/2/1/2 mandatory; old saves default');
// 2. Allotment limits through a game clock.
const lim=run(`(()=>{const to=timeoutGameState(0),q=12*60,out={};out.start=timeoutAvailable(to,0,0)&&to.remaining[0];for(let i=0;i<6;i++)timeoutCharge(to,0,'run',60);out.afterSix=to.remaining[0];
 const t2=timeoutGameState(0);timeoutSync(t2,3*q+1);out.intoFourth=t2.remaining[0];timeoutSync(t2,4*q-3*60+1);out.after3=t2.remaining[0];timeoutSync(t2,4*q+1);out.ot=t2.remaining[0];
 const t3=timeoutGameState(0);timeoutSync(t3,3*q+60);out.fourthEarly=t3.remaining[0];return out})()`);
assert.deepEqual(lim,{start:7,afterSix:1,intoFourth:4,after3:2,ot:2,fourthEarly:4});
console.log('PASS limits: 7 per game, 4 carried into the fourth, 2 after its 3:00 mark, 2 fresh in overtime');
// 3. Mandatory timeouts.
const man=run(`(()=>{const out=[],q=12*60,to=timeoutGameState(0);timeoutSync(to,1);
 out.push(timeoutMandatoryDue(to,q-450,true));            // 7:30 left: not yet
 out.push(timeoutMandatoryDue(to,q-410,false));           // 6:50 left, no stoppage: wait
 out.push(timeoutMandatoryDue(to,q-390,true));            // 6:30 left, first stoppage: charged to home (side 0)
 out.push(timeoutMandatoryDue(to,q-160,true));            // 2:40 left: charged to the other team
 const t2=timeoutGameState(0);timeoutSync(t2,q+1);timeoutCharge(t2,1,'run',q+60);out.push(timeoutMandatoryDue(t2,2*q-390,true)); // 6:30 left; away called one before 7:00: satisfied
 out.push(timeoutMandatoryDue(t2,2*q-160,true));             // 2:40 left: charged to the team not previously charged (home)
 out.push([to.remaining,t2.remaining,to.mandatory.taken]);return out})()`);
assert.equal(man[0],null);assert.equal(man[1],null);assert.deepEqual(man[2],{side:0,charged:true});assert.deepEqual(man[3],{side:1,charged:true});assert.equal(man[4],null,'team timeout satisfies the mandatory');assert.deepEqual(man[5],{side:0,charged:true});
assert.deepEqual(man[6],[[6,6],[6,6],2]);
assert.deepEqual(run("[timeoutMandatoryMarks(0),timeoutMandatoryMarks(4)].map(m=>m.length)"),[2,0],'none in overtime');
l.run("state.leagueSettings.mandatoryTimeouts='wnba'");assert.deepEqual(run("[0,1,2,3].map(p=>timeoutMandatoryMarks(p).length)"),[1,2,1,2]);l.run("state.leagueSettings.mandatoryTimeouts='none'");assert.equal(run('timeoutMandatoryMarks(1).length'),0);l.run("state.leagueSettings.mandatoryTimeouts='two'");
console.log('PASS mandatory: first stoppage past 7:00 charged home, past 3:00 charged away, a team timeout satisfies it, WNBA 1/2/1/2, none in overtime');
// 4. Effects: rest on the floor, final-play shot bonus for that team only.
const eff=run(`(()=>{const rt={court:new Set([1,2]),stamina:new Map([[1,60],[2,98],[3,50]])};timeoutRest([rt]);timeoutShotBoost={side:1};const boosted=shotMakeProbability(.5,{kind:'mid'},null,1),other=shotMakeProbability(.5,{kind:'mid'},null,0);timeoutShotBoost=null;return {s:[...rt.stamina.values()],boosted,other,plain:shotMakeProbability(.5,{kind:'mid'},null,1)}})()`);
assert.deepEqual(eff.s,[64,100,50],'+4 energy on the floor, capped, bench unchanged');assert(eff.boosted>eff.other&&Math.abs(eff.boosted/eff.plain-1.04)<1e-9&&eff.other===eff.plain,'4% shot bonus for the team that drew up the play');
console.log('PASS effects: +4 energy for players on the floor; 4% shot-quality bonus on a drawn-up play');
// 5. Real games: limits never exceeded, reasons in the play-by-play, counters.
const games=run(`(()=>{const out=[];for(let i=0;i<24;i++){const a=i%2?0:1+i%9,b=i%2?2+i%7:0;const g=play(a,b);out.push({stats:g.timeoutStats,pbp:g.playByPlay.filter(e=>/timeout/i.test(e)).map(e=>e.replace(/^\\[[^\\]]*\\] /,'')),periods:g.summaryData.periods,abbr:[state.teams[a].abbr,state.teams[b].abbr]})}return out})()`);
const reasons=new Set();let total=0;
for(const g of games){const ot=g.periods-4;
 for(const [side,s] of g.stats.teams.entries()){const used=s.called+s.mandatory;total+=used;assert(used<=7+2*ot,'never more than the allotment: '+used);assert(s.unused>=0);
  const reg=s.byPeriod.slice(0,3).reduce((n,x)=>n+x,0);assert(reg+(s.byPeriod[3]||0)<=7,'regulation team timeouts within 7');
  const lines=g.pbp.filter(e=>e.includes(' · '+g.abbr[side]+' · ')),q4=lines.filter(e=>/^Q4 /.test(e)),late=q4.filter(e=>{const m=/^Q4 (\d+):(\d+)/.exec(e);return m&&+m[1]*60+ +m[2]<180});
  assert(q4.length<=4,g.abbr[side]+' used '+q4.length+' in Q4');assert(late.length<=2,g.abbr[side]+' used '+late.length+' after 3:00 of Q4: '+late.join(' | '))}
 for(const e of g.pbp){const m=/calls timeout (.*)\.$/.exec(e)||/(Mandatory timeout)/.exec(e);assert(m,'timeout line has a reason: '+e);reasons.add(m[1].replace(/\d+/g,'N'))}}
assert(total/(games.length*2)>3&&total/(games.length*2)<7,'timeouts per team-game '+(total/(games.length*2)).toFixed(2));
for(const want of ['Mandatory timeout']) assert([...reasons].some(x=>x.startsWith(want)),want);assert([...reasons].some(x=>/^to stop an? N-N run$/.test(x)),'run timeouts: '+[...reasons].join(', '));
const sum=k=>games.reduce((n,g)=>n+g.stats.teams.reduce((m,s)=>m+s.byReason[k],0),0),counted=games.reduce((n,g)=>n+g.stats.teams.reduce((m,s)=>m+s.called,0),0);
assert.equal(['run','fatigue','sloppy','clock','advance','finalPlay','lastShot'].reduce((n,k)=>n+sum(k),0),counted,'reasons add up to team timeouts');
console.log('PASS real games:',(total/(games.length*2)).toFixed(2),'timeouts per team-game; Q4 ≤4 and ≤2 after 3:00; reasons:',[...reasons].join(' | '));
