/* One-minute planned lineups; injury, fatigue and foul overrides are game-local. */
const ROTATION_POSITIONS=['PG','SG','SF','PF','C'];
let rotationDraft=null,rotationDraftSignature='';
function rotationSignature(club){return activeSaveId+':'+state.year+':'+gameMinutes()+':'+leagueRules().courtPlayers+':'+club.key+':'+club.roster.map(p=>p.id+':'+(injuryDays(p)>0?'out':'healthy')).sort((a,b)=>a-b).join(',')}
function rotationFromClub(club){
 const ids=new Set(club.roster.map(p=>p.id)),saved=club.rotationPlan;
 const depth=Object.fromEntries(ROTATION_POSITIONS.map(pos=>[pos,(saved?.depth?.[pos]||[]).map(id=>ids.has(id)?id:null)]));
 const used=new Set();
 for(const pos of ROTATION_POSITIONS){if(depth[pos][0]===undefined||depth[pos][0]===null||used.has(depth[pos][0])){const p=club.roster.slice(0,5).find(p=>p.pos===pos&&!used.has(p.id))||club.roster.slice(0,5).find(p=>!used.has(p.id));depth[pos][0]=p?.id??null}used.add(depth[pos][0])}
 for(const pos of ROTATION_POSITIONS){const candidates=club.roster.filter(p=>p.id!==depth[pos][0]).sort((a,b)=>(b.pos===pos)-(a.pos===pos)||b.ovr-a.ovr);for(let i=1;i<3;i++)if(!ids.has(depth[pos][i])||depth[pos].slice(0,i).includes(depth[pos][i]))depth[pos][i]=candidates.find(p=>!depth[pos].includes(p.id))?.id??null;depth[pos]=depth[pos].slice(0,3)}
 return {depth,targets:Object.fromEntries(club.roster.map(p=>[p.id,playerMinutes(p,club)])),roles:Object.fromEntries(club.roster.map((p,i)=>[p.id,used.has(p.id)?'Starter':saved?.roles?.[p.id]&&saved.roles[p.id]!=='Starter'?saved.roles[p.id]:i===5?'Sixth Man':i<9?'Role Player':'Reserve'])),staggerStars:!!saved?.staggerStars,foulThreshold:saved?.foulThreshold||2};
}
function readRotationPlan(raw,club,bad){
 if(raw===undefined)return undefined;
 if(!raw||typeof raw.staggerStars!=='boolean'||![2,3].includes(raw.foulThreshold)||!raw.depth||!raw.roles)bad('invalid rotation plan.');
 const ids=new Set(club.roster.map(p=>p.id)),depth={};
 // Transactions can invalidate an old chart; use a fresh coach chart on reload.
 if(ROTATION_POSITIONS.some(pos=>Array.isArray(raw.depth[pos])&&raw.depth[pos].some(id=>id!==null&&!ids.has(id)))||club.roster.some(p=>raw.roles[p.id]===undefined))return undefined;
 for(const pos of ROTATION_POSITIONS){const line=raw.depth[pos];if(!Array.isArray(line)||line.length!==3||line.some(id=>id!==null&&!ids.has(id)))bad('invalid depth chart.');depth[pos]=[...line]}
 const starters=Object.values(depth).map(d=>d[0]);if(starters.some(id=>id===null)||new Set(starters).size!==5)bad('invalid starting five.');
 const roles={};for(const p of club.roster){const role=raw.roles[p.id];if(!['Starter','Sixth Man','Role Player','Reserve'].includes(role))bad('invalid rotation role.');roles[p.id]=role}
 return {depth,roles,staggerStars:raw.staggerStars,foulThreshold:raw.foulThreshold};
}
function draftRotation(){const sig=rotationSignature(team());if(!rotationDraft||rotationDraftSignature!==sig){rotationDraft=rotationFromClub(team());rotationDraftSignature=sig}return rotationDraft}
function syncRotationAfterLineupChange(){
 const club=team();if(club.rotationPlan){const plan=club.rotationPlan;for(let i=0;i<5;i++){const line=plan.depth[ROTATION_POSITIONS[i]],old=line[0];line[0]=club.roster[i].id;for(let j=1;j<3;j++)if(line[j]===line[0])line[j]=old===line[0]?null:old}for(const p of club.roster)plan.roles[p.id]=club.roster.indexOf(p)<5?'Starter':plan.roles[p.id]==='Starter'?'Role Player':plan.roles[p.id]||'Role Player'}rotationDraft=null;
}
function rotationErrors(plan,club){
 const mins=club.roster.map(p=>plan.targets[p.id]);
 const errors=[];if(mins.some(n=>!Number.isInteger(n)||n<0||n>gameMinutes()))errors.push('Use whole minutes from 0 to '+gameMinutes()+'.');
 if(mins.reduce((a,b)=>a+b,0)!==gamePlayerMinutes())errors.push('Allocate exactly '+gamePlayerMinutes()+' minutes.');
 const starters=courtPositions().map(pos=>plan.depth[pos][0]);if(new Set(starters).size!==leagueRules().courtPlayers||starters.some(id=>!club.roster.some(p=>p.id===id)))errors.push('Choose different players for every active starting position.');
 if(starters.some(id=>club.roster.some(p=>p.id===id&&injuryDays(p))))errors.push('Injured players cannot start.');
 if(starters.some(id=>!(plan.targets[id]>0)))errors.push('Each starter needs at least one minute.');
 if(club.roster.some(p=>plan.targets[p.id]===gameMinutes()&&!starters.includes(p.id)))errors.push('A full-game player must be a starter.');
 if(ROTATION_POSITIONS.some(pos=>{const ids=plan.depth[pos].filter(id=>id!==null);return new Set(ids).size!==ids.length}))errors.push('Use different players within each position’s depth chart.');
 if(club.roster.some(p=>injuryDays(p)&&plan.targets[p.id]>0))errors.push('Set injured players to 0 minutes before applying.');
 return errors;
}
function rotationStars(club){const score=p=>{const a=withBasketballAttributes(p).attributes;return (a.lay+a.post+a.fg+a.tp)/4};const scorer=[...club.roster].sort((a,b)=>score(b)-score(a))[0];const passer=[...club.roster].filter(p=>p!==scorer).sort((a,b)=>b.attributes.pss-a.attributes.pss)[0];return [scorer?.id,passer?.id]}
function buildRotationTimeline(club,plan){
 const remaining=new Map(club.roster.map(p=>[p.id,plan.targets[p.id]||0])),timeline=[],stars=rotationStars(club),consecutive=new Map();
 for(let minute=0;minute<gameMinutes();minute++){
  const slots=gameMinutes()-minute,mandatory=club.roster.filter(p=>remaining.get(p.id)>=slots),chosen=mandatory.map(p=>p.id);
  const candidates=club.roster.filter(p=>remaining.get(p.id)>0&&!chosen.includes(p.id)).sort((a,b)=>{
   const priority=p=>remaining.get(p.id)/slots*100+((consecutive.get(p.id)||0)>0&&(consecutive.get(p.id)||0)<6?12:-(consecutive.get(p.id)||0)*3)+(minute===0&&courtPositions().some(pos=>plan.depth[pos][0]===p.id)?1000:0);
   return priority(b)-priority(a)||b.ovr-a.ovr||a.id-b.id;
  });
  if(minute>0&&plan.staggerStars&&!chosen.some(id=>stars.includes(id))){const star=candidates.find(p=>stars.includes(p.id));if(star&&chosen.length<leagueRules().courtPlayers){chosen.push(star.id);candidates.splice(candidates.indexOf(star),1)}}
  for(const p of candidates)if(chosen.length<leagueRules().courtPlayers)chosen.push(p.id);
  if(chosen.length!==leagueRules().courtPlayers||chosen.some(id=>remaining.get(id)<=0))return [];
  for(const p of club.roster){const playing=chosen.includes(p.id);if(playing)remaining.set(p.id,remaining.get(p.id)-1);consecutive.set(p.id,playing?(consecutive.get(p.id)||0)+1:0)}
  timeline.push(chosen);
 }
 return [...remaining.values()].every(n=>n===0)?timeline:[];
}
function rotationChangeTarget(id,value){if(team().roster.some(p=>p.id===id&&injuryDays(p)))return;draftRotation().targets[id]=value===''?0:Number(value);updateRotationPreview()}
function rotationChangeDepth(pos,index,value){
 const plan=draftRotation(),id=value===''?null:Number(value),old=plan.depth[pos][index];if(team().roster.some(p=>p.id===id&&injuryDays(p)))return;
 if(index===0&&id!==null)for(const other of ROTATION_POSITIONS)if(other!==pos&&plan.depth[other][0]===id)plan.depth[other][0]=old;
 plan.depth[pos][index]=id;for(const p of team().roster){const starting=courtPositions().some(pos=>plan.depth[pos][0]===p.id);if(starting)plan.roles[p.id]='Starter';else if(plan.roles[p.id]==='Starter')plan.roles[p.id]='Role Player'}render();
}
function autoAllocateRotation(){
 const club=team(),plan=draftRotation(),healthy=club.roster.filter(p=>!injuryDays(p)).sort((a,b)=>b.ovr-a.ovr);
 if(healthy.length<leagueRules().courtPlayers)return toast('Not enough healthy players for the configured lineup.');
 const used=new Set();for(const pos of courtPositions()){const p=healthy.find(p=>p.pos===pos&&!used.has(p.id))||healthy.find(p=>!used.has(p.id));plan.depth[pos][0]=p.id;used.add(p.id)}
 const bench=healthy.filter(p=>!used.has(p.id)).slice(0,4);
 for(const p of club.roster){plan.targets[p.id]=0;plan.roles[p.id]='Reserve'}
 if(gameMinutes()===48&&leagueRules().courtPlayers===5){if(bench.length>=4){for(const id of used)plan.targets[id]=34;bench.forEach((p,i)=>plan.targets[p.id]=i<2?18:17)}else if(bench.length===3){for(const id of used)plan.targets[id]=36;bench.forEach(p=>plan.targets[p.id]=20)}else{for(const id of used)plan.targets[id]=48}}else{const allocated=allocateGameMinutes(club,used);for(const p of club.roster)plan.targets[p.id]=allocated.get(p.id)||0;}
 for(const id of used)plan.roles[id]='Starter';bench.forEach((p,i)=>plan.roles[p.id]=i===0?'Sixth Man':'Role Player');
 for(const pos of courtPositions()){const ranked=healthy.filter(p=>p.id!==plan.depth[pos][0]).sort((a,b)=>(b.pos===pos)-(a.pos===pos)||plan.targets[b.id]-plan.targets[a.id]||b.ovr-a.ovr);plan.depth[pos][1]=ranked[0]?.id??null;plan.depth[pos][2]=ranked[1]?.id??null}
 render();
}
function clearRotationMinutes(){for(const p of team().roster)draftRotation().targets[p.id]=0;render()}
function resetRotationDraft(){rotationDraft=null;render()}
async function applyRotationPlan(){
 const club=team(),plan=draftRotation(),errors=rotationErrors(plan,club);if(errors.length)return toast(errors.join(' '));
 const timeline=buildRotationTimeline(club,plan);if(timeline.length!==gameMinutes())return toast('Unable to build a valid rotation.');
 const previous=club.roster.slice(),minutes=club.roster.map(p=>p.rotationMinutes),old=club.rotationPlan;
 const starters=courtPositions().map(pos=>club.roster.find(p=>p.id===plan.depth[pos][0]));
 club.roster=[...starters,...club.roster.filter(p=>!starters.includes(p))];for(const p of club.roster)p.rotationMinutes=plan.targets[p.id];
 normalizeDepthChart(plan,club);club.rotationPlan={depth:copy(plan.depth),roles:copy(plan.roles),staggerStars:plan.staggerStars,foulThreshold:plan.foulThreshold};
 if(!await save()){club.roster=previous;previous.forEach((p,i)=>{if(minutes[i]===undefined)delete p.rotationMinutes;else p.rotationMinutes=minutes[i]});if(old===undefined)delete club.rotationPlan;else club.rotationPlan=old;return toast('Could not save. Your previous rotation is still active.')}
 rotationDraft=null;render();toast('Rotation copied to simulation and saved.');
}
function rotationTimelineHTML(plan){
 const errors=rotationErrors(plan,team());if(errors.length)return '<p class="rotation-warning">'+errors.join(' ')+'</p>';
 const timeline=buildRotationTimeline(team(),plan);if(!timeline.length)return '<p>Unable to build this rotation.</p>';
 return '<div class="rotation-timeline"><div class="rotation-time-head"><span>Player</span><div style="grid-template-columns:repeat('+leagueRules().gamePeriods+',minmax(0,1fr))">'+Array.from({length:leagueRules().gamePeriods},(_,i)=>i+1).map(q=>'<span>Q'+q+'</span>').join('')+'</div></div>'+team().roster.map(p=>'<div class="rotation-time-row"><div class="rotation-time-name" title="'+escapeHTML(p.name)+'">'+escapeHTML(p.name)+' <small>'+plan.targets[p.id]+'m</small></div><div class="rotation-quarter-grid" style="grid-template-columns:repeat('+leagueRules().gamePeriods+',minmax(0,1fr))">'+Array.from({length:leagueRules().gamePeriods},(_,i)=>i).map(q=>{const slots=timeline.slice(q*leagueRules().periodMinutes,(q+1)*leagueRules().periodMinutes),stretches=[];let start=null;for(let m=0;m<=leagueRules().periodMinutes;m++){if(m<leagueRules().periodMinutes&&slots[m].includes(p.id)){if(start===null)start=m}else if(start!==null){stretches.push((leagueRules().periodMinutes-start)+':00–'+(leagueRules().periodMinutes-m)+':00');start=null}}return '<div class="rotation-quarter" role="img" aria-label="'+escapeHTML(p.name)+' Q'+(q+1)+': '+(stretches.join(', ')||'Bench')+'" title="Q'+(q+1)+': '+(stretches.join(', ')||'Bench')+'">'+slots.map(unit=>'<i class="'+(unit.includes(p.id)?'on-court':'resting')+'"></i>').join('')+'</div>'}).join('')+'</div></div>').join('')+'</div><p class="rotation-helper"><span class="rotation-legend"></span> On court · Each segment is one minute. Fatigue, injuries and fouls can override the plan.</p>'+(plan.staggerStars?'<p class="rotation-helper">Scorer / playmaker coverage: '+timeline.filter(unit=>rotationStars(team()).some(id=>unit.includes(id))).length+' / '+gameMinutes()+' minutes. Minute limits and starters take priority.</p>':'');
}
function rotationAllocationStatus(plan){const errors=rotationErrors(plan,team()),total=Object.values(plan.targets).reduce((a,b)=>a+(b||0),0);return {total,valid:!errors.length,label:errors.length?(total<gamePlayerMinutes()?'INCOMPLETE':'INVALID'):'COMPLETE'}}
function updateRotationPreview(){
 const plan=draftRotation(),status=rotationAllocationStatus(plan);
 document.getElementById('rotation-minutes-total').textContent=status.total+' / '+gamePlayerMinutes()+' MINUTES';
 const badge=document.getElementById('rotation-allocation');badge.dataset.valid=String(status.valid);
 document.getElementById('rotation-status-label').textContent=status.label;
 document.getElementById('rotation-apply').disabled=!status.valid;
 document.getElementById('rotation-timeline-content').innerHTML=rotationTimelineHTML(plan);
 for(const badge of document.querySelectorAll('[data-rotation-minutes]'))badge.textContent=plan.targets[badge.dataset.rotationMinutes]+'m';
}
function rotationsView(){if(team().roster.length<leagueRules().courtPlayers)return '<section class="panel"><div class="panelhead"><h2>Build your roster first</h2></div><p class="note">Sign at least five players before setting rotations. Eight players are required for next season.</p><button onclick="go(\'Free agency\')">Open free agency</button></section>';
 const club=team(),plan=draftRotation(),status=rotationAllocationStatus(plan);
 const options=(value,empty=false)=>(empty?'<option value="">Unassigned</option>':'')+club.roster.filter(p=>!injuryDays(p)).map(p=>'<option value="'+p.id+'" '+(p.id===value?'selected':'')+'>'+escapeHTML(p.name)+' · '+p.pos+'</option>').join('');
 const latest=state.history.find(g=>g.a===club.id||g.b===club.id);
 const depth=courtPositions().map(pos=>'<div class="rotation-position"><strong class="rotation-position-label">'+pos+'</strong><div class="rotation-depth-fields">'+[0,1,2].map(i=>{
  const p=club.roster.find(p=>p.id===plan.depth[pos][i]),startsAt=p&&ROTATION_POSITIONS.find(position=>plan.depth[position][0]===p.id),fallback=p&&(p.pos!==pos||(i>0&&startsAt));
  return '<div class="rotation-depth-field"><div class="rotation-slot-label"><label for="depth-'+pos+'-'+i+'">'+['Starter','Primary Backup','Reserve / Deep Bench'][i]+'</label>'+(fallback?'<span class="rotation-fallback" title="'+(i>0&&startsAt?'Starts at '+startsAt+'; this is secondary coverage.':'Natural position '+p.pos+'; assigned at '+pos+'.')+'">'+(i>0&&startsAt?startsAt+' starter · Fallback':'Secondary · '+p.pos+' → '+pos)+'</span>':'')+'</div><div class="rotation-selection"><select id="depth-'+pos+'-'+i+'" class="rotation-depth-select" aria-label="'+pos+' '+['starter','backup','reserve'][i]+'" onchange="rotationChangeDepth(\''+pos+'\','+i+',this.value)">'+options(plan.depth[pos][i],i>0||plan.depth[pos][i]===null)+'</select><span class="rotation-assigned-minutes" '+(p?'data-rotation-minutes="'+p.id+'"':'')+' title="Total player minutes across all positions">'+(p?plan.targets[p.id]+'m':'—')+'</span></div></div>';
 }).join('')+'</div></div>').join('');
 return '<div class="rotations-page"><section class="panel rotation-management"><div class="panelhead"><div><h2>Rotation Management</h2><span class="muted">'+escapeHTML(club.city+' '+club.name)+(teamBackToBack(club)?' · Back-to-back: lighter game-day loads':'')+'</span></div><div class="rotation-allocation" id="rotation-allocation" data-valid="'+status.valid+'" role="status" aria-live="polite"><strong id="rotation-minutes-total">'+status.total+' / '+gamePlayerMinutes()+' MINUTES</strong><small id="rotation-status-label">'+status.label+'</small></div></div><div class="rotation-control-body"><div class="rotation-actions"><button onclick="autoAllocateRotation()">Auto-Allocate Minutes</button><button onclick="clearRotationMinutes()">Clear All</button><button class="primary" id="rotation-apply" onclick="applyRotationPlan()" '+(!status.valid?'disabled':'')+'>Copy to Simulation</button><button onclick="resetRotationDraft()">Reset Draft</button></div><div class="rotation-settings"><label><input type="checkbox" '+(plan.staggerStars?'checked':'')+' onchange="draftRotation().staggerStars=this.checked;updateRotationPreview()"> Stagger Stars</label><label>Q1 foul threshold <select aria-label="Q1 foul threshold" onchange="draftRotation().foulThreshold=Number(this.value)">'+[2,3].map(n=>'<option '+(plan.foulThreshold===n?'selected':'')+'>'+n+'</option>').join('')+'</select></label><span class="muted">Sit until halftime</span></div><p class="rotation-helper">Draft changes take effect when copied to simulation. Player minutes are shared across all assigned positions.</p></div></section><section class="panel"><div class="panelhead"><h2>Starting Lineup &amp; Depth</h2></div><div class="rotation-depth">'+depth+'</div>'+injuryRotationAdvice(club)+'</section><section class="panel"><div class="panelhead"><h2>Minutes &amp; Roles</h2></div><div class="rotation-roster"><div class="rotation-player-row rotation-column-head" aria-hidden="true"><span>Player</span><span>Pos</span><span>Role</span><span>Min</span><span>Stamina</span></div>'+club.roster.map(p=>{const last=latest?.box.find(b=>b.playerId===p.id);return '<div class="rotation-player-row '+(injuryDays(p)?'injured-player':'')+'"><div class="rotation-player-name"><button class="namebutton" onclick="profile('+p.id+')">'+escapeHTML(p.name)+'</button><small>'+(injuryDays(p)?'Inactive / IR · '+injuryDays(p)+' days':'Available')+(Number.isFinite(last?.mp)?' · Last game '+last.mp.toFixed(1)+'m':'')+'</small></div><span class="rotation-player-pos">'+p.pos+'</span><label class="rotation-role"><span class="rotation-mobile-label">Role</span><select '+(injuryDays(p)?'disabled':'')+' aria-label="Role for '+escapeHTML(p.name)+'" onchange="draftRotation().roles['+p.id+']=this.value">'+(courtPositions().some(pos=>plan.depth[pos][0]===p.id)?['Starter']:['Sixth Man','Role Player','Reserve']).map(r=>'<option '+(plan.roles[p.id]===r?'selected':'')+'>'+ (r==='Sixth Man'?'Sixth Player':r)+'</option>').join('')+'</select></label><label class="rotation-player-min"><span class="rotation-mobile-label">Min</span><input class="rotation-minute-input" aria-label="Target minutes for '+escapeHTML(p.name)+'" type="number" '+(injuryDays(p)?'disabled':'')+' min="0" max="'+gameMinutes()+'" step="1" value="'+plan.targets[p.id]+'" oninput="rotationChangeTarget('+p.id+',this.value)"></label><div class="rotation-stamina"><span class="rotation-mobile-label">Stamina</span>'+ratingMarkup(p.attributes.endu)+'<small>'+Math.round(playerEnergy(p,club))+'% energy</small>'+'</div></div>'}).join('')+'</div></section><details class="panel rotation-plan" open><summary class="panelhead"><h2>Planned Playing Time</h2><span class="muted">'+gameMinutes()+'-minute plan</span></summary><div class="rotation-plan-body" id="rotation-timeline-content">'+rotationTimelineHTML(plan)+'</div></details></div>';
}
function createGameRotation(club){
 const plan=rotationFromClub(club);plan.targets=Object.fromEntries(club.roster.map(p=>[p.id,playerMinutes(p,club)]));
 const workloadCaps=workloadTargets(club,plan),timeline=buildRotationTimeline(club,plan);
 return {plan,timeline,workloadCaps,initialEnergy:new Map(club.roster.map(p=>[p.id,playerEnergy(p,club)])),court:new Set(),stamina:new Map(club.roster.map(p=>[p.id,playerEnergy(p,club)])),consecutive:new Map(),held:new Map(),minute:0};
}
function rotationEligible(p,runtime,rows,minute){return !injuryDays(p)&&!rows.get(p.id).ejected&&(rows.get(p.id).pf||0)<leagueRules().foulLimit&&(runtime.held.get(p.id)||0)<=minute}
function refreshGameRotation(club,runtime,minute,rows,events,margin=0){
 runtime.minute=minute;
 const clutch=minute>=Math.max(0,gameMinutes()-5)&&Math.abs(margin)<=10,blowout=minute>=gameMinutes()*.75&&minute<gameMinutes()&&Math.abs(margin)>=20;
 const quarter=gamePeriod(minute)+1,remaining=gamePeriodRemaining(minute);
 const trouble=p=>!clutch&&remaining>2&&(rows.get(p.id).pf||0)>=quarter+1;
 const starters=new Set(courtPositions().map(pos=>runtime.plan.depth[pos][0]));
 const forced=[...runtime.court].some(id=>(restManagedPlayer(club.roster.find(p=>p.id===id),club)&&runtime.workloadCaps&&(rows.get(id).mp||0)>=runtime.workloadCaps.get(id))||!rotationEligible(club.roster.find(p=>p.id===id),runtime,rows,minute));
 const boundary=minute!==runtime.lastCheck&&(gameBoundary(minute));
 const contextChanged=clutch!==runtime.clutch||blowout!==runtime.blowout;
 if(runtime.court.size===leagueRules().courtPlayers&&!forced&&!boundary&&!contextChanged&&minute-runtime.lastCheck<2&&!(runtime.deadBall&&minute-runtime.lastCheck>=1))return;
 runtime.lastCheck=minute;runtime.deadBall=false;runtime.clutch=clutch;runtime.blowout=blowout;
 if(blowout&&!runtime.blowoutLogged&&events.length<120){events.push(club.abbr+': late blowout; prioritizing bench minutes to preserve legs.');runtime.blowoutLogged=true}
 const planned=runtime.timeline[Math.min(gameMinutes()-1,Math.floor(minute))]||[];
 let eligible=club.roster.filter(p=>rotationEligible(p,runtime,rows,minute));
 const underCap=eligible.filter(p=>(!restManagedPlayer(p,club)&&(clutch||minute>=gameMinutes()))||!runtime.workloadCaps||(rows.get(p.id).mp||0)<runtime.workloadCaps.get(p.id));
 if(underCap.length>=leagueRules().courtPlayers)eligible=underCap;
 // Foul holds may be relaxed only when needed to field five; injuries and six fouls are never ignored.
 if(eligible.length<leagueRules().courtPlayers)eligible=club.roster.filter(p=>!injuryDays(p)&&!rows.get(p.id).ejected&&(rows.get(p.id).pf||0)<leagueRules().foulLimit);
 if(eligible.length<leagueRules().courtPlayers){const error=Error('Not enough eligible players to field the configured lineup.');error.code='LINEUP_UNAVAILABLE';error.clubId=club.id;throw error;}
 const safe=eligible.filter(p=>!trouble(p));if(safe.length>=leagueRules().courtPlayers)eligible=safe;
 if(blowout){const bench=eligible.filter(p=>!starters.has(p.id));if(bench.length>=leagueRules().courtPlayers)eligible=bench;}
 const active=[],starPair=[...club.roster].sort((a,b)=>(b.attributes.pss+b.ovr)-(a.attributes.pss+a.ovr)).slice(0,1).concat([...club.roster].sort((a,b)=>b.ovr-a.ovr).slice(0,1)).map(p=>p.id);
 const maxStint=6+coachingSkill(club,'rotation')/50;
 for(const pos of courtPositions()){
  const depth=runtime.plan.depth[pos]||[];
  const score=p=>{
   const energy=runtime.stamina.get(p.id),stint=runtime.consecutive.get(p.id)||0;
   const fallback=ROTATION_POSITIONS.some(k=>k===pos&&runtime.plan.depth[k].includes(p.id));
   return (p.pos===pos?100:fallback?60:Math.abs(ROTATION_POSITIONS.indexOf(p.pos)-ROTATION_POSITIONS.indexOf(pos))===1?20:-40)
    +(depth[0]===p.id?12:depth[1]===p.id?25:depth[2]===p.id?10:0)
    +(clutch?(starters.has(p.id)?1000:0)+p.ovr*2:energy+(energy>=90?25:0)-(energy<70?160:0)-(stint>=maxStint?140:0))
    +(blowout&&!starters.has(p.id)?500:0)+(planned.includes(p.id)?70:0)
    +Math.max(-40,Math.min(40,((runtime.plan.targets[p.id]||0)-(rows.get(p.id).mp||0))*2))
    -(trouble(p)?200:0)+(runtime.court.has(p.id)?10:0)-altitudeRotationPenalty(p,club,runtime,clutch)
    +(runtime.plan.staggerStars&&!active.some(id=>starPair.includes(id))&&starPair.includes(p.id)?45:0);
  };
  const candidates=eligible.filter(p=>!active.includes(p.id)).sort((a,b)=>score(b)-score(a)||b.ovr-a.ovr||a.id-b.id);
  active.push(candidates[0].id);
 }
 const incoming=active.filter(id=>!runtime.court.has(id)),outgoing=[...runtime.court].filter(id=>!active.includes(id));
 if(outgoing.length&&events.length<120){const names=ids=>ids.map(id=>club.roster.find(p=>p.id===id).name).join(', ');const reason=blowout?'garbage time':clutch?'closing lineup':outgoing.some(id=>(rows.get(id).pf||0)>=leagueRules().foulLimit)?'foul out':outgoing.some(id=>trouble(club.roster.find(p=>p.id===id))||(runtime.held.get(id)||0)>minute)?'foul trouble':outgoing.some(id=>runtime.stamina.get(id)<70)?'fatigue':outgoing.some(id=>(runtime.consecutive.get(id)||0)>=maxStint)?'stint rest':'planned rotation';events.push(club.abbr+': '+names(incoming)+' in; '+names(outgoing)+' out ('+reason+').');}
 runtime.court=new Set(active);runtime.positions=Object.fromEntries(courtPositions().map((pos,i)=>[pos,active[i]]));
}
function accrueRotationMinutes(club,runtime,rows,dt){
 for(const p of club.roster){const active=runtime.court.has(p.id),row=rows.get(p.id);if(active){row.played=true;row.mp+=dt}
 const stamina=runtime.stamina.get(p.id)+(active?-(1.2+(100-p.attributes.endu)*.025)*(1-coachingSkill(club,'rotation')/300)*durabilityFatigueMultiplier(p)*altitudeDrain(p,club,runtime)*(1+(b2bPlayer(p).drain||0))*(0.9+coachFor(club).tempo/500+(club.id===controlledTeamId()&&state.pace==='Fast'?.08:club.id===controlledTeamId()&&state.pace==='Slow'?-.06:0)):3.2*durabilityRecoveryMultiplier(p)*altitudeRecovery(p,club,runtime))*dt;
 runtime.stamina.set(p.id,Math.max(0,Math.min(runtime.initialEnergy.get(p.id),stamina)));runtime.consecutive.set(p.id,active?(runtime.consecutive.get(p.id)||0)+dt:0)}
}
function recordRotationFoul(p,club,runtime,rows,events){
 const row=rows.get(p.id);row.pf++;if(row.pf===leagueRules().foulLimit)row.dq=1;runtime.deadBall=true;
 if(row.pf===runtime.plan.foulThreshold&&runtime.minute<leagueRules().periodMinutes){runtime.held.set(p.id,Math.floor(leagueRules().gamePeriods/2)*leagueRules().periodMinutes);if(events.length<120)events.push(p.name+' ('+club.abbr+') has '+row.pf+' first-quarter fouls and sits until halftime.')}
 if(row.pf===leagueRules().foulLimit&&events.length<120)events.push(p.name+' ('+club.abbr+') fouls out.');
}
