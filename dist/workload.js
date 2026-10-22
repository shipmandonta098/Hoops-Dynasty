/* Calendar recovery follows players through trades and survives save/load. */
function workloadRecovery(p,club){return Math.max(5,Math.min(18,6+p.attributes.endu*.055+p.attributes.dur*.035+coachingSkill(club,'conditioning')*.025-Math.max(0,p.age-27)*.4))}
function playerEnergy(p,club){if(!p.workload)return 100;return Math.max(0,Math.min(100,p.workload.energy+Math.max(0,medicalStamp()-p.workload.stamp)*workloadRecovery(p,club)))}
function teamBackToBack(club){return state.history.some(g=>g.stage==='Regular season'&&g.day===state.day&&(g.a===club.id||g.b===club.id))}
function workloadLoad(club){const players=club.roster.filter(p=>!injuryDays(p)),total=players.reduce((n,p)=>n+playerMinutes(p,club),0)||1;return players.reduce((n,p)=>n+(100-playerEnergy(p,club))*playerMinutes(p,club),0)/total/100}
function workloadShootingPenalty(club){return teamBackToBack(club)?Math.min(.05,.02+workloadLoad(club)*.10):0}
function workloadTargets(club,plan){
 const available=club.roster.filter(p=>!injuryDays(p)),back=teamBackToBack(club),caps=new Map();
 for(const p of club.roster){const heavy=back&&p.workload?.stamp===medicalStamp()-1&&p.workload.minutes>=28,energy=playerEnergy(p,club);caps.set(p.id,injuryDays(p)?0:restManagedPlayer(p,club)?Math.min(18,gameMinutes()):b2bManagedStar(p,club)?Math.min(26,gameMinutes()):energy<70?Math.min(28,gameMinutes()):heavy?Math.min(32,gameMinutes()):gameMinutes())}
 if(!back&&!available.some(p=>b2bPlayer(p).minutes>0)&&!available.some(p=>playerEnergy(p,club)<70))return null;
 const targets=Object.fromEntries(club.roster.map(p=>[p.id,Math.min(caps.get(p.id),plan.targets[p.id]||0)]));let remaining=gamePlayerMinutes()-Object.values(targets).reduce((a,b)=>a+b,0);
 while(remaining>0){const candidates=available.filter(p=>targets[p.id]<caps.get(p.id)).sort((a,b)=>{const score=p=>playerEnergy(p,club)-targets[p.id]*2+(plan.roles[p.id]==='Starter'?0:15);return score(b)-score(a)||b.ovr-a.ovr});if(!candidates.length)break;targets[candidates[0].id]++;remaining--}
 // A short healthy roster may have to exceed the preferred cap to field five players.
 while(remaining>0){const p=available.filter(p=>targets[p.id]<gameMinutes()).sort((a,b)=>targets[a.id]-targets[b.id])[0];if(!p)break;targets[p.id]++;caps.set(p.id,Math.max(caps.get(p.id),targets[p.id]));remaining--}
 if(remaining!==0)return null;plan.targets=targets;return caps;
}
function recordWorkload(club,result){for(const p of club.roster){const minutes=result.box.find(r=>r.playerId===p.id)?.mp||0;if(!minutes)continue;const cost=minutes*.85*(1.15-p.attributes.dur*.003)+Math.max(0,minutes-30)*.6;p.workload={energy:Math.max(15,playerEnergy(p,club)-cost),stamp:medicalStamp(),minutes}}}
function readWorkload(raw,bad){if(raw===undefined)return undefined;if(!raw||!Number.isFinite(raw.energy)||raw.energy<0||raw.energy>100||!Number.isInteger(raw.stamp)||raw.stamp< -100000||raw.stamp>4000000||!Number.isFinite(raw.minutes)||raw.minutes<0||raw.minutes>200)bad('invalid player workload.');return {energy:raw.energy,stamp:raw.stamp,minutes:raw.minutes}}
