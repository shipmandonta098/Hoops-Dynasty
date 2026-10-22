/* Match-local coaching preferences; no rating or accuracy changes.
 * Lead-size × elapsed-regulation-time intensity, capped at one.
 * Numeric policy strengths are simulation assumptions, not measured CBA rules. */
function scoreStatePolicy(margin,minute){
 const intensity=Math.min(1,Math.abs(margin)/20)*Math.max(0,Math.min(1,minute/gameMinutes()));
 const leading=margin>0,trailing=margin<0;
 return {intensity,pace:leading?1-.12*intensity:trailing?1+.08*intensity:1,
  three:trailing?1+.65*intensity:1,safe:leading?intensity:0,
  pressure:leading?1-.08*intensity:trailing?1+.04*intensity:1,
  gamble:leading?1-.30*intensity:trailing?1+.40*intensity:1};
}
/* Behavioral frequencies, not ability ratings. Zero = avoid; 100 = strongly prefer. */
const TENDENCY_GROUPS=[['Finishing',[['drivingLayup','Driving Layup','lay'],['runningLayup','Running Layup','lay'],['standingDunk','Standing Dunk','dnk'],['drivingDunk','Driving Dunk','dnk'],['alleyOop','Alley-Oop Dunk Shot','dnk'],['floater','Floater','lay'],['runningFloater','Running Floater','lay'],['putback','Put-back','reb']]],['Post & Jump Shooting',[['postUp','Post Up','post'],['postHook','Post Hook','post'],['postFade','Post Fadeaway','post'],['turnaround','Turnaround Jumper','fg'],['midrange','Midrange','fg'],['fadeaway','Fadeaway Jumper','fg'],['pullup','Pull Up Jumper','fg'],['three','Three Point','tp'],['pullupThree','Pull Up Three','tp'],['runningThree','Running Three Pointer','tp']]],['Offensive Decisions',[['touches','Usage / Touches','oiq'],['shoot','Shoot','fg'],['inside','Close / Rim','lay'],['overplay','Hold Ball / Overplay','drb'],['drawFoul','Seek Contact / Draw Foul','lay'],['isolation','Isolation','drb'],['drive','Drive','spd'],['passing','Passing','pss']]],['Defense & Rebounding',[['sagOff','Sag Off','diq'],['foul','Foul Proneness','stre'],['onBallSteal','On Ball Steal','stl'],['passLane','Play Pass Lane','diq'],['contest','Contest Shot','per'],['block','Block','sbl'],['crashGlass','Crash Glass','reb']]]];
const TENDENCY_KEYS=TENDENCY_GROUPS.flatMap(g=>g[1].map(t=>t[0]));
function generatedTendencies(p,a=p.attributes||generatedAttributes(p)){let seed=(p.id+19)>>>0;for(const c of p.name)seed=(Math.imul(seed,33)+c.charCodeAt(0))>>>0;const big=['PF','C'].includes(p.pos);return Object.fromEntries(TENDENCY_GROUPS.flatMap(g=>g[1]).map(([key,,attribute])=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;let preference=a[attribute]+(seed%41)-20;if(['postUp','postHook','standingDunk','crashGlass','putback'].includes(key))preference+=big?12:-18;if(['pullup','pullupThree','drive','isolation'].includes(key))preference+=big?-18:8;if(['runningThree','alleyOop','fadeaway'].includes(key))preference-=20;return [key,genderTendency(p,key,Math.max(0,Math.min(100,Math.round(preference)))) ]}))}
const NEW_DECISION_TENDENCIES=['touches','shoot','inside','overplay','drawFoul','sagOff','foul'];
function readPlayerTendencies(p,bad){if(p.tendencies===undefined)return generatedTendencies(p);const t=p.tendencies;if(!t||typeof t!=='object'||TENDENCY_KEYS.some(k=>t[k]===undefined? !NEW_DECISION_TENDENCIES.includes(k):!Number.isInteger(t[k])||t[k]<0||t[k]>100))bad('invalid player tendencies.');const defaults=generatedTendencies(p);return Object.fromEntries(TENDENCY_KEYS.map(k=>[k,t[k]??defaults[k]]))}
function tendency(p,key){if(!p.tendencies)p.tendencies=generatedTendencies(p);if(p.tendencies[key]===undefined&&NEW_DECISION_TENDENCIES.includes(key))p.tendencies[key]=generatedTendencies(p)[key];return Math.min(1,p.tendencies[key]/100*archetypeTendencyMultiplier(p,key))}
const TENDENCY_SHOTS=[
 ['drivingLayup','inside','lay',0],['runningLayup','inside','lay',-.01],['postHook','inside','post',-.01],['postFade','mid','post',-.04],['turnaround','mid','post',-.035],['standingDunk','inside','dnk',0],['drivingDunk','inside','dnk',-.015],['alleyOop','inside','dnk',-.02],['midrange','mid','fg',0],['fadeaway','mid','fg',-.05],['pullup','mid','fg',-.025],['floater','inside','lay',-.045],['runningFloater','inside','lay',-.055],['three','three','tp',0],['pullupThree','three','tp',-.035],['runningThree','three','tp',-.06]
].map(([key,kind,skill,adjustment])=>({key,kind,skill,adjustment}));
function tendencyShotWeights(p,{transition=false,focus='Balanced',system='',action='shoot',assisted=false,scoreState=null}={}){
 // General-shot priors account for the separate drive, post and pick-and-roll branches.
 const zones={inside:.23*tendency(p,'inside'),mid:.47*tendency(p,'midrange'),three:.57*tendency(p,'three')};
 if(scoreState)zones.three*=scoreState.three;
 if(system==='Pace & Space'){zones.three*=1.25;zones.mid*=.75}if(focus==='Outside-in')zones.three*=1.2;if(focus==='Inside-out')zones.inside*=1.2;
 const eligible=s=>action==='drive'?['drivingLayup','drivingDunk','floater','runningLayup','runningFloater'].includes(s.key):action==='post'?['postHook','postFade','turnaround'].includes(s.key):true;
 const raw=TENDENCY_SHOTS.map(s=>{let w=eligible(s)?tendency(p,s.key):0;if(scoreState?.safe&&['fadeaway','postFade','turnaround','pullup','pullupThree','runningThree','alleyOop'].includes(s.key))w*=1-.45*scoreState.safe;if(['runningLayup','runningFloater','runningThree'].includes(s.key)&&!transition)w=0;if(s.key==='alleyOop'&&!assisted)w=0;if(s.skill==='dnk')w*=femaleDunkMultiplier(p);if(assisted&&['pullupThree','runningThree'].includes(s.key))w*=.25;return w});
 if(action==='drive'||action==='post')return raw;
 return TENDENCY_SHOTS.map((s,i)=>{const total=raw.reduce((n,w,j)=>n+(TENDENCY_SHOTS[j].kind===s.kind?w:0),0);return total?zones[s.kind]*raw[i]/total:0});
}
function tendencyShot(p,context={}){const weights=tendencyShotWeights(p,context);if(!weights.some(w=>w>0))return {key:'basicShot',kind:context.action==='post'?'mid':'inside',skill:context.action==='post'?'post':'lay',adjustment:0};return simWeighted(TENDENCY_SHOTS,s=>weights[TENDENCY_SHOTS.indexOf(s)])}
function tendencyIsClutch(minute,margin){return Math.abs(margin)<=8&&(minute>=Math.max(0,gameMinutes()-2)&&minute<gameMinutes()||minute>=gameMinutes()&&gamePeriodRemaining(minute)<=2)}
function tendencyTouchWeight(p,starId,clutch=false){return usageWeight(p)*(clutch&&p.id===starId?1.65:1)}
function tendencyDecision(p,{clutch=false,starId=null}={}){const choices=['pass','shoot','drive','post'],weights=[tendency(p,'passing'),4*tendency(p,'shoot')*(clutch&&p.id===starId?1.5:1),.7*tendency(p,'drive'),.45*tendency(p,'postUp')];return weights.some(w=>w>0)?simWeighted(choices,c=>weights[choices.indexOf(c)]):'shoot'}
function tendencyPossession(offense,defense,active,context,rows,log){
 const attackers=offense.roster.filter(p=>active(offense,p)),defenders=defense.roster.filter(p=>active(defense,p));
 const star=[...attackers].sort((a,b)=>b.ovr-a.ovr)[0],pick=list=>list.some(p=>tendencyTouchWeight(p,star.id,context.clutch)>0)?simWeighted(list,p=>tendencyTouchWeight(p,star.id,context.clutch)):list[Math.floor(Math.random()*list.length)];
 let p=attackers.find(p=>p.id===context.initialPlayerId)||pick(attackers),lastPasser=null,held=false;const machine=context.machine;const move=(phase,seconds)=>{if(!machine)return true;if(machine.transition(phase,seconds))return true;context.recordTurnover('shotClock',p);return false};
 if(Math.random()<.88*leagueRules().passingTendency){const passers=attackers.filter(q=>q.id!==p.id&&tendency(q,'passing')>0);if(passers.length&&context.initialPlayerId==null){const receiver=p;p=simWeighted(passers,q=>q.attributes.pss*q.attributes.pss*tendency(q,'passing'));if(!move('pass',3))return null;if(Math.random()<possessionTurnoverRisk(Math.max(.005,.05-p.attributes.pss*.0004))){context.recordTurnover('badPassOut',p);return null}log(pbpNarrative('pass',{player:p.name,target:receiver.name},0));lastPasser=p;p=receiver;machine?.transition('decision');}}
 for(let step=0;step<5;step++){
  if(Math.random()<tendency(p,'overplay')*.10){held=true;if(!move('decision',6))return null;log(p.name+' holds the ball, running down the shot clock.');step++}
  const action=step>=4?'shoot':tendencyDecision(p,{...context,starId:star.id});
  if(action!=='pass'){if(!move(action==='shoot'?'shot':action,4))return null;if(action!=='shoot'&&!move('shot',3))return null;const iso=false;log(p.name+(step>=4?' forces a shot as the clock runs down.':action==='drive'?' attacks the basket.':action==='post'?' establishes position in the post.':iso?' clears space for an isolation.':' looks for a shot.'));return {p,lastPasser:iso?null:lastPasser,action,forced:step>=4||held,iso}}
  if(!move('pass',4))return null;const receiver=pick(attackers.filter(q=>q.id!==p.id)),laneCandidates=defenders.filter(q=>tendency(q,'passLane')>0),lane=laneCandidates.length?simWeighted(laneCandidates,q=>tendency(q,'passLane')):null;
  const attempt=lane&&Math.random()<tendency(lane,'passLane')*.35*(context.defensiveState?.gamble??1);
  const badPass=Math.random()<possessionTurnoverRisk(Math.max(.005,.06-p.attributes.pss*.00045));
  const intercepted=attempt&&Math.random()<possessionTurnoverRisk(Math.max(.03,Math.min(.6,.22+(lane.attributes.stl-p.attributes.pss)*.004)));
  if(badPass||intercepted){context.recordTurnover(intercepted?'badPass':'badPassOut',p,intercepted?lane:null);return null}
  log(pbpNarrative('pass',{player:p.name,target:receiver.name},step));lastPasser=p;p=receiver;machine?.transition('decision');
 }
 if(!move('shot',1))return null;return {p,lastPasser,action:'shoot',forced:true,iso:false};
}
function tendencyShotName(shot){return TENDENCY_GROUPS.flatMap(g=>g[1]).find(t=>t[0]===shot.key)?.[1].toLowerCase()||'late-clock shot'}
function playerTendencies({p}){withBasketballAttributes(p);return archetypeCard(p)+'<p class="attribute-intro">Behavior, not ability · 0–100. Higher means more frequent attempts, not better execution. These effective preferences include archetype and league modifiers. Base usage weight: '+playerUsage(p).toFixed(1)+' (normalized across the active lineup and adjusted by Usage / Touches). Close / Rim, Midrange and Three Point are relative shot-zone weights; specialized shots are selected within each zone. Drive and post-up decisions select their own finishes. Coaching and game context modify preferences.</p>'+TENDENCY_GROUPS.map(([group,items])=>playerCard(group.toUpperCase(),'<div class="attribute-list">'+items.map(([key,label])=>'<div class="attribute-row"><div><strong>'+label+'</strong><small>'+ (Math.round(tendency(p,key)*100)>=75?'Strong preference':Math.round(tendency(p,key)*100)>=50?'Often':Math.round(tendency(p,key)*100)>=25?'Occasional':'Rare / avoids')+'</small></div><meter aria-label="'+label+' tendency" min="0" max="100" value="'+Math.round(tendency(p,key)*100)+'">'+Math.round(tendency(p,key)*100)+'</meter><b>'+Math.round(tendency(p,key)*100)+'</b></div>').join('')+'</div>')).join('')}

// Existing layup, handle and IQ ratings supply touch/creativity; no hidden new ratings.
function layupOptions(p,context={}){
 const a=p.attributes,options=[{name:'Driving Layup',weight:40,skills:{lay:.75,spd:.25},block:1,adjustment:0}];
 // Running finishing requires an event opportunity; tempo alone still controls its other existing pathways.
 if(context.transitionAdvantage&&context.shotClock>=14)return [{name:'Running Layup',weight:1,skills:{lay:.8,spd:.2},block:.5,adjustment:.055}];
 if(a.lay>=75)options.push({name:'Finger Roll Layup',weight:20,skills:{lay:.85,oiq:.15},block:.9,adjustment:.01});
 if(a.drb>=80&&a.spd>=80)options.push({name:'Reverse Layup',weight:16,skills:{lay:.65,drb:.2,spd:.15},block:.65,adjustment:-.015});
 if(a.drb>=85&&a.spd>=80)options.push({name:'Eurostep Layup',weight:14,skills:{lay:.6,drb:.25,spd:.15},block:.7,adjustment:-.01});
 if(a.drb>=70&&a.spd>=70)options.push({name:'Scoop Layup',weight:18,skills:{lay:.65,drb:.2,spd:.15},block:.8,adjustment:0});
 if(context.assisted)options.push({name:'Cutting Layup',weight:20+a.oiq*.2+(context.passing||50)*.2,skills:{lay:.65,oiq:.25,spd:.1},block:.8,adjustment:.02});
 if((context.rim||0)>=80&&tendency(p,'floater')>0)options.push({name:'Floater / Tear Drop',weight:60*tendency(p,'floater'),skills:{lay:.4,fg:.35,oiq:.25},block:.55,adjustment:-.025});
 return options;
}
function contextualLayup(p,shot,context={}){
 if(shot.skill!=='lay')return shot;
 const floating=['floater','runningFloater'].includes(shot.key),variant=floating?{name:shot.key==='runningFloater'?'Running Floater':'Floater / Tear Drop',skills:{lay:.4,fg:.35,oiq:.25},block:.55,adjustment:-.025}:simWeighted(layupOptions(p,context),x=>x.weight);
 return {...shot,layup:variant.name,skills:variant.skills,blockMultiplier:variant.block,adjustment:shot.adjustment+variant.adjustment};
}
function layupRating(shot,rating){return shot.skills?Object.entries(shot.skills).reduce((n,[k,w])=>n+rating(k)*w,0):rating(shot.skill)}
function layupNarrative(type,v){const short=full=>{const parts=full.trim().split(/\s+/);return parts.length>1?parts[0][0]+'. '+parts.slice(1).join(' '):full},name=short(v.player);return type==='made'?'MADE: '+name+' '+v.shot+' ('+(v.points||2)+' PTS)'+(v.assister?' ('+short(v.assister)+' '+v.assists+' AST)':''):type==='block'?'MISS: '+name+' '+v.shot+' - blocked. '+short(v.defender)+' BLOCK ('+v.blocks+' Blk).':'MISS: '+name+' '+v.shot+'.';}
const baseTendencyShotName=tendencyShotName;tendencyShotName=function(shot){return shot.layup||baseTendencyShotName(shot)};

function dunkFinish(p,shot,context={}){
 if(shot.skill!=='dnk')return shot;
 const alley=shot.key==='alleyOop'&&context.assisted;
 return {...shot,layup:alley?'Alley Oop Dunk Shot':shot.key==='standingDunk'?'Standing Power Dunk':'Driving Dunk',alleyOop:alley,adjustment:shot.adjustment+(alley?((context.passing||50)+p.attributes.jmp+p.attributes.oiq-180)*.00035:(p.attributes.stre-60)*.0006)};
}
const layupFinishBefore=contextualLayup;contextualLayup=function(p,shot,context={}){return shot.skill==='dnk'?dunkFinish(p,shot,context):layupFinishBefore(p,shot,context)};
function putbackDunkChance(p){const a=p.attributes;return a.dnk<60||a.jmp<55?0:Math.min(.7,(a.dnk+a.jmp+a.reb+a.oiq)/600)*tendency(p,'standingDunk')*femaleDunkMultiplier(p)}
function reboundNarrative(p,row){const words=p.name.split(/\s+/),name=words[0][0]+'. '+words.slice(1).join(' ');return name+' REBOUND (Off: '+row.orb+' Def: '+row.drb+')';}

function jumperFinish(p,shot,context={}){
 const a=p.attributes,range=(lo,hi)=>rand(lo,hi);
 if(shot.layup?.includes('Floater')||shot.key==='floater'||shot.key==='runningFloater')return {...shot,layup:range(4,10)+'′ Driving Floating Jumpshot',distanceBand:'Short two',blockMultiplier:.4};
 if(!['mid','three'].includes(shot.kind))return shot;
 const three=shot.kind==='three';let name='Jumpshot',skills=three?{tp:1}:{fg:1},contestMultiplier=1,blockMultiplier=1,adjustment=shot.adjustment;
 const post=context.action==='post';
 if(post&&shot.key==='turnaround'){name='Turnaround Jumpshot';skills={post:.55,fg:.45};}
 else if(context.contested&&['postFade','fadeaway'].includes(shot.key)){name='Fadeaway Jumper';skills=three?{tp:.85,drb:.15}:{fg:.85,post:.15};contestMultiplier=.55;blockMultiplier=.7;adjustment-=Math.max(0,85-a[three?'tp':'fg'])*.001;}
 else if(context.iso&&a.drb>=85&&a.spd>=80&&Math.random()<.45){name='Step-back Jumper';skills=three?{tp:.85,drb:.15}:{fg:.85,drb:.15};contestMultiplier=.65;blockMultiplier=.8;adjustment-=.025;}
 else if(['pullup','pullupThree'].includes(shot.key)&&a.drb>=70){name='Pullup Jumper';skills=three?{tp:.85,drb:.15}:{fg:.85,drb:.15};}
 else if(context.assisted&&!context.iso&&(!context.action||context.action==='shoot')){name='Catch and Shoot Jumpshot';adjustment+=.035;}
 else if(shot.key==='runningThree'){name='Running Jumpshot';}
 const distance=three?range(24,28):name==='Turnaround Jumpshot'?range(4,16):name==='Pullup Jumper'||name==='Step-back Jumper'?range(11,21):range(4,21);
 return {...shot,layup:distance+'′ '+name,skills,adjustment,contestMultiplier,blockMultiplier,distance,distanceBand:three?'Three point':distance<=10?'Short two':distance<=16?'Mid range':'Long two'};
}
const finishBeforeJumpers=contextualLayup;contextualLayup=function(p,shot,context={}){return jumperFinish(p,finishBeforeJumpers(p,shot,context),context)};

function threePointFinish(p,shot,c={}){
 if(shot.kind!=='three')return shot;
 const selfCreated=c.iso||['pullupThree','stepbackThree'].includes(shot.key),step=c.iso&&p.attributes.drb>=85&&p.attributes.spd>=80,transition=c.earlyThree||shot.key==='runningThree'&&c.transition;
 const name=transition?'Running 3PT':step?'Stepback 3PT':selfCreated?'Pullup 3PT':'3PT',distance=rand(24,28),skills=selfCreated?{tp:.7,drb:.2,oiq:.1}:{tp:1};
 return {...shot,layup:distance+'′ '+name,distance,skills,selfCreated,adjustment:(selfCreated?-.035:0)+(c.assisted&&!selfCreated?.005+(c.passing||50)*.0001:0),contestMultiplier:c.openLook?.3:step?.6:1,blockMultiplier:c.openLook?.6:1};
}
const beforeThreeFinish=contextualLayup;contextualLayup=function(p,s,c={}){return threePointFinish(p,beforeThreeFinish(p,s,c),c)};
const beforeThreePossession=tendencyPossession;
tendencyPossession=function(offense,defense,active,c,rows,log){
 if(!leagueRules().threePointers)return beforeThreePossession(offense,defense,active,c,rows,log);
 const players=offense.roster.filter(p=>active(offense,p)),handler=players.find(p=>p.id===c.initialPlayerId)||simWeighted(players,usageWeight),others=players.filter(p=>p.id!==handler.id&&tendency(p,'three')>0),pace=coachFor(offense).tempo+(offense.id===controlledTeamId()&&state.pace==='Fast'?20:offense.id===controlledTeamId()&&state.pace==='Slow'?-20:0);
 const early=!!c.transition&&Math.random()<Math.max(0,Math.min(.65,pace/140))*tendency(handler,'three')*handler.attributes.spd/100;
 const collapse=!early&&others.length&&Math.random()<tendency(handler,'drive')*tendency(handler,'passing')*(archetypeId(handler)==='slashKick'?.60:.35);
 if(!early&&!collapse)return beforeThreePossession(offense,defense,active,c,rows,log);
 let shooter=handler,passer=null;const pass=collapse||early&&others.length&&Math.random()<tendency(handler,'passing')*.4;
 if(pass){shooter=simWeighted(others,p=>tendency(p,'three')*(30+p.attributes.tp));if(!c.machine.transition('pass',3)){c.recordTurnover('shotClock',handler);return null;}if(Math.random()<possessionTurnoverRisk(Math.max(.015,.10-handler.attributes.pss*.0008))){c.recordTurnover('badPassOut',handler);return null}passer=handler;log(handler.name+(collapse?' draws help in the paint and kicks out to ':' pushes in transition and passes to ')+shooter.name+'.');}
 if(!c.machine.transition('shot',early?3:5)){c.recordTurnover('shotClock',shooter);return null;}if(early)log(shooter.name+' pulls up for an early-clock three before the defense sets.');
 return {p:shooter,lastPasser:passer,action:'shoot',forced:false,iso:false,earlyThree:early,openLook:true,shotOverride:{kind:'three',skill:'tp',key:early?'runningThree':'three',adjustment:0}};
};

function turnoverText(type,p,row,defender,defRow){
 const short=q=>{const n=q.name.trim().split(/\s+/);return n.length>1?n[0][0]+'. '+n.slice(1).join(' '):q.name};
 const labels={badPass:'bad pass',badPassOut:'bad pass out-of-bounds',lostBall:'lost ball',lostBallOut:'lost ball out-of-bounds',travel:'traveling',doubleDribble:'Discontinued Dribble',stepOut:'step-out-of-bounds',backcourt:'backcourt',threeSeconds:'3-second-violation',charge:'offensive foul',illegalScreen:'offensive foul',offensiveFoul:'offensive foul',offBallFoul:'offensive foul'};
 const foul=['offensiveFoul','offBallFoul','charge','illegalScreen'].includes(type);
 return (foul?short(p)+(type==='offBallFoul'?' off-the-ball offensive FOUL':type==='illegalScreen'?' Illegal Screen offensive FOUL':type==='charge'?' charging offensive FOUL':' offensive FOUL')+' ('+row.pf+' PF) · ':'')+short(p)+' '+labels[type]+' TURNOVER ('+row.tov+' TO)'+(defender?' · '+short(defender)+' STEAL ('+defRow.stl+' STL)':'');
}
function handlingTurnoverType(p,action){
 const a=p.attributes,choices=[['lostBallOut',35+(100-a.drb)*.3],['travel',15+(100-a.oiq)*.15],['doubleDribble',12+(100-a.drb)*.12],['stepOut',10],['backcourt',4],['threeSeconds',action==='post'?22:2],['offensiveFoul',action==='drive'||action==='post'?25:7],['offBallFoul',7]];
 return simWeighted(choices,x=>x[1]*(['offensiveFoul','offBallFoul'].includes(x[0])?leagueRules().foulRate:1))[0];
}
function teamTurnoverCount(game,abbr,index=Infinity){return (game.teamTurnoverEvents||[]).filter(e=>e.team===abbr&&e.index<=index).length}
function readTeamTurnovers(events,bad){if(events===undefined)return [];if(!Array.isArray(events)||events.length>500||events.some(e=>!e||typeof e.team!=='string'||e.team.length>12||!Number.isInteger(e.index)||e.index<0||e.index>1600))bad('invalid team turnovers');return events.map(e=>({team:e.team,index:e.index}))}

function isolationTrigger(p,d,club,clock,random=Math.random){
 const a=p.attributes,b=d.attributes,post=a.hgt-b.hgt>=12&&a.stre-b.stre>=8&&a.post>=65;
 const perimeter=a.drb>=70&&a.spd-b.spd>=15;
 if(clock<5)return {reason:'late clock',post};
 if((post||perimeter)&&random()<.65)return {reason:'mismatch',post};
 const c=coachFor(club),slow=club.id===controlledTeamId()&&state.pace==='Slow',weight=c.system==='Grit & Grind'?.36:c.system==='Triangle'?.25:.08;
 if(random()<tendency(p,'isolation')*(weight+(slow?.14:0)))return {reason:'playbook',post:false};
 return null;
}
function isolationAdvantage(off,def,variance=0){return off('drb')*.35+off('spd')*.3+off('oiq')*.2+off('endu')*.15-(def('per')*.4+def('spd')*.25+def('diq')*.25+def('endu')*.1)+variance}
function isolationShot(p,post=false){
 if(post)return tendencyShot(p,{action:'post'});
 const drive=tendency(p,'drive'),jump=tendency(p,'pullup')+tendency(p,'pullupThree');
 if(Math.random()*(drive+jump||1)<drive)return tendencyShot(p,{action:'drive'});
 const three=Math.random()*(tendency(p,'three')+tendency(p,'midrange')||1)<tendency(p,'three');
 return {...TENDENCY_SHOTS.find(s=>s.key===(three?'pullupThree':'pullup'))};
}
