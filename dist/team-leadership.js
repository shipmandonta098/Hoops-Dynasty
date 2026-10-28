/* Coach-directed team leadership: captains are chosen by the head coach (appointment, player vote or consultation),
   leadership is a derived player score, and captains only soften temporary morale swings — never a morale floor.
   Reuses the existing morale model (moraleAdjustment, moraleDetails) and personality traits. */
const LEADERSHIP_METHODS={appointment:'Coach appointment',vote:'Player vote',consultation:'Coach and player consultation',legacy:'Designated before coach-led selection',commissioner:'Commissioner appointment'};
const LEADERSHIP_TRAITS={leader:28,professional:12,fiery:3,toxic:-30,diva:-12,loyal:6,mercenary:-4,smart:5,gym:3,lazy:-8,steady:2,balanced:2};
// Influence is the share of a negative per-game morale swing a captain absorbs (and extra recovery of temporary frustration).
const LEADERSHIP_MAX_INFLUENCE=.25,LEADERSHIP_RECOMMEND_COOLDOWN=14;
function leadershipHash(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h}
function leadershipStore(s=state){return s.teamLeadership??={version:1,teams:{},history:[],arrivals:{}}}
function leadershipRecord(club,s=state){return leadershipStore(s).teams[club.id]??null}
function leadershipRule(){return leagueRules().captainDesignations||'captainCo'}
function yearsPro(p){const debut=p.bio?.debutYear??state.year-Math.max(0,p.age-21);return Math.max(0,state.year-debut)}
// Distinct seasons served, so a mid-season promotion from co-captain does not count twice.
function leadershipSeasons(entries){const years=new Set();for(const h of entries)for(let y=h.from;y<=(h.to??state.year);y++)years.add(y);return years.size}
function captainSeasons(p){return leadershipSeasons(leadershipStore().history.filter(h=>h.playerId===p.id))}
// Leadership: personality traits, loyalty, professional experience, a personal communication component and captaincy
// history. Overall rating and salary play no part; experience is capped so veterans are not automatically great leaders.
function playerLeadership(p){
 const traits=traitsOf(p).reduce((n,k)=>n+(LEADERSHIP_TRAITS[k]||0),0),loyalty=(personality(p).loyalty-60)*.1,communication=leadershipHash(p.id+':'+p.name)%21-10;
 return Math.max(1,Math.min(99,Math.round(40+traits+loyalty+Math.min(12,yearsPro(p)*1.2)+communication+Math.min(8,captainSeasons(p)*2))));
}
function leadershipTenure(p,club){const a=leadershipStore().arrivals[p.id];if(a?.team===club.key)return Math.max(0,state.year-a.year);return Math.min(yearsPro(p),leadershipHash(p.id+':'+club.key)%5)}
function leadershipTradeRequest(p){return p.dissatisfaction?.active?.visibility==='public'}
// Locker-room respect: leadership, experience, tenure and role; talent and current morale count only a little.
function lockerRoomRespect(p,club){
 const minutes=playerMinutes(p,club),morale=moraleDetails(p,club).score;
 return Math.round(playerLeadership(p)*.45+Math.min(10,yearsPro(p))*1.5+Math.min(9,leadershipTenure(p,club)*1.5)+Math.min(10,minutes/36*10)+Math.max(-4,Math.min(6,(p.ovr-72)*.25))+(morale-60)*.08-(hasTrait(p,'toxic')?15:0)-(leadershipTradeRequest(p)?12:0));
}
function coachCaptainScore(p,club,coach=coachFor(club)){
 const respect=lockerRoomRespect(p,club),lead=playerLeadership(p),injured=injuryDays(p)>60?10:0;
 const style=coach.type==='Win-Now'?Math.min(6,playerMinutes(p,club)/6):coach.type==='Developmental'?(hasTrait(p,'leader')&&p.age>=27?5:0):0;
 return Math.round((respect*.6+lead*.4+style-injured)*10)/10;
}
// The coach's philosophy decides how captains are chosen: disciplinarians appoint, players' coaches let the room vote.
function leadershipMethod(coach){const a=coach.attributes||{};if((a.discipline??60)>=75&&(a.charisma??60)<65)return 'appointment';if((a.charisma??60)>=75&&(a.discipline??60)<70)return 'vote';return coach.type==='Win-Now'&&(a.discipline??60)>=65?'appointment':'consultation'}
function leadershipVote(club,seedKey){
 const votes=new Map(),mentors=new Set((state.rivalries?.players||[]).flatMap(r=>r.mentors||[]));
 for(const voter of club.roster){let best=null,bestScore=-Infinity;for(const c of club.roster){if(c.id===voter.id)continue;const noise=leadershipHash(seedKey+':'+voter.id+':'+c.id)%17-8,score=lockerRoomRespect(c,club)+noise+(mentors.has(c.id)&&voter.age<=25?6:0)+(hasTrait(c,'professional')?3:0);if(score>bestScore||score===bestScore&&c.id<best.id){best=c;bestScore=score}}if(best)votes.set(best.id,(votes.get(best.id)||0)+1)}
 return votes;
}
function leadershipRanking(club,method,seedKey){
 const coach=coachFor(club),votes=method==='vote'||method==='consultation'?leadershipVote(club,seedKey):new Map(),n=Math.max(1,club.roster.length);
 return club.roster.map(p=>{const coachScore=coachCaptainScore(p,club,coach),share=(votes.get(p.id)||0)/n;return {p,coachScore,votes:votes.get(p.id)||0,score:method==='vote'?share*100+coachScore*.01:method==='consultation'?coachScore+share*30:coachScore}}).sort((a,b)=>b.score-a.score||b.coachScore-a.coachScore||a.p.id-b.p.id);
}
function leadershipCaptains(club){const r=leadershipRecord(club);return r?[r.captain,r.coCaptain].filter(id=>id!==null&&club.roster.some(p=>p.id===id)):[]}
function teamCaptain(club){const r=leadershipRecord(club);return r?.captain!=null?club.roster.find(p=>p.id===r.captain)||null:null}
function teamCoCaptain(club){const r=leadershipRecord(club);return r?.coCaptain!=null?club.roster.find(p=>p.id===r.coCaptain)||null:null}
// Morale shapes effectiveness modestly (never an on/off switch); a long injury keeps the title but reduces daily presence.
function leaderEffect(p,club){const lead=playerLeadership(p),morale=moraleDetails(p,club).score;return Math.max(0,(lead-40)/60)*.22*(morale<40?.75:morale<60?.9:1)*(injuryDays(p)>30?.75:1)}
function leadershipInfluence(club){const effects=[teamCaptain(club),teamCoCaptain(club)].filter(Boolean).map(p=>leaderEffect(p,club)).sort((a,b)=>b-a);return Math.min(LEADERSHIP_MAX_INFLUENCE,(effects[0]||0)+(effects[1]||0)*.35)}
function leadershipInfluenceFor(p,club){const others=[teamCaptain(club),teamCoCaptain(club)].filter(q=>q&&q.id!==p.id).map(q=>leaderEffect(q,club)).sort((a,b)=>b-a),base=Math.min(LEADERSHIP_MAX_INFLUENCE,(others[0]||0)+(others[1]||0)*.35),a=leadershipStore().arrivals[p.id],recent=a?.team===club.key&&moraleStamp()-(a.year*200+a.day)<30;return Math.min(.3,base*(p.age<=25||recent?1.4:1))}
// Applied to one game's morale change: dampens losing swings and speeds recovery from temporary frustration only.
function leadershipMoraleChange(p,club,raw,decay){const f=leadershipInfluenceFor(p,club);if(!f)return {raw,decay};return {raw:raw<0?raw*(1-f):raw,decay:(p.moraleAdjustment||0)<0?decay*(1+f):decay}}
function leadershipInfluenceLabel(club){const f=leadershipInfluence(club);return f>=.18?'Strong':f>=.1?'Steady':f>0?'Limited':'None'}
function leadershipHistoryOpen(club,p,role,method){leadershipStore().history.push({playerId:p.id,name:p.name,teamKey:club.key,team:club.city+' '+club.name,role,method,from:state.year,to:null});const h=leadershipStore().history;if(h.length>4000)h.splice(0,h.length-4000)}
function leadershipHistoryClose(club,id){for(const h of leadershipStore().history)if(h.playerId===id&&h.teamKey===club.key&&h.to===null)h.to=state.year}
function leadershipDeparture(id){const club=state.teams.find(t=>t.roster.some(p=>p.id===id)),free=state.free.find(p=>p.id===id);return club?{kind:'traded',club}:free?{kind:'free agency'}:{kind:'retired'}}
function leadershipVeteran(p){return yearsPro(p)>=8?'veteran ':''}
// Apply a leadership structure. news: null for silent setup, otherwise the reason for the change.
function setLeadership(club,{captain,coCaptain,method,reason=null,departed=null}){
 const r=leadershipStore().teams[club.id]??={captain:null,coCaptain:null,method,coach:coachFor(club).name,appointed:null,reviewedYear:state.year,lastRecommendation:null};
 const before=[r.captain,r.coCaptain],next=[captain?.id??null,coCaptain?.id??null];
 for(const id of before)if(id!==null&&!next.includes(id))leadershipHistoryClose(club,id);
 for(const [p,role,i] of [[captain,'Captain',0],[coCaptain,'Co-captain',1]])if(p&&before[i]!==p.id){if(before.includes(p.id))leadershipHistoryClose(club,p.id);leadershipHistoryOpen(club,p,role,method)}
 const changed=before[0]!==next[0]||before[1]!==next[1];
 Object.assign(r,{captain:next[0],coCaptain:next[1],method,coach:coachFor(club).name,reviewedYear:state.year});if(changed&&captain)r.appointed={year:state.year,day:state.day};if(!captain)r.appointed=null;
 if(changed&&reason&&captain){
  const city=club.city,both=coCaptain&&captain;
  const text=reason==='retired'&&departed?city+' names a new captain following the retirement of its longtime leader, '+departed+'. '+captain.name+' takes over'+(both?' with '+coCaptain.name+' as co-captain':'')+'.'
   :method==='vote'?city+' players elect '+captain.name+' as their new captain'+(both?', with '+coCaptain.name+' as co-captain':'')+'.'
   :both&&leadershipVeteran(captain)&&leadershipVeteran(coCaptain)?city+' appoints two veteran leaders as team captains: '+captain.name+' and '+coCaptain.name+'.'
   :city+' names '+leadershipVeteran(captain)+captain.name+' team captain'+(reason==='season'?' ahead of the new season':departed?' after '+departed+'’s departure':'')+(both?'; '+coCaptain.name+' will serve as co-captain':'')+'.';
  say(text);if(club.id===controlledTeamId())addGMMessage('Morale',coachFor(club).name+', Head coach','Team leadership update',text);
 }
 return changed;
}
// The head coach chooses the structure using the coach's selection method and the league's designation rule.
function selectLeadership(club,{reason='season',departed=null,silent=false}={}){
 const rule=leadershipRule(),coach=coachFor(club),method=leadershipMethod(coach);
 if(rule==='none'||club.roster.length<2)return setLeadership(club,{captain:null,coCaptain:null,method,reason:silent?null:reason});
 const ranked=leadershipRanking(club,method,state.year+':'+state.day+':'+club.key),best=ranked[0],second=ranked.find(x=>x!==best);
 if(!best||playerLeadership(best.p)<35&&best.coachScore<45)return setLeadership(club,{captain:null,coCaptain:null,method,reason:silent?null:reason});
 // A co-captain only when a second leader is nearly as strong (or a developmental coach wants a mentor pairing).
 const co=rule==='captainCo'&&second&&(playerLeadership(second.p)>=70&&second.coachScore>=best.coachScore-4||coach.type==='Developmental'&&playerLeadership(second.p)>=80&&second.coachScore>=best.coachScore-8)?second.p:null;
 return setLeadership(club,{captain:best.p,coCaptain:co,method,reason:silent?null:reason,departed});
}
// initial: first sighting of an existing roster estimates prior tenure instead of treating everyone as a new arrival.
function leadershipTrackArrivals(initial=false){const a=leadershipStore().arrivals,ids=new Set();for(const club of state.teams)for(const p of club.roster){ids.add(String(p.id));if(a[p.id]?.team!==club.key)a[p.id]={team:club.key,year:initial?state.year-Math.min(yearsPro(p),leadershipHash(p.id+':'+club.key)%5):state.year,day:initial?0:state.day}}for(const id of Object.keys(a))if(!ids.has(id))delete a[id]}
// Vacancies (trade, release, free agency, retirement) and coaching changes; captains keep their roles otherwise.
function leadershipReview(seasonStart=false){
 const store=leadershipStore();
 for(const club of state.teams){if(expansionPendingSeason(club))continue;const r=store.teams[club.id];
  if(!r){if(seasonStart)selectLeadership(club,{reason:'season'});continue}
  const missing=[r.captain,r.coCaptain].filter(id=>id!==null&&!club.roster.some(p=>p.id===id)),coachChanged=r.coach!==coachFor(club).name,captain=teamCaptain(club);
  if(missing.includes(r.captain)&&r.captain!==null){const name=store.history.findLast(h=>h.playerId===r.captain)?.name,d=leadershipDeparture(r.captain);selectLeadership(club,{reason:d.kind==='retired'&&seasonStart?'retired':'vacancy',departed:name});continue}
  if(missing.length){leadershipHistoryClose(club,r.coCaptain);r.coCaptain=null}
  if(coachChanged){selectLeadership(club,{reason:'coach'});continue}
  if(captain&&leadershipTradeRequest(captain)&&seasonStart){leadershipRemoval(club,captain);selectLeadership(club,{reason:'locker'});continue}
  if(seasonStart&&r.reviewedYear<state.year&&r.captain===null)selectLeadership(club,{reason:'season'});else if(seasonStart)r.reviewedYear=state.year;
 }
 leadershipTrackArrivals();
}
// Removing a respected leader stings a little; moving on from a poor one helps a little. Both use moraleAdjustment.
function leadershipRemoval(club,p){const lead=playerLeadership(p);moraleAdjust(p,-6);if(lead>=70)for(const q of club.roster)if(q.id!==p.id)moraleAdjust(q,-1);if(lead<45)for(const q of club.roster)if(q.id!==p.id)moraleAdjust(q,1)}
const newSeasonBeforeLeadership=newSeason;newSeason=function(...args){const year=state.year,result=newSeasonBeforeLeadership(...args);if(state.year!==year)leadershipReview(true);return result};
const ownerDayBeforeLeadership=ownerDay;ownerDay=function(...args){const result=ownerDayBeforeLeadership(...args);if(state.teamLeadership)leadershipReview(false);return result};
const freshBeforeLeadership=fresh;fresh=function(...args){const data=freshBeforeLeadership(...args),previous=state;state=data;try{leadershipTrackArrivals(true);for(const club of data.teams)selectLeadership(club,{silent:true})}finally{state=previous}return data};
// GM advisory role: recommend a captain or raise concerns; the coach decides by philosophy and evaluation.
function leadershipCooldown(club){const r=leadershipRecord(club);return r?.lastRecommendation!=null?Math.max(0,LEADERSHIP_RECOMMEND_COOLDOWN-(moraleStamp()-r.lastRecommendation)):0}
function leadershipRecommend(id){
 const club=team(),p=club.roster.find(q=>q.id===id);if(!p||leadershipCooldown(club))return null;const r=leadershipStore().teams[club.id]??={captain:null,coCaptain:null,method:leadershipMethod(coachFor(club)),coach:coachFor(club).name,appointed:null,reviewedYear:state.year,lastRecommendation:null};
 r.lastRecommendation=moraleStamp();const coach=coachFor(club),current=teamCaptain(club);if(current?.id===p.id)return {accepted:false,message:p.name+' is already the captain.'};
 if(leadershipRule()==='none')return {accepted:false,message:'League rules do not allow official captains.'};
 const openness=(coach.attributes?.charisma??60)/100*8,mine=coachCaptainScore(p,club,coach),theirs=current?coachCaptainScore(current,club,coach):45,lead=playerLeadership(p),method=r.method;
 const accepted=lead>=50&&mine>=theirs-openness&&!leadershipTradeRequest(p);
 const message=accepted?coach.name+' agrees: '+p.name+' will be the new captain.':coach.name+' declines: '+(lead<50?p.name+' has not shown enough leadership yet.':leadershipTradeRequest(p)?p.name+'’s public trade request makes the role untenable.':method==='vote'?'the players chose their captain and the coach will not overrule the room.':(current?current.name+' keeps the respect of the locker room.':'the coach wants to see more before naming a captain.'));
 if(accepted){if(current)leadershipRemoval(club,current);const co=teamCoCaptain(club);setLeadership(club,{captain:p,coCaptain:co?.id===p.id?null:co,method:r.method==='legacy'?leadershipMethod(coach):r.method,reason:'gm'})}
 addGMMessage('Morale',coach.name+', Head coach','Captain recommendation: '+p.name,message);return {accepted,message};
}
function leadershipConcern(){
 const club=team(),coach=coachFor(club),captain=teamCaptain(club),r=leadershipRecord(club);if(!captain||!r||leadershipCooldown(club))return null;r.lastRecommendation=moraleStamp();
 const best=leadershipRanking(club,'appointment',state.year+':'+state.day+':concern').find(x=>x.p.id!==captain.id),gap=best?best.coachScore-coachCaptainScore(captain,club,coach):0,act=leadershipTradeRequest(captain)||gap>=12;
 const message=act?coach.name+' agrees a change is needed. '+captain.name+' steps down as captain.':coach.name+' hears the concern but keeps '+captain.name+' as captain; the locker room still backs them.';
 if(act){leadershipRemoval(club,captain);selectLeadership(club,{reason:'concern'})}
 addGMMessage('Morale',coach.name+', Head coach','Leadership concerns',message);return {changed:act,message};
}
async function leadershipCommit(action){const before=copy(state);try{const result=action();if(await save()===false)throw Error('Could not save leadership changes.');render();if(result?.message)toast(result.message);return result}catch(e){state=before;render();toast(e.message);return null}}
function recommendCaptain(value){if(!ownerCanManage()||value==='')return;return leadershipCommit(()=>leadershipRecommend(Number(value))||{message:'Wait before raising leadership with the coach again.'})}
function raiseLeadershipConcern(){if(!ownerCanManage())return;return leadershipCommit(()=>leadershipConcern()||{message:'No captain to discuss, or wait before raising leadership again.'})}
// Commissioner / sandbox: direct appointment and removal.
function commissionerSetCaptain(teamId,role,value){if(!state.commissioner?.enabled)return;const club=state.teams.find(t=>t.id===teamId);if(!club)return;return leadershipCommit(()=>{const p=value===''?null:club.roster.find(q=>q.id===Number(value))||null,captain=role==='captain'?p:teamCaptain(club),co=role==='co'?p:teamCoCaptain(club);if(captain&&co&&captain.id===co.id)throw Error('Captain and co-captain must be different players.');setLeadership(club,{captain:co&&!captain?co:captain,coCaptain:co&&!captain?null:co,method:'commissioner'});return {message:co&&!captain?'Captain removed; '+co.name+' steps up from co-captain.':'Team leadership updated.'}})}
function leadershipPanel(club){
 const r=leadershipRecord(club),captain=teamCaptain(club),co=teamCoCaptain(club),coach=coachFor(club),method=r?.method??leadershipMethod(coach),commish=!!state.commissioner?.enabled,served=p=>leadershipSeasons(leadershipStore().history.filter(x=>x.playerId===p.id&&x.teamKey===club.key));
 const row=(label,value)=>`<div><dt>${label}</dt><dd>${value}</dd></div>`,select=(role,current)=>`<select onchange="commissionerSetCaptain(${club.id},'${role}',this.value)"><option value="">None</option>${club.roster.map(p=>`<option value="${p.id}" ${current?.id===p.id?'selected':''}>${escapeHTML(p.name)} · Leadership ${playerLeadership(p)}</option>`).join('')}</select>`;
 const cooldown=leadershipCooldown(club),rule=leadershipRule();
 return `<section class="panel team-leadership"><div class="panelhead"><h2>Team leadership</h2><span>${escapeHTML(LEADERSHIP_METHODS[method]||method)}</span></div><div class="note"><dl class="pp-ledger">${row('Captain',captain?escapeHTML(captain.name):rule==='none'?'Not permitted by league rules':'No formal captain')}${row('Co-captain',co?escapeHTML(co.name):'—')}${row('Selection method',escapeHTML(LEADERSHIP_METHODS[method]||method))}${row('Head coach responsible',escapeHTML(coach.name))}${row('Captain leadership rating',captain?playerLeadership(captain)+' / 99':'—')}${row('Years as captain',captain?served(captain):'—')}${row('Locker-room influence',leadershipInfluenceLabel(club))}${row('Appointed',r?.appointed?r.appointed.year+'–'+String(r.appointed.year+1).slice(-2)+(r.appointed.day?' season, day '+r.appointed.day:' preseason'):captain?'Before current records':'—')}</dl>
 ${commish?`<p><strong>Commissioner:</strong> <label>Captain ${select('captain',captain)}</label> <label>Co-captain ${select('co',co)}</label></p>`:club.id!==controlledTeamId()?`<p>Captains are chosen by ${escapeHTML(coach.name)}.</p>`:`<p>The head coach selects captains. You can recommend a player or raise concerns; the coach decides.</p><div class="actions"><label>Recommend captain <select onchange="recommendCaptain(this.value)" ${cooldown||rule==='none'?'disabled':''}><option value="">Choose a player</option>${club.roster.filter(p=>p.id!==captain?.id).map(p=>`<option value="${p.id}">${escapeHTML(p.name)} · Leadership ${playerLeadership(p)}</option>`).join('')}</select></label><button onclick="raiseLeadershipConcern()" ${!captain||cooldown?'disabled':''}>Discuss leadership concerns</button></div>${cooldown?`<p class="muted">The coach will revisit leadership in ${cooldown} days.</p>`:''}`}
 <p class="muted">Captains soften losing-streak morale swings and help teammates (especially young or new players) recover from temporary frustration. They do not prevent unhappiness over role, contract or results, and add no on-court rating boosts.</p></div></section>`;
}
function leadershipProfileCard(p,club){
 const history=leadershipStore().history.filter(h=>h.playerId===p.id).sort((a,b)=>a.from-b.from),current=club?[teamCaptain(club)?.id===p.id?'Team Captain':teamCoCaptain(club)?.id===p.id?'Co-Captain':null].filter(Boolean)[0]:null,years=leadershipSeasons(history);
 return playerCard('LEADERSHIP',`<dl class="pp-ledger"><div><dt>Leadership rating</dt><dd>${playerLeadership(p)} / 99</dd></div><div><dt>Role</dt><dd>${current||'—'}</dd></div><div><dt>Years served</dt><dd>${years}</dd></div></dl>${history.length?'<p>Captaincy history: '+history.map(h=>escapeHTML(h.role+', '+h.team+' ('+h.from+(h.to===null?'–present':h.to===h.from?'':'–'+h.to)+')')).join('; ')+'</p>':'<p class="muted">No captaincy history.</p>'}`);
}
const leadershipMoraleProfileBefore=moraleProfile;moraleProfile=function(ctx){return leadershipMoraleProfileBefore(ctx)+leadershipProfileCard(ctx.p,ctx.club)};
function readTeamLeadership(raw,data,bad){
 if(!raw||raw.version!==1||!raw.teams||typeof raw.teams!=='object'||Array.isArray(raw.teams)||!Array.isArray(raw.history)||raw.history.length>4000||!raw.arrivals||typeof raw.arrivals!=='object'||Array.isArray(raw.arrivals))bad('invalid team leadership.');
 const id=v=>v===null||Number.isInteger(v)&&v>=0&&v<=10000000,str=(v,n)=>typeof v==='string'&&v.length>0&&v.length<=n,yr=v=>Number.isInteger(v)&&v>=1900&&v<=10001,teams={};
 for(const [key,r] of Object.entries(raw.teams)){if(!/^\d+$/.test(key)||!data.teams.some(t=>t.id===Number(key)))bad('invalid team leadership team.');if(r===null){teams[key]=null;continue}
  if(!r||!id(r.captain)||!id(r.coCaptain)||r.captain!==null&&r.captain===r.coCaptain||!Object.hasOwn(LEADERSHIP_METHODS,r.method)||!str(r.coach,80)||!yr(r.reviewedYear)||r.appointed!==null&&(!r.appointed||!yr(r.appointed.year)||!Number.isInteger(r.appointed.day)||r.appointed.day<0||r.appointed.day>400)||r.lastRecommendation!==null&&!Number.isInteger(r.lastRecommendation))bad('invalid team leadership record.');
  teams[key]={captain:r.captain,coCaptain:r.coCaptain,method:r.method,coach:r.coach,appointed:r.appointed?{year:r.appointed.year,day:r.appointed.day}:null,reviewedYear:r.reviewedYear,lastRecommendation:r.lastRecommendation}}
 const history=raw.history.map(h=>{if(!h||!id(h.playerId)||h.playerId===null||!str(h.name,160)||!str(h.teamKey,80)||!str(h.team,120)||!['Captain','Co-captain'].includes(h.role)||!Object.hasOwn(LEADERSHIP_METHODS,h.method)||!yr(h.from)||h.to!==null&&(!yr(h.to)||h.to<h.from))bad('invalid captaincy history.');return {playerId:h.playerId,name:h.name,teamKey:h.teamKey,team:h.team,role:h.role,method:h.method,from:h.from,to:h.to}});
 const arrivals={};for(const [key,a] of Object.entries(raw.arrivals)){if(!/^\d+$/.test(key)||!a||!str(a.team,80)||!yr(a.year)||!Number.isInteger(a.day)||a.day<0||a.day>400)bad('invalid roster arrival.');arrivals[key]={team:a.team,year:a.year,day:a.day}}
 return {version:1,teams,history,arrivals};
}
// Older saves: manually designated captains carry over as legacy captains; nobody is reselected until next season.
const validateBeforeLeadership=validateCareerData;validateCareerData=function(raw){
 const data=validateBeforeLeadership(raw),bad=m=>{throw Error('Invalid save: '+m)};
 if(raw.teamLeadership!==undefined){data.teamLeadership=readTeamLeadership(raw.teamLeadership,data,bad);if(data.moraleSystem)data.moraleSystem.captains={};return data}
 const legacy=data.moraleSystem?.captains||{},previous=state;state=data;
 try{const store=leadershipStore(data);for(const club of data.teams){const id=legacy[club.id],p=club.roster.find(q=>q.id===id);store.teams[club.id]={captain:p?p.id:null,coCaptain:null,method:p?'legacy':leadershipMethod(coachFor(club)),coach:coachFor(club).name,appointed:null,reviewedYear:data.year,lastRecommendation:null};if(p)store.history.push({playerId:p.id,name:p.name,teamKey:club.key,team:club.city+' '+club.name,role:'Captain',method:'legacy',from:data.year,to:null})}leadershipTrackArrivals(true)}finally{state=previous}
 if(data.moraleSystem)data.moraleSystem.captains={};return data;
};
// Shown on the Roster tab under the coach and ownership panels; advisory controls only for your own team.
const coachCardBeforeLeadership=coachRosterCard;coachRosterCard=function(club){return coachCardBeforeLeadership(club)+leadershipPanel(club)};
