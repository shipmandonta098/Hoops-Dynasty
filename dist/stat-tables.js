function profileCompetitionMatches(stage){return profileStatsStage==='all'||(profileStatsStage==='regular'?stage==='Regular season':['First round','Conference semifinal','Conference final','Semifinal','Championship'].includes(stage))}
let profileStatsMode='pergame',profileStatsStage='regular',profileStatsView='traditional';
const PROFILE_STAT_COLUMNS=[['season','Season'],['age','Age'],['team','Team'],['pos','Pos'],['gp','G'],['fgm','FG'],['fga','FGA'],['fgpct','FG%'],['tpm','3P'],['tpa','3PA'],['tppct','3P%'],['twom','2P'],['twoa','2PA'],['twopct','2P%'],['efg','eFG%'],['ftm','FT'],['fta','FTA'],['ftpct','FT%'],['reb','TRB'],['ast','AST'],['stl','STL'],['blk','BLK'],['tov','TOV'],['pts','PTS']];
function selectProfileStats(key,value){
 if(key==='view'&&['traditional','advanced','per36','highs','misc'].includes(value))profileStatsView=value;
 if(key==='mode'&&['pergame','totals'].includes(value))profileStatsMode=value;
 if(key==='stage'&&['all','regular','playoffs'].includes(value))profileStatsStage=value;
 renderPlayerProfile();document.getElementById(key==='stage'?'stats-stage-'+value:'stats-'+key)?.focus();
}
function profileStatsControls(){
 const select=(key,label,items,current)=>`<label>${label}<select id="stats-${key}" onchange="selectProfileStats('${key}',this.value)">${items.map(([value,text])=>`<option value="${value}" ${value===current?'selected':''}>${text}</option>`).join('')}</select></label>`;
 return '<div class="reference-controls profile-stats-toolbar"><h3>Season statistics</h3>'+select('view','View',[['traditional','Traditional'],['advanced','Advanced'],['per36','Per 36'],['highs','Game Highs'],['misc','Miscellaneous']],profileStatsView)+(profileStatsView==='traditional'?select('mode','Display',[['pergame','Per game'],['totals','Totals']],profileStatsMode):'')+`<div class="profile-competition" role="group" aria-label="Statistics competition">${[['regular','Regular Season'],['playoffs','Playoffs']].map(([value,label])=>`<button type="button" id="stats-stage-${value}" aria-pressed="${profileStatsStage===value}" onclick="selectProfileStats('stage','${value}')">${label}</button>`).join('')}</div>`+'</div>';
}
function aggregateProfileStats(p,games,clubLabel,wholeSeason=false){const row={season:state.year+'–'+String(state.year+1).slice(-2),age:p.age,team:clubLabel,pos:p.pos,gp:wholeSeason?p.gp:games.length};for(const key of ['pts','reb','ast','fgm','fga','tpm','tpa','ftm','fta','stl','blk','tov','mp','orb','drb','pf']){row[key]=wholeSeason&&['pts','reb','ast'].includes(key)?p[key]:games.length&&games.every(g=>Number.isFinite(g[key]))&&(!wholeSeason||games.length===p.gp)?games.reduce((sum,g)=>sum+g[key],0):null}row.twom=row.fgm!==null&&row.tpm!==null?row.fgm-row.tpm:null;row.twoa=row.fga!==null&&row.tpa!==null?row.fga-row.tpa:null;const pct=(m,a)=>m!==null&&a>0?m/a:null;row.fgpct=pct(row.fgm,row.fga);row.tppct=pct(row.tpm,row.tpa);row.twopct=pct(row.twom,row.twoa);row.ftpct=pct(row.ftm,row.fta);row.efg=row.fgm!==null&&row.tpm!==null&&row.fga>0?(row.fgm+.5*row.tpm)/row.fga:null;return row}
const PROFILE_PER36_COLUMNS=[['season','Season'],['age','Age'],['team','Team'],['pos','Pos'],['gp','G'],['mp','MP'],...PROFILE_STAT_COLUMNS.slice(5,18),['orb','ORB'],['drb','DRB'],...PROFILE_STAT_COLUMNS.slice(18,-1),['pf','PF'],['pts','PTS']];
function profileStatCell(row,key,mode=profileStatsMode){
 const value=row[key];if(value===null||value===undefined||typeof value==='number'&&!Number.isFinite(value))return '—';
 if(['fgpct','tppct','twopct','ftpct','efg'].includes(key))return value.toFixed(3).replace(/^0/,'');
 if(['season','age','team','pos','gp'].includes(key))return escapeHTML(String(value));
 if(mode==='per36'){if(key==='mp')return value.toFixed(1);return Number.isFinite(row.mp)&&row.mp>0?(value*36/row.mp).toFixed(1):'—'}
 return mode==='totals'?String(value):row.gp?(value/row.gp).toFixed(1):'—';
}
function referenceStatsTable(ctx,per36=false){
 const {p,club}=ctx,all=playerGameRows(p).filter(g=>g.played!==false),games=all.filter(g=>profileCompetitionMatches(g.stage)),clubs=[...new Set(games.map(g=>g.team))];
 const rows=[aggregateProfileStats(p,games,clubs.length>1?'TOT':clubs[0]||club?.abbr||'FA',!per36&&profileStatsStage==='all')];
 if(clubs.length>1)for(const abbr of clubs)rows.push(aggregateProfileStats(p,games.filter(g=>g.team===abbr),abbr));
 const mode=per36?'per36':profileStatsMode,columns=per36?PROFILE_PER36_COLUMNS:PROFILE_STAT_COLUMNS,title=per36?'Per 36 Minutes':mode==='totals'?'Traditional · Totals':'Traditional · Per game';
 return `<section class="reference-stats"><div class="reference-scroll" role="region" aria-label="${title} table, scroll horizontally for more columns" tabindex="0"><table><caption>${escapeHTML(p.name)} · ${title}</caption><thead><tr>${columns.map(([k,label])=>`<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map((row,i)=>`<tr class="${i===0?'stat-total':''}">${columns.map(([key],j)=>`<${j===0?'th scope="row"':'td'}>${profileStatCell(row,key,mode)}</${j===0?'th':'td'}>`).join('')}</tr>`).join('')}</tbody></table></div><p class="reference-note">${per36?'Counting stats = recorded totals × 36 ÷ recorded minutes. G and MP show actual games and total minutes; shooting percentages are unchanged. Missing or zero minutes show — for per-36 rates.':'Shooting percentages use .000 notation. TRB = total rebounds; eFG% adjusts for the extra value of threes.'}</p><p class="reference-note">${games.length} recorded game${games.length===1?'':'s'} in this view. ${per36?'Current season and selected competition only. Team splits use each team’s own minutes. Incomplete recorded statistics show —.':'All-competition points, rebounds, assists and games include older season totals. Competition and team splits use recorded games only; incomplete data shows —. Earlier seasons are not available.'}</p></section>`;
}
const statsBeforeTable=playerStats;playerStats=function(ctx){return profileStatsControls()+referenceStatsTable(ctx)+statsBeforeTable(ctx)};
