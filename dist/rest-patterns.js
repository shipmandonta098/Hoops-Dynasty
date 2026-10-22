/* Rest effects are match-local; saved ratings and completed calendar dates never change. */
let restMatch=null;
function restDays(p){return p.workload?Math.max(0,medicalStamp()-p.workload.stamp-1):null}
const restEnergyBefore=playerEnergy;
playerEnergy=function(p,club){const days=restDays(p);return days!==null&&days>=2?100:restEnergyBefore(p,club)};
function restManagedPlayer(p,club){return !!(leagueRules().restLoadManagement&&restDays(p)===0&&p.workload?.minutes>0&&playerEnergy(p,club)<70)}
const restRotationBefore=createGameRotation;
createGameRotation=function(club){const runtime=restRotationBefore(club);for(const p of club.roster){const f=b2bPlayer(p);if(f.energy){const energy=playerEnergy(p,club)*(1-f.energy);runtime.initialEnergy.set(p.id,energy);runtime.stamina.set(p.id,energy)}}return runtime};
function restQuarter(minute){if(!restMatch)return;const rust=minute<leagueRules().periodMinutes;for(const [p,entry] of restMatch.players){if(entry.rust===rust||entry.days===null||entry.days<3)continue;if(rust){entry.values={pss:p.attributes.pss,drb:p.attributes.drb};for(const key of ['pss','drb'])p.attributes[key]=Math.max(1,entry.values[key]-2)}else for(const key of ['pss','drb'])p.attributes[key]=entry.values[key];entry.rust=rust}}
const restSimBefore=simulateAttributeGame;
simulateAttributeGame=function(a,b,...args){const previous=restMatch,originals=new Map();restMatch={players:new Map(),home:a};try{for(const club of [state.teams[a],state.teams[b]])for(const p of club.roster){withBasketballAttributes(p);const days=restDays(p);restMatch.players.set(p,{days,rust:false});originals.set(p,p.attributes);p.attributes={...p.attributes};if(days===2)p.attributes.pss=Math.min(99,p.attributes.pss+1);if(days===2&&club.id===a)for(const key of ['diq','reb'])p.attributes[key]=Math.min(99,p.attributes[key]+2)}return restSimBefore(a,b,...args)}finally{for(const [p,attributes] of originals)p.attributes=attributes;restMatch=previous}};
const restPregameBefore=b2bPregameLines;
b2bPregameLines=function(club){const lines=restPregameBefore(club);for(const p of club.roster){const entry=restMatch?.players.get(p);if(restManagedPlayer(p,club))lines.push(p.name+': below 70 energy; load management targets 18 minutes, subject to healthy lineup availability.');if(entry?.days>=3)lines.push(p.name+': fully recovered after '+entry.days+' days off; passing and handling −2 for the opening period while shaking off rust.');else if(entry?.days===2)lines.push(p.name+': fully recovered after two rest days · tactical preparation adds +1 passing'+(club.id===restMatch.home?' · fresh legs add +2 defensive awareness and rebounding.':'.'))}return lines};
// Count gaps rather than empty league dates; an All-Star gap has its own category.
function restHistogram(days,calendar){const counts=[0,0,0,0,0,0];for(let i=1;i<days.length;i++){if(calendar&&days[i-1]<calendar.breakStart-1&&days[i]>calendar.breakEnd-1){counts[4]++;continue}const rest=days[i]-days[i-1]-1;counts[rest<=2?rest:rest<=4?3:5]++}return counts}
function balanceRestPatterns(career,rules=career.leagueSettings){if(rules.restDistribution===false)return;const calendar=career.schedule,n=career.teams.length,breakInfo=career.allStarCalendar,random=scheduleRandom(career.year*31337+n),blocked=d=>breakInfo&&d>=breakInfo.breakStart-1&&d<=breakInfo.breakEnd-1;
 const days=Array.from({length:n},(_,id)=>calendar.flatMap((games,d)=>games.some(g=>g.includes(id))?[d]:[]));
 const cost=ds=>{const h=restHistogram(ds,breakInfo),total=h[0]+h[1]+h[2]+h[3]+h[5];return [15,60,15,8].reduce((sum,w,i)=>sum+(h[i]-total*w/98)**2,0)+h[5]*h[5]*4};
 let costs=days.map(cost);
 // Bounded local search changes only dates, never opponents or home/away assignments.
 for(let attempt=0;attempt<12000;attempt++){const source=Math.floor(random()*calendar.length),games=calendar[source];if(!games.length||source===calendar.length-1)continue;const pair=games[Math.floor(random()*games.length)],target=source+Math.floor(random()*15)-7;if(target<0||target>=calendar.length-1||target===source||blocked(target)||pair.some(id=>days[id].includes(target)))continue;
  const proposed=pair.map(id=>days[id].filter(d=>d!==source).concat(target).sort((a,b)=>a-b));
  if(proposed.some(ds=>ds.some((d,i)=>i>1&&d===ds[i-1]+1&&d===ds[i-2]+2)))continue;
  if(career.scheduleFormat==='nba82'&&proposed.some(ds=>ds.filter((d,i)=>i&&d===ds[i-1]+1).length>16))continue;
  const next=proposed.map(cost);if(next[0]+next[1]>=costs[pair[0]]+costs[pair[1]]-.0001)continue;
  games.splice(games.indexOf(pair),1);calendar[target].push(pair);pair.forEach((id,i)=>{days[id]=proposed[i];costs[id]=next[i]});
 }
}
const restCalendarBefore=applyAllStarCalendar;
applyAllStarCalendar=function(career,rules=career.leagueSettings){restCalendarBefore(career,rules);balanceRestPatterns(career,rules)};
const restBannerBefore=seasonCalendarBanner;
seasonCalendarBanner=function(){const days=state.schedule.flatMap((games,d)=>games.some(g=>g.includes(controlledTeamId()))?[d]:[]),h=restHistogram(days,state.allStarCalendar),total=h.reduce((a,b)=>a+b,0)-h[4];return restBannerBefore()+`<details class="panel note"><summary>Your team’s rest patterns</summary><p>${['Back-to-back','1 day off','2 days off','3–4 days off','All-Star gap','Other long gaps'].map((label,i)=>label+': '+h[i]+(i!==4&&total?' ('+Math.round(h[i]/total*100)+'%)':'')).join(' · ')}</p><p>Targets: 60% standard, 15% extended, 15% back-to-back, 8% long rest. Calendar constraints take priority. Automatic fatigue load management: ${leagueRules().restLoadManagement?'enabled':'disabled'} (League Settings → Schedule).</p></details>`};
function applyAllStarRecovery(){const c=state.allStarCalendar;if(!leagueRules().allStarEnabled||!c||state.day!==c.breakEnd)return;for(const p of [...state.teams.flatMap(t=>t.roster),...state.free]){if(p.workload)p.workload.energy=100;if(p.medicalInfo?.severity==='Minor'){p.medicalInfo.until=Math.min(p.medicalInfo.until,medicalStamp());p.medicalInfo.rehabUntil=p.medicalInfo.until}}}
const restMilestoneBefore=seasonMilestoneDay;
seasonMilestoneDay=function(){restMilestoneBefore();applyAllStarRecovery()};
