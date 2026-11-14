/* Position-based starting lineups. For each court position (PG, SG, SF, PF, C, or courtPositions() in smaller
   formats) the starting five is the best-total assignment of healthy players, where a player's value at a spot is his
   OVR plus a bounded positional preference (lineupSlotBonus): +4 at the main position, +3 at the secondary position,
   and otherwise from how well his ratings and height fit that spot: up to +2 for a near fit (a big wing at PF), down to
   −8 for a poor one (a point guard at center). So a natural fit wins close calls (within about 4 OVR), a clearly better player starts out of
   position (an 80 point guard over a 74 shooting guard), and small-ball or big lineups form when the talent is there. This only
   chooses starters; the game engine has no out-of-position performance penalty (attributes already cover size,
   spacing, rebounding and rim protection).
   Teams are 'auto' (CPU teams, and the user's team until the user sets starters) or 'manual' (team.lineupMode).
   Before every game an auto team's roster is put in lineup order (starters by position, then the bench by OVR), so
   roster screens, roles and the minutes model all agree; its rotation plan uses the same starters. Manual lineups are
   left alone and show a warning for out-of-position starters. */
const LINEUP_MAIN_BONUS=4,LINEUP_SECONDARY_BONUS=3,LINEUP_FIT_BONUS_MAX=2,LINEUP_FIT_BONUS_MIN=-8;
function lineupSlotBonus(p,pos){const rank=positionRank(p,pos);if(rank===2)return LINEUP_MAIN_BONUS;if(rank===1)return LINEUP_SECONDARY_BONUS;if(!p.attributes)return LINEUP_FIT_BONUS_MIN;
 const gap=Math.max(0,playerPositionFit(p,p.pos)-playerPositionFit(p,pos));return Math.max(LINEUP_FIT_BONUS_MIN,Math.min(LINEUP_FIT_BONUS_MAX,4-gap/2))}
// Exact ties go to the player at his main position.
function lineupSlotValue(p,pos){return p.ovr+lineupSlotBonus(p,pos)+(p.pos===pos?.01:0)}
function lineupHealthy(club){return club.roster.filter(p=>!injuryDays(p))}
// Exact best assignment (highest total slot value) by dynamic programming over players and the set of filled spots (2^5 states).
function lineupAssignment(club,players=lineupHealthy(club)){const spots=courtPositions(),full=(1<<spots.length)-1,order=[...players].sort((a,b)=>b.ovr-a.ovr||a.id-b.id);
 let dp=new Map([[0,{value:0,pick:[]}]]);
 for(const p of order){const next=new Map(dp),values=spots.map(pos=>lineupSlotValue(p,pos));for(const [mask,s] of dp)for(let i=0;i<spots.length;i++){if(mask&(1<<i))continue;const value=s.value+values[i],m=mask|(1<<i),cur=next.get(m);if(!cur||value>cur.value)next.set(m,{value,pick:[...s.pick,[spots[i],p.id]]})}dp=next}
 const best=dp.get(full)||[...dp.entries()].sort((a,b)=>b[1].pick.length-a[1].pick.length||b[1].value-a[1].value)[0]?.[1]||{pick:[]};
 const result=Object.fromEntries(best.pick);
 // Not enough healthy players: fill the remaining spots from the injured, best OVR first.
 if(Object.keys(result).length<spots.length){const used=new Set(Object.values(result)),rest=club.roster.filter(p=>!used.has(p.id)).sort((a,b)=>b.ovr-a.ovr||a.id-b.id);for(const pos of spots)if(result[pos]===undefined&&rest.length)result[pos]=rest.shift().id}
 return result}
function lineupAuto(club){return club?.lineupMode!=='manual'}
// Starters whose main and secondary positions don't include their spot.
function lineupOutOfPosition(club,starters){return Object.entries(starters).filter(([pos,id])=>{const p=club.roster.find(p=>p.id===id);return p&&positionRank(p,pos)===0}).map(([pos,id])=>({pos,p:club.roster.find(p=>p.id===id)}))}
function lineupStartersFromRoster(club){return Object.fromEntries(courtPositions().map((pos,i)=>[pos,club.roster[i]?.id]))}
// Puts an auto team's roster in lineup order. Returns true when the order changed.
function applyAutoLineup(club){if(!club||!lineupAuto(club)||club.roster.length<courtPositions().length)return false;const starters=lineupAssignment(club),ids=courtPositions().map(pos=>starters[pos]),first=ids.map(id=>club.roster.find(p=>p.id===id)).filter(Boolean);
 const bench=club.roster.filter(p=>!ids.includes(p.id)).sort((a,b)=>(injuryDays(a)>0)-(injuryDays(b)>0)||b.ovr-a.ovr||a.id-b.id),order=[...first,...bench];
 if(order.every((p,i)=>club.roster[i]===p))return false;club.roster.splice(0,club.roster.length,...order);if(typeof rotationDraft!=='undefined'&&club===team())rotationDraft=null;return true}
function applyAutoLineups(data=state){for(const t of data.teams||[])applyAutoLineup(t)}
// Rotation plans: an auto team starts its position lineup; backups and roles follow it.
const rotationBeforeLineups=rotationFromClub;
rotationFromClub=function(club,...args){const plan=rotationBeforeLineups(club,...args);if(!lineupAuto(club))return plan;
 const starters=lineupAssignment(club),healthy=lineupHealthy(club),ids=new Set(Object.values(starters));
 const backups=rotationBackups(starters,healthy,plan.targets);for(const pos of courtPositions()){const line=backups[pos];plan.depth[pos]=[starters[pos]??null,line[0],line[1]]}
 const bench=club.roster.filter(p=>!ids.has(p.id)).sort((a,b)=>(injuryDays(a)>0)-(injuryDays(b)>0)||b.ovr-a.ovr||a.id-b.id);
 for(const p of club.roster)plan.roles[p.id]=ids.has(p.id)?'Starter':injuryDays(p)?'Reserve':bench.indexOf(p)===0?'Sixth Man':bench.indexOf(p)<4?'Role Player':'Reserve';
 return plan};
// Before every game both teams' auto lineups are set (injuries and roster moves change them day to day).
const playBeforeLineups=play;
play=function(a,b,...args){applyAutoLineup(state.teams[a]);applyAutoLineup(state.teams[b]);return playBeforeLineups(a,b,...args)};
// Setting starters by hand switches the user's team to a manual lineup.
function lineupSetManual(club=team()){if(club)club.lineupMode='manual'}
const promoteBeforeLineups=promote;promote=function(...args){const club=team(),before=club.roster.slice(0,5).map(p=>p.id).join();const r=promoteBeforeLineups(...args);if(club.roster.slice(0,5).map(p=>p.id).join()!==before)lineupSetManual(club);return r};
const lineupActionBeforeLineups=playerLineupAction;playerLineupAction=function(...args){const club=team(),before=club.roster.slice(0,5).map(p=>p.id).join();const r=lineupActionBeforeLineups(...args);if(club.roster.slice(0,5).map(p=>p.id).join()!==before)lineupSetManual(club);return r};
const applyPlanBeforeLineups=applyRotationPlan;applyRotationPlan=async function(...args){const club=team(),plan=draftRotation(),chosen=courtPositions().map(pos=>plan.depth[pos][0]).join(),auto=lineupAssignment(club),autoIds=courtPositions().map(pos=>auto[pos]).join();
 const r=await applyPlanBeforeLineups(...args);if(club.rotationPlan&&chosen!==autoIds){lineupSetManual(club);await save();render()}return r};
async function setLineupMode(mode){const club=team();if(!club||!['auto','manual'].includes(mode))return;const before=snapshotState();club.lineupMode=mode;if(mode==='auto'){delete club.rotationPlan;applyAutoLineup(club)}rotationDraft=null;if(await save()===false){state=before;return toast('Could not save. Please try again.')}toast(mode==='auto'?'Starting five set automatically by position.':'Starting five is now manual.');render()}
// Rotation view: lineup mode switch, and a warning for out-of-position starters in a manual lineup.
// Why an auto lineup starts a player out of position: no healthy player fits that spot, or the best one is clearly weaker.
function lineupOutReason(club,starters,x){const used=new Set(Object.values(starters)),fit=lineupHealthy(club).filter(p=>!used.has(p.id)&&playsPosition(p,x.pos)).sort((a,b)=>b.ovr-a.ovr)[0];
 return fit?' (ahead of '+escapeHTML(fit.name)+', '+fit.ovr+' OVR '+positionLabel(fit)+')':' (no healthy '+x.pos+' available)'}
function lineupNotice(club=team()){const auto=lineupAuto(club),plan=draftRotation(),starters=Object.fromEntries(courtPositions().map(pos=>[pos,plan.depth[pos][0]])),out=lineupOutOfPosition(club,starters);
 return `<div class="lineup-mode note"><strong>Starting five:</strong> ${auto?'Auto · best players by position':'Manual'} <button type="button" onclick="setLineupMode('${auto?'manual':'auto'}')">${auto?'Set starters myself':'Use auto lineup by position'}</button>${out.length?`<p class="lineup-warning" role="alert">⚠ Out of position: ${out.map(x=>escapeHTML(x.p.name)+' ('+positionLabel(x.p)+') starting at '+x.pos+(auto?lineupOutReason(club,starters,x):'')).join('; ')}.</p>`:''}</div>`}
const rotationsViewBeforeLineups=rotationsView;rotationsView=function(...args){const html=rotationsViewBeforeLineups(...args);if(team().roster.length<leagueRules().courtPlayers)return html;return lineupNotice()+html};
// Saves: lineupMode is 'auto' or 'manual'. Saves from before this change: the user's team keeps a manual lineup when
// it saved a rotation plan whose starters differ from the automatic ones; everything else (CPU teams, lineups set only
// with the Roster Start button, which leaves no record) becomes auto.
function readLineupMode(raw,bad){if(raw!==undefined&&!['auto','manual'].includes(raw))bad('invalid lineup mode.');return raw}
const validateBeforeLineups=validateCareerData;
validateCareerData=function(raw){const out=validateBeforeLineups(raw),bad=m=>{throw Error('Invalid save: '+m)},legacy=(raw.teams||[]).every(t=>t?.lineupMode===undefined),you=controlledTeamId(out);
 out.teams.forEach((t,i)=>{const mode=readLineupMode(raw.teams?.[i]?.lineupMode,bad);if(mode)t.lineupMode=mode});
 if(legacy)for(const t of out.teams){let mode='auto';if(t.id===you&&t.rotationPlan){const auto=Object.values(lineupAssignment(t,t.roster)).sort().join(),saved=courtPositions().map(pos=>t.rotationPlan.depth[pos]?.[0]).sort().join();if(auto!==saved)mode='manual'}t.lineupMode=mode}
 return out};
const milestoneBeforeLineups=seasonMilestoneDay;seasonMilestoneDay=function(...args){const r=milestoneBeforeLineups(...args);applyAutoLineups();return r};
const newSeasonBeforeLineups=newSeason;newSeason=function(...args){const year=state.year,r=newSeasonBeforeLineups(...args),after=()=>{if(state.year!==year)applyAutoLineups()};if(r&&typeof r.then==='function')return r.then(v=>{after();return v});after();return r};
