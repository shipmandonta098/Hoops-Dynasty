/* Developer-only orchestration. Load after the production scripts in an isolated realm.
   No alternate basketball engine, live-career save, historical pruning, or product UI. */
class LeagueValidationError extends Error {
 constructor(issues){super(issues.map(x=>`[LEAGUE VALIDATION FAILED] Season ${x.season} · ${x.system} · ${x.problem}`).join('\n'));this.issues=issues;}
}
function fastAllPlayers(){return [...state.teams.flatMap(t=>t.roster),...state.free,...(state.draftRights||[]).map(r=>r.player)]}
// The product explicitly defines displayed age at October 1 of the season year.
// Calendar dates below are the existing schedule clock, not invented offseason dates.
function agingLeagueDate(){return scheduleDate(state.day).toISOString().slice(0,10)}
function agingSeasonAge(birthdate,year){
 if(typeof birthdate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)||!Number.isFinite(Date.parse(birthdate))||new Date(birthdate).toISOString().slice(0,10)!==birthdate)return null;
 return year-Number(birthdate.slice(0,4))-(birthdate.slice(5)>'10-01'?1:0);
}
function agingPopulation(){return [...state.teams.flatMap(t=>t.roster.map(p=>({p,status:'active',teamId:t.id}))),...state.free.map(p=>({p,status:'free agent'})),...(state.draftRights||[]).map(r=>({p:r.player,status:r.player.international?.stashUntil?'international stash':'unsigned draft rights',teamId:r.team}))]}
function traceSeasonAging(){
 const previousSeason=state.year,previousLeagueDate=agingLeagueDate(),ages=new Map(),refs=new Map();
 for(const {p,status,teamId} of agingPopulation()){
  const row={playerId:p.id,playerName:p.name,birthdate:p.bio?.birthdate??null,beforeAge:p.age,previousSeason,previousLeagueDate,beforeStatus:status,teamId,agingApplications:0,ageWrites:[],expectedAge:p.age+1};
  ages.set(p.id,row);refs.set(p.id,p);let value=p.age;
  Object.defineProperty(p,'age',{enumerable:true,configurable:true,get:()=>value,set:next=>{row.ageWrites.push({from:value,to:next});if(next!==value)row.agingApplications++;value=next;}});
 }
 return {ages,finish(){const current=new Map(agingPopulation().map(x=>[x.p.id,x])),retired=new Set((state.hallOfFame?.people||[]).filter(x=>x.kind==='Player'&&x.retired!==null).map(x=>Number(x.key.slice(2))));
  for(const [id,row] of ages){const p=refs.get(id),next=current.get(id);Object.assign(row,{afterAge:p.age,newSeason:state.year,currentLeagueDate:agingLeagueDate(),afterStatus:next?.status||(retired.has(id)?'retired':'removed'),agingTouched:row.agingApplications>0,expectedAge:row.beforeAge+(state.year-previousSeason),birthdateExpectedAge:agingSeasonAge(row.birthdate,state.year)});Object.defineProperty(p,'age',{value:p.age,writable:true,enumerable:true,configurable:true});}
  return ages;
 }};
}
function validateHeadlessLeague({completedYear=null,ages=null,drafted=null,teamIds=null}={}){
 const issues=[],fail=(system,problem,ids={})=>issues.push({season:state.year,day:state.day,system,problem,...ids}),teams=new Set(),players=new Map(),retired=new Set((state.hallOfFame?.people||[]).filter(p=>p.kind==='Player'&&p.retired!==null).map(p=>Number(p.key.slice(2))));
 for(const t of state.teams){if(teams.has(t.id)||state.teams[t.id]!==t)fail('Teams','Duplicate or invalid team ID',{teamId:t.id});teams.add(t.id);if(t.roster.length<rosterMinimum()||t.roster.length>rosterMaximum())fail('Rosters',`${t.city} ${t.name}: ${t.roster.length} players; expected ${rosterMinimum()}–${rosterMaximum()}`,{teamId:t.id});}
 if(teamIds&&[...teamIds].some(id=>!teams.has(id)))fail('Teams','A team disappeared during the season');
 const pools=[...state.teams.map(t=>({label:t.city+' '+t.name,players:t.roster})),{label:'Free agents',players:state.free},...(state.draftRights||[]).map(r=>({label:'Draft rights '+r.team,players:[r.player]}))];
 for(const pool of pools)for(const p of pool.players){if(players.has(p.id))fail('Rosters',`Player ${p.id} exists in ${players.get(p.id)} and ${pool.label}`,{playerId:p.id});players.set(p.id,pool.label);if(retired.has(p.id))fail('Retirements',`Retired player ${p.id} is still in ${pool.label}`,{playerId:p.id});if(!Number.isFinite(p.salary)||p.salary<0||p.contractThrough!==undefined&&(!Number.isInteger(p.contractThrough)||p.contractThrough<1900))fail('Contracts',`Invalid contract for ${p.id}`,{playerId:p.id});}
 for(const row of ages?.values()||[])if(row.afterAge!==row.expectedAge||row.agingApplications!==1)fail('Aging',`${row.playerName} (${row.playerId}) aged ${row.beforeAge} → ${row.afterAge}; expected ${row.expectedAge}; applications ${row.agingApplications}`,row);
 for(const p of [...fastAllPlayers(),...(state.draft?.prospects||[])]){const expected=agingSeasonAge(p.bio?.birthdate,state.year);if(expected!==p.age)fail('Aging',`${p.name}: season age ${p.age} disagrees with October 1 birthdate age ${expected}`,{...(ages?.get(p.id)||{}),playerId:p.id,playerName:p.name,birthdate:p.bio?.birthdate??null,afterAge:p.age,expectedAge:expected,ageReferenceDate:state.year+'-10-01'});}
 for(const r of state.draftRights||[])if(!teams.has(r.team))fail('Draft','Rights assigned to nonexistent team',{teamId:r.team,playerId:r.player.id});
 const games=state.history.filter(g=>g.stage==='Regular season'),appearances=new Map(state.teams.map(t=>[t.id,{w:0,l:0}]));
 for(const g of games){if(!teams.has(g.a)||!teams.has(g.b)||![g.a,g.b].includes(g.winner)){fail('Standings','Game references invalid team');continue;}appearances.get(g.winner).w++;appearances.get(g.winner===g.a?g.b:g.a).l++;}
 for(const t of state.teams){const r=appearances.get(t.id);if(t.w!==r.w||t.l!==r.l)fail('Standings',`${t.city}: ${t.w}–${t.l} differs from recorded ${r.w}–${r.l}`,{teamId:t.id});}
 if(completedYear!==null){if(state.year!==completedYear+1||state.day!==0||!state.schedule?.length)fail('Calendar','Next season did not initialize correctly');const champs=(state.championsArchive||[]).filter(x=>x.year===completedYear);if(champs.length!==1)fail('Championship',`Expected one championship archive, found ${champs.length}`);const draft=(state.draftHistory||[]).find(d=>d.year===completedYear);if(!draft||draft.picks.length!==state.teams.length*(draft.rounds||2))fail('Draft','Completed draft archive missing or incomplete');for(const id of drafted||[])if(!players.has(id))fail('Draft',`Drafted rookie ${id} missing from rosters, free agents and rights`,{playerId:id});}
 // Use the existing save validator as a check, never install its normalized output.
 try{validateCareerData(state)}catch(e){fail('Persistence',e.message)}
 if(issues.length)throw new LeagueValidationError(issues);return {season:state.year,passed:true,teams:teams.size,players:players.size};
}
function headlessHealth(){
 const active=state.teams.flatMap(t=>t.roster),games=state.history.filter(g=>g.stage==='Regular season'),rows=games.flatMap(g=>g.box),sum=k=>rows.reduce((n,r)=>n+(r[k]||0),0),ratio=(a,b)=>b?a/b:null,payrolls=state.teams.map(t=>ownerPayroll(t)),avg=k=>ratio(active.reduce((n,p)=>n+p[k],0),active.length);
 return {season:state.year,activePlayers:active.length,freeAgents:state.free.length,draftRights:(state.draftRights||[]).length,averageAge:avg('age'),averageOVR:avg('ovr'),averagePOT:avg('pot'),rookies:active.filter(p=>p.bio?.debutYear===state.year).length,retirements:(state.hallOfFame?.people||[]).filter(p=>p.kind==='Player'&&p.retired===state.year).length,teamPPG:ratio(games.reduce((n,g)=>n+g.sa+g.sb,0),games.length*2),fg:ratio(sum('fgm'),sum('fga')),three:ratio(sum('tpm'),sum('tpa')),ft:ratio(sum('ftm'),sum('fta')),possessionsPerTeamGame:ratio(games.reduce((n,g)=>n+Object.values(g.possessionOutcomes||{}).reduce((a,b)=>a+b,0),0),games.length*2),averagePayroll:ratio(payrolls.reduce((a,b)=>a+b,0),payrolls.length),payrollMin:Math.min(...payrolls),payrollMax:Math.max(...payrolls),aboveCap:payrolls.filter(p=>p>salaryCap()).length,currentlyInjured:active.filter(p=>injuryDays(p)>0).length};
}
function headlessGrowth(){return Object.fromEntries(['history','statsArchive','playerPostseasonArchive','teamStatsArchive','teamSeasonArchive','draftHistory','draftRights','free','championsArchive','leagueHistory'].map(k=>[k,state[k]?.length||0]).concat([['hallPeople',state.hallOfFame?.people?.length||0],['news',state.newsFeed?.items?.length||0],['decisions',state.decisions?.entries?.length||0],['pbpStrings',state.history.reduce((n,g)=>n+(g.playByPlay?.length||0),0)],['replayFrames',state.history.reduce((n,g)=>n+(g.boxTimeline?.length||0),0)]]))}
function headlessContext(phase,extra={}){simulationExecution.context={season:state.year,day:state.day,phase,...extra}}
function assertHeadless(){if(!simulationHeadless()||!simulationExecution.isolated)throw Error('Run this developer utility in an isolated simulation realm.');}
function headlessCheckpoint(){return snapshotState()}
function simulateGameHeadless(a,b,stage='Regular season'){
 assertHeadless();headlessContext(stage==='Regular season'?'regular-season-game':'playoff-game',{homeId:a,awayId:b,stage});const before=headlessCheckpoint();
 try{return play(a,b,stage)}catch(e){state=before;throw e}
}
async function headlessAllStar(){if(allStarSimulationPaused()){headlessContext('all-star-selections');await confirmAllStarSelections(true,{quiet:true});if(allStarSimulationPaused())throw Error('All-Star ballot could not be finalized');seasonMilestoneDay();}}
async function simulateDayHeadless(){assertHeadless();await headlessAllStar();if(state.day>=seasonLength())return false;headlessContext('league-day');const day=state.day,games=simulationExecution.games,players=simulationExecution.players;try{if(!await sim(1)||state.day!==day+1)throw Error('League day did not advance');}catch(e){simulationExecution.games=games;simulationExecution.players=players;throw e;}await headlessAllStar();return true;}
async function headlessOffseason(options){
 headlessContext('draft-lottery');await runDraftLottery();if(!state.draft?.order?.length)throw Error('Draft lottery did not produce an order');
 headlessContext('draft');await autoDraft(false);if(!draftComplete())throw Error('Draft did not complete');const drafted=new Set(state.draft.picks.map(p=>p.id));
 headlessContext('free-agency-opening');await beginFreeAgency();if(!faActive()&&state.freeAgency?.phase!=='complete')throw Error('Free agency did not open');
 let rounds=0;while(faActive()){
  headlessContext('free-agency',{round:state.freeAgency.round});
  for(const sheet of [...state.freeAgency.pending])if(sheet.former===0){const p=state.free.find(p=>p.id===sheet.id),offer={...sheet.offer,team:0,route:'bird'},match=team().roster.length<Math.min(rosterMaximum(),Math.max(12,rosterMinimum()))&&p.ovr>=68&&!faOfferCheck(p,team(),offer,true);await matchFreeAgent(p.id,match);}
  if(state.freeAgency.phase==='market'&&!state.freeAgency.pending.length&&state.teams.every(t=>t.roster.length>=(wnbaEnabled()?wnbaRules(state.year+1).rosterMin:rosterMinimum())&&faPayroll(t)<=financeRosterLimit(t,state.year+1)+.001)){await finishFreeAgency();if(faActive())throw Error('Free agency completion rejected');break;}
  if(++rounds>64)throw Error('Free agency stalled after 64 rounds: '+state.teams.filter(t=>t.roster.length<rosterMinimum()).map(t=>`${t.id}:${t.roster.length} players, payroll ${faPayroll(t).toFixed(1)}`).join('; '));
  await advanceFreeAgency();await options.boundary();
 }
 return drafted;
}
async function simulateSeasonHeadless(options={boundary:async()=>{}}){
 assertHeadless();const year=state.year,ids=new Set(state.teams.map(t=>t.id));
 while(state.day<seasonLength()){await simulateDayHeadless();await options.boundary();}
 await headlessAllStar();headlessContext('playoffs');
 while(state.champion===null){const slot=playoffSeriesSlots().find(s=>!s.complete);if(!slot)throw Error('Playoff bracket stalled without champion');if(!await simulatePlayoffGame(...slot.nextPair))throw Error('Playoff game did not commit');await options.boundary();}
 const final=playoffSeriesSlots().filter(s=>s.stage==='Championship'&&s.complete);if(final.length!==1||final[0].winner!==state.champion)throw Error('Playoff champion does not reconcile with final series');
 validateHeadlessLeague();const health=headlessHealth();options.onSeasonMetrics?.(health);const drafted=await headlessOffseason(options),aging=traceSeasonAging();
 headlessContext('season-rollover');let ages;try{newSeason()}finally{ages=aging.finish()}headlessContext('integrity-validation');const validation=validateHeadlessLeague({completedYear:year,ages,drafted,teamIds:ids});
 health.retirements=(state.hallOfFame?.people||[]).filter(p=>p.kind==='Player'&&p.retired===state.year).length;
 if(!state.draft)ensureDraft(); // Same generator as opening the Draft tab; one upcoming class.
 return {year,health,validation,aging:{checked:ages.size,applications:[...ages.values()].reduce((n,r)=>n+r.agingApplications,0),retired:[...ages.values()].filter(r=>r.afterStatus==='retired').length},growth:headlessGrowth()};
}
async function simulateMultipleSeasonsHeadless(count,{seed=1,onProgress=null,signal=null,memory=null,yieldControl=null,onCheckpoint=null,mode='headless',log=true}={}){
 if(![1,5,10,25,50,100].includes(count))throw Error('Supported benchmark sizes: 1, 5, 10, 25, 50, 100');
 if(!simulationExecution.isolated||simulationHeadless())throw Error('Benchmarks require a fresh isolated realm; never run against a mounted career.');
 if(!['headless','fast'].includes(mode))throw Error('Invalid fast simulation mode');
 let randomState=Number(seed)>>>0;const originalRandom=Math.random,originalPlay=play,start=performance.now(),startingSeason=state.year;
 const report={requestedSeasons:count,seasonsSimulated:0,gamesSimulated:0,playersProcessed:0,startingSeason,endingSeason:state.year,seed:Number(seed)>>>0,mode,status:'running',memoryStart:memory?.()??null,memoryFinish:null,peakSampledMemory:null,errors:[],warnings:[],seasons:[],seasonDiagnostics:[],growthStart:headlessGrowth()};
 Math.random=()=>{randomState=(Math.imul(randomState,1664525)+1013904223)>>>0;return randomState/4294967296};
 Object.assign(simulationExecution,{mode,autopilot:true,warnings:[],games:0,players:0,saveRequests:0});
 play=function(a,b,stage='Regular season'){headlessContext(stage==='Regular season'?'regular-season-game':'playoff-game',{homeId:a,awayId:b,stage});const result=originalPlay(a,b,stage);delete result.simulationScoring;simulationExecution.games++;simulationExecution.players+=result.box.length;return result};
 let lastYield=start,lastMemory=start;const boundary=async()=>{
  const now=performance.now();if(memory&&now-lastMemory>100){const value=memory();if(Number.isFinite(value))report.peakSampledMemory=Math.max(report.peakSampledMemory||0,value);lastMemory=now;}
  if(signal?.aborted){const error=Error('Cancelled at a committed day/game/offseason-round boundary');error.name='AbortError';throw error;}
  if(onProgress)onProgress({season:state.year,targetSeasons:count,seasonsCompleted:report.seasonsSimulated,phase:simulationExecution.context.phase,gamesCompleted:simulationExecution.games,totalGames:null,regularSeasonGamesTotal:state.schedule.flat().length,day:state.day});
  if(yieldControl&&now-lastYield>=50){await yieldControl();lastYield=performance.now();}
  if(signal?.aborted){const error=Error('Cancelled at a committed day/game/offseason-round boundary');error.name='AbortError';throw error;}
 };
 try{await boundary();validateHeadlessLeague();for(let i=0;i<count;i++){const seasonStart=performance.now(),gameStart=simulationExecution.games,r=await simulateSeasonHeadless({boundary,onSeasonMetrics:health=>report.seasonDiagnostics.push(health)});r.runtimeMs=performance.now()-seasonStart;r.games=simulationExecution.games-gameStart;report.seasons.push(r);report.seasonsSimulated++;if(onCheckpoint)await onCheckpoint(copy(state),{season:state.year,completedSeasons:report.seasonsSimulated});await boundary();}report.status='completed';}
 catch(e){report.status=e.name==='AbortError'?'cancelled':'failed';report.errors.push({...simulationExecution.context,error:e.message,issues:e.issues||[],stack:e.stack});}
 finally{report.endingSeason=state.year;report.gamesSimulated=simulationExecution.games;report.playersProcessed=simulationExecution.players;report.saveRequestsDeferred=simulationExecution.saveRequests;report.runtimeMs=performance.now()-start;report.averageMsPerSeason=report.seasonsSimulated?report.runtimeMs/report.seasonsSimulated:null;report.averageMsPerGame=report.gamesSimulated?report.runtimeMs/report.gamesSimulated:null;report.memoryFinish=memory?.()??null;report.peakSampledMemory=memory?Math.max(report.peakSampledMemory||0,report.memoryStart||0,report.memoryFinish||0):null;report.warnings=[...new Set(simulationExecution.warnings)];report.growthFinish=headlessGrowth();Math.random=originalRandom;play=originalPlay;Object.assign(simulationExecution,{mode:'normal',autopilot:false});}
 if(log)console.log(`[FAST SIM] ${report.seasonsSimulated}/${count} seasons completed; ${report.gamesSimulated} games; ${(report.runtimeMs/1000).toFixed(2)} sec; ${report.errors.length} errors; ${report.status}`);
 return report;
}
