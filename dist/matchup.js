const MATCHUP_METRICS=[
 ['ortg','Offensive rating','rate',1],['drtg','Defensive rating','rate',-1],['pace','Pace','rate',1],
 ['ts','True shooting %','percent',1],['efg','Effective FG%','percent',1],['pts','PPG','game',1],['opp','Opponent PPG','game',-1],
 ['ast','Assists','game',1],['orb','Offensive rebounds','game',1],['drb','Defensive rebounds','game',1],
 ['blk','Blocks','game',1],['stl','Steals','game',1],['tov','Turnovers','game',-1],
 ['fgp','Field goal %','percent',1],['tpp','Three-point %','percent',1],['ftp','Free throw %','percent',1],['pf','Personal fouls','game',-1]
];
function matchupValue(row,metric){return row?.gp>0&&Number.isFinite(row[metric[0]])?row[metric[0]]/(metric[2]==='game'?row.gp:1):null}
function matchupRank(rows,row,metric){
 const value=matchupValue(row,metric);if(value===null)return null;
 const values=rows.map(r=>matchupValue(r,metric)).filter(v=>v!==null);
 const better=values.filter(v=>(v-value)*metric[3]>1e-9).length;
 return {rank:better+1,tied:values.filter(v=>Math.abs(v-value)<1e-9).length>1};
}
function matchupSeries(a,b){
 const matches=g=>(g.a===a&&g.b===b)||(g.a===b&&g.b===a);
 const games=state.history.filter(g=>g.stage==='Regular season'&&matches(g));
 const total=state.schedule.flat().filter(p=>p.includes(a)&&p.includes(b)).length;
 const aw=games.filter(g=>g.winner===a).length,bw=games.filter(g=>g.winner===b).length;
 const complete=total>0&&games.length>=total;
 const leader=aw>bw?a:b;
 return {total,played:games.length,complete,text:aw===bw?'Season series tied '+aw+'–'+bw:state.teams[leader].city+(complete?' wins ':' leads ')+Math.max(aw,bw)+'–'+Math.min(aw,bw)};
}
function matchupComparison(a,b){
 const rows=teamStatRows('all','regular','current'),left=rows.find(r=>r.teamId===a),right=rows.find(r=>r.teamId===b);
 const cell=(row,metric)=>{const value=matchupValue(row,metric),rank=matchupRank(rows,row,metric);return `<td><strong>${value===null?'—':(value*(metric[2]==='percent'?100:1)).toFixed(1)+(metric[2]==='percent'?'%':'')}</strong><small>${rank?(rank.tied?'T-':'#')+rank.rank:'Unranked'}</small></td>`};
 return `<table class="matchup-comparison"><thead><tr><th scope="col">${escapeHTML(state.teams[a].abbr)}</th><th scope="col">Season comparison</th><th scope="col">${escapeHTML(state.teams[b].abbr)}</th></tr></thead><tbody>${MATCHUP_METRICS.map(m=>`<tr>${cell(left,m)}<th scope="row">${m[1]}</th>${cell(right,m)}</tr>`).join('')}</tbody></table>`;
}
function viewGMMatchup(){
 const pair=next();if(!pair)return;
 renderMatchup(controlledTeamId(),pair.find(id=>id!==controlledTeamId()),pair,state.day+1,true);
}
function scheduleMatchupButton(day,pair){return `<button onclick="viewScheduleMatchup(${day},${pair[0]},${pair[1]})">View matchup</button>`}
function viewScheduleMatchup(day,a,b){
 if(!state.schedule[day-1]?.some(p=>p[0]===a&&p[1]===b))return;
 renderMatchup(a,b,[a,b],day,false);
}
function renderMatchup(a,b,pair,day,dashboard=false){
 const series=matchupSeries(a,b),result=state.history.find(g=>g.stage==='Regular season'&&g.day===day&&g.a===pair[0]&&g.b===pair[1]);
 const actions=dashboard?`<button onclick="closeTitleModal();go('Roster')">Set lineup</button><button class="primary" onclick="closeTitleModal();sim(1)">Simulate game →</button>`:result?`<button onclick="closeTitleModal();viewScheduledResults(${day},${pair[0]},${pair[1]})">View results</button>`:day>state.day?`<button class="primary" onclick="closeTitleModal();openWatchGame(${day},${pair[0]},${pair[1]})">Watch live</button>`:'';
 const identity=id=>{const t=state.teams[id];return `<div>${teamLogo(t)}<h3>${escapeHTML(t.city+' '+t.name)}</h3><small>${t.w}–${t.l} · ${pair[0]===id?'Home':'Away'}</small></div>`};
 titleModal(dashboard?'Next matchup':'View matchup',`<p class="matchup-helper">${scheduleDateLabel(day,true)} · ${escapeHTML(teamArena(state.teams[pair[0]]))}${result?' · Final':''}</p><div class="matchup-identities">${identity(a)}<span>VS</span>${identity(b)}</div><section class="matchup-series"><small>${seasonLabel(state.year)} · REGULAR SEASON SERIES</small><h3>${escapeHTML(series.text)}</h3><small>${series.played} of ${series.total} games played${series.complete?' · Complete':''}</small></section>${altitudePanel(result?.altitude||altitudeEnvironment(pair[0],pair[1],'Regular season',day-1))}${matchupComparison(a,b)}<p class="matchup-helper">Current season to date · Counting stats are per game. Ranks are league-wide; ties share a rank. Lower is better for defensive rating, opponent PPG, turnovers and fouls. Pace ranks fastest first. — means no recorded data.</p><div class="actions">${actions}</div>`);
 document.getElementById('profile').classList.add('matchup-dialog');
}
