/* Family leave: a non-injury player status. Maternity leave (female players) is rare and age-weighted; announced mostly
   at the start of a season (misses that season) and sometimes in-season (the rest of the season plus part of the
   next). Paternity leave (male players) is in-season only and covers the next one or two team games. It is not an
   injury: no medical record, no injury reports, no durability or reinjury effects, no ratings change. Salary
   continues in full (2020 WNBA CBA). The roster spot is kept: a player on leave cannot be waived and does not count
   toward the roster maximum, so a temporary replacement can be signed (CPU teams do so when short-handed; WNBA leagues
   use the hardship exception). On return from maternity leave, a two-to-four week conditioning ramp caps minutes and
   energy. Fictional players only: anyone linked to a real historical person is never affected.

   p.familyLeave = {type:'maternity'|'paternity', state:'leave'|'ramp', start, until (maternity leave), games (paternity
   leave), rampUntil (ramp), announced:'season'|'inSeason'|'commissioner'}; p.familyLeaveCover = {for:id} marks a
   temporary replacement. */
const FAMILY_LEAVE_RATES={maternity:{low:.004,normal:.012},paternity:{low:.01,normal:.03}};
function familyLeaveSetting(){return leagueRules().familyLeave??'normal'}
function familyLeaveEligible(p){return !!p&&!p.historicalPersonId&&!p.familyLeave&&!(p.medicalInfo&&p.medicalInfo.until>medicalStamp())}
function familyLeaveActive(p){const f=p?.familyLeave;if(!f||f.state!=='leave')return false;return f.type==='paternity'?f.games>0:medicalStamp()<f.until}
function familyLeaveDays(p){if(!familyLeaveActive(p))return 0;const f=p.familyLeave;return f.type==='paternity'?1:Math.max(1,f.until-medicalStamp())}
function familyLeaveRamping(p){const f=p?.familyLeave;return !!f&&f.state==='ramp'&&medicalStamp()<f.rampUntil}
function familyLeaveAgeWeight(type,age){if(type==='maternity')return age<20?0:age<22?.15:age<26?.6:age<=34?1:age<=37?.35:age<=40?.08:0;return age<23?.3:age<=36?1:age<=40?.4:.1}
function familyLeaveTeam(p){return state.teams.find(t=>t.roster.includes(p))||null}
function familyLeaveWho(p){const t=familyLeaveTeam(p);return p.name+(t?' ('+t.abbr+')':'')}
function familyLeaveNews(p,headline){const t=familyLeaveTeam(p);if(typeof addNewsItem==='function')addNewsItem({category:'Franchise',headline,teams:t?[t.id]:[]});else if(typeof say==='function')say(headline)}
// Last regular-season day of the current season as a medical stamp (maternity leave announced at season start).
function familyLeaveSeasonEndStamp(){return medicalStamp()+Math.max(1,seasonLength()-state.day)}
function startFamilyLeave(p,type,{announced='inSeason',days=null,games=null,quiet=false}={}){
 const now=medicalStamp();
 if(type==='maternity'){const until=now+(days??(announced==='season'?familyLeaveSeasonEndStamp()-now+21:300+Math.floor(Math.random()*101)));p.familyLeave={type,state:'leave',start:now,until,announced};
  if(!quiet)familyLeaveNews(p,familyLeaveWho(p)+' announces she is expecting and will miss '+(announced==='season'?'the '+seasonLabel(state.year)+' season':until-now>=seasonLength()-state.day?'the rest of the season and the start of next season':'the next '+Math.max(1,Math.round((until-now)/7))+' weeks')+'.')}
 else{const n=games??(Math.random()<.65?1:2);p.familyLeave={type,state:'leave',start:now,games:n,announced};
  if(!quiet)familyLeaveNews(p,familyLeaveWho(p)+' will miss the next '+(n===1?'game':n===2?'two games':n+' games')+' for the birth of his child.')}
 return p.familyLeave}
function endFamilyLeave(p,{quiet=false}={}){const f=p.familyLeave;if(!f)return;
 if(f.type==='maternity'&&f.state==='leave'){const now=medicalStamp();p.familyLeave={type:'maternity',state:'ramp',start:f.start,rampStart:now,rampUntil:now+14+Math.floor(Math.random()*15),announced:f.announced};if(p.workload)p.workload.energy=Math.min(p.workload.energy??100,80);
  if(!quiet)familyLeaveNews(p,familyLeaveWho(p)+' returns from maternity leave and will ease back in over the next few weeks.');familyLeaveReleaseCover(p);return}
 delete p.familyLeave;if(f.type==='paternity'&&f.state==='leave'&&!quiet)familyLeaveNews(p,familyLeaveWho(p)+' rejoins the team after the birth of his child.')}
function clearFamilyLeave(p){delete p.familyLeave}
// Return ramp: about 60% of a game for the first half of the ramp, about 80% for the rest; energy starts lower.
function familyLeaveMinutesCap(p){if(!familyLeaveRamping(p))return Infinity;const f=p.familyLeave,g=typeof gameMinutes==='function'?gameMinutes():48,left=f.rampUntil-medicalStamp(),half=Math.ceil((f.rampUntil-(f.rampStart??f.rampUntil-21))/2);return Math.round(g*(left>half?.6:.8))}

// Availability: a player on leave is unavailable like an injured player (lineups, rotations, minutes, hardship), but has
// no medical record, so injury reports, reinjury windows and durability are untouched.
const familyLeaveInjuryDaysBefore=injuryDays;injuryDays=function(p){return familyLeaveInjuryDaysBefore(p)||familyLeaveDays(p)};
const familyLeaveCapBefore=injuryMinutesCap;injuryMinutesCap=function(p){return Math.min(familyLeaveCapBefore(p),familyLeaveMinutesCap(p))};
const familyLeaveEnergyBefore=playerEnergy;playerEnergy=function(p,club){const e=familyLeaveEnergyBefore(p,club);return familyLeaveRamping(p)?Math.min(e,85):e};
// Health text, injury reports, DNP reasons and the watch list say "family leave", never injury.
const familyLeaveHealthBefore=durabilityHealthText;durabilityHealthText=function(p){const f=p.familyLeave;if(familyLeaveActive(p))return f.type==='paternity'?'Family leave · Paternity leave for the next '+(f.games===1?'game':f.games+' games')+'. Not an injury.':'Family leave · Maternity leave. Expected back in about '+familyLeaveDays(p)+' days. Salary continues in full; not an injury.';if(familyLeaveRamping(p))return 'Returning from maternity leave · Conditioning ramp: about '+familyLeaveMinutesCap(p)+' minutes a game for '+(f.rampUntil-medicalStamp())+' more days.';return familyLeaveHealthBefore(p)};
function familyLeaveStatusLabel(p){const f=p.familyLeave;return familyLeaveActive(p)?(f.type==='paternity'?'Family leave · '+(f.games===1?'1 game':f.games+' games'):'Family leave · '+familyLeaveDays(p)+' days'):familyLeaveRamping(p)?'Returning · minutes ramp':''}
const familyLeaveSnapshotBefore=teamInjurySnapshot;teamInjurySnapshot=function(ids){return familyLeaveSnapshotBefore(ids).filter(x=>!familyLeaveActive(state.teams.flatMap(t=>t.roster).find(p=>p.id===x.id)))};
const familyLeaveDNPBefore=boxDNPReasons;boxDNPReasons=function(game){const reasons=familyLeaveDNPBefore(game);for(const [row] of reasons){const p=state.teams.flatMap(t=>t.roster).find(q=>q.id===row.playerId);if(p&&familyLeaveActive(p))reasons.set(row,'DNP – Family leave')}return reasons};
const familyLeaveWatchBefore=watchSnapshot;watchSnapshot=function(r){const s=familyLeaveWatchBefore(r);if(familyLeaveActive(r.p))s.injured=false;return s};

// Roster: players on leave keep their spot (never waived) and do not count toward the roster maximum.
function familyLeaveRosterCount(t){return t.roster.filter(p=>!familyLeaveActive(p)).length}
const familyLeaveWaiveBefore=cpuWaiveCandidate;cpuWaiveCandidate=function(t,keep=[]){return familyLeaveWaiveBefore(t,[...keep,...t.roster.filter(familyLeaveActive)])};
// A CPU signing made while the club has a player on leave and its counted roster was already full is a temporary cover.
const familyLeaveSignBefore=cpuSign;cpuSign=function(t,p,...rest){const on=t.roster.filter(familyLeaveActive),full=t.roster.length>=rosterMaximum();const ok=familyLeaveSignBefore(t,p,...rest);if(ok&&on.length&&full&&t.roster.includes(p))p.familyLeaveCover={for:on[0].id};return ok};
// On return, a CPU club over the limit releases her temporary cover.
function familyLeaveReleaseCover(p){const t=familyLeaveTeam(p);if(!t)return;const cover=t.roster.find(q=>q.familyLeaveCover?.for===p.id);if(!cover)return;delete cover.familyLeaveCover;if(t.id===controlledTeamId()&&!simulationAutopilot()){if(familyLeaveRosterCount(t)>rosterMaximum())familyLeaveNews(p,'Roster note: '+t.city+' '+t.name+' are over the roster limit now that '+p.name+' has returned.');return}if(familyLeaveRosterCount(t)>rosterMaximum())cpuRelease(t,cover,{text:'now that '+p.name+' has returned from maternity leave',allowBelowMinimum:true})}

// Events. Season start (most maternity announcements) and a daily in-season roll; paternity games count down as the
// team plays. Off in leagues with the setting off; fictional players only.
function familyLeaveRate(type){const s=familyLeaveSetting();return s==='off'?0:FAMILY_LEAVE_RATES[type][s]??0}
function familyLeaveSeasonStart(){if(familyLeaveSetting()==='off')return;for(const t of state.teams)for(const p of t.roster){if(p.gender!=='female'||!familyLeaveEligible(p))continue;if(Math.random()<familyLeaveRate('maternity')*.75*familyLeaveAgeWeight('maternity',p.age))startFamilyLeave(p,'maternity',{announced:'season'})}}
function familyLeaveDaily(){const now=medicalStamp();
 for(const t of state.teams)for(const p of t.roster){const f=p.familyLeave;if(f?.type==='maternity'&&f.state==='leave'&&now>=f.until)endFamilyLeave(p);else if(f?.state==='ramp'&&now>=f.rampUntil)delete p.familyLeave}
 if(familyLeaveSetting()==='off'||state.champion!==null||state.day>=seasonLength())return;const days=Math.max(1,seasonLength());
 for(const t of state.teams)for(const p of t.roster){if(!familyLeaveEligible(p))continue;
  if(p.gender==='female'){if(Math.random()<familyLeaveRate('maternity')*.25*familyLeaveAgeWeight('maternity',p.age)/days)startFamilyLeave(p,'maternity',{announced:'inSeason'})}
  else if(Math.random()<familyLeaveRate('paternity')*familyLeaveAgeWeight('paternity',p.age)/days)startFamilyLeave(p,'paternity')}}
const familyLeaveOwnerDayBefore=ownerDay;ownerDay=function(...args){const r=familyLeaveOwnerDayBefore(...args);familyLeaveDaily();return r};
const familyLeavePlayBefore=play;play=function(a,b,...rest){const result=familyLeavePlayBefore(a,b,...rest);for(const id of [a,b])for(const p of state.teams[id]?.roster||[]){const f=p.familyLeave;if(f?.type==='paternity'&&f.state==='leave'&&f.games>0){f.games--;if(!f.games)endFamilyLeave(p)}}return result};
const familyLeaveNewSeasonBefore=newSeason;newSeason=function(...args){const year=state.year,r=familyLeaveNewSeasonBefore(...args);if(state.year!==year){for(const t of state.teams)for(const p of t.roster){const f=p.familyLeave;if(f?.type==='paternity')delete p.familyLeave}familyLeaveSeasonStart()}return r};

// Saves: the status and cover marks are validated and kept.
function readFamilyLeave(raw,bad){if(raw===undefined)return undefined;const int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi,stamp=n=>int(n,-100000,4000000);
 if(!raw||!['maternity','paternity'].includes(raw.type)||!['leave','ramp'].includes(raw.state)||!stamp(raw.start)||!['season','inSeason','commissioner'].includes(raw.announced)||raw.state==='leave'&&(raw.type==='maternity'?!stamp(raw.until)||raw.until<raw.start||raw.until>raw.start+800:!int(raw.games,0,20))||raw.state==='ramp'&&(raw.type!=='maternity'||!stamp(raw.rampUntil)||raw.rampUntil<raw.start||raw.rampStart!==undefined&&(!stamp(raw.rampStart)||raw.rampStart>raw.rampUntil)))bad('invalid family leave status.');
 return {type:raw.type,state:raw.state,start:raw.start,announced:raw.announced,...(raw.until!==undefined?{until:raw.until}:{}),...(raw.games!==undefined?{games:raw.games}:{}),...(raw.rampUntil!==undefined?{rampUntil:raw.rampUntil}:{}),...(raw.rampStart!==undefined?{rampStart:raw.rampStart}:{})}}
const familyLeaveValidateBefore=validateCareerData;
validateCareerData=function(raw){const out=familyLeaveValidateBefore(raw),bad=m=>{throw Error('Invalid save: '+m)},all=s=>[...(s.teams||[]).flatMap(t=>t.roster||[]),...(s.free||[]),...(s.draftRights||[]).map(r=>r.player),...(s.draft?.prospects||[])].filter(Boolean);
 const leave=new Map(),cover=new Map();for(const p of all(raw||{})){if(p.familyLeave!==undefined)leave.set(p.id,readFamilyLeave(p.familyLeave,bad));if(p.familyLeaveCover!==undefined){if(!p.familyLeaveCover||!Number.isInteger(p.familyLeaveCover.for))bad('invalid family leave cover.');cover.set(p.id,{for:p.familyLeaveCover.for})}}
 for(const p of all(out)){if(leave.has(p.id))p.familyLeave=leave.get(p.id);if(cover.has(p.id))p.familyLeaveCover=cover.get(p.id)}return out};
