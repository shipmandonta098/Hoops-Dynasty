/* Population targets are priors, not quotas. Existing saved players are never rerolled. */
function basketballNormal(random=Math.random){const u=Math.max(Number.EPSILON,random());return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*random())}
function generatedOverall(base=0,random=Math.random){const draw=random(),tier=draw<.20?[60,69,65]:draw<.75?[70,79,75]:draw<.95?[80,89,84]:[90,99,93];let value=tier[2];for(let attempt=0;attempt<32;attempt++){value=Math.round(tier[2]+basketballNormal(random)*2.5);if(value>=tier[0]&&value<=tier[1])break}return ratingLimit(Math.max(tier[0],Math.min(tier[1],value))+base)}
function playerUsage(p){const a=p.attributes,offense=(Math.max(a.lay,a.post)+a.fg+a.tp+a.drb)/4,specialist=p.ovr<90&&(a.pss>offense+12||Math.max(a.per,a.rim)>offense+14);return specialist?Math.max(10,Math.min(14,12+(offense-70)*.1)):p.ovr>=90?Math.max(28,Math.min(35,28+(p.ovr-90)*.8)):Math.max(15,Math.min(22,15+(p.ovr-70)*.35))}
function usageWeight(p){return playerUsage(p)*tendency(p,'touches')*archetypeProfile(p).usage}
// Matchup deltas are percentage points: +0.2 per rating point, before context and sliders.
function basketballShotProbability(shot,shooting,defense){const base={inside:.625,mid:.435,three:.31}[shot.kind];const range=shot.kind==='three'&&shooting<50?Math.max(.08,(shooting-15)/35):1;return Math.max(.02,Math.min(.98,(base+(shooting-defense)*.002)*range))}
function reboundPlayerWeight(p){const a=p.attributes;return Math.max(1,a.reb*.7+physicalReboundScore(p)*.3)*({PG:.7,SG:.8,SF:1,PF:1.2,C:1.3}[p.pos])*(.6+tendency(p,'crashGlass')*.8)}
function selectBasketballRebound(offense,defense,active,allowOffense=true,court=null){const attackers=offense.roster.filter(p=>active(offense,p)),defenders=defense.roster.filter(p=>active(defense,p)),strength=players=>players.reduce((s,p)=>s+reboundPlayerWeight(p),0)/players.length;const ratio=strength(attackers)/strength(defenders),weight=allowOffense?leagueRules().offRebTendency*ratio:0;const offensive=Math.random()<Math.max(0,Math.min(1,weight*possessionEnvironment().reboundOdds/(1+weight*possessionEnvironment().reboundOdds)+(allowOffense&&weight>0?homeCourtRebound(court,offense.id===court?.homeId):0)));return {offensive,player:simWeighted(offensive?attackers:defenders,reboundPlayerWeight)}}
function readShotDistribution(raw,bad){const result={};for(const key of ['inside','mid','three']){const x=raw?.[key];if(!x||!Number.isInteger(x.attempts)||!Number.isInteger(x.made)||x.attempts<0||x.attempts>2000||x.made<0||x.made>x.attempts)bad('invalid shot distribution');result[key]={attempts:x.attempts,made:x.made}}return result}

function readPossessionOutcomes(raw,bad){const keys=['fieldGoal','freeThrows','turnover','other'];if(!raw||keys.some(k=>!Number.isInteger(raw[k])||raw[k]<0||raw[k]>2000))bad('invalid possession outcomes');return Object.fromEntries(keys.map(k=>[k,raw[k]]))}

/* Phase 2 possession priors. Measured inputs: Basketball Reference annual team
 * averages (NBA year = start year). Translation to event hazards is a model,
 * not a quota. Sparse years use the nearest reference, explicitly exposed here.
 * Columns: FGA, FTA, ORB, DRB, TOV, PF. No saved ratings/settings are rewritten. */
const POSSESSION_REFERENCES={
 nba:{1997:[79.7,26.3,13.1,28.5,15.5,22.4],2023:[88.9,21.7,10.6,33,13.6,18.7],2024:[89.2,21.7,11.1,33,14.3,18.6]},
 wnba:{1997:[61.3,20.7,11,21.6,18.5,19.6],2006:[64.2,20.4,10.1,23.3,15.6,19.6],2023:[68.3,18.5,8,26.3,13.2,17.9],2024:[68.3,18,8.2,26.2,13.3,17.2]}
};
let possessionPriorCache=null;
function possessionEnvironment(){
 const league=state.leagueGender==='female'?'wnba':'nba',year=Number(state.year);
 if(possessionPriorCache?.league===league&&possessionPriorCache.year===year)return possessionPriorCache;
 const refs=POSSESSION_REFERENCES[league],reference=Object.keys(refs).map(Number).reduce((a,b)=>Math.abs(b-year)<Math.abs(a-year)?b:a),[fga,fta,orb,drb,tov,pf]=refs[reference],estimated=fga-orb+tov+.44*fta;
 return possessionPriorCache={league,year,reference,approximate:reference!==year,
  reboundOdds:orb/drb,turnoverScale:Math.max(.7,Math.min(2.2,(tov/estimated)/.125)),
  // Existing ordinary-path PF totals were about 0.12 per slot in the traced baseline.
  // Add the missing contact share; do not multiply the existing shooting-foul hazard.
  nonShootingRate:Math.max(.02,Math.min(.16,pf/estimated-.12)),
  shotClock:league==='wnba'&&year<2006?30:league==='nba'&&year<1954?Infinity:24,
  defensiveReset:league==='wnba'&&year<2006?(year<2004?30:20):14,
  reboundReset:year>=(league==='wnba'?2016:2018)?14:league==='wnba'&&year<2006?30:league==='nba'&&year<1954?Infinity:24};
}
function possessionTurnoverRisk(base){return Math.max(0,Math.min(.65,base*possessionEnvironment().turnoverScale))}
