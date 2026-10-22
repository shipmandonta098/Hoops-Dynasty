/* Merit is independent of city size and the controlled franchise. Evidence uses
   only the preceding season; absent history falls back to current roster estimates. */
function openingNightCandidates(c){
 const prior=(c.teamSeasonArchive||[]).filter(s=>s.year===c.year-1),honors=(c.leagueHistory||[]).find(s=>s.year===c.year-1),name=t=>t.city+' '+t.name;
 const byName=value=>{const found=prior.filter(s=>s.name===value);if(found.length)return found.length===1?found[0].key:null;const current=c.teams.filter(t=>name(t)===value);return current.length===1?current[0].key:null};
 const champion=prior.find(s=>s.champion),championKey=champion?.key||byName(honors?.champion?.name),runnerKey=byName(champion?.games?.find(g=>g.stage==='Championship')?.opponent)||byName(honors?.runnerUp?.name);
 const quality=t=>{const top=t.roster.slice().sort((a,b)=>b.ovr-a.ovr).slice(0,8);return top.reduce((n,p)=>n+p.ovr,0)/Math.max(1,top.length)};
 const ranked=c.teams.slice().sort((a,b)=>quality(b)-quality(a)||a.key.localeCompare(b.key)),top=new Set(ranked.slice(0,Math.max(4,Math.ceil(c.teams.length/3))).map(t=>t.key));
 const priorMvp=prior.find(s=>s.name===honors?.mvp?.team)?.roster?.find(p=>p.name===honors?.mvp?.name);
 const merit=new Map(c.teams.map(t=>{
  const old=prior.find(s=>s.key===t.key),q=quality(t),star=Math.max(0,...t.roster.map(p=>p.ovr)),rate=old&&old.w+old.l>0?old.w/(old.w+old.l):null;
  const finalist=t.key===runnerKey,champ=t.key===championKey,conferenceFinal=!!old?.games?.some(g=>g.stage==='Conference final');
  const mvp=!!honors?.mvp&&t.roster.some(p=>priorMvp?.id!=null?p.id===priorMvp.id:old?.name===honors.mvp.team&&p.name===honors.mvp.name),newStars=old?.roster?.length?t.roster.filter(p=>p.ovr>=85&&!old.roster.some(r=>r.id===p.id)).length:0;
  const score=Math.max(0,q-50)*2+(rate===null?0:rate*30)+(champ?40:finalist?24:conferenceFinal?12:0)+Math.max(0,star-80)*.5+(mvp?8:0)+Math.min(8,newStars*4);
  return [t.key,{q,star,rate,score,champ,finalist,conferenceFinal,mvp,newStars,old,competitive:top.has(t.key)&&(rate===null||rate>=.5||q>=82)}];
 }));
 const available=new Set(c.schedule.flat().map(g=>g.join(':'))),out=[];
 for(const h of c.teams)for(const a of c.teams){if(h.id===a.id||!available.has(h.id+':'+a.id))continue;
  const x=merit.get(h.key),y=merit.get(a.key),both=x.competitive&&y.competitive;
  const finals=(x.champ&&y.finalist)||(y.champ&&x.finalist),conference=!!x.old?.games?.some(g=>g.stage==='Conference final'&&byName(g.opponent)===a.key);
  const rivalry=(c.rivalries?.pairs||[]).find(r=>[r.a,r.b].includes(h.key)&&[r.a,r.b].includes(a.key)&&r.heat>=50&&r.events?.length>=3);
  let kind='Opening Night Showcase',reason='Selected by preseason roster strength; previous-season achievements are not assumed.',bonus=0;
  if(finals){kind='Championship Rematch';reason='The recorded defending champion faces last season’s Finals runner-up.';bonus=65}
  else if(conference){kind='Conference Finals Rematch';reason='These teams met in a recorded Conference Final last season.';bonus=30}
  else if(x.champ||y.champ){kind='Defending Champion Showcase';reason=name(x.champ?h:a)+' begins its title defense against '+name(x.champ?a:h)+'.';bonus=45}
  else if(both&&rivalry){kind='Elite Rivalry';reason='Two projected contenders renew a rivalry supported by recorded league events.';bonus=16}
  else if(both){kind='Contender Showdown';reason='Both rosters rank among the league’s projected contenders.';bonus=12}
  else if(x.star>=85&&y.star>=85){kind='Star Power Showcase';reason='Both teams feature a player rated at least 85 overall.';bonus=5}
  const detail=t=>{const m=merit.get(t.key);return t.abbr+': top-eight roster '+m.q.toFixed(1)+(m.rate===null?'':', previous record '+m.old.w+'–'+m.old.l)+(m.mvp?', reigning MVP on roster':'')+(m.newStars?', '+m.newStars+' new 85+ OVR player'+(m.newStars===1?'':'s'):'')};
  const score=x.score+y.score+Math.min(x.score,y.score)*.25+bonus;
  // Key-based seasonal tie breaker survives the new-career selected-team reorder.
  const tie=Array.from(c.year+':'+h.key+':'+a.key).reduce((v,ch)=>Math.imul(v^ch.charCodeAt(0),16777619)>>>0,2166136261);
  out.push({home:h.id,away:a.id,kind,text:reason+' '+detail(h)+'; '+detail(a)+'. Selection score '+score.toFixed(1)+'.',score,tie});
 }
 return out.sort((a,b)=>b.score-a.score||a.tie-b.tie);
}
function openingNightPlace(c,selected){const blocked=d=>c.allStarCalendar&&d+1>=c.allStarCalendar.breakStart&&d+1<=c.allStarCalendar.breakEnd;if(blocked(0))return null;const random=scheduleRandom(c.year*997+selected.length);
 for(let attempt=0;attempt<30;attempt++){const cal=copy(c.schedule),queue=[];for(const g of selected){let found=false;for(const games of cal){const index=games.findIndex(p=>p[0]===g.home&&p[1]===g.away);if(index>=0){games.splice(index,1);found=true;break}}if(!found)return null}queue.push(...cal[0]);cal[0]=selected.map(g=>[g.home,g.away]);
 const occupied=Array.from({length:c.teams.length},(_,id)=>cal.map(games=>games.some(p=>p.includes(id))));
 const valid=id=>c.scheduleFormat==='nba82'?scheduleRestValid(occupied[id]):!occupied[id].some((v,d)=>v&&d>1&&occupied[id][d-1]&&occupied[id][d-2]);
 for(const id of selected.flatMap(g=>[g.home,g.away]))if(!valid(id)){for(const d of [1,2]){const index=cal[d]?.findIndex(p=>p.includes(id));if(index>=0){const [pair]=cal[d].splice(index,1);pair.forEach(i=>occupied[i][d]=false);queue.push(pair)}if(valid(id))break}}
 const put=(pair,d)=>{cal[d].push(pair);pair.forEach(id=>occupied[id][d]=true)},take=(pair,d)=>{cal[d].splice(cal[d].indexOf(pair),1);pair.forEach(id=>occupied[id][d]=false)},slots=pair=>scheduleShuffle(Array.from({length:cal.length-1},(_,i)=>i+1),random).filter(d=>!blocked(d)&&!pair.some(id=>occupied[id][d]));
 const direct=pair=>{for(const d of slots(pair)){put(pair,d);if(pair.every(valid))return d;take(pair,d)}return -1};
 let failed=false;for(const pair of scheduleShuffle(queue,random)){if(direct(pair)>=0)continue;let placed=false;for(const d of slots(pair)){const displaced=[];for(const near of [d-1,d+1])if(near>0&&near<cal.length)for(const other of [...cal[near]])if(other.some(id=>pair.includes(id))){take(other,near);displaced.push({pair:other,from:near})}if(!displaced.length)continue;put(pair,d);const moved=[];if(pair.every(valid)){for(const item of displaced){const target=direct(item.pair);if(target<0)break;moved.push({...item,to:target})}if(moved.length===displaced.length){placed=true;break}}for(const item of moved)take(item.pair,item.to);take(pair,d);for(const item of displaced)put(item.pair,item.from)}if(!placed){failed=true;break}}

 if(!failed&&selected.flatMap(g=>[g.home,g.away]).every(valid))return cal;
 }return null;
}
function scheduleOpeningNight(c,rules=c.leagueSettings){
 const count=openingNightCapacity(c,rules);
 if(c.teams.length<=count*2)throw openingNightError('Opening Night needs teams outside the showcase. Choose two featured games with at least six teams, or three with at least eight.');
 if(c.schedule.length<3)throw openingNightError('Opening Night requires at least three league days. Extend the season dates.');
 const candidates=openingNightCandidates(c),original=c.schedule;
 // Try alternate high-merit opponents if the top slate cannot fit the calendar.
 for(let attempt=0;attempt<16;attempt++){
  const selected=[],used=new Set(),ordered=attempt===0?candidates:[...candidates.slice(attempt,attempt+1),...candidates];
  for(const g of ordered)if(!used.has(g.home)&&!used.has(g.away)){selected.push(g);used.add(g.home);used.add(g.away);if(selected.length===count)break}
  if(selected.length!==count)continue;const cal=openingNightPlace(c,selected);if(!cal)continue;
  const champion=selected.findIndex(g=>['Championship Rematch','Defending Champion Showcase'].includes(g.kind));
  if(champion>=0){const prime=count===3?1:0;[selected[prime],selected[champion]]=[selected[champion],selected[prime]]}
  cal[0]=selected.map(g=>[g.home,g.away]);
  const night={year:c.year,format:count===3?'triple':'double',constrained:false,games:selected.map(({home,away,kind,text},i)=>({home,away,kind,text,slot:count===2?['Prime','Late'][i]:['Early','Prime','Late'][i]}))};
  const trial={...c,schedule:cal,openingNight:night};repairOpeningWeek(trial,{...rules,openingWindowDays:3});
  if(openingWeekAudit(trial,{...rules,openingWindowDays:3}).delayed.length)continue;
  c.schedule=trial.schedule;c.openingNight=night;return;
 }
 c.schedule=original;
 throw openingNightError('Cannot fit the featured opener and every team’s debut by Day 3 while preserving fixtures, rest limits and protected dates. Extend the calendar, move an overlapping break, or choose two featured games. No replacement calendar was accepted.');
}
const openingCalendarBefore=applyAllStarCalendar;applyAllStarCalendar=function(c,rules=c.leagueSettings){openingCalendarBefore(c,rules);scheduleOpeningNight(c,rules)};
function openingNightMarkup(){const night=state.openingNight;if(!night||night.year!==state.year)return '';return `<section class="panel note"><h3>Opening Night · ${scheduleDateLabel(1)}</h3>${night.constrained?'<p>The requested spotlight format could not fit this calendar without breaking schedule rules. The original opening slate is retained. Extend the season dates for more flexibility.</p>':night.games.map(g=>`<p><strong>${escapeHTML(g.slot)} · ${escapeHTML(g.kind)}</strong><br>${escapeHTML(state.teams[g.away].city+' '+state.teams[g.away].name)} at ${escapeHTML(state.teams[g.home].city+' '+state.teams[g.home].name)}<br>${escapeHTML(g.text)}</p>`).join('')}</section>`}
const openingBannerBefore=seasonCalendarBanner;seasonCalendarBanner=function(){return openingNightMarkup()+seasonOpenerMarkup()+openingBannerBefore()};
const openingMilestoneBefore=seasonMilestoneDay;seasonMilestoneDay=function(){openingMilestoneBefore();const n=state.openingNight;if(state.day!==1||!n||n.year!==state.year||n.constrained)return;for(const g of n.games){const headline='Opening Night · '+g.slot+': '+state.teams[g.away].abbr+' at '+state.teams[g.home].abbr;if(!state.newsFeed?.items?.some(x=>x.year===state.year&&x.headline===headline))addNewsItem({category:'League',headline,detail:g.kind+' — '+g.text,teams:[g.home,g.away]})}};
const openingValidateBefore=validateCareerData;validateCareerData=function(raw){const c=openingValidateBefore(raw),n=raw.openingNight;if(n===undefined)return c;const bad=()=>{throw Error('Invalid save: opening-night schedule')};if(!n||n.year!==c.year||!['solo','double','triple','auto'].includes(n.format)||typeof n.constrained!=='boolean'||!Array.isArray(n.games)||n.games.length>3)bad();const seen=new Set();for(const g of n.games){if(!g||![g.home,g.away].every(id=>Number.isInteger(id)&&c.teams[id])||g.home===g.away||seen.has(g.home)||seen.has(g.away)||!['Early','Prime','Late','Solo Spotlight'].includes(g.slot)||typeof g.kind!=='string'||g.kind.length>80||typeof g.text!=='string'||g.text.length>600||!c.schedule[0].some(p=>p[0]===g.home&&p[1]===g.away))bad();seen.add(g.home);seen.add(g.away)}if(n.constrained?n.games.length!==0:n.games.length!==(n.format==='auto'?n.games.length:Math.min(n.format==='solo'?1:n.format==='double'?2:3,Math.floor(c.teams.length/2)))||c.schedule[0].length!==n.games.length)bad();c.openingNight={year:n.year,format:n.format,constrained:n.constrained,games:n.games.map(g=>Object.fromEntries(['home','away','kind','text','slot'].map(k=>[k,g[k]])))};return c};

/* Generated-calendar preferences, not claims about verified historical fixtures.
   Explicit formats remain stable in existing saves. No repair runs during load. */
function openingNightCapacity(c,rules=c.leagueSettings){return rules.openingNightFormat==='triple'?3:2}
function openingWeekAudit(c,rules=c.leagueSettings){
 const target=3;
 const teams=c.teams.map((t,id)=>{
  const games=c.schedule.flatMap((pairs,d)=>pairs.filter(p=>p.includes(id)).map(pair=>({day:d+1,pair}))),week=games.filter(g=>g.day<=7);
  let run=0,longestRest=0;for(let day=1;day<=Math.min(7,c.schedule.length);day++){run=week.some(g=>g.day===day)?0:run+1;longestRest=Math.max(longestRest,run)}
  let previous=t.arenaCity||t.city;const travel=week.map(g=>{const venue=c.teams[g.pair[0]],city=venue.arenaCity||venue.city,leg={day:g.day,from:previous,to:city,changesCity:previous!==city};previous=city;return leg});
  return {id,firstDay:games[0]?.day??null,games:week.length,home:week.filter(g=>g.pair[0]===id).length,away:week.filter(g=>g.pair[1]===id).length,longestRest,backToBacks:week.filter((g,i)=>i&&g.day===week[i-1].day+1).length,travel};
 });
 const delayed=teams.filter(t=>t.firstDay===null||t.firstDay>target),blocked=c.allStarCalendar;
 return {target,teams,debuts:Array.from({length:7},(_,i)=>teams.filter(t=>t.firstDay===i+1).length),delayed:delayed.map(t=>({id:t.id,reason:t.firstDay===null?'No regular-season fixture exists.':blocked&&blocked.breakStart<=target?'Protected All-Star break overlaps the opening window.':'No improving legal fixture move fits the opening slate, same-day occupancy, rest limits and fixed season dates.'})),threeBeforeDebut:teams.filter(t=>t.firstDay&&teams.some(other=>c.schedule.slice(0,t.firstDay-1).filter(ps=>ps.some(p=>p.includes(other.id))).length>=3)).map(t=>t.id)};
}
function repairOpeningWeek(c,rules=c.leagueSettings){
 const cal=c.schedule,n=c.teams.length,target=Math.min(cal.length,3);
 if(!cal.length)return;
 const blocked=d=>c.allStarCalendar&&d+1>=c.allStarCalendar.breakStart&&d+1<=c.allStarCalendar.breakEnd;
 const occupied=Array.from({length:n},(_,id)=>cal.map(ps=>ps.some(p=>p.includes(id))));
 const first=id=>occupied[id].indexOf(true),b2b=ds=>ds.reduce((s,v,d)=>s+(v&&d>0&&ds[d-1]?1:0),0);
 const triples=ds=>ds.reduce((s,v,d)=>s+(v&&d>1&&ds[d-1]&&ds[d-2]?1:0),0);
 const legal=(id,ds)=>c.scheduleFormat==='nba82'?scheduleRestValid(ds):triples(ds)<=triples(occupied[id]);
 // Move existing games only. Preserve the featured slate and the season finale.
 // Prefer debuts together, fewer back-to-backs and shorter date shifts.
 for(let pass=0;pass<n;pass++){
  let best=null;
  for(let from=target;from<cal.length-1;from++)for(const pair of cal[from]){
   if(!pair.some(id=>first(id)>=target))continue;
   for(let to=c.openingNight&&!c.openingNight.constrained?1:0;to<target;to++){
    if(blocked(to)||pair.some(id=>occupied[id][to]))continue;
    const proposed=pair.map(id=>occupied[id].map((v,d)=>d===from?false:d===to?true:v));if(!pair.every((id,i)=>legal(id,proposed[i])))continue;
    const gain=pair.reduce((s,id,i)=>s+Math.max(0,first(id)-target+1)-Math.max(0,proposed[i].indexOf(true)-target+1),0);
    const penalty=pair.reduce((s,id,i)=>s+b2b(proposed[i])-b2b(occupied[id]),0);
    const score=gain*10000+(to===1?1000:0)-penalty*100-(from-to)-cal[to].length;
    if(gain>0&&(!best||score>best.score))best={pair,from,to,score,proposed};
   }
  }
  if(!best)break;cal[best.from].splice(cal[best.from].indexOf(best.pair),1);cal[best.to].push(best.pair);best.pair.forEach((id,i)=>occupied[id]=best.proposed[i]);
 }
 // Prefer day 2 for teams otherwise debuting on day 3, without breaking rest limits.
 for(const pair of [...(cal[2]||[])])if(pair.some(id=>first(id)===2)&&!blocked(1)&&pair.every(id=>!occupied[id][1])){
  const proposed=pair.map(id=>occupied[id].map((v,d)=>d===2?false:d===1?true:v));
  if(pair.every((id,i)=>legal(id,proposed[i]))){cal[2].splice(cal[2].indexOf(pair),1);cal[1].push(pair);pair.forEach((id,i)=>occupied[id]=proposed[i])}
 }
 // Smooth excessive first-week loading against this calendar's actual cadence.
 // This is deliberately soft: sparse historical/custom seasons need fewer games.
 const available=cal.reduce((sum,_,d)=>sum+(!blocked(d)?1:0),0),expected=occupied.map(ds=>ds.filter(Boolean).length*Math.min(7,cal.length)/Math.max(1,available));
 const weekCost=(id,ds)=>{const count=ds.slice(0,7).filter(Boolean).length;return (count-expected[id])**2*10+b2b(ds)*2};
 for(let pass=0;pass<n*2;pass++){
  let best=null;
  for(let from=1;from<Math.min(14,cal.length-1);from++)for(const pair of cal[from])for(let to=1;to<Math.min(14,cal.length-1);to++){
   if((from<7)===(to<7)||blocked(to)||pair.some(id=>occupied[id][to]))continue;
   const proposed=pair.map(id=>occupied[id].map((v,d)=>d===from?false:d===to?true:v));
   if(!pair.every((id,i)=>legal(id,proposed[i])&&proposed[i].indexOf(true)<=first(id)))continue;
   const gain=pair.reduce((sum,id,i)=>sum+weekCost(id,occupied[id])-weekCost(id,proposed[i]),0);
   if(gain>.001&&(!best||gain>best.gain))best={pair,from,to,proposed,gain};
  }
  if(!best)break;cal[best.from].splice(cal[best.from].indexOf(best.pair),1);cal[best.to].push(best.pair);best.pair.forEach((id,i)=>occupied[id]=best.proposed[i]);
 }
}
function seasonOpenerMarkup(){
 const id=controlledTeamId(),day=state.schedule.findIndex(ps=>ps.some(p=>p.includes(id))),audit=openingWeekAudit(state),team=state.teams[id];
 const opener=day<0||!team?'':(()=>{const pair=state.schedule[day].find(p=>p.includes(id)),opp=state.teams[pair.find(i=>i!==id)];return `<h3>Your Season Opener</h3><p>${escapeHTML(opp.city+' '+opp.name)} · ${scheduleDateLabel(day+1)} · League day ${day+1} · ${pair[0]===id?'Home':'Away'}</p>`})();
 return `<section class="panel note">${opener}<details><summary>Opening-week schedule audit</summary><p>Generated calendar · New-calendar debut deadline: day ${audit.target}. Historical presets do not supply verified real-world fixtures.</p>${audit.delayed.map(d=>`<p>${escapeHTML(state.teams[d.id].abbr)}: ${escapeHTML(d.reason)}</p>`).join('')||'<p>Every team has a fixture within the opening target.</p>'}<div class="scroll"><table><thead><tr><th>Team</th><th>First day</th><th>Games (days 1–7)</th><th>H / A</th><th>Longest rest</th><th>B2B</th><th>City changes</th></tr></thead><tbody>${audit.teams.map(t=>`<tr><td>${escapeHTML(state.teams[t.id].abbr)}</td><td>${t.firstDay??'—'}</td><td>${t.games}</td><td>${t.home} / ${t.away}</td><td>${t.longestRest}</td><td>${t.backToBacks}</td><td>${t.travel.filter(x=>x.changesCity).length}</td></tr>`).join('')}</tbody></table></div><p>Travel records scheduled venue changes, not measured distances or arrival times.${audit.threeBeforeDebut.length?' Some teams play three games before another franchise debuts; calendar constraints remain unresolved.':''}</p></details></section>`;
}

function openingNightError(message){const error=new Error(message);error.code='OPENING_NIGHT_CONSTRAINT';return error}
// A rejected next-season calendar must not strand a career halfway through rollover.
const eliteOpeningNewSeasonBefore=newSeason;
newSeason=function(...args){
 const before=copy(state),failed=error=>{if(error.code!=='OPENING_NIGHT_CONSTRAINT')throw error;state=before;toast(error.message);return false};
 try{const result=eliteOpeningNewSeasonBefore(...args);return result&&typeof result.then==='function'?result.catch(failed):result}catch(error){return failed(error)}
};
