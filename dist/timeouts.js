/* Timeouts: league rules (allotment, final-period and late-window limits, overtime, mandatory timeouts) and the coach's
   reasons. The game engine (attributes.js) asks these helpers whether a timeout is legal, charges it, and applies its
   effects (dead ball for substitutions, a short rest for the players on the floor, crowd momentum reset).
   Rules follow the NBA rulebook since 2017–18: 7 per team, no more than 4 carried into the fourth period, no more than 2
   after its 3:00 mark, 2 per team in each overtime; if neither team has called one before the period's 7:00 (6:59)
   mark, a mandatory timeout is taken at the first stoppage and charged to the home team, and the 3:00 (2:59) one to the
   team not previously charged. */
const TIMEOUT_REASONS=['run','fatigue','sloppy','clock','advance','finalPlay','lastShot'];
// Mandatory marks, as a share of the period remaining. NBA: 7:00 and 3:00 of 12 minutes. WNBA (2024 rulebook): one in
// the first and third quarters, two in the second and fourth; the exact marks are approximated at the same shares.
function timeoutMandatoryMarks(period,rules=leagueRules()){if(period>=rules.gamePeriods||rules.mandatoryTimeouts==='none')return [];const two=[7/12,3/12];if(rules.mandatoryTimeouts==='wnba')return period%2===1?two:[.5];return two}
function timeoutGameState(home=0){const r=leagueRules();return {home,remaining:[r.timeoutsPerGame,r.timeoutsPerGame],period:-1,lateCapped:false,periodMarks:[],windowTeam:[false,false],lastCharged:null,boost:null,saved:[0,0],streak:[{empty:0,turnovers:0},{empty:0,turnovers:0}],lastEnd:[null,null],
 stats:[0,1].map(()=>({called:0,mandatory:0,byReason:Object.fromEntries(TIMEOUT_REASONS.map(k=>[k,0])),byPeriod:[],unused:0})),mandatory:{taken:0,uncharged:0}}}
// Period bookkeeping from the game clock (seconds elapsed): period changes, the final-period cap, the late-window cap
// and fresh overtime allotments.
// ending: the clock reading closes a possession (a period's last second still belongs to that period).
function timeoutSync(to,seconds,ending=false){const r=leagueRules(),minute=Math.max(0,seconds/60-(ending?1e-9:0)),period=gamePeriod(minute),final=r.gamePeriods-1;
 if(period!==to.period){to.period=period;to.windowTeam=[false,false];to.periodMarks=timeoutMandatoryMarks(period,r).map(share=>({share,done:false}));
  if(period===final)to.remaining=to.remaining.map(n=>Math.min(n,r.timeoutsFourthMax));
  if(period>final)to.remaining=[r.timeoutsOvertime,r.timeoutsOvertime]}
 if(period===final&&!to.lateCapped&&gamePeriodRemaining(minute)<=r.timeoutsLateWindow+1e-9){to.lateCapped=true;to.remaining=to.remaining.map(n=>Math.min(n,r.timeoutsLateMax))}
 return period}
function timeoutAvailable(to,side,seconds,ending=false){timeoutSync(to,seconds,ending);return to.remaining[side]>0}
function timeoutCharge(to,side,reason,seconds,ending=false){const period=timeoutSync(to,seconds,ending);to.remaining[side]--;const s=to.stats[side];s.called++;s.byReason[reason]++;s.byPeriod[period]=(s.byPeriod[period]||0)+1;to.windowTeam[side]=true;to.streak[side]={empty:0,turnovers:0}}
// Before the final two minutes of regulation a coach keeps one or two timeouts for the finish (better tacticians keep
// two); voluntary timeouts get rarer once only the reserve is left.
function timeoutReserveFactor(to,side,seconds,tactics){const r=leagueRules(),minute=Math.max(0,seconds/60-1e-9),period=gamePeriod(minute),reserve=tactics>=60?2:1,lateGame=period>=r.gamePeriods-1&&gamePeriodRemaining(minute)<=2;if(lateGame)return 1;return to.remaining[side]>reserve?1:to.remaining[side]>0?.08:0}
// Mandatory timeouts: after a possession, each passed mark is satisfied by a team timeout in its window, or taken at the
// first stoppage (foul, violation, turnover) and charged to the home team first, then to the team not previously charged.
function timeoutMandatoryDue(to,seconds,stoppage){const period=timeoutSync(to,seconds,true),r=leagueRules();if(period>=r.gamePeriods)return null;const left=gamePeriodRemaining(Math.max(0,seconds/60-1e-9))*60,length=r.periodMinutes*60;
 for(const mark of to.periodMarks){if(mark.done)continue;if(left>mark.share*length+1e-6)return null;
  if(to.windowTeam[0]||to.windowTeam[1]){mark.done=true;to.lastCharged=to.windowTeam[to.home]?to.home:1-to.home;to.windowTeam=[false,false];continue}
  if(!stoppage)return null;mark.done=true;const side=to.lastCharged===null||to.lastCharged!==to.home?to.home:1-to.home;to.lastCharged=side;to.windowTeam=[false,false];
  const charged=to.remaining[side]>0;if(charged){to.remaining[side]--;to.stats[side].mandatory++}else to.mandatory.uncharged++;to.mandatory.taken++;return {side,charged}}
 return null}
function timeoutReasonText(reason,detail){return {run:'to stop '+(/^(8|11|18)\b/.test(detail)?'an ':'a ')+detail+' run',fatigue:'to give tired starters a breather',sloppy:detail==='turnovers'?'after back-to-back turnovers':'after '+detail+' straight empty possessions',clock:'to stop the clock',advance:'to advance the ball',finalPlay:'to set up a final play',lastShot:'to set up the last shot of the quarter'}[reason]}
// A timeout's short rest for the players on the floor (energy is 0–100).
const TIMEOUT_REST=4;
function timeoutRest(runtimes){for(const rt of runtimes)for(const id of rt.court)rt.stamina.set(id,Math.min(100,(rt.stamina.get(id)??100)+TIMEOUT_REST))}
// A drawn-up play after a timeout: a small shot-quality bonus for that one possession.
const TIMEOUT_PLAY_BONUS=.04;let timeoutShotBoost=null;
const shotMakeBeforeTimeouts=shotMakeProbability;
shotMakeProbability=function(base,shot,court=null,side=0,...rest){const p=shotMakeBeforeTimeouts(base,shot,court,side,...rest);return timeoutShotBoost&&timeoutShotBoost.side===side?Math.min(.99,p*(1+TIMEOUT_PLAY_BONUS)):p};
function timeoutStatsResult(to){return {teams:to.stats.map((s,i)=>({...s,byPeriod:Array.from({length:s.byPeriod.length},(_,k)=>s.byPeriod[k]||0),unused:to.remaining[i]})),mandatory:{...to.mandatory}}}
