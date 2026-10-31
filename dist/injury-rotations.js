/* Availability is derived, keeping the saved healthy rotation intact for recovery. */
function injuryStarters(club,depth){
 const healthy=club.roster.filter(p=>!injuryDays(p)),used=new Set(),result={};
 for(const pos of courtPositions()){const id=depth?.[pos]?.[0],p=healthy.find(p=>p.id===id);if(p&&!used.has(id)){result[pos]=id;used.add(id)}}
 for(const pos of courtPositions())if(result[pos]===undefined){
  const ranked=healthy.filter(p=>!used.has(p.id)).sort((a,b)=>{
   const score=p=>(depth?.[pos]?.[1]===p.id?2000:depth?.[pos]?.[2]===p.id?1000:0)+(p.pos===pos?500:0)+p.ovr;
   return score(b)-score(a)||a.id-b.id;
  });result[pos]=ranked[0]?.id??null;if(ranked[0])used.add(ranked[0].id);
 }
 return result;
}
function injuryMinuteAllocation(club){
 const healthy=club.roster.filter(p=>!injuryDays(p)),depth=club.rotationPlan?.depth||Object.fromEntries(courtPositions().map((pos,i)=>[pos,[club.roster[i]?.id]])),starters=new Set(Object.values(injuryStarters(club,depth)));
 const valid=rotationValid(club),minutes=new Map(club.roster.map(p=>[p.id,0]));
 for(const p of healthy)minutes.set(p.id,Math.min(gameMinutes(),Math.max(0,valid?p.rotationMinutes:Math.round(coachBaseMinutes(p,club)*gameMinutes()/48))));
 let total=[...minutes.values()].reduce((a,b)=>a+b,0);
 while(total>gamePlayerMinutes()){const p=healthy.filter(p=>minutes.get(p.id)>0).sort((a,b)=>minutes.get(b.id)-minutes.get(a.id)||a.id-b.id)[0];minutes.set(p.id,minutes.get(p.id)-1);total--}
 while(total<gamePlayerMinutes()){
  const candidates=healthy.filter(p=>minutes.get(p.id)<gameMinutes());if(!candidates.length)break;
  const weight=p=>(starters.has(p.id)?3:1)*(Math.max(1,p.ovr)/75)/(minutes.get(p.id)+1);
  candidates.sort((a,b)=>weight(b)-weight(a)||a.id-b.id);const p=candidates[0];minutes.set(p.id,minutes.get(p.id)+1);total++;
 }
 return minutes;
}
const minutesBeforeInjuryAvailability=playerMinutes;
// The allocation walks minute by minute; it is computed once per club and state (not once per player lookup), since
// older leagues carry more injuries and the per-call cost grew with them.
const injuryMinuteCache=new WeakMap();
function injuryMinuteAllocationCached(club){const sig=state.year+'|'+state.day+'|'+gameMinutes()+'|'+(club.rotationPlan?JSON.stringify(club.rotationPlan):'')+'|'+club.roster.map(p=>p.id+':'+injuryDays(p)+':'+p.rotationMinutes+':'+p.ovr).join(','),hit=injuryMinuteCache.get(club);if(hit?.sig===sig)return hit.minutes;const minutes=injuryMinuteAllocation(club);injuryMinuteCache.set(club,{sig,minutes});return minutes}
playerMinutes=function(p,club){return club?.roster.some(q=>injuryDays(q))?(injuryMinuteAllocationCached(club).get(p.id)||0):minutesBeforeInjuryAvailability(p,club)};
const planBeforeInjuryAvailability=rotationFromClub;
rotationFromClub=function(club){
 const plan=planBeforeInjuryAvailability(club);if(!club.roster.some(p=>injuryDays(p)))return plan;
 const starters=injuryStarters(club,plan.depth),healthy=club.roster.filter(p=>!injuryDays(p));
 for(const pos of ROTATION_POSITIONS){const first=starters[pos]??null;const backups=healthy.filter(p=>p.id!==first).sort((a,b)=>(b.pos===pos)-(a.pos===pos)||b.ovr-a.ovr);plan.depth[pos]=[first,backups[0]?.id??null,backups[1]?.id??null]}
 const minutes=injuryMinuteAllocation(club);for(const p of club.roster){plan.targets[p.id]=minutes.get(p.id)||0;plan.roles[p.id]=injuryDays(p)?'Reserve':Object.values(starters).includes(p.id)?'Starter':plan.roles[p.id]==='Starter'?'Role Player':plan.roles[p.id]}
 return plan;
};
const promoteBeforeInjuryAvailability=promote;
promote=function(id){if(team().roster.some(p=>p.id===id&&injuryDays(p)))return toast('This player is injured and unavailable.');return promoteBeforeInjuryAvailability(id)};
function injuryRotationAdvice(club){
 const out=club.roster.filter(p=>injuryDays(p));if(!out.length)return '';
 const healthy=club.roster.length-out.length,notes=['Injured players are inactive with 0 minutes. Healthy backups cover starting vacancies and available teammates share their minutes. Usage follows the healthy players on court.'];
 if(out.some(p=>['PF','C'].includes(p.pos)))notes.push('Frontcourt depth is reduced. Consider a smaller lineup with extra shooting.');
 if(out.some(p=>p.attributes?.per>=80||p.attributes?.rim>=80))notes.push('A key defender is out. Consider a slower pace or defensive game plan.');
 if(healthy<8)notes.push(healthy<leagueRules().courtPlayers?'Not enough healthy players to field a full lineup. Sign a replacement before playing.':'Healthy depth is low. Consider a short-term free-agent replacement.');
 return '<div class="note injury-rotation-note">'+notes.map(escapeHTML).join(' ')+' <button onclick="go(\'Free agency\')">Find replacements</button></div>';
}
