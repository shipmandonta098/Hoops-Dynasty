/* Career lifecycle for long leagues.
   - Development follows an age curve: growth into the mid-20s, a peak at 26-28, declines from 29 that speed up after
     32 (slower for elite and durable players), with occasional breakouts and early falloffs.
   - Retirement is decided once per offseason when free agency opens (inside its rollback), so teams can replace
     retirees in free agency. Possible from 30, likely by 35, rare past 38; better players and bigger roles last longer.
   - Free agents who went unsigned all season retire if 30+, or leave the league if they were also unsigned the season
     before or are below a playable level.
   - First-round picks sign on draft day (a full CPU roster waives its lowest-value player). Unsigned draft rights expire
     after a full season unless the player is an international stash; the player becomes a free agent. */
const LIFECYCLE=Object.freeze({retireBase:[.03,.06,.1,.16,.25,.37,.5,.64,.78,.88,.94,.98],hardAge:42,rightsSeasons:1,unsignedFloorOVR:60,targetOVR:75.5,breakout:.07,falloff:.06,poolPerTeam:2});
// Yearly OVR change before trait adjustments, by the player's new age.
let lifecycleLastReport=null;
// Age curve: growth into the mid-20s, a peak at 26-28, small declines at 29-31 that speed up after 32. Elite (85+) and
// high-durability players decline more slowly. Breakouts and early falloffs keep careers varied. Growth slows near
// potential and for elite players, so the share of 85+ players stays stable.
function developmentBase(p){const a=p.age,elite=p.ovr>=85,durable=(p.attributes?.dur??50)>=80;
 let d=a<=23?rand(0,3):a<=25?rand(0,2):a<=28?rand(-1,1):a<=31?rand(-2,0):a<=33?rand(-3,-1):rand(-5,-2);
 if(d<0&&(elite||durable))d=Math.ceil(d*(elite&&durable?.5:.7));
 const roll=Math.random();
 if(a<=25&&p.ovr<80&&p.pot-p.ovr>=4&&roll<LIFECYCLE.breakout){d+=rand(2,4);p.pot=Math.min(99,p.pot+rand(1,3))}
 else if(a>=26&&roll>1-LIFECYCLE.falloff)d-=rand(2,4);
 if(d>0&&p.ovr>=85)d=Math.floor(d/2);if(d>1&&p.pot-p.ovr<=3&&roll>=LIFECYCLE.breakout)d=1;return d+lifecycleRatingOffset()}
// Retirements and roster cuts remove weaker players first, so the league average drifts up even with a balanced age
// curve. Each rollover shifts every player's change by the gap to the target average (capped at 3 points).
let lifecycleOffset={year:null,value:0};
function lifecycleRatingOffset(){if(lifecycleOffset.year!==state.year){const active=state.teams.flatMap(t=>t.roster),mean=active.length?active.reduce((n,p)=>n+p.ovr,0)/active.length:LIFECYCLE.targetOVR;lifecycleOffset={year:state.year,value:Math.max(-3,Math.min(3,Math.round(LIFECYCLE.targetOVR-mean)))}}return lifecycleOffset.value}
function lifecycleSeasonRows(year){const rows=new Map();for(const r of state.statsArchive||[])if(r.year===year&&Number.isInteger(r.id)){const o=rows.get(r.id)||{gp:0,mp:0};o.gp+=r.gp||0;o.mp+=r.mp||0;rows.set(r.id,o)}return rows}
function lifecycleRetireChance(p,season){
 if(p.age>=LIFECYCLE.hardAge)return 1;if(p.age<30)return 0;
 const base=LIFECYCLE.retireBase[Math.min(LIFECYCLE.retireBase.length-1,p.age-30)],mpg=season?.gp?season.mp/season.gp:null;
 const rating=p.ovr>=88?.4:p.ovr>=84?.55:p.ovr>=80?.7:p.ovr>=75?.9:p.ovr<68?1.4:1.15,role=mpg===null?1.3:mpg<8?1.4:mpg<16?1.15:mpg>=30?.75:1;
 return Math.min(.98,base*rating*role);
}
function lifecycleMarkRetired(p,create){const h=hallState(),key='p:'+p.id,person=create?hallPerson(key,p.name,'Player'):h.people.find(x=>x.key===key);if(person&&person.retired===null)person.retired=state.year}
// First-round picks sign: a CPU team with a full roster waives its lowest-value player (not one of this year's picks)
// on draft day, as real teams do. The waived salary stays on the books as dead money.
function draftMakeRoom(club,p,round){if(round!==1||club.id===controlledTeamId()&&!simulationAutopilot()||club.roster.length<rosterMaximum())return false;
 const cut=club.roster.filter(q=>q.bio?.draftYear!==state.year).sort((a,b)=>tradePlayerValue(a,club)-tradePlayerValue(b,club)||(a.contractThrough??0)-(b.contractThrough??0)||a.id-b.id)[0];
 return cut?cpuRelease(club,cut,{text:'to make room for first-round pick '+p.name}):false}
// When free agency opens (expired contracts have left the rosters), CPU teams sign this year's draft picks in pick
// order while roster and payroll allow. Picks used to stay unsigned because the draft runs while expiring veterans
// still fill the roster, so their rights expired and the league kept aging.
function cpuSignDraftRights(){const you=controlledTeamId();
 for(const r of [...(state.draftRights||[])].sort((a,b)=>(a.player.bio?.draftPick||999)-(b.player.bio?.draftPick||999))){
  const club=state.teams[r.team],p=r.player,stash=p.international?.stashUntil;if(!club||club.id===you&&!simulationAutopilot()||p.bio?.draftYear!==state.year||Number.isInteger(stash)&&stash>=state.year)continue;
  if(club.roster.length>=rosterMaximum()||ownerPayroll(club)+p.salary>financeRosterLimit(club)+.001)continue;
  internationalPrepareSigning(p);club.roster.push(p);state.draftRights=state.draftRights.filter(x=>x!==r);
 }}
// Returns counts for diagnostics. Called from beginFreeAgency after the season's stats are archived.
function offseasonLifecycle(){
 const now=lifecycleSeasonRows(state.year),before=lifecycleSeasonRows(state.year-1),you=controlledTeamId(),out={retired:0,freeAgentsLeft:0,rightsExpired:0};
 for(const t of state.teams){const leaving=t.roster.filter(p=>Math.random()<lifecycleRetireChance(p,now.get(p.id)));if(!leaving.length)continue;t.roster=t.roster.filter(p=>!leaving.includes(p));delete t.rotationPlan;
  for(const p of leaving){lifecycleMarkRetired(p,true);out.retired++;if(t.id===you||p.ovr>=80)say(p.name+' ('+t.city+') retires at '+p.age+'.')}}
 state.free=state.free.filter(p=>{if(now.get(p.id)?.gp>0)return true;const gone=p.age>=30||p.ovr<LIFECYCLE.unsignedFloorOVR||!(before.get(p.id)?.gp>0);if(!gone)return true;lifecycleMarkRetired(p,false);out.freeAgentsLeft++;return false});
 state.draftRights=(state.draftRights||[]).filter(r=>{const y=r.player.bio?.draftYear,stash=r.player.international?.stashUntil;if(Number.isInteger(stash)&&stash>=state.year)return true;const keep=!(Number.isInteger(y)&&state.year-y>=LIFECYCLE.rightsSeasons);if(!keep){out.rightsExpired++;const p=r.player;delete p.contractThrough;p.previousTeamKey=state.teams[r.team]?.key;state.free.push(p);if(r.team===you)say('Draft rights to '+p.name+' expired unsigned; he is now a free agent.')}return keep});
 // Cap the leftover pool at two unsigned free agents per team: the lowest-rated surplus who went unsigned all season
 // leave the league (overseas), so the pool can't grow every year from waivers and expired rights.
 const leftovers=state.free.filter(p=>!(now.get(p.id)?.gp>0)).sort((a,b)=>a.ovr-b.ovr||b.age-a.age||a.id-b.id),surplus=state.free.length-state.teams.length*LIFECYCLE.poolPerTeam;
 if(surplus>0){const gone=new Set(leftovers.slice(0,surplus).map(p=>p.id));for(const p of state.free)if(gone.has(p.id))lifecycleMarkRetired(p,false);state.free=state.free.filter(p=>!gone.has(p.id));out.freeAgentsLeft+=gone.size}
 // Keep enough free agents for teams to refill after retirements (same generator as a fresh league's pool).
 const shortfall=state.teams.reduce((n,t)=>n+Math.max(0,rosterMinimum()-t.roster.length),0),need=Math.max(state.teams.length,shortfall*2)-state.free.length;
 if(need>0){let id=Math.max(0,...[...state.teams.flatMap(t=>t.roster),...state.free,...(state.draftRights||[]).map(r=>r.player),...(state.draft?.prospects||[])].map(p=>p.id))+1;
  for(const spec of replacementFreeAgentSpecs(need)){const p=player(id,id%30,0,undefined,'initial',null,spec);id++;if(!p.bio)p.bio=generatePlayerBio(p,state.year,state.teams);state.free.push(p);out.generated=(out.generated||0)+1}}
 // Ownership records for drafts more than a season old are no longer needed.
 if(Array.isArray(state.tradePickOwners))state.tradePickOwners=state.tradePickOwners.filter(x=>x.year>=state.year-1);
 lifecycleLastReport=out;return out;
}
