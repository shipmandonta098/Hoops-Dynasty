/* Basketball-Reference-style award codes on player season tables. At the end of each regular season the top five
   finishers for MVP, DPOY, ROY, 6MOY, MIP and CPOY, plus tiered All-League, All-Defensive and All-Rookie teams, are
   saved in state.awardResults; All-Star, All-Star MVP and Finals MVP are added from the season's own records. Each
   archived player season carries its codes as awards:[{code,rank}]. Older seasons show only what was stored. */
const AWARD_FINISHES=[['mvp','MVP','MVP'],['dpoy','DPOY','Defensive Player of the Year'],['roy','ROY','Rookie of the Year'],['sixth','6MOY','Sixth Player of the Year'],['mip','MIP','Most Improved Player'],['clutch','CPOY','Clutch Player of the Year']];
const AWARD_CODE_ORDER=['MVP','DPOY','ROY','6MOY','MIP','CPOY','FMVP','AS','ASMVP','NBA1','NBA2','NBA3','WNBA1','WNBA2','ALL1','ALL2','ALL3','ALL','DEF1','DEF2','DEF','ROOK1','ROOK2'];
const AWARD_TEAM_NAMES={NBA:'All-NBA',WNBA:'All-WNBA',ALL:'All-League'};
AWARD_RACES.push(['clutch','Clutch Player']);LEAGUE_HONORS.push(['clutch','Clutch Player of the Year']);
function awardOrdinal(n){return n+(['th','st','nd','rd'][n%100>10&&n%100<14?0:n%10]||'th')}
function awardSeasonLabel(year){return typeof seasonLabel==='function'?seasonLabel(year):year+'–'+String(year+1).slice(-2)}
function awardLeaguePrefix(){return leagueRules().historicalSource==='nba'?'NBA':wnbaEnabled()?'WNBA':'ALL'}
function awardCodeTitle(a){
 const finish=AWARD_FINISHES.find(f=>f[1]===a.code),tier=a.code.match(/^(NBA|WNBA|ALL|DEF|ROOK)(\d)$/);
 if(finish)return a.rank===1?(a.code==='MVP'?'Most Valuable Player':finish[2]):awardOrdinal(a.rank)+' in '+(a.code==='MVP'?'MVP':finish[2])+' voting';
 if(tier)return (tier[1]==='DEF'?'All-Defensive':tier[1]==='ROOK'?'All-Rookie':AWARD_TEAM_NAMES[tier[1]])+' '+awardOrdinal(Number(tier[2]))+' Team';
 return {AS:'All-Star',ASMVP:'All-Star Game MVP',FMVP:'Finals MVP',ALL:'All-League (team tier not recorded)',DEF:'All-Defensive (team tier not recorded)'}[a.code]||a.code;
}
function awardCodeText(a){return a.rank?a.code+'-'+a.rank:a.code}
function awardSort(list){return [...list].sort((a,b)=>AWARD_CODE_ORDER.indexOf(a.code)-AWARD_CODE_ORDER.indexOf(b.code)||(a.rank||0)-(b.rank||0))}
function awardCodesMarkup(list,year){
 if(!list?.length)return '';
 return '<span class="award-codes" style="white-space:normal;display:inline-block;min-width:3.5rem;max-width:9rem;line-height:1.35">'+awardSort(list).map(a=>{const text=awardCodeText(a),title=text+': '+awardCodeTitle(a);return '<a href="#awards-'+year+'" title="'+escapeHTML(title)+'" aria-label="'+escapeHTML(title)+'" onclick="openSeasonAwards('+year+');return false">'+escapeHTML(text)+'</a>'}).join(', ')+'</span>';
}
// Clutch Player of the Year: the existing clutch splits (last five minutes, margin within five) for regular-season qualifiers.
function clutchCandidates(rows=awardRaceRows()){
 const eligible=new Map(rows.map(r=>[r.id,r])),clutch=statsRows(statsEntries('clutch','all','regular')).filter(r=>eligible.has(r.id)&&r.mp>0&&Number.isFinite(r.modelScore)),most=Math.max(0,...clutch.map(r=>r.mp));
 return clutch.filter(r=>r.mp>=Math.max(5,most*.3)).map(r=>({...eligible.get(r.id),clutchMp:r.mp,clutchPts:r.pts,clutchFgm:r.fgm,clutchFga:r.fga,clutchPlusMinus:Number.isFinite(r.onPts)&&Number.isFinite(r.oppPts)?r.onPts-r.oppPts:0,clutchScore:r.modelScore+.3*((r.onPts||0)-(r.oppPts||0))})).sort((a,b)=>b.clutchScore-a.clutchScore||b.clutchMp-a.clutchMp||a.id-b.id).slice(0,5);
}
const candidatesBeforeClutch=awardCandidates;awardCandidates=function(type,rows=awardRaceRows()){return type==='clutch'?clutchCandidates(rows):candidatesBeforeClutch(type,rows)};
const clutchRaceViewBefore=awardRacesView;awardRacesView=function(){
 if(awardRaceTab!=='clutch')return clutchRaceViewBefore();const rows=clutchCandidates(),final=state.regularAwards?.find(r=>r.year===state.year),winner=final?.clutch;
 return `<section class="panel"><div class="panelhead"><h2>Clutch Player of the Year</h2><span>${final?'Final rankings':'Live projections'}</span></div><nav class="po-tabs" aria-label="Award races">${AWARD_RACES.map(([k,n])=>`<button onclick="switchAwardRace('${k}')" class="${k==='clutch'?'selected':''}">${n}</button>`).join('')}</nav>${winner?`<p class="note">Winner: <strong>${escapeHTML(winner.name)}</strong> · ${escapeHTML(winner.team)}</p>`:''}<div class="scroll"><table><thead><tr><th>Rank</th><th>Player</th><th>Team</th><th>Clutch MIN</th><th>Clutch PTS</th><th>Clutch FG</th><th>Clutch +/−</th><th>Score</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><th><button class="namebutton" onclick="profile(${r.id})">${escapeHTML(r.name)}</button></th><td>${escapeHTML(state.teams[r.club]?.abbr||'')}</td><td>${r.clutchMp.toFixed(1)}</td><td>${r.clutchPts}</td><td>${r.clutchFgm}-${r.clutchFga}</td><td>${r.clutchPlusMinus>0?'+':''}${r.clutchPlusMinus}</td><td>${r.clutchScore.toFixed(1)}</td></tr>`).join('')||'<tr><td colspan="8">No qualified clutch performers yet.</td></tr>'}</tbody></table></div><p class="note">Clutch minutes are the last five minutes of the fourth quarter or overtime with the margin within five. Score = clutch game score + 0.3 × clutch plus-minus. Qualifiers meet the regular award games rule and play at least 30% of the clutch-minute leader’s total.</p></section>`;
};
// Tiered teams of five: two guards, two forwards and a center unless the league plays position-less selections.
function awardPositionGroup(pos){return pos==='C'?'C':pos==='SF'||pos==='PF'?'F':'G'}
function awardTeams(ranked,tiers,balanced){
 const used=new Set(),teams=[];
 for(let t=0;t<tiers;t++){const team=[],need={G:2,F:2,C:1};
  for(const r of ranked){if(team.length===5)break;if(used.has(r.id))continue;const g=awardPositionGroup(r.pos);if(balanced&&!need[g])continue;team.push(r);used.add(r.id);if(balanced)need[g]--}
  // A league short at one position fills the remaining places with the best players left.
  for(const r of ranked){if(team.length===5)break;if(!used.has(r.id)){team.push(r);used.add(r.id)}}
  if(team.length)teams.push(team.map(r=>r.id));}
 return teams;
}
function awardPlayerPos(id){return playerContext(id)?.p.pos||(state.statsArchive||[]).findLast(r=>r.id===id)?.pos||'SF'}
function computeAwardResults(){
 const rows=awardRaceRows().map(r=>({...r,pos:awardPlayerPos(r.id)})),prefix=awardLeaguePrefix(),balanced=(leagueRules().awardTeamPositions||'balanced')==='balanced',wnba=prefix==='WNBA';
 const finishes=Object.fromEntries(AWARD_FINISHES.map(([key,code])=>[code,awardCandidates(key,rows).map(r=>r.id)]));
 const byScore=[...rows].filter(r=>Number.isFinite(r.score)).sort((a,b)=>b.score-a.score||a.id-b.id),byDefense=[...rows].filter(r=>Number.isFinite(r.defense)).sort((a,b)=>b.defense-a.defense||a.id-b.id);
 const teams={};awardTeams(byScore,wnba?2:3,balanced).forEach((ids,i)=>teams[prefix+(i+1)]=ids);awardTeams(byDefense,2,balanced).forEach((ids,i)=>teams['DEF'+(i+1)]=ids);awardTeams(byScore.filter(r=>r.rookie),wnba?1:2,false).forEach((ids,i)=>teams['ROOK'+(i+1)]=ids);
 const v=state.allStarVoting?.year===state.year&&state.allStarVoting.phase==='final'?state.allStarVoting:null;
 return {year:state.year,league:prefix,finishes,teams,allStars:v?v.selected.map(r=>r.id):[],asmvp:Number.isInteger(v?.game?.mvp)?v.game.mvp:null,fmvp:null};
}
function awardResultsFor(year){return (state.awardResults||[]).find(r=>r.year===year)||null}
function awardsFromResults(id,res){
 if(!res||!Number.isInteger(id))return [];const out=[];
 for(const [,code] of AWARD_FINISHES){const rank=(res.finishes[code]||[]).indexOf(id);if(rank>=0)out.push({code,rank:rank+1})}
 if(res.fmvp===id)out.push({code:'FMVP'});if(res.allStars.includes(id))out.push({code:'AS'});if(res.asmvp===id)out.push({code:'ASMVP'});
 for(const [code,ids] of Object.entries(res.teams))if(ids.includes(id))out.push({code});
 return awardSort(out);
}
// Current season: only decided honors (saved results, a completed All-Star vote, a Finals MVP once crowned).
function liveSeasonAwards(id){
 const res=awardResultsFor(state.year);if(res)return awardsFromResults(id,res);
 const v=state.allStarVoting?.year===state.year&&state.allStarVoting.phase==='final'?state.allStarVoting:null,out=[];
 if(v?.selected.some(r=>r.id===id))out.push({code:'AS'});if(v?.game?.mvp===id)out.push({code:'ASMVP'});return out;
}
function playerSeasonAwards(id,year){if(year===state.year)return liveSeasonAwards(id);const row=(state.statsArchive||[]).find(r=>r.year===year&&r.id===id);return row?.awards?awardSort(row.awards):awardsFromResults(id,awardResultsFor(year))}
const finalizeBeforeAwardCodes=finalizeRegularAwards;finalizeRegularAwards=function(){
 const before=(state.regularAwards||[]).some(r=>r.year===state.year);finalizeBeforeAwardCodes();
 if(!before&&(state.regularAwards||[]).some(r=>r.year===state.year)&&!awardResultsFor(state.year))(state.awardResults??=[]).push(computeAwardResults());
};
// Season rollover: add Finals MVP and the final All-Star record, then write the codes onto the archived seasons.
const archiveBeforeAwardCodes=archiveStatsSeason;archiveStatsSeason=function(){
 archiveBeforeAwardCodes();let res=awardResultsFor(state.year);
 if(!res&&state.day>=seasonLength()){res=computeAwardResults();(state.awardResults??=[]).push(res)}
 if(res){const v=state.allStarVoting?.year===state.year&&state.allStarVoting.phase==='final'?state.allStarVoting:null;if(v){res.allStars=v.selected.map(r=>r.id);res.asmvp=Number.isInteger(v.game?.mvp)?v.game.mvp:null}
  const honors=typeof seasonHonors==='function'?seasonHonors():null;if(honors?.finalsMvp?.id!==undefined)res.fmvp=honors.finalsMvp.id}
 for(const r of state.statsArchive||[])if(r.year===state.year)r.awards=awardsFromResults(r.id,res);
};
// Old saves: rebuild only what was stored — winners, MVP shares, untiered All-League/All-Defensive, family All-Star records.
function legacySeasonAwards(data){
 const byYear=new Map();for(const r of data.statsArchive||[])if(r.awards===undefined)(byYear.get(r.year)||byYear.set(r.year,[]).get(r.year)).push(r);
 const keys={mvp:'MVP',dpoy:'DPOY',roy:'ROY',sixth:'6MOY',mip:'MIP'},allStar=new Set();
 for(const n of data.family?.people||[])for(const s of n.seasons||[])if(s.allStar&&Number.isInteger(n.playerId))allStar.add(s.year+':'+n.playerId);
 for(const [year,rows] of byYear){
  const regular=(data.regularAwards||[]).find(r=>r.year===year),history=(data.leagueHistory||[]).find(r=>r.year===year),find=w=>w?(Number.isInteger(w.id)?rows.find(r=>r.id===w.id):null)||rows.filter(r=>r.name===w.name).at(0)||null:null;
  for(const r of rows)r.awards=[];
  for(const [key,code] of Object.entries(keys)){const w=find(regular?.[key]||history?.[key]);if(w&&code!=='MVP')w.awards.push({code,rank:1})}
  const winner=find(regular?.mvp||history?.mvp),shares=rows.filter(r=>r.mvpShare>0&&r!==winner).sort((a,b)=>b.mvpShare-a.mvpShare||(a.id??0)-(b.id??0));[...(winner?[winner]:[]),...shares].slice(0,5).forEach((r,i)=>r.awards.push({code:'MVP',rank:i+1}));
  const fmvp=find(history?.finalsMvp);if(fmvp)fmvp.awards.push({code:'FMVP'});
  for(const r of rows){if(r.allLeague===true)r.awards.push({code:'ALL'});if(r.allDefense===true)r.awards.push({code:'DEF'});if(allStar.has(year+':'+r.id))r.awards.push({code:'AS'});r.awards=awardSort(r.awards)}
 }
}
function readAwardResults(raw,bad){
 if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>500)bad('invalid award results.');const id=v=>Number.isInteger(v)&&v>=0&&v<=10000000,ids=(a,max)=>Array.isArray(a)&&a.length<=max&&a.every(id)&&new Set(a).size===a.length,years=new Set();
 return raw.map(r=>{if(!r||!Number.isInteger(r.year)||r.year<1900||r.year>10001||years.has(r.year)||!['NBA','WNBA','ALL'].includes(r.league)||!r.finishes||!r.teams||typeof r.finishes!=='object'||typeof r.teams!=='object'||!ids(r.allStars,64)||r.asmvp!==null&&!id(r.asmvp)||r.fmvp!==null&&!id(r.fmvp))bad('invalid award results season.');years.add(r.year);
  const finishes={},teams={};for(const [code,list] of Object.entries(r.finishes)){if(!AWARD_FINISHES.some(f=>f[1]===code)||!ids(list,5))bad('invalid award finishes.');finishes[code]=[...list]}
  for(const [code,list] of Object.entries(r.teams)){if(!/^(NBA[123]|WNBA[12]|ALL[123]|DEF[12]|ROOK[12])$/.test(code)||!ids(list,5))bad('invalid award team.');teams[code]=[...list]}
  return {year:r.year,league:r.league,finishes,teams,allStars:[...r.allStars],asmvp:r.asmvp,fmvp:r.fmvp}});
}
function readSeasonAwardList(raw,bad){if(raw===undefined)return undefined;if(!Array.isArray(raw)||raw.length>30||raw.some(a=>!a||typeof a.code!=='string'||!AWARD_CODE_ORDER.includes(a.code)||a.rank!==undefined&&(!Number.isInteger(a.rank)||a.rank<1||a.rank>5)))bad('invalid season awards.');return raw.map(a=>({code:a.code,...(a.rank!==undefined?{rank:a.rank}:{})}))}
const validateBeforeAwardCodes=validateCareerData;validateCareerData=function(raw){const data=validateBeforeAwardCodes(raw);legacySeasonAwards(data);return data};
// Season awards page linked from every code.
function openSeasonAwards(year){
 const res=awardResultsFor(year),regular=(state.regularAwards||[]).find(r=>r.year===year),history=(state.leagueHistory||[]).find(r=>r.year===year),archive=(state.statsArchive||[]).filter(r=>r.year===year);
 const name=id=>{const p=playerContext(id)?.p;return p?'<button class="namebutton" onclick="profile('+id+')">'+escapeHTML(p.name)+'</button>':escapeHTML(archive.find(r=>r.id===id)?.name||'Former player')};
 const list=ids=>ids.length?'<ol>'+ids.map(id=>'<li>'+name(id)+'</li>').join('')+'</ol>':'<p class="muted">Not recorded.</p>';
 let body='';
 if(res){body+=AWARD_FINISHES.map(([,code,label])=>playerCard((code==='MVP'?'Most Valuable Player':label)+' voting',list(res.finishes[code]||[]))).join('');
  body+=Object.entries(res.teams).sort((a,b)=>AWARD_CODE_ORDER.indexOf(a[0])-AWARD_CODE_ORDER.indexOf(b[0])).map(([code,ids])=>playerCard(awardCodeTitle({code})+' ('+code+')',list(ids))).join('');
  body+=playerCard('All-Stars (AS)',res.allStars.length?'<p>'+res.allStars.map(name).join(', ')+'</p>':'<p class="muted">Not recorded.</p>')+playerCard('All-Star Game MVP · Finals MVP','<p>ASMVP: '+(res.asmvp!==null?name(res.asmvp):'—')+'</p><p>FMVP: '+(res.fmvp!==null?name(res.fmvp):'—')+'</p>');}
 else{const coded=archive.filter(r=>r.awards?.length);body+=playerCard('Recorded honors','<p class="muted">Full voting and team tiers were not saved for this season. Showing the honors stored with it.</p>'+(coded.length?'<ul>'+coded.map(r=>'<li>'+name(r.id)+' · '+r.awards.map(awardCodeText).join(', ')+'</li>').join('')+'</ul>':'<p class="muted">No player honors stored.</p>'))}
 if(regular||history)body+=playerCard('Award winners','<dl class="pp-ledger">'+LEAGUE_HONORS.filter(([k])=>(regular?.[k]||history?.[k])).map(([k,label])=>'<div><dt>'+label+'</dt><dd>'+escapeHTML((regular?.[k]||history?.[k]).name)+'</dd></div>').join('')+'</dl>');
 titleModal(awardSeasonLabel(year)+' Awards',body||'<p class="muted">No awards recorded for this season.</p>');
}
// League stats: an Awards column for single-season regular-season tables; career totals show nothing.
STATS_TRAD.push(['awards','Awards']);
const selectedStatsBeforeAwards=selectedPlayerStats;selectedPlayerStats=function(){const rows=selectedStatsBeforeAwards();if(statsUI.competition!=='regular'||statsUI.season==='career')return rows.map(r=>({...r,awards:[]}));const year=statsUI.season==='current'?state.year:Number(statsUI.season);return rows.map(r=>({...r,awardYear:year,awards:playerSeasonAwards(r.id,year)}))};
