/* CPU in-season roster moves: signings and waivers for clubs the user does not control.
 * Regular season only (offseason free agency keeps its own flow). Signings use the same
 * rules as the user's in-season offers: asking salary, contract limits and cap room
 * (NBA) or wnbaOfferError (WNBA). Two narrow exceptions mirror existing rules:
 * an NBA club short of a playable rotation may add a minimum-salary player within its
 * roster spending limit, and a WNBA club below 10 able players uses the emergency
 * hardship replacement the user flow already offers. Waivers apply releasePlayer's
 * dead-cap rules for each league. Every move is logged to news; the contract book
 * records signings and releases through contractTrack. */
const CPU_UPGRADE_MARGIN=4,CPU_UPGRADE_EVERY=7,CPU_ROTATION_NEED=9;
function cpuRosterClubs(){return state.teams.filter(t=>t.id!==controlledTeamId()&&!expansionPendingSeason(t))}
function cpuHealthy(t){return t.roster.filter(p=>!injuryDays(p)&&!p.wnbaContract?.hardship)}
function cpuPayroll(t){return ownerPayroll(t)+financeDead(t)}
function cpuTrack(){if(typeof contractTrack==='function')contractTrack()}
// Lowest-value player a club may waive: not just signed, and (WNBA) not injured or a hardship replacement.
function cpuWaiveCandidate(t,keep=[]){return t.roster.filter(p=>!keep.includes(p)&&!(p.tradeWait>0)&&!(wnbaEnabled()&&(injuryDays(p)>0||p.wnbaContract?.hardship))).sort((a,b)=>tradePlayerValue(a,t)-tradePlayerValue(b,t)||a.id-b.id)[0]||null}
function cpuRelease(t,p,reason){
 if(t.roster.length<=rosterMinimum()&&!reason.allowBelowMinimum)return false;cpuTrack();let owed=0;
 if(wnbaEnabled()){const elapsed=Math.min(1,state.day/Math.max(1,state.schedule.length));for(const a of p.wnbaContract?.annual||[{year:state.year,base:wnbaDollars(p.salary),guaranteed:wnbaDollars(p.salary)}]){if(a.year<state.year||a.option==='pending'||a.option==='declined')continue;const amount=Math.max(a.guaranteed,a.year===state.year?Math.ceil(a.base*elapsed):0,a.year===state.year&&elapsed>=.5?a.base:0);if(amount){owed+=wnbaMillions(amount);state.wnbaFinance.dead.push({team:t.id,id:p.id,name:p.name,year:a.year,amount,reason:'Waived salary obligation'})}}delete p.wnbaContract;}
 else{const through=Math.max(state.year,p.contractThrough||state.year);owed=p.salary*(through-state.year+1);financeFor(t).dead.push({id:p.id,name:p.name,salary:p.salary,through})}
 t.roster=t.roster.filter(q=>q.id!==p.id);resetPlayerSituation(p);p.moraleAdjustment=-12;p.previousTeamKey=t.key;delete p.contractThrough;if(wnbaEnabled())p.salary=freeAgentQuote(p,t);state.free.push(p);
 if(t.rotationPlan)t.rotationPlan=rotationFromClub(t);updateCapSpace(t);cpuTrack();
 say(t.city+' releases '+p.name+' ('+p.pos+', '+p.ovr+' OVR) '+reason.text+'; '+money(owed)+' in remaining salary stays on the books.');return true}
function cpuSignTerms(t,p,mode){
 if(wnbaEnabled()){const year=state.year;if(mode==='hardship'){const r=wnbaRules(),fraction=(state.schedule.length-state.day)/state.schedule.length;return {salary:wnbaMillions(Math.ceil(wnbaMinimum(p)*(r.year>=2026?1:.75)*fraction)),years:1,hardship:true}}const salary=wnbaMillions(wnbaDemandDollars(p,t,year));return wnbaOfferError(p,t,{salary,years:1},year)?null:{salary,years:1}}
 const r=leagueRules(),years=Math.max(1,r.minContractYears),quote=Math.max(r.minContract,freeAgentQuote(p,t));
 if(quote<=r.maxContract&&cpuPayroll(t)+quote<=financeCapRoomLimit(t)+.001)return {salary:quote,years};
 // Rotation emergency: minimum-salary players only, within the roster spending limit.
 if(mode==='fill'&&freeAgentQuote(p,t)<=r.minContract+.001&&cpuPayroll(t)+r.minContract<=financeRosterLimit(t)+.001)return {salary:r.minContract,years};
 return null}
function cpuSign(t,p,terms,why){cpuTrack();internationalPrepareSigning(p);
 if(wnbaEnabled()){const c=wnbaMakeContract(p,t,{salary:wnbaDollars(terms.salary),years:terms.years,...(terms.hardship?{evidence:'emergency_hardship_simulation'}:{})});if(terms.hardship){c.hardship={type:'emergency',approvedYear:state.year,approvedDay:state.day,terminateWhenAble:10};(state.wnbaFinance.hardships??=[]).push({id:'emergency-'+state.year+'-'+state.day+'-'+p.id,team:t.id,playerId:p.id,year:state.year,amount:wnbaDollars(terms.salary),active:true,reason:'Emergency hardship: '+cpuHealthy(t).length+' able regular players; Article VII Section 4',approvedDay:state.day,expiresYear:state.year})}wnbaAssign(p,c);if(wnbaValidateTransaction(t,{add:[p],year:state.year})){delete p.wnbaContract;return false}}
 else{p.salary=terms.salary;p.contractThrough=state.year+terms.years-1}
 p.tradeWait=15;resetPlayerSituation(p);p.moraleAdjustment=8;t.roster.push(p);state.free=state.free.filter(q=>q.id!==p.id);if(typeof dissatisfactionSigned==='function')dissatisfactionSigned(p,t);
 if(t.rotationPlan)t.rotationPlan=rotationFromClub(t);updateCapSpace(t);cpuTrack();
 say(t.city+' signs '+p.name+' ('+p.pos+', '+p.ovr+' OVR) for '+money(terms.salary)+' per season '+why+'.');return true}
function cpuFreeAgentPool(t){const need=new Map(['PG','SG','SF','PF','C'].map(pos=>[pos,cpuHealthy(t).filter(q=>q.pos===pos).length]));return state.free.filter(p=>!injuryDays(p)).sort((a,b)=>b.ovr-a.ovr+(need.get(a.pos)-need.get(b.pos))*2||a.id-b.id)}
// Fill: too few healthy players for a rotation, or below the roster minimum.
function cpuFillRoster(t){
 const wnbaHardship=wnbaEnabled()&&!wnbaEmergencyEligibility(t),short=()=>t.roster.length<rosterMinimum()||cpuHealthy(t).length<(wnbaEnabled()?10:CPU_ROTATION_NEED);
 for(let guard=0;guard<3&&short();guard++){const mode=wnbaHardship&&cpuHealthy(t).length<10?'hardship':'fill';let signed=false;
  for(const p of cpuFreeAgentPool(t).slice(0,25)){const terms=cpuSignTerms(t,p,mode);if(!terms)continue;
   if(t.roster.length>=rosterMaximum()&&mode!=='hardship'){const cut=cpuWaiveCandidate(t);if(!cut||injuryDays(cut)===0&&cut.ovr>=p.ovr||!cpuRelease(t,cut,{text:'to open a roster spot',allowBelowMinimum:true}))break}
   if(cpuSign(t,p,terms,mode==='hardship'?'as an emergency hardship replacement':'to fill an injury-depleted rotation')){signed=true;break}}
  if(!signed||mode==='hardship')break}}
// Upgrade: a clearly better free agent the club can afford under the user's in-season rules.
function cpuUpgradeRoster(t){if(state.day%CPU_UPGRADE_EVERY!==(t.id%CPU_UPGRADE_EVERY))return;const floor=t.roster.slice().sort((a,b)=>b.ovr-a.ovr)[Math.min(t.roster.length-1,CPU_ROTATION_NEED-1)]?.ovr??0;
 const p=cpuFreeAgentPool(t).find(p=>p.ovr>=floor+CPU_UPGRADE_MARGIN);if(!p)return;
 const cut=t.roster.length>=rosterMaximum()?cpuWaiveCandidate(t):null;if(t.roster.length>=rosterMaximum()&&(!cut||cut.ovr+CPU_UPGRADE_MARGIN>p.ovr))return;
 // Waiving keeps the salary on the books, so affordability is checked against payroll including that dead cap.
 const terms=cpuSignTerms(t,p,'upgrade');if(!terms)return;if(cut&&!cpuRelease(t,cut,{text:'to make room for '+p.name}))return;cpuSign(t,p,terms,'as a rotation upgrade')}
function runCPURosterMoves(){if(state.champion!==null||state.day<1||state.day>=seasonLength()||(typeof faActive==='function'&&faActive())||!state.free.length)return;
 for(const t of cpuRosterClubs()){cpuFillRoster(t);cpuUpgradeRoster(t)}}
const cpuRosterOwnerDayBefore=ownerDay;ownerDay=function(...args){const r=cpuRosterOwnerDayBefore(...args);runCPURosterMoves();return r};
