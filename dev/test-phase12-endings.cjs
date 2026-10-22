/* Synthetic starting-score fixtures. Outcomes use production shot mechanics;
 * these are NOT completed game samples or saved career records. */
const fs=require('fs'),assert=require('assert/strict'),{loadLeague}=require('./load-league.cjs');
const league=process.argv[2]||'nba',variant=process.argv[3]||'production';
const l=loadLeague({seed:818,strictDOM:false,sourceTransform:(name,s)=>{
 s=require('./phase12/variant.cjs')(name,s);s=require('./phase5-instrument.cjs')(name,s);
 if(name.split('?')[0]!=='attributes.js')return s;
 const rep=(a,b)=>{assert(s.includes(a),a);s=s.replace(a,b)};
 rep('for(let minute=0;minute<gameMinutes()-Math.min(2,gameMinutes());minute++)runMinute(minute,Math.floor((minute+1)*possessions/48)-Math.floor(minute*possessions/48));', `runMinute(0,1);scores[0]=100+globalThis.ending.margin;scores[1]=100;dispatchSide=globalThis.ending.ball;globalThis.p10AdvanceEligible=globalThis.ending.advance?0:null;globalThis.p10timeoutCount=0;summaryEvents.length=0;featActions.length=0;globalThis.endingUsed=false;globalThis.p5slots=[];`);
 rep('liveClockEnd=end;elapsedSeconds=start;', `if(end===gameMinutes()*60)start=end-globalThis.ending.seconds;liveClockEnd=end;elapsedSeconds=start;`);
 rep('dispatchSide=side;liveClockEnd=null;', `if(end===gameMinutes()*60)globalThis.regulationEnding={score:[...scores],events:featActions.map(e=>({...e})),slots:globalThis.p5slots.map(s=>({...s}))};dispatchSide=side;liveClockEnd=null;`);
 rep('function possessionCore(side){', `function possessionCore(side){
 if(liveClockEnd!==null&&!globalThis.endingUsed&&['orb','ft'].includes(globalThis.ending.mode)){
  globalThis.endingUsed=true;const p=choose(clubs[side],'ft');
  const original=selectBasketballRebound;let used=false;
  selectBasketballRebound=(off,def,active,allow,court)=>{if(!used){used=true;return {offensive:true,player:off.roster.find(q=>active(off,q))}}return original(off,def,active,allow,court)};
  try{if(globalThis.ending.mode==='orb'){machine.transition('shot');rows.get(p.id).fga++;trackShot({kind:'inside'},false);machine.transition('miss');featAction('miss',side,p,2);finishRebound(side);}else{machine.transition('foul');const rnd=Math.random;let first=true;Math.random=()=>{if(first){first=false;return 1}return rnd()};try{freeThrows(side,p,1)}finally{Math.random=rnd}}}finally{selectBasketballRebound=original}
  return;
 }
 `);
 return s;
}});l.context.league=league;l.context.assert=assert;l.run(require('./feat-fixture.cjs'));
l.run(`d.year=league==='nba'?2025:2024;d.leagueGender=league==='nba'?'male':'female';var hp=historicalPlan(league,d.year,setupLeagueRules(d),d.cap,defaultTeams());d.cap=hp.cap;d.leagueSettings={...d.leagueSettings,...hp.rules,seasonGames:10,divisionGames:0,conferenceGames:10,playoffFormat:'top4',splitPlayoffs:false,firstRoundByes:0};state=buildSetupCareer(d);var fixture=copy(state);`);
const cases=[['tie_60',0,60,null,0,false],['tie_30',0,30,null,0,false],['tie_20',0,20,null,0,false],['down2_30',-2,30,null,0,false],['down2_10',-2,10,null,0,false],['down4_60_defend',-4,60,null,1,false],['down4_30_defend',-4,30,null,1,false],['down6_60_defend',-6,60,null,1,false],['down6_30_defend',-6,30,null,1,false],['down2_15_advance',-2,15,null,0,true],['down3_15_advance',-3,15,null,0,true]];
const output=`dev/phase12/endings-${league}-${variant}.json`;const report=fs.existsSync(output)?JSON.parse(fs.readFileSync(output)):[];const lock=output+'.lock';try{fs.mkdirSync(lock)}catch(e){if(e.code==='EEXIST')process.exit(0);throw e;}process.on('exit',()=>fs.rmdirSync(lock));
for(const [name,margin,seconds,mode,ball,advance]of cases.filter(c=>c[0].startsWith('tie_'))){
 const expectedSamples=name==='tie_60'?2000:1000;
 if(process.env.CASE && name!==process.env.CASE)continue;
 if(report.some(r=>r.name===name&&r.samples.length===expectedSamples))continue;
 const samples=[];
 for(let i=0;i<expectedSamples;i++){
  l.context.ending={margin,seconds,mode,ball,advance};
  const g=l.run(`state=copy(fixture);simulationExecution.mode='headless';globalThis.p5slots=[];globalThis.p5shots=[];if(${i%2}===1)for(const t of state.teams)for(const p of t.roster)p.attributes.tp=Math.max(35,p.attributes.tp-12);Math.random=scheduleRandom(${70000+i});play(0,1)`);
  const r=l.run('regulationEnding'),end=g.gameRules.periodMinutes*g.gameRules.gamePeriods*60;
  let last=end-seconds;
  for(const e of r.events){assert(e.timeMs>=last*1000-.01);assert(e.timeMs<=end*1000);last=e.timeMs/1000;}
  for(const slot of r.slots){assert(slot.finish>=slot.start);assert(slot.finish<=end);}
  const attempts=r.events.filter(e=>e.type==='score'||e.type==='miss'),field=attempts.filter(e=>e.value>=2),three=field.filter(e=>e.value===3),ours=field.filter(e=>e.side===0);
  if(name==='I')assert(g.summaryData.periods>g.gameRules.gamePeriods);
  if(seconds===5&&margin===-3)assert(ours.length===0||ours[0].value===3);
  samples.push({slots:r.slots.map(s=>({side:s.side,start:s.start,finish:s.finish,before:s.before,after:s.after})),timeouts:l.run('globalThis.p10timeoutCount||0'),firstShotRemaining:ours.length?(end-ours[0].timeMs/1000):null,seed:70000+i,lowerShooting:i%2===1,regulation:r.score,final:[g.sa,g.sb],ot:g.summaryData.periods>g.gameRules.gamePeriods,fieldGoals:field.length,threes:three.length,ourAttempts:ours.length,ourMade:ours.filter(e=>e.type==='score').length,ourThree:ours.filter(e=>e.value===3).length,ft:attempts.filter(e=>e.value===1).length,turnovers:r.slots.filter(s=>s.trace.includes('turnover')).length,offensiveRebounds:r.events.filter(e=>e.type==='offensiveRebound').length,tyingScores:r.events.filter(e=>e.type==='score'&&e.score[0]===e.score[1]).length});
 }
 report.push({name,margin,seconds,mode,samples});console.log(league,name,'PASS',samples.length);
 fs.writeFileSync(`dev/phase12/endings-${league}-${variant}.json`,JSON.stringify(report));
}
console.log('PASS synthetic ending timing, scoring choices, rebounds, free throws and overtime initiation');
