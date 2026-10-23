/* Clock-aware endings reuse the existing possession/shot/stat resolvers.
 * Durations are simulation assumptions, not measured tracking-data estimates.
 * No result, score, shooting accuracy, or tie is forced here. */
function lateGameTimingPlan(margin,remaining,shotClock,tempo,transition=false){
 const urgent=margin<0&&margin>=-12&&remaining<=60;
 const neutral=transition?1:Math.max(3,Math.min(8,7-(tempo-64)*.03));
 // Leave time for the existing passing/shot resolver, rather than holding until
 // the shot clock itself expires. A fast break may still be worth taking.
 const protect=margin>0&&remaining<=120&&!transition;
 // Modern NBA/WNBA ending policy; historical formats retain prior timing.
 const tieLast=state.year>=2020&&margin===0&&remaining>4&&remaining<=24&&shotClock>=remaining;const setup=tieLast?remaining-4:protect?(state.year>=2020&&remaining<=60&&margin<=6?Math.min(4,shotClock-3):Math.max(neutral,Math.min(15,shotClock-9,remaining-8))):urgent?2:neutral;
 return {setup:Math.min(Math.max(0,setup),Math.max(0,remaining-1)),
  hold:margin>0&&remaining<shotClock,
  needThree:leagueRules().threePointers&&((margin===-3&&remaining<=15)||(margin<=-3&&margin>=-12&&remaining<=6)),
  protect,urgent};
}
function lateGameFoulChance(offensiveLead,remaining,shotClock,tactics){
 if(offensiveLead<=0||offensiveLead>8||remaining<=1||remaining>35)return 0;
 const base=remaining<=shotClock?(offensiveLead<=6?.88:.55):offensiveLead>=4?.50:.12;
 return Math.min(.96,base*(.75+Math.max(0,Math.min(100,tactics))/200));
}
/* End of Q1–Q3 (the final ~60 seconds run on the live clock). Adherence scales with coach tactics. */
function quarterEndPlan(remaining,shotClock,tactics,tempo,transition=false){
 const neutral=transition?1:Math.max(3,Math.min(8,7-(tempo-64)*.03)),iq=Math.max(0,Math.min(100,tactics))/100;
 if(remaining<=2.5)return {mode:'heave',setup:0};
 // Possession starts between shot clock + 4 and + 16: shoot early so the ball comes back for the last shot.
 if(remaining>=shotClock+4&&remaining<=shotClock+16&&Math.random()<.25+iq*.7)return {mode:'twoForOne',setup:Math.min(1,remaining-1)};
 // Game clock under the shot clock: hold, then the final-shot path releases with about 2–4 seconds left.
 if(remaining<shotClock&&remaining>7&&Math.random()<.55+iq*.4)return {mode:'lastShot',setup:remaining-(5+Math.random()*2)};
 return {mode:null,setup:Math.max(0,Math.min(neutral,remaining-1))};
}
/* Away-from-play foul in the last two minutes: 1 FT + possession. NBA from 2016–17 in every period, earlier
   only Q4/OT. WNBA (2016 rule change) defaults to Q4/OT; the league setting overrides either league. */
function awayFromPlayRuleApplies(period){
 const mode=leagueRules().awayFromPlayRule||'era',female=state.leagueGender==='female',year=Number(state.year);
 const scope=mode==='era'?(female?(year>=2016?'finalPeriod':'none'):(year>=2016?'allPeriods':'finalPeriod')):mode;
 return scope==='allPeriods'||scope==='finalPeriod'&&period>=leagueRules().gamePeriods-1;
}
// Per-possession chance once a hack-a target qualifies; rare in the modern era.
function intentionalFoulRate(tactics,coachType,year){
 return (year>=2016?.04:.12)*Math.max(0,Math.min(100,tactics))/100*({'Win-Now':1.35,Balanced:1,Developmental:.7}[coachType]||1);
}
const shotNameBeforeHeave=tendencyShotName;
tendencyShotName=function(shot){return shot.key==='heave'?'heave from beyond half court':shotNameBeforeHeave(shot)};
const possessionBeforeLateGame=tendencyPossession;
tendencyPossession=function(offense,defense,active,context,rows,log){
 const timing=context.machine?.context;
 if(!timing?.liveClock)return possessionBeforeLateGame(offense,defense,active,context,rows,log);
 const remaining=timing.remaining(),margin=context.machine.context.margin;
 if(remaining<.3){timing.advance(remaining,'decision');return null;}
 if(timing.finalPeriod===false){
  const players=offense.roster.filter(p=>active(offense,p)),pick=()=>players.find(p=>p.id===context.initialPlayerId)||simWeighted(players,p=>Math.max(.01,usageWeight(p)));
  if(timing.heave&&!context.machine.trace.includes('rebound')){const p=pick();context.machine.transition('shot',Math.max(.1,remaining-.2));
   log(p.name+' launches a heave at the buzzer.');return {p,lastPasser:null,action:'shoot',forced:false,iso:false,lateShot:true,shotOverride:{key:'heave',kind:leagueRules().threePointers?'three':'mid',skill:'tp',adjustment:0,heave:.025,selfCreated:true}};}
  if(timing.rush&&remaining>8){timing.rush=false;const p=pick();if(!context.machine.transition('shot',Math.min(remaining-1,4+Math.random()*3))){context.recordTurnover('shotClock',p);return null;}
   return {p,lastPasser:null,action:'shoot',forced:false,rushed:true,iso:false,lateShot:true,shotOverride:null};}
  if(remaining>8)return possessionBeforeLateGame(offense,defense,active,context,rows,log);
  const p=pick();if(!context.machine.transition('shot',Math.min(3,remaining,Math.max(.1,context.machine.shotClock-.1)))){context.recordTurnover('shotClock',p);return null;}
  log(p.name+' gets a final shot away.');return {p,lastPasser:null,action:'shoot',forced:remaining<=3,iso:false,lateShot:true,shotOverride:null};
 }
 const plan=lateGameTimingPlan(margin,remaining,context.machine.shotClock,coachFor(offense).tempo,context.transition);
 if(remaining>8&&!plan.needThree)return possessionBeforeLateGame(offense,defense,active,context,rows,log);
 const players=offense.roster.filter(p=>active(offense,p));
 const p=players.find(p=>p.id===context.initialPlayerId)||simWeighted(players,p=>Math.max(.01,usageWeight(p))*(plan.needThree?Math.max(.1,tendency(p,'three'))*(20+p.attributes.tp):1));
 // A short-clock attempt still faces the ordinary turnover, foul, contest,
 // physical matchup and shooting mechanics in attributes.js.
 if(!context.machine.transition('shot',Math.min(3,remaining,Math.max(.1,context.machine.shotClock-.1)))){context.recordTurnover('shotClock',p);return null;}
 const shotOverride=plan.needThree?{key:'pullupThree',kind:'three',skill:'tp',adjustment:-.035}:null;
 log(p.name+(plan.needThree?' looks for a three with time running out.':' gets a final shot away.'));
 return {p,lastPasser:null,action:'shoot',forced:remaining<=3,iso:false,lateShot:true,shotOverride};
};
