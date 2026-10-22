// CPU transactions: AI trades stay legal, CPU signings/waivers follow the user's rules, every move is logged.
// Activity counts over full seasons: node dev/cpu-transactions/count.cjs <nba|wnba> 3 <label>
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const realm=(league,seed)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.L=league;
 l.run(`var d=makeDraft();d.gmName='CPU test';d.year=L==='nba'?2025:2024;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};state=validateCareerData(buildSetupCareer(d));render=()=>{};save=async()=>true;simulationExecution.mode='headless';simulationExecution.autopilot=true;
 // Audit hooks: re-check legality and both assessments at the moment each AI trade executes.
 globalThis.audit={trades:[],illegal:[],said:[],userTouched:false};const exec=aiTradeExecute;aiTradeExecute=function(a,b,deal){const errors=tradeLegality(a,b,deal.out,deal.into,0,deal.outPicks,deal.inPicks);if(errors.length)audit.illegal.push(errors);audit.trades.push({a:a.id,b:b.id,out:deal.out.length,into:deal.into.length,picks:deal.outPicks.length+deal.inPicks.length,day:state.day});if([a.id,b.id].includes(controlledTeamId()))audit.userTouched=true;return exec(a,b,deal)};
 const s0=say;say=function(t){audit.said.push(t);return s0(t)};`);
 return {run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v},l}};
(async()=>{
 // 1. AI trades over the run-up to the deadline: legal, multi-shape, user team untouched, rules hold after every day.
 for(const league of ['nba','wnba']){
  const {run,l}=realm(league,31);const user=run('controlledTeamId()'),userRoster=run(`state.teams[controlledTeamId()].roster.map(p=>p.id).join()`),deadline=run('seasonMilestones().deadline');
  for(let day=0;day<deadline+2;day++){await l.run('simulateDayHeadless()');
   const bad=run(`state.teams.filter(t=>t.roster.length<rosterMinimum()||t.roster.length>rosterMaximum()).map(t=>t.abbr+':'+t.roster.length)`);assert.deepEqual(bad,[],league+' roster limits on day '+day);}
  const a=run('audit');assert.deepEqual(a.illegal,[],league+': every executed AI trade passes tradeLegality');assert(a.trades.length>0,league+': AI trades occur');assert.equal(a.userTouched,false);
  assert.equal(run(`state.teams[controlledTeamId()].roster.map(p=>p.id).join()`),userRoster,league+': CPU moves never touch the user roster');
  assert(a.trades.every(t=>t.day<=deadline),league+': no AI trades after the deadline');
  // Two-consecutive-years first-round rule still holds for every club after all trades.
  assert.deepEqual(run(`state.teams.filter(t=>{const own=tradePicks(t);for(let y=state.year+((state.draft?.picks.length||0)>0?1:0);y<state.year+leagueRules().tradePickSeasons-1;y++)if(!own.some(p=>p.round===1&&p.year===y)&&!own.some(p=>p.round===1&&p.year===y+1))return true;return false}).map(t=>t.abbr)`),[],league+': first-round pick rule');
  // News: every CPU move is a Transactions item, and trades appear in the trade history.
  const moves=a.said.filter(s=>/^Trade completed|signs |releases /.test(s));assert(moves.length>=a.trades.length);
  assert(run(`audit.said.filter(s=>/^Trade completed|signs |releases /.test(s)).every(s=>newsCategory(s)==='Transactions')`));
  assert(run('displayTradeHistory(50).length')>0);
  assert.equal(run(`(()=>{validateCareerData(JSON.parse(JSON.stringify(state)));return 'ok'})()`),'ok',league+': save/load after CPU moves');
  console.log(league,'trades',a.trades.length,'shapes',JSON.stringify(a.trades.reduce((m,t)=>{const k=t.out+'-for-'+t.into+(t.picks?'+pick':'');m[k]=(m[k]||0)+1;return m},{})));
 }
 // 2. NBA waiver: dead cap identical to releasePlayer (full remaining salary through contract end).
 {const {run}=realm('nba',32);
  const r=run(`(()=>{state.day=10;const t=state.teams.find(t=>t.id!==controlledTeamId()),p=[...t.roster].sort((a,b)=>a.ovr-b.ovr)[0];p.contractThrough=state.year+1;const deadBefore=financeDead(t),n=t.roster.length;const ok=cpuRelease(t,p,{text:'test',allowBelowMinimum:true});return {ok,deadAdded:financeDead(t)-deadBefore,salary:p.salary,entry:financeFor(t).dead.at(-1),free:state.free.some(q=>q.id===p.id),roster:t.roster.length,n,previous:p.previousTeamKey===t.key,contract:p.contractThrough===undefined}})()`);
  assert(r.ok);assert.equal(Math.round(r.deadAdded*1000),Math.round(r.salary*1000));assert.equal(r.entry.through,run('state.year')+1);assert(r.free&&r.previous&&r.contract);assert.equal(r.roster,r.n-1);
  // Cannot drop below the roster minimum unless immediately replaced.
  assert.equal(run(`(()=>{const t=state.teams.find(t=>t.id!==controlledTeamId());t.roster=t.roster.slice(0,rosterMinimum());return cpuRelease(t,t.roster[0],{text:'test'})})()`),false);
  // Fill: injuries drop a club below a playable rotation → it signs a free agent (waiving if full), within its limits.
  const f=run(`(()=>{state.day=20;const t=state.teams.find(t=>t.id!==controlledTeamId()&&t.roster.length<rosterMaximum());const stamp=medicalStamp();t.roster.slice(0,t.roster.length-7).forEach(p=>p.medicalInfo={name:'ankle sprain',severity:'Moderate',until:stamp+20,rehabUntil:stamp+25});const n=t.roster.length,ids=new Set(t.roster.map(p=>p.id));cpuFillRoster(t);return {n,after:t.roster.length,added:t.roster.filter(p=>!ids.has(p.id)).length,healthy:cpuHealthy(t).length,payroll:cpuPayroll(t),limit:financeRosterLimit(t),max:rosterMaximum()}})()`);
  assert(f.added>=1,'injury-depleted club signs a replacement');assert(f.after<=f.max);assert(f.payroll<=f.limit+.001);
 }
 // 3. WNBA waiver: obligations recorded as for the user's WNBA release; injured and hardship players are never waived.
 {const {run}=realm('wnba',33);
  const r=run(`(()=>{state.day=12;const t=state.teams.find(t=>t.id!==controlledTeamId()),p=cpuWaiveCandidate(t);const before=state.wnbaFinance.dead.length;const ok=cpuRelease(t,p,{text:'test',allowBelowMinimum:true});return {ok,added:state.wnbaFinance.dead.slice(before).every(d=>d.team===t.id&&d.id===p.id&&d.amount>0),count:state.wnbaFinance.dead.length-before,contract:p.wnbaContract===undefined}})()`);
  assert(r.ok&&r.added&&r.count>=1&&r.contract);
  assert.equal(run(`(()=>{const t=state.teams.find(t=>t.id!==controlledTeamId());const stamp=medicalStamp();t.roster.forEach(p=>p.medicalInfo={name:'calf strain',severity:'Minor',until:stamp+5,rehabUntil:stamp+6});return cpuWaiveCandidate(t)})()`),null);
 }
 console.log('CPU transactions: legal multi-asset AI trades, user roster untouched, pick rule, NBA/WNBA waiver dead cap, injury fill, news logging and save/load passed.');
})().catch(e=>{console.error(e);process.exitCode=1});
