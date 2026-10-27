/* Executive voting is diagnostic award logic, never a simulation modifier. */
AWARD_RACES.push(['executive','Executive of the Year']);
LEAGUE_HONORS.push(['executive','Executive of the Year']);
function executiveBaseline(data){
 const average=data.teams.reduce((s,t)=>s+t.roster.reduce((n,p)=>n+p.ovr,0)/Math.max(1,t.roster.length),0)/data.teams.length;
 return {year:data.year,teams:data.teams.map(t=>{
  const prior=(data.franchiseArchive||[]).find(r=>r.key===t.key&&r.year===data.year-1)||(data.finances?.[t.id]?.ledger||[]).find(r=>r.year===data.year-1);
  const rating=t.roster.reduce((s,p)=>s+p.ovr,0)/Math.max(1,t.roster.length),star=[...t.roster].sort((a,b)=>b.ovr-a.ovr||a.id-b.id)[0];
  return {key:t.key,expectedRate:prior&&prior.w+prior.l>0?prior.w/(prior.w+prior.l):Math.max(.15,Math.min(.85,.5+(rating-average)*.025)),source:prior?'Previous season':data.day===0?'Preseason roster projection':'Roster projection at tracking start',openingPayroll:t.roster.reduce((s,p)=>s+p.salary,0)+(data.finances?.[t.id]?.dead||[]).filter(d=>d.through>=data.year).reduce((s,d)=>s+(d.salary||0),0),starId:star?.id??null,injuryGames:0,startDay:data.day};
 })};
}
function executiveState(){if(state.executiveSeason?.year!==state.year)state.executiveSeason=executiveBaseline(state);return state.executiveSeason}
const freshBeforeExecutive=fresh;fresh=function(...args){const data=freshBeforeExecutive(...args);data.executiveSeason=executiveBaseline(data);return data};
const validateBeforeExecutive=validateCareerData;validateCareerData=function(raw){const data=validateBeforeExecutive(raw),e=raw.executiveSeason;if(e===undefined){data.executiveSeason=executiveBaseline(data);return data}
 if(!e||e.year!==data.year||!Array.isArray(e.teams)||e.teams.length>data.teams.length||new Set(e.teams.map(t=>t.key)).size!==e.teams.length)throw Error('Invalid save: executive season');
 for(const t of e.teams)if(!data.teams.some(c=>c.key===t.key)||!Number.isFinite(t.expectedRate)||t.expectedRate<0||t.expectedRate>1||!['Previous season','Preseason roster projection','Roster projection at tracking start'].includes(t.source)||!Number.isFinite(t.openingPayroll)||t.openingPayroll<0||!Number.isInteger(t.injuryGames)||t.injuryGames<0||t.injuryGames>366||!Number.isInteger(t.startDay)||t.startDay<0||t.startDay>366||t.starId!==null&&(!Number.isInteger(t.starId)||t.starId<0))throw Error('Invalid save: executive baseline');
 data.executiveSeason=copy(e);return data;
};
const playBeforeExecutive=play;play=function(a,b,stage='Regular season'){
 const e=executiveState(),injured=stage==='Regular season'?[a,b].map(id=>{const t=state.teams[id],base=e.teams.find(x=>x.key===t.key),p=t.roster.find(p=>p.id===base?.starId);return p&&injuryDays(p)>0?base:null}).filter(Boolean):[];
 const result=playBeforeExecutive(a,b,stage);for(const base of injured)base.injuryGames++;return result;
};
function executiveCandidates(rows=awardRaceRows()){
 const e=executiveState(),roy=awardCandidates('roy',rows)[0],field=new Set(playoffField().map(t=>t.id)),round=n=>Math.round(n*100)/100;
 return state.teams.filter(t=>!expansionPendingSeason(t)&&t.w+t.l>0).map(t=>{
  const base=e.teams.find(x=>x.key===t.key),gp=t.w+t.l,pay=ownerPayroll(t),f=financeFor(t),tax=f.season.settled?f.season.tax:financeTax(pay,f),expected=(base?.expectedRate??.5)*gp,improvement=t.w-expected;
  const injuryBonus=base?.injuryGames>=40&&t.w>=50?5:0;
  const draftBonus=roy&&(state.draftHistory||[]).some(h=>h.year===state.year-1&&h.picks.some(p=>p.id===roy.id&&p.team===t.id))?5:0;
  const savings=base?base.openingPayroll-pay:0,cleanBonus=base?.startDay===0&&savings>=20&&field.has(t.id)?5:0;
  const market=t.marketSize==='Small'?1.1:1,raw=t.w+improvement*1.5-tax*.2+injuryBonus+draftBonus+cleanBonus;
  return {id:t.id,club:t.id,name:gmDisplayName(t),gmId:gmUserTeam(t)?null:gmFor(t).id,team:t.city+' '+t.name,record:{w:t.w,l:t.l},score:round(raw>=0?raw*market:raw/market),expected:round(expected),improvement:round(improvement),tax:round(tax),roi:pay>0?round(t.w/pay):null,injuryBonus,draftBonus,cleanBonus,market,source:base?.source||'Neutral baseline'};
 }).sort((a,b)=>b.score-a.score||b.improvement-a.improvement||(b.roi??0)-(a.roi??0)||b.record.w-a.record.w||a.id-b.id).slice(0,5);
}
const candidatesBeforeExecutive=awardCandidates;awardCandidates=function(type,rows=awardRaceRows()){return type==='executive'?executiveCandidates(rows):candidatesBeforeExecutive(type,rows)};
const viewBeforeExecutive=awardRacesView;awardRacesView=function(){if(awardRaceTab!=='executive')return viewBeforeExecutive();const rows=executiveCandidates(),winner=state.regularAwards?.find(r=>r.year===state.year)?.executive;
 return `<section class="panel"><div class="panelhead"><h2>Executive of the Year</h2><span>${winner?'Award announced':'Live projections'}</span></div><nav class="po-tabs" aria-label="Award races">${AWARD_RACES.map(([k,n])=>`<button onclick="switchAwardRace('${k}')" class="${k==='executive'?'selected':''}">${n}</button>`).join('')}</nav>${winner?`<p class="note">Winner: <strong>${escapeHTML(winner.name)}</strong> · ${escapeHTML(winner.team)}</p>`:''}<div class="scroll"><table><thead><tr><th>Rank</th><th>Executive / Team</th><th>Record</th><th>Expected wins</th><th>Improvement</th><th>Tax ($M)</th><th>Wins / $M</th><th>Bonuses</th><th>Market</th><th>Score</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><th>${r.gmId===null?escapeHTML(r.name):gmProfileLink(gmFor(state.teams[r.club]),r.name)}<br><small>${escapeHTML(r.team)}</small></th><td>${r.record.w}–${r.record.l}</td><td title="${escapeHTML(r.source)}">${r.expected.toFixed(1)}</td><td>${r.improvement.toFixed(1)}</td><td>${r.tax.toFixed(1)}</td><td>${r.roi===null?'—':r.roi.toFixed(2)}</td><td title="Injury adversity / drafted ROY / payroll savings">${r.injuryBonus} / ${r.draftBonus} / ${r.cleanBonus}</td><td>${r.market.toFixed(1)}×</td><td>${r.score.toFixed(2)}</td></tr>`).join('')||'<tr><td colspan="10">Play regular-season games to begin the race.</td></tr>'}</tbody></table></div><p class="note">Score = wins + 1.5 × improvement − 0.2 × luxury tax ($M), plus bonuses. Expected wins scale the previous season’s win rate to games played; without history, a fixed roster-strength projection is used. Tax is projected until settled. ROI is a tiebreaker, followed by wins and team ID (improvement breaks ties first).</p><p class="note">+5 each: 50 wins with the opening star missing 40 recorded games through injury; last draft’s pick winning ROY; $20M payroll reduction while in the playoff field. Small markets receive a 10% boost (negative scores divide by 1.1). Existing careers begin injury/payroll tracking when loaded; unrecorded injuries are never guessed. AI candidates are each franchise’s named general manager.</p></section>`;
};
