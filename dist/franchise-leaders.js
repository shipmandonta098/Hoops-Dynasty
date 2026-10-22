const FRANCHISE_LEADER_STATS=[['pts','Points'],['reb','Rebounds'],['ast','Assists'],['stl','Steals'],['blk','Blocks'],['gp','Games played'],['mp','Minutes'],['orb','Offensive rebounds'],['drb','Defensive rebounds'],['fgm','Field goals made'],['tpm','Three-pointers made'],['ftm','Free throws made'],['tov','Turnovers'],['pf','Personal fouls']];
let franchiseLeaderStat='pts';
function setFranchiseLeaderStat(key){if(!FRANCHISE_LEADER_STATS.some(([k])=>k===key))return;franchiseLeaderStat=key;render()}
function currentFranchiseLeaders(){
 const map=new Map();
 for(const p of statsEntries('all','all','regular')){
  const club=state.teams[p.teamId],id=p.playerId??null,key=JSON.stringify([club.key,id??p.name]);
  if(!map.has(key))map.set(key,{teamKey:club.key,id,name:p.name,...Object.fromEntries(FRANCHISE_LEADER_STATS.map(([k])=>[k,0]))});
  const row=map.get(key);row.name=p.name;row.gp++;
  for(const [k] of FRANCHISE_LEADER_STATS)if(k!=='gp')row[k]=row[k]!==null&&Number.isFinite(p[k])?row[k]+p[k]:null;
 }
 return {year:state.year,players:[...map.values()]};
}
function archiveFranchiseLeaders(){state.franchiseLeadersArchive=[...(state.franchiseLeadersArchive||[]).filter(r=>r.year!==state.year),currentFranchiseLeaders()]}
const leadersArchiveBefore=archiveFranchiseSeason;archiveFranchiseSeason=function(){archiveFranchiseLeaders();return leadersArchiveBefore()};
function franchiseLeaderRows(t){
 const map=new Map();for(const season of [...(state.franchiseLeadersArchive||[]).filter(r=>r.year!==state.year),currentFranchiseLeaders()])for(const p of season.players){
  if(p.teamKey!==t.key)continue;const key=p.id??p.name;
  if(!map.has(key))map.set(key,{id:p.id,name:p.name,years:new Set(),...Object.fromEntries(FRANCHISE_LEADER_STATS.map(([k])=>[k,0]))});
  const row=map.get(key);row.name=p.name;row.years.add(season.year);
  for(const [k] of FRANCHISE_LEADER_STATS)row[k]=row[k]!==null&&p[k]!==null?row[k]+p[k]:null;
 }
 return [...map.values()].sort((a,b)=>a[franchiseLeaderStat]===null?(b[franchiseLeaderStat]===null?0:1):b[franchiseLeaderStat]===null?-1:b[franchiseLeaderStat]-a[franchiseLeaderStat]||a.name.localeCompare(b.name));
}
function franchiseLeadersPanel(t){
 const rows=franchiseLeaderRows(t),label=FRANCHISE_LEADER_STATS.find(([k])=>k===franchiseLeaderStat)[1],active=new Set([...state.teams.flatMap(t=>t.roster),...state.free].map(p=>p.id));let last=null,rank=0;
 return gmPanel('FRANCHISE LEADERS',`<label class="franchise-leader-filter">Rank by <select onchange="setFranchiseLeaderStat(this.value)">${FRANCHISE_LEADER_STATS.map(([k,v])=>`<option value="${k}" ${k===franchiseLeaderStat?'selected':''}>${v}</option>`).join('')}</select></label><p class="muted">Career regular-season totals earned with this franchise only. Current-season games update live. Earlier seasons without team-specific player archives are unavailable; — means incomplete stat tracking.</p><div class="scroll" tabindex="0" role="region" aria-label="Franchise player leaders"><table><thead><tr><th>#</th><th>Player</th><th>Seasons</th><th>GP</th><th>${label}</th></tr></thead><tbody>${rows.map((r,i)=>{const value=r[franchiseLeaderStat];if(value!==last||i===0)rank=i+1;last=value;return `<tr><td>${value===null?'—':rank}</td><th scope="row">${r.id!==null&&active.has(r.id)?`<button class="namebutton" onclick="profile(${r.id})">${escapeHTML(r.name)}</button>`:escapeHTML(r.name)}</th><td>${r.years.size}</td><td>${r.gp}</td><td><strong>${value===null?'—':value.toLocaleString('en-US',{maximumFractionDigits:franchiseLeaderStat==='mp'?1:0})}</strong></td></tr>`}).join('')||'<tr><td colspan="5">No recorded player statistics for this franchise yet.</td></tr>'}</tbody></table></div>`);
}
function readFranchiseLeadersArchive(raw,bad){
 if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>8101)bad('invalid franchise leaders archive');
 const years=new Set();return raw.map(s=>{if(!s||!Number.isInteger(s.year)||s.year<1900||s.year>10000||years.has(s.year)||!Array.isArray(s.players)||s.players.length>3000)bad('invalid franchise leaders season');years.add(s.year);const seen=new Set();return {year:s.year,players:s.players.map(p=>{
  if(!p||typeof p.teamKey!=='string'||!p.teamKey||p.teamKey.length>80||typeof p.name!=='string'||!p.name||p.name.length>80||p.id!==null&&(!Number.isInteger(p.id)||p.id<0||p.id>10000000))bad('invalid franchise leader');
  const key=JSON.stringify([p.teamKey,p.id??p.name]);if(seen.has(key))bad('duplicate franchise leader');seen.add(key);
  const out={teamKey:p.teamKey,id:p.id,name:p.name};for(const [k] of FRANCHISE_LEADER_STATS){if(!(p[k]===null&&k!=='gp')&&(!Number.isFinite(p[k])||p[k]<0||p[k]>1000000))bad('invalid franchise leader statistic');out[k]=p[k]}return out;
 })}});
}
