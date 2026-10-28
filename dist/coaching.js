/* Coaching is persisted per team; scouting estimates never change simulation ratings. */
const COACH_PILLARS=[
 ['On-Court Tactics',[['offense','Offensive Acumen','Improves shot execution.'],['defense','Defensive Scheme','Contests shots and forces turnovers.'],['tempo','Pace & Tempo Management','Executes the preferred tempo with fewer mistakes.'],['tactics','In-Game Adjustments','Timeout responses reduce an opponent’s scoring run.'],['rotation','Rotation & Minute Management','Reduces fatigue and improves automatic bench usage.']]],
 ['Player Lifecycle Management',[['teaching','Teaching / Player Dev','Improves young-player offseason growth.'],['veterans','Veteran Optimization','Mitigates age-related regression.'],['conditioning','Physical Conditioning','Reduces non-contact injury risk and recovery time.'],['discipline','Discipline / Focus','Reduces incidents, technical fouls and locker-room friction.']]],
 ['Roster & Front Office',[['charisma','Charisma / Recruiting','Offers a small contract discount and improves coach conversations.'],['scouting','Talent Scouting / Evaluation','Narrows uncertainty in displayed player skill estimates.'],['staff','Staff Management','Amplifies offensive and defensive assistant contributions.']]]
];
const COACH_KEYS=COACH_PILLARS.flatMap(p=>p[1].map(a=>a[0]));
const COACH_SYSTEMS=['Pace & Space','Grit & Grind','Triangle','Seven Seconds or Less'];
const COACH_TYPES=['Developmental','Win-Now','Balanced'];
const COACH_FOCUS=['Inside-out','Outside-in','Balanced'];
function generateCoach(club){
 let seed=2166136261;for(const ch of club.key||club.abbr)seed=Math.imul(seed^ch.charCodeAt(0),16777619)>>>0;
 const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed>>>8};
 const first=['Marcus','Adrian','Calvin','Andre','Darius','Victor','Elijah','Julian','Raymond','Miles','Owen','Terrence','Isaiah','Leon','Samuel','Damon','Wesley','Vincent'];
 const last=['Bennett','Holloway','Reed','Sullivan','Ellis','Foster','Grant','Wallace','Coleman','Rivera','Daniels','Hayes','Lawson','Murray','Porter','Vaughn','Brooks','Harrison'];
 const name=()=>first[next()%first.length]+' '+last[next()%last.length];
 const c={name:name(),age:38+next()%28,system:COACH_SYSTEMS[next()%4],type:COACH_TYPES[next()%3],focus:COACH_FOCUS[next()%3],attributes:Object.fromEntries(COACH_KEYS.map(k=>[k,45+next()%51]))};
 c.tempo=c.system==='Seven Seconds or Less'?94:c.system==='Grit & Grind'?30:c.system==='Pace & Space'?77:53;
 c.assistants=['Offense','Defense'].map(role=>({name:name(),role,rating:45+next()%46}));return c;
}
function readCoach(raw,club,bad,year=2026){
 if(raw===undefined)raw=generateCoach(club);
 if(!raw||typeof raw.name!=='string'||!raw.name.trim()||raw.name.length>80||!Number.isInteger(raw.age)||raw.age<25||raw.age>100||!COACH_SYSTEMS.includes(raw.system)||!COACH_TYPES.includes(raw.type)||!COACH_FOCUS.includes(raw.focus)||!Number.isInteger(raw.tempo)||raw.tempo<0||raw.tempo>100||!raw.attributes||COACH_KEYS.some(k=>!Number.isInteger(raw.attributes[k])||raw.attributes[k]<1||raw.attributes[k]>99)||!Array.isArray(raw.assistants)||raw.assistants.length!==2)bad('invalid coaching staff.');
 const assistants=raw.assistants.map((a,i)=>{if(!a||typeof a.name!=='string'||!a.name.trim()||a.name.length>80||a.role!==['Offense','Defense'][i]||!Number.isInteger(a.rating)||a.rating<1||a.rating>99)bad('invalid assistant coach.');return {name:a.name,role:a.role,rating:a.rating}});
 return {seasons:readCoachSeasons(raw.seasons,bad),bio:readCoachBio(raw,year,bad),recordArchive:readCoachRecord(raw.recordArchive,bad),name:raw.name,age:raw.age,system:raw.system,type:raw.type,focus:raw.focus,tempo:raw.tempo,attributes:Object.fromEntries(COACH_KEYS.map(k=>[k,raw.attributes[k]])),assistants};
}
function coachFor(club){const c=club.coach||(club.coach=generateCoach(club));if(!c.bio)c.bio=generateCoachBio(c,state?.year||2026);if(!c.seasons)c.seasons=[];if(!c.recordArchive)c.recordArchive={w:0,l:0,pw:0,pl:0};return c}
function coachingSkill(club,key){
 const c=coachFor(club);let n=c.attributes[key];
 if(key==='offense'||key==='defense')n+=(c.assistants[key==='offense'?0:1].rating-50)*(.08+c.attributes.staff/500);
 return Math.max(1,Math.min(99,n));
}
function coachFit(club){
 const keys={'Pace & Space':['tp','pss','oiq'],'Grit & Grind':['post','stre','rim','diq'],'Triangle':['pss','oiq','post'],'Seven Seconds or Less':['spd','endu','drb','tp']}[coachFor(club).system];
 return Math.round(club.roster.reduce((s,p)=>s+keys.reduce((n,k)=>n+withBasketballAttributes(p).attributes[k],0)/keys.length,0)/club.roster.length);
}
function coachTradeValue(p,club){
 const c=coachFor(club),a=withBasketballAttributes(p).attributes;
 return p.ovr+(c.type==='Developmental'?Math.max(0,26-p.age)*.9+Math.max(0,p.pot-p.ovr)*.4:c.type==='Win-Now'?(a.oiq+a.diq-120)*.06+(hasTrait(p,'professional')?2:0):Math.max(0,27-p.age)*.55)+(c.focus==='Inside-out'?(a.post-60)*.06:c.focus==='Outside-in'?(a.tp-60)*.06:0);
}
function coachDiscount(club){return Math.max(0,(coachingSkill(club,'charisma')-50)/1000)}
function coachMeetingChance(club){return .35+coachingSkill(club,'charisma')*.0045}
function injuryDays(p){return Math.max(0,p.medicalInfo?p.medicalInfo.until-medicalStamp():(p.injuredUntil||0)-moraleStamp())}
const minutesBeforeCoaches=playerMinutes;
function coachBaseMinutes(p,club){
 if(rotationValid(club))return minutesBeforeCoaches(p,club);
 const i=club.roster.indexOf(p),starterMinutes=Math.round(37-coachingSkill(club,'rotation')/18),bench=club.roster.length-5,total=240-5*starterMinutes;
 return i<0?0:i<5?starterMinutes:Math.floor(total/bench)+(i-5<total%bench?1:0);
}
function coachRotation(club){
 const healthy=club.roster.filter(p=>!injuryDays(p)),custom=rotationValid(club);
 const weights=healthy.map(p=>Math.max(custom?0:1,coachBaseMinutes(p,club)));
 if(!weights.some(x=>x>0))weights.fill(1);
 // Reallocate unavailable players' minutes without exceeding 48 per healthy player.
 const minutes=weights.map(()=>0);for(let n=0;n<240&&healthy.length;n++){let best=-1;for(let i=0;i<healthy.length;i++)if(minutes[i]<48&&(best<0||weights[i]/(minutes[i]+1)>weights[best]/(minutes[best]+1)))best=i;if(best<0)break;minutes[best]++}
 return new Map(healthy.map((p,i)=>[p.id,minutes[i]]));
}
playerMinutes=function(p,club){if(!club)return 0;if(!club.roster.some(q=>injuryDays(q)))return coachBaseMinutes(p,club);return coachRotation(club).get(p.id)||0};
function coachScoutedRating(p,key){
 const observer=team(),actual=withBasketballAttributes(p).attributes[key],range=Math.round((99-coachingSkill(observer,'scouting'))/5);
 let seed=p.id*31;for(const ch of key)seed=Math.imul(seed,33)+ch.charCodeAt(0);
 return {value:ratingLimit(actual+((seed>>>0)%(range*2+1)-range)),range};
}
const attributesBeforeCoaches=playerAttributes;
playerAttributes=function(ctx){
 const a=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,coachScoutedRating(ctx.p,k).value]));
 return '<p class="attribute-intro">Scouting report · '+escapeHTML(coachFor(team()).name)+' · Estimated ratings ±'+coachScoutedRating(ctx.p,'tp').range+' points. Simulation uses underlying abilities.</p>'+ratingLegend()+ATTRIBUTE_GROUPS.map(([group,rows])=>playerCard(group.toUpperCase(),'<div class="attribute-list">'+rows.map(([k,label,description])=>'<div class="attribute-row"><div><strong>'+label+'</strong><small>'+description+'</small></div><meter class="rating-'+ratingTier(a[k])[0]+'" min="1" max="99" value="'+a[k]+'">'+a[k]+'</meter><b>'+ratingMarkup(a[k])+'</b></div>').join('')+'</div>')).join('');
};
const developmentBeforeCoaches=traitDevelopment;
traitDevelopment=function(p,club,base){
 let delta=developmentBeforeCoaches(p,club,base);
 if(p.age<=25){const expected=(coachingSkill(club,'teaching')-50)/30;delta+=Math.trunc(expected)+(Math.random()<Math.abs(expected%1)?Math.sign(expected):0)}
 if(p.age>30&&delta<0&&Math.random()<coachingSkill(club,'veterans')/110)delta++;
 return delta;
};
const developBeforeCoaches=developAttributes;
developAttributes=function(p,change){const before=p.attributes?{...p.attributes}:null;developBeforeCoaches(p,change);const club=state.teams.find(t=>t.roster.includes(p));if(before&&club&&p.age>30&&coachingSkill(club,'veterans')>=80)for(const k of ['stre','spd','jmp','endu'])if(p.attributes[k]<before[k])p.attributes[k]=Math.min(before[k],ratingLimit(p.attributes[k]+1))};
const negotiationsBeforeCoaches=negotiationStatus;
negotiationStatus=function(p){const n=negotiationsBeforeCoaches(p);n.premium=Math.max(hasTrait(p,'mercenary')?.20:0,n.premium-coachDiscount(playerContext(p.id)?.club||team()));return n};
const freeQuoteBeforeCoaches=freeAgentQuote;
freeAgentQuote=function(p,club=team()){return Math.round(freeQuoteBeforeCoaches(p,club)*(hasTrait(p,'mercenary')?1:1-coachDiscount(club))*10)/10};
const teammateMoodBeforeCoaches=teammateMood;
teammateMood=function(p,club){const mood=teammateMoodBeforeCoaches(p,club);return club&&mood<0?Math.round(mood*(1-coachingSkill(club,'discipline')/180)):mood};
function coachAfterGame(club,result){
 const c=coachFor(club);
 for(const p of club.roster){
  const row=result.box.find(r=>r.playerId===p.id);
  if(!row?.played)continue;
  if(Math.random()<.004*(1-c.attributes.discipline/110)){
   p.moraleAdjustment=Math.max(-25,(p.moraleAdjustment||0)-5);
   say(p.name+' ('+club.abbr+') missed a team obligation. The coaching staff is addressing the lapse in focus.');
  }
 }
}
const playBeforeCoaches=play;
play=function(a,b,stage){const result=playBeforeCoaches(a,b,stage);coachAfterGame(state.teams[a],result);coachAfterGame(state.teams[b],result);return result};
const overviewBeforeCoaches=playerOverview;
playerOverview=function(ctx){return overviewBeforeCoaches(ctx)+playerCard('HEALTH','<p>'+escapeHTML(durabilityHealthText(ctx.p))+'</p><p>Durability '+ratingMarkup(durabilityRating(ctx.p))+' · '+durabilityTier(durabilityRating(ctx.p))+'</p>')};
function coachRosterCard(club){
 const c=coachFor(club),injured=club.roster.filter(p=>injuryDays(p));
 return '<section class="panel coach-roster"><div class="panelhead"><div><span class="eyebrow">HEAD COACH</span><h2>'+escapeHTML(c.name)+'</h2></div><button onclick="openCoachProfile('+club.id+')">Coach profile →</button></div><div class="coach-summary"><span>'+escapeHTML(c.system)+'</span><span>'+escapeHTML(c.type)+'</span><span>System fit '+coachFit(club)+'/99</span><span>Tempo '+c.tempo+'/100</span></div>'+(injured.length?'<div class="note"><strong>Injury report</strong><p>'+injured.map(p=>escapeHTML(p.name)+' · '+escapeHTML(p.medicalInfo?.name||'strain')+(p.medicalInfo?.context==='practice'?' (practice)':'')+' · '+injuryDays(p)+' days remaining').join('<br>')+'</p><small>Unavailable players sit out. Their minutes are redistributed automatically.</small></div>':'')+'</section>';
}
const rosterBeforeCoaches=roster;
roster=function(free=false){const body=rosterBeforeCoaches(free);if(free)return body;return coachRosterCard(state.teams.find(t=>t.id===rosterTeamId)||team())+body};
function openCoachProfile(id){
 const club=state.teams.find(t=>t.id===id);if(!club)return;const c=coachFor(club);
 const groups=COACH_PILLARS.map(([pillar,rows])=>playerCard(pillar,'<div class="coach-attributes">'+rows.map(([key,label,help])=>'<div><span><strong>'+label+'</strong><small>'+help+'</small></span>'+ratingMarkup(c.attributes[key])+'</div>').join('')+'</div>')).join('');
 titleModal('Coach profile','<div class="coach-profile-head">'+teamLogo(club)+'<div><h2>'+escapeHTML(c.name)+'</h2><p>'+escapeHTML(club.city+' '+club.name)+' · Head coach · Age '+c.age+'</p></div></div>'+coachProfileDetails(club)+'<div class="coach-pillars">'+groups+playerCard('Personality / System Archetypes','<dl class="pp-ledger"><div><dt>System</dt><dd>'+c.system+'</dd></div><div><dt>Roster preference</dt><dd>'+c.type+'</dd></div><div><dt>Position focus</dt><dd>'+c.focus+'</dd></div><div><dt>Preferred tempo</dt><dd>'+c.tempo+'/100</dd></div><div><dt>Roster system fit</dt><dd>'+coachFit(club)+'/99</dd></div></dl><p>System fit boosts execution when roster skills match the scheme. Roster preferences shape trade valuations.</p>')+'</div>'+playerCard('Assistant staff',c.assistants.map(a=>'<p>'+escapeHTML(a.name)+' · '+a.role+' coordinator '+ratingMarkup(a.rating)+'</p>').join('')+'<p>Effective offense '+coachingSkill(club,'offense').toFixed(1)+' · defense '+coachingSkill(club,'defense').toFixed(1)+' after staff management.</p>')+'<p class="coach-footnote">Ratings use the game’s 1–99 scale. Coach conversations: '+Math.round(coachMeetingChance(club)*100)+'% success. Contract discount: up to '+(coachDiscount(club)*100).toFixed(1)+'%. Draft and staff hiring systems are not yet available.</p>');
 const d=document.getElementById('profile');d.className='player-dialog coach-dialog';
}

function generateCoachBio(c,year){
 let seed=0;for(const ch of c.name)seed=(Math.imul(seed,31)+ch.charCodeAt(0))>>>0;
 const colleges=['Georgia','Georgia Tech','Duke','North Carolina','Kentucky','UCLA','Kansas','Michigan State','Arizona','Connecticut','Memphis','Texas'];
 const towns=['Atlanta, Georgia, USA','Dallas, Texas, USA','Los Angeles, California, USA','Chicago, Illinois, USA','Charlotte, North Carolina, USA','Detroit, Michigan, USA','New Orleans, Louisiana, USA','New York, New York, USA'];
 const month=1+seed%9,day=1+(seed>>>8)%28;
 return {college:colleges[seed%colleges.length],hometown:towns[(seed>>>4)%towns.length],birthdate:String(year-c.age).padStart(4,'0')+'-'+String(month).padStart(2,'0')+'-'+String(day).padStart(2,'0')};
}
function readCoachBio(c,year,bad){
 if(c.bio===undefined)return generateCoachBio(c,year);
 const b=c.bio;if(!b||['college','hometown'].some(k=>typeof b[k]!=='string'||!b[k].trim()||b[k].length>100)||typeof b.birthdate!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(b.birthdate)||!Number.isFinite(Date.parse(b.birthdate))||new Date(b.birthdate).toISOString().slice(0,10)!==b.birthdate)bad('invalid coach biography.');
 return {college:b.college,hometown:b.hometown,birthdate:b.birthdate};
}
function readCoachRecord(raw,bad){
 if(raw===undefined)return {w:0,l:0,pw:0,pl:0};
 if(!raw||['w','l','pw','pl'].some(k=>!Number.isInteger(raw[k])||raw[k]<0||raw[k]>1000000))bad('invalid coaching record.');
 return Object.fromEntries(['w','l','pw','pl'].map(k=>[k,raw[k]]));
}
function coachSeasonRecord(club){const games=state.history.filter(g=>g.stage!=='Regular season'&&(g.a===club.id||g.b===club.id)),pw=games.filter(g=>g.winner===club.id).length;return {w:club.w,l:club.l,pw,pl:games.length-pw}}
function archiveCoachRecords(){for(const club of state.teams){if(expansionPendingSeason(club))continue;const c=coachFor(club);if(c.seasons.some(r=>r.year===state.year))continue;const r=coachSeasonSnapshot(club);c.seasons.push(r);for(const k of ['w','l','pw','pl'])c.recordArchive[k]+=r[k]}}
function coachProfileDetails(club){
 const c=coachFor(club),birth=new Date(c.bio.birthdate+'T00:00:00Z').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'});
 const facts=[['College',c.bio.college],['Birthdate',birth],['Hometown',c.bio.hometown]];
 return playerCard('Background','<dl class="pp-facts pp-biography">'+facts.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+escapeHTML(value)+'</dd></div>').join('')+'</dl>')+coachRecordTable(club);
}
function coachSeasonSnapshot(club){
 const c=coachFor(club),r=coachSeasonRecord(club),division=state.teams.filter(t=>t.division===club.division&&t.conference===club.conference),pct=t=>t.w+t.l?t.w/(t.w+t.l):0;
 const finish=state.day>=seasonLength()?1+division.filter(t=>pct(t)>pct(club)).length:null;
 return {...r,year:state.year,age:c.age,team:club.abbr,league:state.leagueName||'Dynasty Basketball League',finish};
}
function readCoachSeasons(raw,bad){
 if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>8100)bad('invalid coaching seasons.');
 const years=new Set();return raw.map(r=>{if(!r||!Number.isInteger(r.year)||r.year<1900||r.year>10000||years.has(r.year)||!Number.isInteger(r.age)||r.age<25||r.age>100||typeof r.team!=='string'||r.team.length>5||!r.team||typeof r.league!=='string'||r.league.length>80||!r.league||(r.finish!==null&&(!Number.isInteger(r.finish)||r.finish<1||r.finish>30)))bad('invalid coaching season.');years.add(r.year);return {...readCoachRecord(r,bad),year:r.year,age:r.age,team:r.team,league:r.league,finish:r.finish}});
}
function coachRecordTable(club){
 const c=coachFor(club),current=coachSeasonSnapshot(club),rows=[...c.seasons.filter(r=>r.year!==state.year),current].sort((a,b)=>a.year-b.year),total={w:c.recordArchive.w+current.w,l:c.recordArchive.l+current.l,pw:c.recordArchive.pw+current.pw,pl:c.recordArchive.pl+current.pl};
 const pct=(w,l)=>w+l?(w/(w+l)).toFixed(3).replace(/^0/,''):'—';
 const stats=r=>[r.w+r.l,r.w,r.l,pct(r.w,r.l),r.finish??'—',r.pw+r.pl,r.pw,r.pl,pct(r.pw,r.pl)].map(v=>'<td>'+v+'</td>').join('');
 const body=rows.map(r=>'<tr><th scope="row">'+seasonLabel(r.year)+'</th><td>'+r.age+'</td><td title="'+escapeHTML(r.league)+'">'+escapeHTML(r.league.split(/\s+/).map(w=>w[0]).join('').slice(0,6))+'</td><td>'+escapeHTML(r.team)+'</td>'+stats(r)+'</tr>').join('');
 return playerCard('Coaching Record','<div class="bref-table scroll" role="region" aria-label="Season-by-season coaching record" tabindex="0"><table><thead><tr><th colspan="4"></th><th colspan="5" scope="colgroup">Regular Season</th><th colspan="4" scope="colgroup">Playoffs</th></tr><tr>'+['Season','Age','Lg','Tm','G','W','L','W/L%','Finish','G','W','L','W/L%'].map(v=>'<th scope="col">'+v+'</th>').join('')+'</tr></thead><tbody>'+body+'</tbody><tfoot><tr><th scope="row" colspan="4">Career (tracked)</th>'+stats(total)+'</tr></tfoot></table></div><p class="muted">Finish is division rank at the end of the regular season; tied records share a rank. Season rows are saved going forward. Previously saved career totals are retained, even when their season breakdown is unavailable.</p>');
}
