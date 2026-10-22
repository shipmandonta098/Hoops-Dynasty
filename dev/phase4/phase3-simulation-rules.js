/* Shared game dimensions; completed games retain a snapshot for Courtside. */
function gameMinutes(){return leagueRules().gamePeriods*leagueRules().periodMinutes}
function gamePlayerMinutes(){return gameMinutes()*leagueRules().courtPlayers}
function courtPositions(){return leagueRules().courtPlayers===3?['PG','SF','C']:leagueRules().courtPlayers===4?['PG','SG','PF','C']:ROTATION_POSITIONS}
function gamePeriod(minute){const r=leagueRules();return minute<gameMinutes()?Math.floor(minute/r.periodMinutes):r.gamePeriods+Math.floor((minute-gameMinutes())/r.overtimeMinutes)}
function gameBoundary(minute){return minute<gameMinutes()?minute%leagueRules().periodMinutes===0:(minute-gameMinutes())%leagueRules().overtimeMinutes===0}
function gamePeriodRemaining(minute){return minute<gameMinutes()?leagueRules().periodMinutes-minute%leagueRules().periodMinutes:leagueRules().overtimeMinutes-(minute-gameMinutes())%leagueRules().overtimeMinutes}
function simulationRuleSnapshot(){return Object.fromEntries(['gamePeriods','periodMinutes','overtimeMinutes','courtPlayers','foulLimit','bonusFouls','threePointers'].map(k=>[k,leagueRules()[k]]))}
function readSimulationRules(raw,bad){const fields={gamePeriods:[1,8],periodMinutes:[1,20],overtimeMinutes:[1,10],courtPlayers:[3,5],foulLimit:[2,12],bonusFouls:[1,12]};if(!raw||typeof raw.threePointers!=='boolean'||Object.entries(fields).some(([k,[lo,hi]])=>!Number.isInteger(raw[k])||raw[k]<lo||raw[k]>hi)||raw.gamePeriods*raw.periodMinutes>60)bad('invalid game rules');return Object.fromEntries([...Object.keys(fields),'threePointers'].map(k=>[k,raw[k]]))}
function allocateGameMinutes(club,starters=new Set(club.roster.slice(0,leagueRules().courtPlayers).map(p=>p.id))){const available=club.roster.filter(p=>!injuryDays(p)),result=new Map(club.roster.map(p=>[p.id,0]));for(let i=0;i<gamePlayerMinutes();i++){const candidates=available.filter(p=>result.get(p.id)<gameMinutes());if(!candidates.length)break;const weight=p=>(starters.has(p.id)?3:1)/(result.get(p.id)+1);candidates.sort((a,b)=>weight(b)-weight(a)||b.ovr-a.ovr||a.id-b.id);const p=candidates[0];result.set(p.id,result.get(p.id)+1)}return result}
function normalizeDepthChart(plan,club){const used=new Set(courtPositions().map(pos=>plan.depth[pos][0]));for(const pos of ROTATION_POSITIONS.filter(pos=>!courtPositions().includes(pos))){const p=club.roster.find(p=>!used.has(p.id));plan.depth[pos]=[p.id,...club.roster.filter(q=>q.id!==p.id).slice(0,2).map(q=>q.id)];used.add(p.id)}}
rotationValid=function(club){return club.roster.every(p=>Number.isInteger(p.rotationMinutes)&&p.rotationMinutes>=0&&p.rotationMinutes<=gameMinutes())&&club.roster.reduce((s,p)=>s+p.rotationMinutes,0)===gamePlayerMinutes()};
const standardPlayerMinutes=playerMinutes,customMinuteCache=new WeakMap();
playerMinutes=function(p,club){if(!club)return 0;if(gameMinutes()===48&&leagueRules().courtPlayers===5)return standardPlayerMinutes(p,club);if(rotationValid(club)&&!club.roster.some(p=>injuryDays(p)))return p.rotationMinutes;return allocateGameMinutes(club).get(p.id)||0};
const legalShotWeights=tendencyShotWeights;tendencyShotWeights=function(...args){const weights=legalShotWeights(...args);return leagueRules().threePointers?weights:weights.map((w,i)=>TENDENCY_SHOTS[i].kind==='three'?0:w)};
const legalContextualShot=contextualLayup;contextualLayup=function(p,shot,c){return legalContextualShot(p,!leagueRules().threePointers&&shot.kind==='three'?{key:'pullup',kind:'mid',skill:'fg',adjustment:0}:shot,c)};

function gameInBonus(teamFouls){return teamFouls>=leagueRules().bonusFouls}

// Apply accuracy after the base probability clamps so zero remains zero.
function leagueProbability(base,key){return Math.max(0,Math.min(1,base*leagueRules()[key]))}
function shotAccuracySetting(shot){return shot.kind==='three'?'threeAccuracy':shot.skill==='dnk'?'dunkAccuracy':shot.skill==='post'||['postHook','postFade','turnaround'].includes(shot.key)?'postAccuracy':shot.skill==='lay'?'layupAccuracy':'midrangeAccuracy'}
function shotMakeProbability(base,shot,court=null,side=0){return homeCourtProbability(leagueProbability(base,shotAccuracySetting(shot)),court,side)}
function leagueAssist(base){const chance=leagueProbability(base,'assistTendency');return chance>=1||chance>0&&Math.random()<chance}
