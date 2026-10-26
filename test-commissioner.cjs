// Commissioner mode: save field, team control and AI protection, forced results, trade review, draft
// rigging, schedule edits/regeneration (saves still load), player and award editing, settings panel.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
(async()=>{
const l=loadLeague({seed:71,strictDOM:false});l.setRandomSeed(71);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Commish';state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';`);
const roundTrip=`validateCareerData(JSON.parse(JSON.stringify(state)))`;
// 1. Off by default; panel offers to enable; enabling marks the save; the field survives save/load.
assert.equal(run('state.commissioner'),undefined);assert.match(run('settingsView()'),/Enable commissioner mode/);
l.run(`Object.assign(commissioner(),{enabled:true,everUsed:true})`);
for(const tab of ['teams','players','schedule','draft','awards','trades'])assert.match(run(`(commissionerUI.tab='${tab}',settingsView())`),/Commissioner mode<\/h2><span>On/,tab);
assert.deepEqual(run(`${roundTrip}.commissioner`),run('state.commissioner'));
for(const bad of [`{...state.commissioner,enabled:'yes'}`,`{...state.commissioner,managedTeams:[99]}`,`{...state.commissioner,forcedGames:{'1:0-1':5}}`])
 assert.throws(()=>run(`validateCareerData({...JSON.parse(JSON.stringify(state)),commissioner:${bad}})`),/commissioner|forced/i,bad);
// 2. Team control: act as any team; managed teams are skipped by AI roster moves, AI trades and CPU FA offers.
const own=run('controlledTeamId()');l.run(`commissioner().activeTeam=5;commissioner().managedTeams=[7,8];`);
assert.equal(run('controlledTeamId()'),5);assert.equal(run('team().id'),5);
assert.deepEqual(run(`cpuRosterClubs().filter(t=>[5,7,8].includes(t.id)).length`),0);
assert.equal(run(`[5,7,8].every(id=>aiTradeCoolingDown(state.teams[id]))&&!aiTradeCoolingDown(state.teams[9])`),true);
l.run(`commissioner().enabled=false`);assert.equal(run('controlledTeamId()'),own,'turning it off returns control');assert(run(`cpuRosterClubs().some(t=>t.id===7)`));
l.run(`Object.assign(commissioner(),{enabled:true,activeTeam:null,managedTeams:[]})`);
// 3. Forced results: the chosen team wins; each game is recorded once with a consistent box score.
const forced=run(`(()=>{const out=[];for(let i=0;i<12;i++){const a=i%15*2,b=i%15*2+1,want=i%2?a:b;commissioner().forcedGames[state.day+':'+a+'-'+b]=want;const before=state.teams[a].w+state.teams[a].l+state.teams[b].w+state.teams[b].l,hist=state.history.length;const g=play(a,b);out.push({ok:g.winner===want,once:state.teams[a].w+state.teams[a].l+state.teams[b].w+state.teams[b].l===before+2&&state.history.length===hist+1,box:g.box.reduce((n,p)=>n+p.pts,0)===g.sa+g.sb});delete commissioner().forcedGames[state.day+':'+a+'-'+b]}return out})()`);
assert(forced.every(f=>f.ok&&f.once&&f.box),JSON.stringify(forced));
const attrsBefore=run('JSON.stringify(state.teams[3].roster.map(p=>withBasketballAttributes(p).attributes))');
const always=run(`(()=>{commissioner().alwaysWin=[3];let wins=0;for(let i=0;i<8;i++){const opp=(i%14)*2+4;wins+=play(opp,3).winner===3}commissioner().alwaysWin=[];return wins})()`);
assert.equal(always,8,'always-win team wins every game');
assert.equal(run('JSON.stringify(state.teams[3].roster.map(p=>p.attributes))'),attrsBefore,'temporary boosts are removed');
// 4. Trade review: AI trades wait; approve executes; veto leaves rosters alone; stale trades expire.
const trade=run(`(()=>{commissioner().tradeReview=true;const a=state.teams[10],b=state.teams[11],pa=a.roster[3],pb=b.roster[3];aiTradeExecute(a,b,{out:[pa],into:[pb],outPicks:[],inPicks:[]});const queued=commissioner().pendingTrades.length,untouched=a.roster.includes(pa)&&b.roster.includes(pb);
 const msg=commissionerReviewTrade(commissioner().pendingTrades[0].id,true);const done=a.roster.includes(pb)&&b.roster.includes(pa);
 aiTradeExecute(a,b,{out:[a.roster[4]],into:[b.roster[4]],outPicks:[],inPicks:[]});const x=a.roster[4],y=b.roster[4];commissionerReviewTrade(commissioner().pendingTrades[0].id,false);
 return {queued,untouched,msg,done,vetoKept:a.roster.includes(x)&&b.roster.includes(y),empty:commissioner().pendingTrades.length===0}})()`);
assert.deepEqual(trade,{queued:1,untouched:true,msg:'Trade approved.',done:true,vetoKept:true,empty:true});
assert.match(run(`(()=>{const a=state.teams[12],b=state.teams[13];aiTradeExecute(a,b,{out:[a.roster[2]],into:[b.roster[2]],outPicks:[],inPicks:[]});a.roster.splice(2,1);return commissionerReviewTrade(commissioner().pendingTrades[0].id,true)})()`),/can no longer be completed/);
l.run(`commissioner().tradeReview=false`);
// The ad-hoc games above were not on the schedule; reset records so saves check against season progress.
l.run(`state.teams.forEach(t=>{t.w=0;t.l=0});state.history=[];`);
// 5. Schedule edits on future days; an edited 82-game season still loads; forced games move with their game.
const sch=run(`(()=>{const day=state.day+2,pair=[...state.schedule[day][0]];commissionerScheduleEdit('force',{day,index:0,winner:String(pair[1])});commissionerScheduleEdit('swap',{day,index:0});const swapped=state.schedule[day][0].join()===[pair[1],pair[0]].join();
 const to=state.schedule.findIndex((r,k)=>k>day&&!commissionerBreakDay(k)&&!r.some(p=>p.includes(pair[0])||p.includes(pair[1])));const brk=state.schedule.findIndex((r,k)=>commissionerBreakDay(k));let breakBlocked=brk<0;try{commissionerScheduleEdit('move',{day,index:0,to:brk})}catch(e){breakBlocked=/All-Star break/.test(e.message)}commissionerScheduleEdit('force',{day,index:0,winner:String(pair[1])});commissionerScheduleEdit('move',{day,index:0,to});const moved=state.schedule[to].some(p=>p.join()===[pair[1],pair[0]].join())&&commissioner().forcedGames[to+':'+pair[1]+'-'+pair[0]]===pair[1];
 let past=false;try{commissionerScheduleEdit('swap',{day:state.day-1,index:0})}catch(e){past=/not been played/.test(e.message)}
 let clash=false;try{const r=state.schedule[day+1];commissionerScheduleEdit('add',{day:day+1,home:r[0][0],away:r[1][0]})}catch(e){clash=/already plays/.test(e.message)}
 return {swapped,moved,past,clash,breakBlocked,flag:commissioner().scheduleEdited}})()`);
assert.deepEqual(sch,{swapped:true,moved:true,past:true,clash:true,breakBlocked:true,flag:true});
assert.doesNotThrow(()=>run(`${roundTrip}.schedule.length`),'an edited 82-game schedule still loads');
// Reshuffle mid-season: same remaining matchups, nobody twice in a day, played days untouched.
for(let i=0;i<3;i++)await l.run('simulateDayHeadless()');
const re=run(`(()=>{const played=JSON.stringify(state.schedule.slice(0,state.day)),key=r=>r.flat().length?r.map(p=>p.join('-')).sort().join(','):'',before=state.schedule.slice(state.day).flatMap(r=>r.map(p=>p.join('-'))).sort().join();const msg=commissionerRegenerateSchedule();const after=state.schedule.slice(state.day).flatMap(r=>r.map(p=>p.join('-'))).sort().join();
 return {msg,same:before===after,played:JSON.stringify(state.schedule.slice(0,state.day))===played,oncePerDay:state.schedule.every(r=>new Set(r.flat()).size===r.flat().length),breakEmpty:state.schedule.every((r,k)=>!commissionerBreakDay(k)||!r.length)}})()`);
assert(re.same&&re.played&&re.oncePerDay&&re.breakEmpty,JSON.stringify(re));assert.doesNotThrow(()=>run(`${roundTrip}.day`));
// Preseason regeneration builds a fresh, fully valid schedule (no edit flag).
const pre=run(`(()=>{const s=JSON.parse(JSON.stringify(state));const x=makeDraft();x.gmName='Pre';state=validateCareerData(buildSetupCareer(x));const old=JSON.stringify(state.schedule);state.commissioner={...s.commissioner,scheduleEdited:true};const msg=commissionerRegenerateSchedule();const ok=!state.commissioner.scheduleEdited&&JSON.stringify(state.schedule)!==old&&!!state.allStarCalendar;validateCareerData(JSON.parse(JSON.stringify(state)));state=s;return msg+' '+ok})()`);
assert.equal(pre,'Schedule regenerated. true');l.run(`state=validateCareerData(JSON.parse(JSON.stringify(state)))`);
// 6. Player editing: name, attributes, tendencies, personality and bio; invalid input is rejected; saves load.
const pid=run('state.teams[2].roster[0].id');
const form=run(`(()=>{const p=state.teams[2].roster[0],v={name:'Edited Player',pos:'C',age:'31',ovr:'88',pot:'90',trait0:TRAIT_GROUPS[0][2],trait1:TRAIT_GROUPS[1][0],trait2:TRAIT_GROUPS[2][1],heightInches:'86',weightLbs:'260',birthdate:'1995-04-12',hometown:'Lagos, Nigeria',college:'Kentucky'};for(const k of ATTRIBUTE_KEYS)v['a_'+k]='77';for(const k of TENDENCY_KEYS)v['t_'+k]='40';return v})()`);
const edited=run(`(()=>{const p=commissionerEditPlayer(${pid},${JSON.stringify(form)});return {name:p.name,pos:p.pos,age:p.age,ovr:p.ovr,attr:p.attributes.sbl,tend:p.tendencies.block,traits:p.personalityTraits,bio:[p.bio.heightInches,p.bio.hometown,p.bio.birthdate]}})()`);
assert.deepEqual(edited,{name:'Edited Player',pos:'C',age:31,ovr:88,attr:77,tend:40,traits:[run('TRAIT_GROUPS[0][2]'),run('TRAIT_GROUPS[1][0]'),run('TRAIT_GROUPS[2][1]')],bio:[86,'Lagos, Nigeria','1995-04-12']});
assert.equal(run(`${roundTrip}.teams[2].roster.find(p=>p.id===${pid}).name`),'Edited Player');
for(const [k,v] of [['a_sbl','0'],['t_block','101'],['name',''],['birthdate','2001-02-30'],['age','12'],['trait0','grumpy']])
 assert.throws(()=>run(`commissionerEditPlayer(${pid},${JSON.stringify({...form,[k]:v})})`),/./,k);
assert.equal(run(`state.teams[2].roster.find(p=>p.id===${pid}).name`),'Edited Player','rejected edits change nothing');
// 7. Awards: both stores update; the save checker accepts the result.
l.run(`state.regularAwards=[{year:state.year,mvp:{id:1,name:'Old MVP',team:'X'},roy:null,dpoy:null,sixth:null,mip:null,coach:null}];state.leagueHistory=[{year:state.year,champion:null,runnerUp:null,finalsMvp:null,mvp:{id:1,name:'Old MVP',team:'X'},dpoy:null,roy:null,mip:null,sixth:null,coach:null}];commissionerSetAward(state.year,'mvp',${pid});commissionerSetAward(state.year,'finalsMvp',${pid});`);
assert.equal(run(`state.regularAwards[0].mvp.name+'|'+state.leagueHistory[0].mvp.name+'|'+state.leagueHistory[0].finalsMvp.name`),'Edited Player|Edited Player|Edited Player');
assert.doesNotThrow(()=>run(`${roundTrip}.regularAwards.length`));assert.throws(()=>run(`commissionerSetAward(state.year,'champion',${pid})`),/cannot be edited/);
// 8. Draft: reorder the first round after the lottery and before the first pick; the lottery winner is applied.
const dr=run(`(()=>{state.draft={year:state.year,rounds:2,poolSize:90,order:state.teams.map(t=>t.id),picks:[],prospects:[]};commissionerMoveDraftTeam(17,0);const first=state.draft.order[0];commissionerMoveDraftTeam(17,4);const fifth=state.draft.order[4];state.draft.picks=[{}];let locked=false;try{commissionerMoveDraftTeam(17,0)}catch(e){locked=/before the first pick/.test(e.message)}state.draft=null;return {first,fifth,locked}})()`);
assert.deepEqual(dr,{first:17,fifth:17,locked:true});
// 9. Rigged lottery: the chosen team receives the first pick when the lottery runs (playoff gate stubbed).
const lot=loadLeague({seed:72,strictDOM:false});lot.setRandomSeed(72);
lot.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='C';state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true,lotteryWinner:22});gmCanAdvance=()=>true;draftReady=()=>true;`);
await lot.run('Promise.resolve(runDraftLottery())');
assert.deepEqual(JSON.parse(lot.run(`JSON.stringify([state.draft.order[0],state.commissioner.lotteryWinner,(state.news||[]).some(n=>/Commissioner decision/.test(n))])`)),[22,null,true]);
console.log('Commissioner mode: save field, team control/AI protection, forced results, trade review, schedule edits/regeneration, player and award editing, draft order and rigged lottery passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
