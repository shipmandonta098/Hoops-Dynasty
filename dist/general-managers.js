/* Named general managers for CPU franchises: identity, career records, season-end tenure reviews and profiles.
   The user's front office stays state.gmName; display and records never change simulation results. */
const GM_COLLEGES=['Georgetown','Duke','Stanford','Michigan','Northwestern','Penn','Villanova','Gonzaga','UCLA','Syracuse','Wake Forest','Notre Dame','Virginia','Butler','Princeton','Texas'];
const GM_HOMETOWNS=['Boston, Massachusetts, USA','Philadelphia, Pennsylvania, USA','Houston, Texas, USA','Seattle, Washington, USA','Indianapolis, Indiana, USA','Baltimore, Maryland, USA','Oakland, California, USA','Columbus, Ohio, USA','Memphis, Tennessee, USA','Denver, Colorado, USA','Atlanta, Georgia, USA','Chicago, Illinois, USA'];
const GM_PREVIOUS=['Assistant general manager','Director of player personnel','Vice president of basketball operations','Director of scouting','Salary-cap strategist','Director of analytics','Player agent','Former head coach'];
const GM_STYLES=['Analytics-driven','Player development','Win-now dealmaker','Cap-conscious','Scouting-first','Culture builder'];
const GM_EXIT_REASONS=['Fired','Replaced'];
function gmSeed(text){let h=2166136261;for(const ch of String(text))h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return h}
function gmAllRecords(s=state){return [...(s.teams||[]).map(t=>t.gm).filter(Boolean),...(s.formerGMs||[])]}
function gmNextId(s=state){return gmAllRecords(s).reduce((n,g)=>Math.max(n,g.id),0)+1}
function gmUserTeam(club,s=state){return club.id===controlledTeamId(s)||typeof controlledBeforeCommissioner==='function'&&club.id===controlledBeforeCommissioner(s)}
function generateGM(club,s=state,{hiredYear=null,id=gmNextId(s)}={}){
 const gender=generatedGender(s.leagueGender||'male',hiredYear===null?club.id:id),taken=new Set(gmAllRecords(s).map(g=>nameKey(g.name)));
 let info=generatePlayerName({country:'US',gender,s});for(let i=0;i<20&&taken.has(nameKey(info.name));i++)info=generatePlayerName({country:'US',gender,s});
 const seed=gmSeed(info.name+':'+(club.key||club.abbr)),year=s.year||2026;
 return {id,name:info.name,gender,age:34+seed%30,hiredYear:hiredYear??year-(seed>>>5)%6,bio:{college:GM_COLLEGES[(seed>>>9)%GM_COLLEGES.length],hometown:GM_HOMETOWNS[(seed>>>13)%GM_HOMETOWNS.length],previous:GM_PREVIOUS[(seed>>>17)%GM_PREVIOUS.length],style:GM_STYLES[(seed>>>21)%GM_STYLES.length]},pressure:0,seasons:[]};
}
function gmFor(club){if(!club)return null;if(!club.gm)club.gm=generateGM(club,state,{hiredYear:state.year});return club.gm}
function gmDisplayName(club){return gmUserTeam(club)?(state.gmName||'General Manager'):gmFor(club).name}
function gmLead(club){return club.city+' GM '+gmDisplayName(club)}
function readGMSeasons(raw,bad){
 if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>8100)bad('invalid general manager seasons.');
 const years=new Set();return raw.map(r=>{if(!r||!Number.isInteger(r.year)||r.year<1900||r.year>10000||years.has(r.year)||typeof r.team!=='string'||!r.team||r.team.length>5||typeof r.key!=='string'||!r.key||r.key.length>80||typeof r.name!=='string'||!r.name||r.name.length>100||['w','l'].some(k=>!Number.isInteger(r[k])||r[k]<0||r[k]>120)||['playoffs','title','award'].some(k=>typeof r[k]!=='boolean'))bad('invalid general manager season.');years.add(r.year);return {year:r.year,team:r.team,key:r.key,name:r.name,w:r.w,l:r.l,playoffs:r.playoffs,title:r.title,award:r.award}});
}
function readGM(raw,bad){
 const str=(v,n)=>typeof v==='string'&&v.trim()&&v.length<=n;
 if(!raw||!Number.isInteger(raw.id)||raw.id<1||raw.id>10000000||!str(raw.name,80)||!['male','female'].includes(raw.gender)||!Number.isInteger(raw.age)||raw.age<20||raw.age>100||!Number.isInteger(raw.hiredYear)||raw.hiredYear<1900||raw.hiredYear>10001||!raw.bio||['college','hometown','previous','style'].some(k=>!str(raw.bio[k],100))||!Number.isFinite(raw.pressure)||raw.pressure<0||raw.pressure>100)bad('invalid general manager.');
 return {id:raw.id,name:raw.name,gender:raw.gender,age:raw.age,hiredYear:raw.hiredYear,bio:{college:raw.bio.college,hometown:raw.bio.hometown,previous:raw.bio.previous,style:raw.bio.style},pressure:raw.pressure,seasons:readGMSeasons(raw.seasons,bad)};
}
function readFormerGMs(raw,bad){
 if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>2000)bad('invalid former general managers.');
 return raw.map(g=>{const out=readGM(g,bad);if(!Number.isInteger(g.leftYear)||g.leftYear<1900||g.leftYear>10001||typeof g.lastTeam!=='string'||!g.lastTeam||g.lastTeam.length>100||!GM_EXIT_REASONS.includes(g.reason))bad('invalid former general manager.');return {...out,leftYear:g.leftYear,lastTeam:g.lastTeam,reason:g.reason}});
}
// Every generated GM name stays reserved, so players and later GMs never reuse it.
const namePeopleBeforeGM=namePeople;namePeople=function(s){return [...namePeopleBeforeGM(s),...gmAllRecords(s)]};
function gmAssignMissing(s){for(const club of s.teams)if(!club.gm&&!gmUserTeam(club,s))club.gm=generateGM(club,s)}
const freshBeforeGM=fresh;fresh=function(...args){const s=freshBeforeGM(...args);gmAssignMissing(s);return s};
const validateBeforeGM=validateCareerData;validateCareerData=function(raw){
 const data=validateBeforeGM(raw),bad=m=>{throw Error('Invalid save: '+m)};data.formerGMs=readFormerGMs(raw.formerGMs,bad);
 const ids=gmAllRecords(data).map(g=>g.id),names=gmAllRecords(data).map(g=>nameKey(g.name));if(new Set(ids).size!==ids.length)bad('duplicate general manager.');
 for(const g of data.formerGMs)reservePlayerName(g.name,data);
 // Older saves: teams without a named GM get one now (the user's own team keeps state.gmName).
 gmAssignMissing(data);if(new Set(names).size!==names.length)bad('duplicate general manager name.');return data;
};
function gmCurrentSeason(club){const games=state.history.filter(g=>g.stage!=='Regular season'&&(g.a===club.id||g.b===club.id)),award=(state.regularAwards||[]).find(r=>r.year===state.year)?.executive;
 return {year:state.year,team:club.abbr,key:club.key,name:club.city+' '+club.name,w:club.w,l:club.l,playoffs:games.length>0,title:state.champion===club.id,award:!!award&&award.id===club.id&&award.name===gmFor(club).name}}
function gmCareerTotals(g,current=null){const rows=[...g.seasons.filter(r=>r.year!==current?.year),...(current?[current]:[])];return {rows:rows.sort((a,b)=>a.year-b.year),w:rows.reduce((n,r)=>n+r.w,0),l:rows.reduce((n,r)=>n+r.l,0),playoffs:rows.filter(r=>r.playoffs).length,titles:rows.filter(r=>r.title).length,awards:rows.filter(r=>r.award).length,teams:[...new Set(rows.map(r=>r.name))]}}
// Hot seat: results against the executive-award expectation, recent pressure and owner patience (owners.js).
function gmReview(club,g,row){
 const owner=ownerFor(club),games=row.w+row.l,rate=games?row.w/games:.5,expected=(state.executiveSeason?.year===state.year?state.executiveSeason.teams.find(t=>t.key===club.key)?.expectedRate:null)??.5;
 // Owner patience collapses quickly in owners.js, so it nudges pressure; sustained misses decide.
 const miss=(expected-rate)*100,floor=Math.max(0,.4-rate)*80,ownerHeat=(100-owner.patience)*.1+(owner.fired?5:0),pressure=Math.max(0,Math.min(100,g.pressure*.6+miss+floor-(row.playoffs?10:0)-(row.title?60:0)+ownerHeat));
 const tenure=state.year-g.hiredYear+1,threshold=38;
 return {pressure:Math.round(pressure*10)/10,fire:tenure>=2&&!row.title&&pressure>=threshold,expected,rate,threshold};
}
function gmRetire(club,reason,year=state.year){const g=club.gm;if(!g)return null;(state.formerGMs??=[]).push({...g,leftYear:year,lastTeam:club.city+' '+club.name,reason});if(state.formerGMs.length>2000)state.formerGMs=state.formerGMs.slice(-2000);delete club.gm;return g}
function archiveGMSeasons(){
 for(const club of state.teams){if(expansionPendingSeason(club)||gmUserTeam(club))continue;const g=gmFor(club);if(g.seasons.some(r=>r.year===state.year))continue;
  const row=gmCurrentSeason(club);g.seasons.push(row);const review=gmReview(club,g,row);g.pressure=review.pressure;g.age=Math.min(100,g.age+1);
  if(!review.fire)continue;const old=gmRetire(club,'Fired'),next=club.gm=generateGM(club,state,{hiredYear:state.year+1}),n=state.year-old.hiredYear+1;
  say(club.city+' fires GM '+old.name+' after a '+row.w+'–'+row.l+' season ('+n+' '+(n===1?'season':'seasons')+' in charge); '+next.name+' named general manager.');
 }
}
const archiveCoachBeforeGM=archiveCoachRecords;archiveCoachRecords=function(){archiveCoachBeforeGM();archiveGMSeasons()};
// A user hired into a CPU front office replaces that franchise's GM.
const gmAcceptBeforeGM=gmAccept;gmAccept=async function(id){const result=await gmAcceptBeforeGM(id);const club=state.teams[controlledTeamId()];if(result!==false&&club?.gm&&gmEnsure().status==='employed'){gmRetire(club,'Replaced');await save()}return result};
const franchiseSeasonBeforeGM=currentFranchiseSeason;currentFranchiseSeason=function(t){return {...franchiseSeasonBeforeGM(t),gm:gmDisplayName(t)}};
function gmLookup(id){for(const club of state.teams)if(club.gm?.id===id)return {g:club.gm,club,current:true};const g=(state.formerGMs||[]).findLast(g=>g.id===id);return g?{g,club:null,current:false}:null}
function gmByName(name){const all=[...state.teams.map(t=>t.gm).filter(Boolean),...(state.formerGMs||[])];return all.find(g=>g.name===name)||null}
function gmProfileLink(g,label=g.name){return '<a href="#gm-'+g.id+'" onclick="openGMProfile('+g.id+');return false">'+escapeHTML(label)+'</a>'}
function openGMProfile(id){
 const found=gmLookup(id);if(!found)return;const {g,club}=found,current=club?gmCurrentSeason(club):null,totals=gmCareerTotals(g,current&&!g.seasons.some(r=>r.year===state.year)?current:null);
 const pct=(w,l)=>w+l?(w/(w+l)).toFixed(3).replace(/^0/,''):'—',status=club?'General manager · '+club.city+' '+club.name+' · Hired '+g.hiredYear:'Former general manager · '+g.reason+' by '+g.lastTeam+' ('+g.leftYear+')';
 const facts=[['Age',g.age],['College',g.bio.college],['Hometown',g.bio.hometown],['Previous role',g.bio.previous],['Approach',g.bio.style],['Hot seat',club?Math.round(g.pressure)+'/100':'—']];
 const summary=[['Seasons',totals.rows.length],['Record',totals.w+'–'+totals.l],['W/L%',pct(totals.w,totals.l)],['Playoffs',totals.playoffs],['Titles',totals.titles],['Executive of the Year',totals.awards]];
 const body=totals.rows.map(r=>'<tr><th scope="row">'+seasonLabel(r.year)+(r.year===state.year&&club?' <small>Current</small>':'')+'</th><td title="'+escapeHTML(r.name)+'">'+escapeHTML(r.team)+'</td><td>'+r.w+'</td><td>'+r.l+'</td><td>'+pct(r.w,r.l)+'</td><td>'+(r.playoffs?'Yes':r.year===state.year&&state.champion===null?'—':'No')+'</td><td>'+(r.title?'Champion':'—')+'</td><td>'+(r.award?'Executive of the Year':'—')+'</td></tr>').join('');
 titleModal('General manager profile','<div class="coach-profile-head">'+(club?teamLogo(club):'')+'<div><h2>'+escapeHTML(g.name)+'</h2><p>'+escapeHTML(status)+'</p></div></div>'+playerCard('Background','<dl class="pp-facts pp-biography">'+facts.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+escapeHTML(String(value))+'</dd></div>').join('')+'</dl><p>'+escapeHTML(g.bio.previous+' before taking charge of a front office; known for a '+g.bio.style.toLowerCase()+' approach.')+'</p>')
  +playerCard('Career summary','<dl class="pp-ledger">'+summary.map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')+'</dl><p>Teams: '+escapeHTML(totals.teams.join(', ')||'—')+'</p>')
  +playerCard('Executive record','<div class="bref-table scroll" role="region" aria-label="Season-by-season executive record" tabindex="0"><table><thead><tr>'+['Season','Tm','W','L','W/L%','Playoffs','Title','Award'].map(v=>'<th scope="col">'+v+'</th>').join('')+'</tr></thead><tbody>'+(body||'<tr><td colspan="8">No completed seasons yet.</td></tr>')+'</tbody></table></div><p class="muted">Seasons are tracked from the first season this league recorded the GM. The current season updates live. Hot seat combines results against preseason expectations with owner patience; CPU GMs can be fired at season end.</p>'));
 const d=document.getElementById('profile');if(d)d.className='player-dialog coach-dialog';
}
function gmRosterCard(club){
 if(gmUserTeam(club))return '<section class="panel coach-roster gm-roster"><div class="panelhead"><div><span class="eyebrow">GENERAL MANAGER</span><h2>'+escapeHTML(state.gmName||'General Manager')+'</h2></div><span>Your front office</span></div></section>';
 const g=gmFor(club);return '<section class="panel coach-roster gm-roster"><div class="panelhead"><div><span class="eyebrow">GENERAL MANAGER</span><h2>'+escapeHTML(g.name)+'</h2></div><button onclick="openGMProfile('+g.id+')">GM profile →</button></div><div class="coach-summary"><span>'+escapeHTML(g.bio.style)+'</span><span>Hired '+g.hiredYear+'</span><span>Hot seat '+Math.round(g.pressure)+'/100</span></div></section>';
}
const rosterBeforeGM=roster;roster=function(free=false){const body=rosterBeforeGM(free);if(free)return body;return gmRosterCard(state.teams.find(t=>t.id===rosterTeamId)||team())+body};
