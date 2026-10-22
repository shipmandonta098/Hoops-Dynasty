/* Half-court two-on-two decisions. Ratings are derived from existing save fields.
   This module selects a shot/matchup; the shared engine alone awards baskets/stats. */
const PNR_COVERAGES=['drop','hedge','switch','blitz'];
const pnrClamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function pnrRatings(p){const a=p.attributes;return {screening:a.stre*.85+a.oiq*.15,roll:a.lay*.55+a.spd*.25+a.oiq*.2,hands:pnrClamp((a.drb*.6+a.oiq*.4)*playerBuild(p).reachFactor,1,99)}}
function pnrScreen(screener,onBall,discipline=70,random=Math.random){
 const screening=pnrRatings(screener).screening;
 const illegal=pnrClamp(.025+(65-screening)*.00035+(65-discipline)*.0002,.006,.065);
 if(random()<leagueProbability(illegal,'foulRate'))return {quality:'illegal',edge:0,boost:0};
 const edge=screening+1+Math.floor(random()*20)-(onBall.attributes.per*.8+onBall.attributes.spd*.2+1+Math.floor(random()*20));
 return {quality:edge>5?'excellent':'soft',edge,boost:edge>5?14:4};
}
function pnrCoverageWeights(defense,onBall,big,screen){
 const c=coachFor(defense),a=big.attributes,pressure=defense.id===controlledTeamId()&&state.focus==='Defense'?1.25:1;
 return {drop:(30+a.rim*.35)*(c.system==='Grit & Grind'?1.4:1),hedge:(15+a.diq*.2+c.attributes.tactics*.1)*(screen.quality==='excellent'?1.25:1),switch:(10+a.spd*.3+onBall.attributes.rim*.1)*(c.system==='Pace & Space'?1.3:1),blitz:(8+c.attributes.defense*.13+onBall.attributes.stl*.12)*pressure};
}
function pnrActionWeights(handler,screener,onBall,big,coverage,screen){
 const a=handler.attributes,s=screener.attributes,roll=pnrRatings(screener).roll,passing=tendency(handler,'passing');
 return {pullup:(a.fg*.7+a.drb*.3)*tendency(handler,'pullup')*(coverage==='drop'?1.9:coverage==='blitz'?.3:.7),drive:(a.lay*.55+a.drb*.25+a.spd*.2)*tendency(handler,'drive')*(coverage==='drop'?.75:coverage==='blitz'?.3:1.05)*(1+Math.max(0,a.spd-big.attributes.spd)/100),roll:(a.pss*.5+roll*.5)*passing*archetypeProfile(screener).roll*(coverage==='hedge'||coverage==='blitz'?2:coverage==='switch'?1.5:1),pop:leagueRules().threePointers&&s.tp>=70?(a.pss*.45+s.tp*.55)*passing*archetypeProfile(screener).pop*tendency(screener,'three')*(coverage==='drop'||coverage==='blitz'?1.7:1.25):0};
}
function pnrMatch(defenders,player,excluded=null){const options=defenders.filter(p=>p.id!==excluded);return simWeighted(options,p=>p.pos===player.pos?6:Math.abs(ROTATION_POSITIONS.indexOf(p.pos)-ROTATION_POSITIONS.indexOf(player.pos))===1?3:1)}
function pnrPhrase(choices){return choices[Math.floor(Math.random()*choices.length)]}
function playPickAndRoll(handler,screener,onBall,big,offense,defense,defenders,context,log){
 const machine=context.machine,advance=(phase,seconds)=>{if(machine.transition(phase,seconds))return true;context.recordTurnover('shotClock',handler);return false};
 if(!advance('decision',3))return null;
 const screen=pnrScreen(screener,onBall,coachFor(offense).attributes.discipline);
 if(screen.quality==='illegal'){context.recordTurnover('illegalScreen',screener);return null}
 const weights=pnrCoverageWeights(defense,onBall,big,screen),coverage=simWeighted(PNR_COVERAGES,k=>weights[k]);
 const screened=screen.quality==='excellent';
 log(screener.name+(screened?' sets a hard pick, taking ':' sets a soft pick; ')+onBall.name+(screened?' out of the initial action.':' fights through and recovers.'));
 const coverageText={drop:big.name+' drops toward the paint, conceding space for a pull-up.',hedge:big.name+' hedges toward the ball while '+onBall.name+' recovers.',switch:big.name+' switches onto '+handler.name+'; '+onBall.name+' takes the screener.',blitz:big.name+' and '+onBall.name+' blitz '+handler.name+', leaving a passing outlet.'};
 log('Pick-and-roll: '+coverageText[coverage]);
 const a=handler.attributes,b=big.attributes,o=onBall.attributes;
 if(coverage==='blitz'){
  const risk=pnrClamp(.10+((o.stl+b.stl)/2-a.drb)*.002+(b.diq-a.pss)*.001+(b.spd-a.spd)*.0005,.02,.32);
  if(Math.random()<possessionTurnoverRisk(leagueProbability(risk,'stealTendency'))){context.recordTurnover('lostBall',handler,simWeighted([onBall,big],p=>p.attributes.stl));return null}
 }
 const actions=pnrActionWeights(handler,screener,onBall,big,coverage,screen),choices=Object.keys(actions);
 const choice=choices.some(k=>actions[k]>0)?simWeighted(choices,k=>actions[k]):'pullup';
 let shooter=handler,passer=null,defender=big,openLook=false,forced=false,action='shoot',shot,shotAdjustment=0;
 if(choice==='roll'||choice==='pop'){
  if(!advance('pass',3))return null;
  const lanes=[onBall,big,...defenders.filter(p=>p.id!==onBall.id&&p.id!==big.id)],interceptor=simWeighted(lanes,p=>(p.attributes.stl*.65+p.attributes.diq*.35)*(.2+tendency(p,'passLane')));
  const passRisk=pnrClamp(.045+(interceptor.attributes.stl*.6+interceptor.attributes.diq*.4-a.pss)*.002+(coverage==='blitz'?.035:0)-(screened?.012:0),.008,.25);
  if(Math.random()<possessionTurnoverRisk(leagueProbability(passRisk,'stealTendency'))){context.recordTurnover('badPass',handler,interceptor);return null}
  const catchRisk=pnrClamp(.015+(70-pnrRatings(screener).hands)*.001+(70-a.pss)*.00035,.004,.13);
  if(Math.random()<possessionTurnoverRisk(catchRisk)){log(screener.name+' bobbles the pass out of bounds.');context.recordTurnover('lostBallOut',screener);return null}
  shooter=screener;passer=handler;
  const helpers=defenders.filter(p=>p.id!==onBall.id&&p.id!==big.id),help=helpers.length?simWeighted(helpers,p=>p.attributes.diq*.5+p.attributes.rim*.3+p.attributes.spd*.2):big;
  if(choice==='pop'){
   defender=coverage==='switch'?onBall:big;
   openLook=coverage==='drop'||coverage==='blitz'||Math.random()>pnrClamp((defender.attributes.spd+defender.attributes.diq)/220,.1,.9);
   shot={key:'three',kind:'three',skill:'tp',adjustment:0};
   log(screener.name+' pops to the arc. '+handler.name+' '+pnrPhrase(['whips it back to','feeds','fires a pass to'])+' '+screener.name+' for '+(openLook?'an open':'a contested')+' three-point look.');
  }else{
   const rotationChance=pnrClamp((help.attributes.diq+help.attributes.spd+help.attributes.rim)/330-(screened?.12:0),.12,.85);
   const helpArrives=Math.random()<rotationChance;
   defender=helpArrives?help:coverage==='switch'?onBall:big;
   openLook=!helpArrives&&(coverage==='hedge'||coverage==='blitz');
   const dunk=screener.attributes.dnk>=60&&Math.random()<tendency(screener,'drivingDunk')*femaleDunkMultiplier(screener);
   shot={key:dunk?'drivingDunk':'drivingLayup',kind:'inside',skill:dunk?'dnk':'lay',adjustment:0};
   shotAdjustment=pnrClamp((pnrRatings(screener).roll-defender.attributes.rim)*.0006,-.035,.035);
   log(handler.name+' '+pnrPhrase(['drops a pocket pass to','dishes to','slips a bounce pass to','feeds'])+' '+screener.name+' rolling hard to the rim'+(helpArrives?', where '+help.name+' rotates to help.':'.'));
  }
 }else if(choice==='drive'){
  action='drive';if(!advance('drive',3))return null;
  const reject=!screened&&a.spd>o.spd&&Math.random()<.35;
  defender=reject?onBall:big;
  const recover=pnrClamp((defender.attributes.spd+defender.attributes.diq-a.spd-screen.boost)/180,.05,.8);
  openLook=Math.random()>recover&&coverage!=='drop';
  shot={key:'drivingLayup',kind:'inside',skill:'lay',adjustment:0};
  shotAdjustment=pnrClamp((a.drb+a.spd-defender.attributes.per-defender.attributes.spd+screen.boost)*.0006+(a.lay-defender.attributes.rim)*.0008,-.08,.07);
  log(handler.name+(reject?' rejects the screen and bursts past '+onBall.name:pnrPhrase([' turns the corner off the pick',' snakes around the screen',' drives off the screen']))+' toward the rim.');
 }else{
  defender=screened||coverage!=='drop'?big:onBall;
  openLook=coverage==='drop'&&(screened||a.drb+screen.boost>onBall.attributes.per);
  forced=coverage==='blitz';shot={key:'pullup',kind:'mid',skill:'fg',adjustment:0};
  log(handler.name+(coverage==='drop'?' reads the drop and pulls up for an elbow jumper.':' uses the pick and rises for a pull-up jumper.'));
 }
 if(!advance('shot',3))return null;
 // All boosts are possession-local, never written back to player ratings.
 return {p:shooter,lastPasser:passer,action,forced,iso:false,openLook,shotOverride:shot,defenderId:defender.id,pickAndRoll:{coverage,choice,screen:screen.quality,handlerId:handler.id,screenerId:screener.id,onBallId:onBall.id,bigId:big.id,boost:shooter===handler?screen.boost:0,shotAdjustment}};
}
const possessionBeforePickAndRoll=tendencyPossession;
tendencyPossession=function(offense,defense,active,context,rows,log){
 const attackers=offense.roster.filter(p=>active(offense,p)),defenders=defense.roster.filter(p=>active(defense,p));
 if(context.transition||!context.machine||context.machine.phase!=='decision'||context.machine.shotClock<10||attackers.length<2||defenders.length<2)return possessionBeforePickAndRoll(offense,defense,active,context,rows,log);
 const coach=coachFor(offense),frequency=coach.system==='Pace & Space'?.32:coach.system==='Grit & Grind'?.23:coach.system==='Triangle'?.16:.27;
 if(Math.random()>=Math.min(1,frequency*leagueRules().pickAndRollRate*(attackers.some(p=>archetypeId(p)==='slashKick')?1.3:1)))return possessionBeforePickAndRoll(offense,defense,active,context,rows,log);
 const handler=attackers.find(p=>p.id===context.initialPlayerId)||simWeighted(attackers,p=>(p.attributes.drb*.55+p.attributes.pss*.45)*usageWeight(p)/20*archetypeProfile(p).pnr*(['PG','SG'].includes(p.pos)?1.7:1));
 const screener=simWeighted(attackers.filter(p=>p.id!==handler.id),p=>pnrRatings(p).screening*(['PF','C'].includes(p.pos)?2:1));
 const onBall=pnrMatch(defenders,handler),big=pnrMatch(defenders,screener,onBall.id);
 return playPickAndRoll(handler,screener,onBall,big,offense,defense,defenders,context,log);
};
