// Store one compact row per season/opponent pair before game history is reset.
function currentHeadToHead(){
 const pairs=new Map();
 for(const g of state.history){
  if(!state.teams[g.a]||!state.teams[g.b]||![g.a,g.b].includes(g.winner))continue;
  const keys=[state.teams[g.a].key,state.teams[g.b].key].sort(),key=JSON.stringify(keys);
  if(!pairs.has(key))pairs.set(key,{a:keys[0],b:keys[1],w:0,l:0,hw:0,hl:0,rw:0,rl:0,pf:0,pa:0,pw:0,pl:0});
  const r=pairs.get(key),win=state.teams[g.winner].key===r.a,home=state.teams[g.a].key===r.a;
  if(g.stage!=='Regular season'){if(['First round','Conference semifinal','Conference final','Semifinal','Championship'].includes(g.stage))r[win?'pw':'pl']++;continue}
  r[win?'w':'l']++;r[(home?'h':'r')+(win?'w':'l')]++;
  r.pf+=home?g.sa:g.sb;r.pa+=home?g.sb:g.sa;
 }
 return {year:state.year,pairs:[...pairs.values()]};
}
function archiveHeadToHead(){state.headToHeadArchive=[...(state.headToHeadArchive||[]).filter(r=>r.year!==state.year),currentHeadToHead()]}
const h2hArchiveBefore=archiveFranchiseSeason;
archiveFranchiseSeason=function(){archiveHeadToHead();return h2hArchiveBefore()};
function headToHeadRows(t){
 const seasons=[...(state.headToHeadArchive||[]).filter(r=>r.year!==state.year),currentHeadToHead()];
 return state.teams.filter(o=>o.key!==t.key).map(o=>{
  const out={team:o,w:0,l:0,hw:0,hl:0,rw:0,rl:0,pf:0,pa:0,pw:0,pl:0};
  for(const season of seasons)for(const r of season.pairs){
   if(!([r.a,r.b].includes(t.key)&&[r.a,r.b].includes(o.key)))continue;
   const same=r.a===t.key;
   for(const [a,b] of [['w','l'],['hw','rl'],['hl','rw'],['pf','pa'],['pw','pl']]){out[a]+=r[same?a:b];out[b]+=r[same?b:a]}
  }
  return out;
 }).sort((a,b)=>a.team.city.localeCompare(b.team.city)||a.team.name.localeCompare(b.team.name));
}
function headToHeadPanel(t){
 const rows=headToHeadRows(t),record=(w,l)=>w+'–'+l;
 return gmPanel('HEAD-TO-HEAD','<p class="muted">All recorded seasons · Regular-season results, with playoff records shown separately. Older seasons without saved matchup results are unavailable.</p><div class="scroll" tabindex="0" role="region" aria-label="Franchise head-to-head records"><table class="h2h-table"><thead><tr>'+['Opponent','G','W','L','Win%','Home','Road','PPG','OPPG','Playoffs W–L'].map(s=>'<th scope="col">'+s+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>{const gp=r.w+r.l;return '<tr><th scope="row"><button class="namebutton h2h-team" onclick="openTeamHistory('+r.team.id+')">'+secondaryTeamLogo(r.team)+'<span>'+escapeHTML(r.team.city+' '+r.team.name)+'</span></button></th><td>'+gp+'</td><td>'+r.w+'</td><td>'+r.l+'</td><td>'+(gp?(100*r.w/gp).toFixed(1)+'%':'—')+'</td><td>'+record(r.hw,r.hl)+'</td><td>'+record(r.rw,r.rl)+'</td><td>'+(gp?(r.pf/gp).toFixed(1):'—')+'</td><td>'+(gp?(r.pa/gp).toFixed(1):'—')+'</td><td>'+record(r.pw,r.pl)+'</td></tr>'}).join('')+'</tbody></table></div>');
}
function readHeadToHeadArchive(raw,bad){
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>8101)bad('invalid head-to-head archive');
 const years=new Set();return raw.map(s=>{
  if(!s||!Number.isInteger(s.year)||s.year<1900||s.year>10000||years.has(s.year)||!Array.isArray(s.pairs)||s.pairs.length>630)bad('invalid head-to-head season');years.add(s.year);
  const pairs=new Set();return {year:s.year,pairs:s.pairs.map(r=>{
   if(!r||[r.a,r.b].some(k=>typeof k!=='string'||!k||k.length>80)||r.a>=r.b||pairs.has(JSON.stringify([r.a,r.b])))bad('invalid head-to-head pairing');pairs.add(JSON.stringify([r.a,r.b]));
   const out={a:r.a,b:r.b};for(const k of ['w','l','hw','hl','rw','rl','pf','pa','pw','pl']){if(!Number.isInteger(r[k])||r[k]<0||r[k]>(['pf','pa'].includes(k)?120000:240))bad('invalid head-to-head record');out[k]=r[k]}
   if(out.w!==out.hw+out.rw||out.l!==out.hl+out.rl)bad('inconsistent head-to-head record');return out;
  })};
 });
}
let franchiseHistoryPage='seasons';
function setFranchiseHistoryPage(page){if(!['seasons','headToHead','leaders','rivalries'].includes(page))return;franchiseHistoryPage=page;render()}
function franchiseHistoryNavigation(){return `<nav class="franchise-history-navigation" aria-label="Franchise history pages"><button class="${franchiseHistoryPage==='seasons'?'primary':''}" aria-current="${franchiseHistoryPage==='seasons'?'page':'false'}" onclick="setFranchiseHistoryPage('seasons')">Season history</button><button class="${franchiseHistoryPage==='headToHead'?'primary':''}" aria-current="${franchiseHistoryPage==='headToHead'?'page':'false'}" onclick="setFranchiseHistoryPage('headToHead')">Head-to-Head</button><button class="${franchiseHistoryPage==='leaders'?'primary':''}" aria-current="${franchiseHistoryPage==='leaders'?'page':'false'}" onclick="setFranchiseHistoryPage('leaders')">Franchise Leaders</button><button class="${franchiseHistoryPage==='rivalries'?'primary':''}" aria-current="${franchiseHistoryPage==='rivalries'?'page':'false'}" onclick="setFranchiseHistoryPage('rivalries')">Rivalries</button></nav>`}
