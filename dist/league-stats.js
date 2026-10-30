const STATS_COUNTS=['mp','gs','pts','reb','orb','drb','ast','blk','stl','tov','pf','fgm','fga','tpm','tpa','ftm','fta','poss','defPoss','onPts','oppPts'];
let statsUI={season:'current',competition:'regular',tab:'traditional',mode:'pergame',team:'all',split:'all',sort:'pts',dir:-1};
function statsChange(key,value){statsUI[key]=value;if(key==='season')statsUI.split='all';render()}
function statsSort(key){statsUI.dir=statsUI.sort===key?-statsUI.dir:-1;statsUI.sort=key;render()}
function readClutchStats(raw,bad){if(!raw||typeof raw!=='object'||STATS_COUNTS.some(k=>typeof raw[k]!=='number'||!Number.isFinite(raw[k])||raw[k]<0||raw[k]>500))bad('invalid clutch statistics.');return Object.fromEntries(STATS_COUNTS.map(k=>[k,raw[k]]))}
function statsEntries(split='all',team='all',competition='regular'){
 const regular=state.history.filter(g=>competition==='regular'?g.stage==='Regular season':competition==='playoffs'?['First round','Conference semifinal','Conference final','Semifinal','Championship'].includes(g.stage):false);return regular.flatMap(g=>g.box.filter(p=>p.played!==false&&(p.mp===undefined||p.mp>0)).flatMap(p=>{
 const id=state.teams[g.a].abbr===p.team?g.a:g.b,opp=state.teams[id===g.a?g.b:g.a],home=id===g.a,date=scheduleDate(g.day),previous=regular.filter(h=>h.day<g.day&&(h.a===id||h.b===id)).reduce((n,h)=>Math.max(n,h.day),0),rest=previous?g.day-previous-1:null;
 if(team!=='all'&&state.teams[Number(team)]?.abbr!==p.team)return [];
 if(split==='home'&&!home||split==='away'&&home||split==='pre'&&g.day>=seasonMilestones().start||split==='post'&&g.day<seasonMilestones().start||split==='winning'&&opp.w/(opp.w+opp.l||1)<=.5||split==='losing'&&opp.w/(opp.w+opp.l||1)>=.5||split.startsWith('month:')&&Number(split.slice(6))!==date.getUTCMonth()||split.startsWith('rest:')&&(rest===null||(split==='rest:3'?rest<3:rest!==Number(split.slice(5)))))return [];
 if(split==='clutch'&&!(p.clutch?.mp>0))return [];
 return [{...p,...(split==='clutch'?p.clutch:{}),year:state.year,game:g,teamId:id}];
 }));
}
function statsRows(entries=statsEntries(statsUI.split,statsUI.team)){
 const map=new Map();for(const p of entries){const key=p.playerId??p.team+':'+p.name;const r=map.get(key)||{id:p.playerId,name:p.name,team:p.team,games:[],teams:new Set()};r.games.push(p);r.teams.add(p.team);map.set(key,r)}
 return [...map.values()].map(r=>{const games=r.games,sum=k=>games.every(p=>Number.isFinite(p[k]))?games.reduce((n,p)=>n+p[k],0):null;r.gp=games.length;r.team=[...r.teams].join(' / ');for(const k of STATS_COUNTS)r[k]=sum(k);const div=(n,d)=>n!==null&&d>0?n/d:null;r.fgp=div(r.fgm,r.fga);r.tpp=div(r.tpm,r.tpa);r.ftp=div(r.ftm,r.fta);r.ts=r.fga!==null&&r.fta!==null?div(r.pts,2*(r.fga+.44*r.fta)):null;r.efg=r.fgm!==null&&r.tpm!==null?div(r.fgm+.5*r.tpm,r.fga):null;r.ortg=div(r.onPts,r.poss);if(r.ortg!==null)r.ortg*=100;r.drtg=div(r.oppPts,r.defPoss);if(r.drtg!==null)r.drtg*=100;
 const denominators=games.map(p=>{const own=p.game.box.filter(b=>b.team===p.team),opp=p.game.box.filter(b=>b.team!==p.team);const total=(a,k)=>a.every(x=>Number.isFinite(x[k]))?a.reduce((n,x)=>n+x[k],0):null;return{mp:total(own,'mp')/5,fga:total(own,'fga'),fta:total(own,'fta'),tov:total(own,'tov'),fgm:total(own,'fgm'),reb:total([...own,...opp],'reb'),p}});
 const denom=fn=>denominators.every(d=>Object.values(d).filter(v=>typeof v!=='object').every(v=>v!==null&&Number.isFinite(v)))?denominators.reduce((n,d)=>n+fn(d),0):null;
 const use=denom(d=>d.p.mp/d.mp*(d.fga+.44*d.fta+d.tov)),assists=denom(d=>d.p.mp/d.mp*d.fgm-d.p.fgm),rebounds=denom(d=>d.p.mp/d.mp*d.reb);
 r.usg=r.fga!==null&&r.fta!==null&&r.tov!==null?div(r.fga+.44*r.fta+r.tov,use):null;r.astPct=div(r.ast,assists);r.trbPct=div(r.reb,rebounds);if(statsUI.split==='clutch'){r.usg=r.astPct=r.trbPct=null}
 for(const k of ['pts','reb','ast','blk','stl'])r['high_'+k]=Math.max(...games.map(p=>p[k]??0));return r});
}
const STATS_TRAD=[['name','Player'],['age','Age'],['team','Team'],['pos','Pos'],['gp','GP'],['gs','GS'],['mp','MIN'],['fgm','FG'],['fga','FGA'],['fgp','FG%'],['tpm','3P'],['tpa','3PA'],['tpp','3P%'],['twom','2P'],['twoa','2PA'],['twopct','2P%'],['efg','eFG%'],['ftm','FT'],['fta','FTA'],['ftp','FT%'],['orb','ORB'],['drb','DRB'],['reb','TRB'],['ast','AST'],['stl','STL'],['blk','BLK'],['tov','TOV'],['pf','PF'],['pts','PTS']];
const STATS_ADV=[['name','Player'],['age','Age'],['team','Team'],['pos','Pos'],...ADVANCED_TABLE_COLUMNS.map(([k,label])=>[k==='usgPct'?'usg':k,['per','ws48','bpm','dbpm','vorp'].includes(k)?label+'*':label]),['efg','eFG%'],['ortg','ORtg'],['drtg','DRtg']];
const STATS_HIGHS=[['name','Player'],['team','Team'],...HIGH_TABLE_COLUMNS.map(([k,label])=>['high_'+k,label])];

function statsValue(r,key){const v=r[key];if(key==='awards')return Array.isArray(v)?v.length:null;if(v==null)return null;if(statsUI.tab==='history')return v;if(typeof v!=='number'||['age','gp','gs','year','ovr','mvpShare','allLeague','allDefense','ortg','drtg','per','ws48','bpm','vorp','dbpm'].includes(key)||key.startsWith('high_')||['twopct','threeRate','ftRate','tovRate','orbPct','drbPct','stlPct','blkPct','ows','dws','ws','obpm','fgp','tpp','ftp','ts','efg','usg','astPct','trbPct'].includes(key))return v;if(statsUI.tab==='advanced'||statsUI.tab==='misc')return v;if(statsUI.tab==='per36')return key==='mp'?v:r.mp>0?v*36/r.mp:null;if(statsUI.mode==='totals')return v;if(statsUI.mode==='per36')return r.mp>0?v*36/r.mp:null;if(statsUI.mode==='per100')return r.poss>0?v*100/r.poss:null;return r.gp?v/r.gp:null}
function statsTable(rows,cols){rows=[...rows].sort((a,b)=>{const x=statsValue(a,statsUI.sort),y=statsValue(b,statsUI.sort);if(x==null)return y==null?0:1;if(y==null)return -1;return statsUI.dir*(typeof x==='string'?x.localeCompare(y):x-y)});return '<div class="scroll"><table><thead><tr><th><button class="namebutton" onclick="statsSort(\'pts\')">#</button></th>'+cols.map(([k,label])=>'<th aria-sort="'+(statsUI.sort===k?(statsUI.dir<0?'descending':'ascending'):'none')+'"><button class="namebutton" onclick="statsSort(\''+k+'\')">'+label+(statsUI.sort===k?(statsUI.dir<0?' ↓':' ↑'):'')+'</button></th>').join('')+'</tr></thead><tbody>'+(typeof storageStatsSlice==='function'?storageStatsSlice(rows):rows).map((r,i)=>'<tr><td>'+(i+1+(typeof storageStatsPage==='number'?storageStatsPage*100:0))+'</td>'+cols.map(([k])=>{const v=statsValue(r,k),pct=['twopct','tovRate','orbPct','drbPct','stlPct','blkPct','fgp','tpp','ftp','ts','efg','usg','astPct','trbPct','mvpShare'].includes(k),good=(k==='fgp'&&v>=.5)||(k==='tpp'&&v>=.4)||(k==='ftp'&&v>=.9)||(k==='per'&&v>25),poor=v!=null&&((k==='fgp'&&v<.35)||(k==='tpp'&&v<.25)||(k==='ftp'&&v<.6));let text=v==null?'—':typeof v==='boolean'?(v?'Yes':'—'):typeof v==='string'?escapeHTML(v):pct?(v*100).toFixed(1)+'%':Number.isInteger(v)&&['age','gp','gs',...MISC_TOTAL_KEYS].includes(k)?v:['threeRate','ftRate'].includes(k)?v.toFixed(3):v.toFixed(1);if(k==='awards'){const y=r.awardYear??r.year;text=awardCodesMarkup(r.awards??(Number.isInteger(y)&&statsUI.competition==='regular'?playerSeasonAwards(r.id,y):[]),y)}if(k==='name'&&r.id!==undefined&&[...state.teams.flatMap(t=>t.roster),...state.free].some(p=>p.id===r.id))text='<button class="namebutton" onclick="profile('+r.id+')">'+text+'</button>';if(statsUI.tab==='highs'&&k.startsWith('high_')&&r.highGames?.[k])text='<button class="namebutton" onclick="showResult('+state.history.indexOf(r.highGames[k])+')">'+text+'</button>';return '<td'+(good?' style="color:#62bc89"':poor?' style="color:#e87979"':'')+'>'+text+'</td>'}).join('')+'</tr>').join('')+'</tbody></table></div>'+(rows.length?'':'<p class="note">No recorded games match these filters.</p>')+(typeof storageStatsPagination==='function'?storageStatsPagination(rows.length):'')}
function statsSnapshot(competition='regular'){return statsAwards(statsRows(statsEntries('all','all',competition))).map(r=>{const p=[...state.teams.flatMap(t=>t.roster),...state.free].find(p=>p.id===r.id);return Object.fromEntries([...['id','name','team','age','pos','gp',...STATS_COUNTS,...MISC_TOTAL_KEYS,...HIGH_TABLE_COLUMNS.map(c=>'high_'+c[0]),'high_pts','high_reb','high_ast','high_blk','high_stl','mvpShare'].map(k=>[k,r[k]??null]),['year',state.year],['ovr',p?.ovr??null]])})}
function archiveStatsSeason(){state.playerPostseasonArchive=(state.playerPostseasonArchive||[]).filter(r=>r.year!==state.year).concat(statsSnapshot('playoffs'));state.statsArchive??=[];state.statsArchive=state.statsArchive.filter(r=>r.year!==state.year).concat(statsSnapshot()).slice(-30000)}
function readStatsArchive(raw,bad){if(raw===undefined)return [];if(!Array.isArray(raw)||raw.length>30000)bad('invalid statistics archive.');return raw.map(r=>{if(!r||!Number.isInteger(r.year)||r.year<1900||r.year>10000||typeof r.name!=='string'||r.name.length>80||typeof r.team!=='string'||r.team.length>200||r.id!==null&&(!Number.isInteger(r.id)||r.id<0||r.id>10000000))bad('invalid historical player.');for(const k of ['gp',...STATS_COUNTS,'ovr','high_pts','high_reb','high_ast','high_blk','high_stl'])if(r[k]!==null&&(!Number.isFinite(r[k])||r[k]<0||r[k]>1000000))bad('invalid historical stats.');for(const k of MISC_TOTAL_KEYS)if(r[k]!=null&&(!Number.isFinite(r[k])||Math.abs(r[k])>1000000||(k!=='plusMinus'&&r[k]<0)))bad('invalid miscellaneous statistics.');if(r.mvpShare!==undefined&&(!Number.isFinite(r.mvpShare)||r.mvpShare<0||r.mvpShare>1))bad('invalid voting share.');if(r.age!=null&&(!Number.isInteger(r.age)||r.age<16||r.age>1000))bad('invalid historical age.');if(r.pos!=null&&!['PG','SG','SF','PF','C'].includes(r.pos))bad('invalid historical position.');for(const [key] of HIGH_TABLE_COLUMNS){const v=r['high_'+key];if(v!=null&&(!Number.isFinite(v)||Math.abs(v)>1000000))bad('invalid historical game high.');}for(const k of ['allLeague','allDefense'])if(r[k]!==undefined&&typeof r[k]!=='boolean')bad('invalid award.');const awards=readSeasonAwardList(r.awards,bad);return {...r,...(awards?{awards}:{})}})}
function statsHistory(){const archive=[...(state.statsArchive||[]).filter(r=>r.year!==state.year),...statsSnapshot()],filtered=archive.filter(r=>statsUI.team==='all'||r.team.split(' / ').includes(state.teams[Number(statsUI.team)]?.abbr));const map=new Map();for(const r of filtered){const key=r.id??r.name,old=map.get(key)||{id:r.id,name:r.name,team:r.team,gp:0,pts:0,reb:0,ast:0,blk:0,stl:0,high_pts:0,high_reb:0,high_ast:0,high_blk:0,high_stl:0};for(const k of ['gp','pts','reb','ast','blk','stl'])old[k]=old[k]===null||r[k]===null?null:old[k]+r[k];for(const k of ['pts','reb','ast','blk','stl'])old['high_'+k]=Math.max(old['high_'+k],r['high_'+k]||0);map.set(key,old)}return {archive:filtered,rows:[...map.values()]}}
function leagueStatsView(){if(statsUI.tab==='awards')statsUI.tab='leaders';if(!['current','career'].includes(statsUI.season)&&!playerStatsYears().includes(Number(statsUI.season)))statsUI.season='current';const select=(key,label,options)=>'<label>'+label+'<select onchange="statsChange(\''+key+'\',this.value)">'+options.map(([v,t])=>'<option value="'+v+'" '+(String(statsUI[key])===String(v)?'selected':'')+'>'+escapeHTML(t)+'</option>').join('')+'</select></label>';const rows=selectedPlayerStats(),history=selectedPlayerHistory();const historic=statsUI.tab==='history',progression=statsUI.tab==='progression',leaders=statsUI.tab==='leaders';let body=leaders?playerLeagueLeaders(rows):statsTable(historic?history.rows:progression?history.archive:rows,historic?[['name','Player'],['team','Team'],['gp','Career GP'],['pts','Career PTS'],['reb','Career TRB'],['ast','Career AST'],...['pts','reb','ast','blk','stl'].map(k=>['high_'+k,k.toUpperCase()+' High'])]:progression?[['name','Player'],['year','Season'],['team','Team'],['ovr','OVR'],['gp','GP'],['pts','PTS'],['reb','TRB'],['ast','AST'],['awards','Awards']]:statsUI.tab==='misc'?[['name','Player'],...MISC_COLUMNS]:statsUI.tab==='advanced'?STATS_ADV:statsUI.tab==='highs'?STATS_HIGHS:STATS_TRAD);return '<div class="panel"><div class="panelhead"><h2>Player statistics</h2><span class="muted">'+(statsUI.season==='career'?'Career':statsUI.season==='current'?state.year:statsUI.season)+' · '+TEAM_COMPETITIONS[statsUI.competition]+'</span></div><div class="note"><div class="actions">'+[['traditional','Traditional'],['advanced','Advanced'],['per36','Per 36'],['highs','Game Highs'],['misc','Miscellaneous'],['history','Career & highs'],['progression','Year by year'],['leaders','League Leaders']].map(([v,t])=>'<button '+(statsUI.tab===v?'class="primary"':'')+' onclick="statsChange(\'tab\',\''+v+'\')">'+t+'</button>').join('')+'</div><div class="strategy">'+select('competition','Season Type',Object.entries(TEAM_COMPETITIONS))+select('season','Season Year',playerStatsYears().map(y=>[y===state.year?'current':String(y),y+'–'+(y+1)]).concat([['career','Career']]))+select('team','Team',[['all','Entire league'],...state.teams.map(t=>[String(t.id),t.city+' '+t.name])])+ (['per36','misc'].includes(statsUI.tab)?'':select('mode','View',[['pergame','Per game'],['per36','Per 36 minutes'],['per100','Per 100 on-court possessions'],['totals','Totals']]))+(!historic&&!progression&&statsUI.season==='current'?select('split','Split',[['all','All games'],['home','Home'],['away','Away'],['pre','Pre-All-Star'],['post','Post-All-Star'],['clutch','Clutch · final 5 min / within 5'],['rest:0','Back-to-back'],['rest:1','1 day rest'],['rest:2','2 days rest'],['rest:3','3+ days rest'],['winning','Opponent above .500 now'],['losing','Opponent below .500 now'],...Array.from({length:12},(_,i)=>['month:'+i,new Date(Date.UTC(2026,i,1)).toLocaleString('en-US',{month:'long',timeZone:'UTC'})])]) :'')+'</div><p class="muted">Click any column to sort. — means unavailable. Shooting colors are guides, with no minimum-attempt qualification. Traditional MIN follows the selected view; Per 36 scales counting stats to 36 minutes and keeps MIN as total minutes. Advanced MP is total minutes. Game Highs are single-game values; click one to open its box score.</p></div>'+(statsUI.competition==='preseason'?'<p class="note">Preseason games coming soon.</p>':statsUI.season!=='current'?'<p class="note">Career and past seasons use recorded season totals. Older playoff data and detailed highs may be unavailable. Archived team filters include full traded-player seasons; unsupported historical advanced metrics show —.</p>':'')+body+'<div class="note">'+(statsUI.tab==='advanced'?'TS%, eFG%, usage, assist and rebound rates use recorded box scores. ORtg/DRtg measure team points scored/allowed during a player’s on-court possessions. PER*, WS/48*, BPM*, DBPM* and VORP* are game-model estimates, not Basketball Reference formulas: game-score efficiency normalized to 15, win allocation by positive game score, relative box contribution and minutes-weighted replacement value. Estimates recalibrate to the selected sample; small samples are unstable. Additional profile categories without supported calculations display —.':historic||progression?'History begins with recorded games and season archives. Historical team filters include seasons spent with that team; traded-player combined seasons are included in full.':'Clutch uses the simulation’s minute-level clock and includes overtime. First appearances without a prior game have unknown rest. New tracking fields are unavailable for older games.')+'</div></div>'}
// Transparent game-model estimates. These are not the proprietary/reference implementations.
const statsRowsBeforeModels=statsRows;
statsRows=function(...args){const rows=statsRowsBeforeModels(...args),valid=rows.filter(r=>r.mp>0&&['pts','fgm','fga','ftm','fta','orb','drb','stl','ast','blk','pf','tov'].every(k=>r[k]!=null));let totalMP=0,totalScore=0,totalDefense=0;for(const r of valid){r.modelScore=r.pts+.4*r.fgm-.7*r.fga-.4*(r.fta-r.ftm)+.7*r.orb+.3*r.drb+r.stl+.7*r.ast+.7*r.blk-.4*r.pf-r.tov;r.modelDefense=(r.stl*1.5+r.blk+.3*r.drb-.3*r.pf)/r.mp*36;totalMP+=r.mp;totalScore+=r.modelScore;totalDefense+=r.modelDefense*r.mp}const avg=totalScore/totalMP,def=totalDefense/totalMP;for(const r of valid){r.per=avg>0?15*(r.modelScore/r.mp)/avg:null;r.bpm=(r.modelScore/r.mp-avg)*12;r.dbpm=(r.modelDefense-def)*.6;r.vorp=(r.bpm+2)*r.mp/(48*82);const own=state.teams.find(t=>t.abbr===r.team),teammates=valid.filter(p=>p.team===r.team),den=teammates.reduce((n,p)=>n+Math.max(0,p.modelScore),0);r.ws48=own&&den>0?own.w*Math.max(0,r.modelScore)/den*48/r.mp:null}return rows};
function statsAwards(rows){const candidates=rows.filter(r=>r.gp>0&&r.mp>0),top=[...candidates].sort((a,b)=>(b.modelScore||0)-(a.modelScore||0)).slice(0,5),sum=top.reduce((n,r)=>n+Math.max(0,r.modelScore||0),0);return rows.map(r=>({...r,mvpShare:top.includes(r)&&sum>0?Math.max(0,r.modelScore)/sum:0,allLeague:[...candidates].sort((a,b)=>(b.modelScore||0)-(a.modelScore||0)).slice(0,15).includes(r),allDefense:[...candidates].sort((a,b)=>(b.modelDefense||0)*b.mp-(a.modelDefense||0)*a.mp).slice(0,10).includes(r)}))}
function statsAwardsView(){const archived=(state.statsArchive||[]).filter(r=>r.mvpShare>0||r.awards?.length||r.allLeague||r.allDefense);const projected=awardResultsFor(state.year)||computeAwardResults();const current=statsAwards(statsRows(statsEntries('all','all'))).map(r=>({...r,year:state.year,awards:awardsFromResults(r.id,projected)})).filter(r=>r.mvpShare>0||r.awards.length);const entries=[...current,...archived].filter(r=>statsUI.team==='all'||r.team.split(' / ').includes(state.teams[Number(statsUI.team)]?.abbr));return '<p class="note">'+(state.day<seasonLength()?'Current-season award race — projections until the season ends. ':'Season award results. ')+'Simulated MVP voting shares use the top five total game-score contributions. Honors list award voting finishes and 1st/2nd/3rd All-League, All-Defensive and All-Rookie teams (position-balanced unless the league setting is position-less); current-season honors are projections until the regular season ends. Seasons saved before tiers existed show ALL/DEF without a tier.</p>'+statsTable(entries,[['name','Player'],['year','Season'],['team','Team'],['mvpShare','MVP share'],['awards','Honors']])}
let statsProgressPlayer=null;
function statsProgressChart(archive){const ids=[...new Set(archive.map(r=>r.id))];if(!ids.includes(statsProgressPlayer))statsProgressPlayer=ids[0];const list=archive.filter(r=>r.id===statsProgressPlayer).sort((a,b)=>a.year-b.year);if(!list.length)return '';const max=Math.max(1,...list.map(r=>r.pts/(r.gp||1))),bars=list.map((r,i)=>{const x=35+i*80,h=(r.pts/(r.gp||1))/max*95;return '<rect x="'+x+'" y="'+(125-h)+'" width="34" height="'+h+'" fill="#c4a15f"/><text x="'+(x+17)+'" y="145" text-anchor="middle" fill="currentColor" font-size="12">'+r.year+'</text><text x="'+(x+17)+'" y="'+(120-h)+'" text-anchor="middle" fill="currentColor" font-size="12">'+(r.pts/(r.gp||1)).toFixed(1)+'</text>'}).join('');return '<div class="note"><label>Player progression <select onchange="statsProgressPlayer=Number(this.value);render()">'+ids.map(id=>'<option value="'+id+'" '+(id===statsProgressPlayer?'selected':'')+'>'+escapeHTML(archive.find(r=>r.id===id).name)+'</option>').join('')+'</select></label><p>Points per game by season · OVR appears in the table below.</p><div class="scroll"><svg role="img" aria-label="Points per game by season" width="'+Math.max(220,list.length*80+40)+'" height="155">'+bars+'</svg></div></div>'}

function statsLeaderCards(rows){return '<div class="stats" style="padding:0 20px">'+[['pts','POINTS'],['reb','REBOUNDS'],['ast','ASSISTS'],['blk','BLOCKS']].map(([k,label])=>{const top=[...rows].filter(r=>r[k]!=null&&r.gp>0).sort((a,b)=>b[k]/b.gp-a[k]/a.gp)[0];return '<div class="panel" style="padding:16px;min-width:0"><small>'+label+' / GAME</small><h2>'+(top?(top[k]/top.gp).toFixed(1):'—')+'</h2><span>'+escapeHTML(top?.name||'No games recorded')+'</span></div>'}).join('')+'</div>'}
let teamStatsUI={season:'current',competition:'regular',category:'traditional',mode:'pergame',split:'all',sort:'pts',dir:-1};
function teamStatsChange(key,value){teamStatsUI[key]=value;if(key==='category'){teamStatsUI.sort=value==='advanced'?'ortg':value==='fourFactors'?'efg':value==='opponents'?'opp_pts':'pts';teamStatsUI.dir=-1}render()}
function teamStatsSort(key){teamStatsUI.dir=teamStatsUI.sort===key?-teamStatsUI.dir:-1;teamStatsUI.sort=key;render()}
function teamStatRows(split=teamStatsUI.split,competition=teamStatsUI.competition,season=teamStatsUI.season){
 const year=season==='current'?state.year:Number(season);
 if(competition==='preseason')return [];
 if(year!==state.year)return (state.teamStatsArchive||[]).find(a=>a.year===year)?.rows[competition]?.[split]||[];
 const entries=statsEntries(split,'all',competition);return state.teams.map(t=>{const ps=entries.filter(p=>p.teamId===t.id),games=[...new Set(ps.map(p=>p.game))],sum=k=>ps.length&&ps.every(p=>Number.isFinite(p[k]))?ps.reduce((n,p)=>n+p[k],0):null,r={teamId:t.id,name:t.city+' '+t.name,gp:games.length,w:games.filter(g=>g.winner===t.id).length};r.blka=teamOpponentStat(games,t.id,'blk');r.pfd=teamOpponentStat(games,t.id,'pf');r.l=r.gp-r.w;r.pct=r.gp?r.w/r.gp:null;for(const k of STATS_COUNTS)r[k]=sum(k);if(r.tov!==null)r.tov+=games.reduce((n,g)=>n+teamTurnoverCount(g,t.abbr),0);r.poss=r.poss===null?null:r.poss/5;r.defPoss=r.defPoss===null?null:r.defPoss/5;r.mp=r.mp===null?null:r.mp/5;r.opp=split==='clutch'?(sum('oppPts')===null?null:sum('oppPts')/5):games.length?games.reduce((n,g)=>n+(g.a===t.id?g.sb:g.sa),0):null;if(split!=='clutch'&&games.length)r.pts=games.reduce((n,g)=>n+(g.a===t.id?g.sa:g.sb),0);const div=(n,d)=>n!==null&&d>0?n/d:null;r.fgp=div(r.fgm,r.fga);r.tpp=div(r.tpm,r.tpa);r.ftp=div(r.ftm,r.fta);r.ts=r.fga!==null&&r.fta!==null?div(r.pts,2*(r.fga+.44*r.fta)):null;r.efg=r.fgm!==null&&r.tpm!==null?div(r.fgm+.5*r.tpm,r.fga):null;r.ortg=div(r.pts,r.poss);r.drtg=div(r.opp,r.defPoss);if(r.ortg!==null)r.ortg*=100;if(r.drtg!==null)r.drtg*=100;r.net=r.ortg!==null&&r.drtg!==null?r.ortg-r.drtg:null;r.pace=r.poss!==null&&r.defPoss!==null&&r.mp>0?(r.poss+r.defPoss)*24/r.mp:null;teamAdvancedMetrics(r,games,t.id);teamOpponentMetrics(r,games,t.id);return r})}
const TEAM_STATS_ADVANCED_COLS=[['name','Team'],['w','W'],['l','L'],['ortg','OFFRTG'],['drtg','DEFRTG'],['net','NETRTG'],['astPct','AST%'],['astTo','AST/TO'],['astRatio','AST RATIO'],['orebPct','OREB%'],['drebPct','DREB%'],['rebPct','REB%'],['tovPct','TOV%'],['efg','EFG%'],['ts','TS%'],['pace','PACE'],['pie','PIE']];
const TEAM_FOUR_FACTORS_COLS=[['name','Team'],['w','W'],['l','L'],['efg','EFG%'],['ftaRate','FTA Rate'],['tovPct','TOV%'],['orebPct','OREB%'],['oppEfg','OPP EFG%'],['oppFtaRate','OPP FTA RATE'],['oppTovPct','OPP TOV%'],['oppOrebPct','OPP OREB%']];
const TEAM_STATS_COLS=[['name','Team'],['w','W'],['l','L'],['pct','Win%'],['fgm','FGM'],['fga','FGA'],['fgp','FG%'],['tpm','3PM'],['tpa','3PA'],['tpp','3P%'],['ftm','FTM'],['fta','FTA'],['ftp','FT%'],['orb','OREB'],['drb','DREB'],['reb','REB'],['ast','AST'],['tov','TOV'],['stl','STL'],['blk','BLK'],['blka','BLKA'],['pf','PF'],['pfd','PFD'],['pts','PTS']];
const TEAM_OPPONENT_COLS=TEAM_STATS_COLS.map(([key,label])=>['name','w','l','pct'].includes(key)?[key,label]:['opp_'+key,'OPP '+label]);
function teamOpponentMetrics(r,games,id){
 const div=(n,d)=>Number.isFinite(n)&&Number.isFinite(d)&&d>0?n/d:null;
 r.opp_w=r.l;r.opp_l=r.w;r.opp_pct=div(r.l,r.gp);
 for(const key of ['fgm','fga','tpm','tpa','ftm','fta','orb','drb','reb','ast','tov','stl','blk','pf'])r['opp_'+key]=teamOpponentStat(games,id,key);
 r.opp_pts=r.opp;r.opp_blka=r.blk;r.opp_pfd=r.pf;
 r.opp_fgp=div(r.opp_fgm,r.opp_fga);r.opp_tpp=div(r.opp_tpm,r.opp_tpa);r.opp_ftp=div(r.opp_ftm,r.opp_fta);
}
function teamOpponentStat(games,teamId,key){
 if(!games.length)return null;
 let total=0;
 for(const g of games){
  const opponent=state.teams[g.a===teamId?g.b:g.a];
  const rows=g.box.filter(p=>p.team===opponent.abbr);
  if(!rows.length||rows.some(p=>!Number.isFinite(p[key])))return null;
  total+=rows.reduce((sum,p)=>sum+p[key],0)+(key==='tov'?teamTurnoverCount(g,opponent.abbr):0);
 }
 return total;
}
function teamImpactTotal(r){
 const keys=['pts','fgm','ftm','fga','fta','drb','orb','ast','stl','blk','pf','tov'];
 if(!keys.every(k=>Number.isFinite(r[k])))return null;
 return r.pts+r.fgm+r.ftm-r.fga-r.fta+r.drb+.5*r.orb+r.ast+r.stl+.5*r.blk-r.pf-r.tov;
}
function teamAdvancedMetrics(r,games,id){
 const div=(n,d)=>Number.isFinite(n)&&Number.isFinite(d)&&d>0?n/d:null;
 const share=(n,opp)=>Number.isFinite(n)&&Number.isFinite(opp)?div(n,n+opp):null;
 r.astPct=div(r.ast,r.fgm);r.astTo=div(r.ast,r.tov);
 const ar=div(r.ast,r.poss);r.astRatio=ar===null?null:ar*100;
 r.tovPct=div(r.tov,r.poss);
 r.orebPct=share(r.orb,teamOpponentStat(games,id,'drb'));
 r.drebPct=share(r.drb,teamOpponentStat(games,id,'orb'));
 r.rebPct=share(r.reb,teamOpponentStat(games,id,'reb'));
 const opponent=Object.fromEntries(['pts','fgm','ftm','fga','fta','drb','orb','ast','stl','blk','pf','tov','tpm'].map(k=>[k,teamOpponentStat(games,id,k)]));
 r.ftaRate=div(r.fta,r.fga);
 r.oppEfg=Number.isFinite(opponent.fgm)&&Number.isFinite(opponent.tpm)?div(opponent.fgm+.5*opponent.tpm,opponent.fga):null;
 r.oppFtaRate=div(opponent.fta,opponent.fga);
 r.oppTovPct=div(opponent.tov,r.defPoss);
 r.oppOrebPct=share(opponent.orb,r.drb);
 const own=teamImpactTotal(r),other=teamImpactTotal(opponent);
 r.pie=own!==null&&other!==null?div(own,own+other):null;
}
function teamStatValue(r,k){if(k.startsWith('opp_')){
 const v=r[k];if(v===null||v===undefined)return null;
 if(!['opp_w','opp_l','opp_pct','opp_fgp','opp_tpp','opp_ftp'].includes(k)){
 if(teamStatsUI.mode==='pergame')return r.gp?v/r.gp:null;
 if(teamStatsUI.mode==='per100')return r.defPoss>0?v*100/r.defPoss:null;
 }return v;
 }const v=r[k];if(v===null||v===undefined)return null;if(['pts','opp','reb','orb','drb','ast','stl','blk','tov','pf','blka','pfd','fgm','fga','tpm','tpa','ftm','fta'].includes(k)){if(teamStatsUI.mode==='pergame')return r.gp?v/r.gp:null;if(teamStatsUI.mode==='per100'){const poss=k==='opp'?r.defPoss:r.poss;return poss>0?v*100/poss:null}}return v}
function teamStatsView(){if(!teamStatsSeasons().includes(teamStatsUI.season==='current'?state.year:Number(teamStatsUI.season)))teamStatsUI.season='current';const cols=teamStatsUI.category==='advanced'?TEAM_STATS_ADVANCED_COLS:teamStatsUI.category==='fourFactors'?TEAM_FOUR_FACTORS_COLS:teamStatsUI.category==='opponents'?TEAM_OPPONENT_COLS:TEAM_STATS_COLS;const rows=[...teamStatRows()].sort((a,b)=>{const x=teamStatValue(a,teamStatsUI.sort),y=teamStatValue(b,teamStatsUI.sort);return x===null?(y===null?0:1):y===null?-1:teamStatsUI.dir*(typeof x==='string'?x.localeCompare(y):x-y)}),options=[['all','All games'],['home','Home'],['away','Away'],['pre','Pre-All-Star'],['post','Post-All-Star'],['rest:0','Back-to-back'],['rest:1','1 day rest'],['rest:2','2 days rest'],['rest:3','3+ days rest'],['winning','Opponent above .500 now'],['losing','Opponent below .500 now'],...Array.from({length:12},(_,i)=>['month:'+i,new Date(Date.UTC(2026,i,1)).toLocaleString('en-US',{month:'long',timeZone:'UTC'})])];return `<section class="panel"><div class="panelhead"><h2>Team statistics</h2><span class="muted">${teamStatsUI.season==='current'?state.year:teamStatsUI.season} · ${TEAM_COMPETITIONS[teamStatsUI.competition]}</span></div><div class="note"><div class="actions"><button onclick="teamStatsChange('category','traditional')" class="${teamStatsUI.category==='traditional'?'primary':''}">Traditional</button><button onclick="teamStatsChange('category','advanced')" class="${teamStatsUI.category==='advanced'?'primary':''}">Advanced</button><button onclick="teamStatsChange('category','fourFactors')" class="${teamStatsUI.category==='fourFactors'?'primary':''}">Four Factors</button><button onclick="teamStatsChange('category','opponents')" class="${teamStatsUI.category==='opponents'?'primary':''}">Opponents</button></div><div class="strategy"><label>Season<select onchange="teamStatsChange('season',this.value)">${teamStatsSeasons().map(y=>`<option value="${y===state.year?'current':y}" ${(teamStatsUI.season==='current'?state.year:Number(teamStatsUI.season))===y?'selected':''}>${seasonLabel(y)}</option>`).join('')}</select></label><label>Season type<select onchange="teamStatsChange('competition',this.value)">${Object.entries(TEAM_COMPETITIONS).map(([v,label])=>`<option value="${v}" ${teamStatsUI.competition===v?'selected':''}>${label}</option>`).join('')}</select></label><label>View<select onchange="teamStatsChange('mode',this.value)">${[['pergame','Per game'],['totals','Totals'],['per100','Per 100 possessions']].map(([v,t])=>`<option value="${v}" ${v===teamStatsUI.mode?'selected':''}>${t}</option>`).join('')}</select></label><label>Split<select onchange="teamStatsChange('split',this.value)">${options.map(([v,t])=>`<option value="${v}" ${v===teamStatsUI.split?'selected':''}>${t}</option>`).join('')}</select></label></div></div>${teamStatsUI.competition==='preseason'?'<p class="note">Preseason games coming soon.</p>':!rows.some(r=>r.gp>0)?'<p class="note">No recorded games available for this season, season type and split.</p>':''}<div class="scroll" tabindex="0" role="region" aria-label="Sortable team statistics"><table><thead><tr>${cols.map(([k,label])=>`<th aria-sort="${teamStatsUI.sort===k?(teamStatsUI.dir<0?'descending':'ascending'):'none'}"><button class="namebutton" onclick="teamStatsSort('${k}')">${label}${teamStatsUI.sort===k?(teamStatsUI.dir<0?' ↓':' ↑'):''}</button></th>`).join('')}</tr></thead><tbody>${rows.map(r=>'<tr>'+cols.map(([k])=>{const v=teamStatValue(r,k);if(k==='name')return `<td><button class="namebutton po-stat-team" onclick="rosterTeamId=${r.teamId};go('Roster')">${secondaryTeamLogo(state.teams[r.teamId])}<span style="white-space:nowrap">${escapeHTML(r.name)}</span></button></td>`;const percent=['pct','fgp','tpp','ftp','ts','efg','astPct','orebPct','drebPct','rebPct','tovPct','pie','oppEfg','oppTovPct','oppOrebPct','opp_pct','opp_fgp','opp_tpp','opp_ftp'].includes(k),good=v!==null&&((k==='fgp'&&v>=.5)||(k==='tpp'&&v>=.4)||(k==='ftp'&&v>=.9)||(k==='net'&&v>=5));if(statsUI.tab==='highs'&&k.startsWith('high_')&&r.highGames?.[k])text='<button class="namebutton" onclick="showResult('+state.history.indexOf(r.highGames[k])+')">'+text+'</button>';return '<td'+(good?' style="color:#62bc89"':'')+'>'+(v===null?'—':percent?(v*100).toFixed(1)+'%':['gp','w','l','opp_w','opp_l'].includes(k)?v:['ftaRate','oppFtaRate'].includes(k)?v.toFixed(3):v.toFixed(1))+'</td>'}).join('')+'</tr>').join('')}</tbody></table></div><p class="note">Click any column to sort or a team to open its roster. Records reflect the selected split. In Opponents, each row shows stats recorded against that team; W, L and Win% show the team’s own record in those matchups. FTA Rate = FTA / FGA; opponent factors use the opposing box scores from the same games. BLKA counts opponent blocks; PFD counts opponent personal fouls in those same games. Counting stats follow the selected View; percentages use summed makes and attempts. OFFRTG / DEFRTG use points per 100 recorded possessions. AST% = AST / FGM; AST/TO = AST / TOV; AST RATIO = 100 × AST / possessions; TOV% = TOV / possessions. Rebound percentages use both teams’ recorded rebounds. PIE is the team’s share of combined box-score impact. PACE averages both teams’ possessions per 48 minutes, including overtime. Advanced rates do not change with the counting-stat View. — means missing data or no matching games. Older saves may lack possession and rebound-split tracking.</p></section>`}

const TEAM_COMPETITIONS={preseason:'Preseason',regular:'Regular Season',playoffs:'Playoffs'};
const TEAM_ARCHIVE_SPLITS=['all','home','away','pre','post','rest:0','rest:1','rest:2','rest:3','winning','losing',...Array.from({length:12},(_,i)=>'month:'+i)];
function teamStatsSeasons(){return [...new Set([state.year,...(state.teamStatsArchive||[]).map(a=>a.year),...(state.franchiseArchive||[]).map(a=>a.year)])].sort((a,b)=>b-a)}
function archiveTeamStatsSeason(){
 const rows={};
 for(const type of ['regular','playoffs']){rows[type]={};for(const split of TEAM_ARCHIVE_SPLITS)rows[type][split]=teamStatRows(split,type,'current')}
 state.teamStatsArchive=(state.teamStatsArchive||[]).filter(a=>a.year!==state.year).concat({year:state.year,rows});
 teamStatsUI.season='current';
}
function readTeamStatsArchive(raw,bad){
 if(raw===undefined)return [];
 if(!Array.isArray(raw)||raw.length>8101)bad('invalid team statistics archive.');
 const years=new Set(),keys=new Set([...STATS_COUNTS,...TEAM_STATS_COLS.map(c=>c[0]),...TEAM_STATS_ADVANCED_COLS.map(c=>c[0]),...TEAM_FOUR_FACTORS_COLS.map(c=>c[0]),...TEAM_OPPONENT_COLS.map(c=>c[0]),'gp','opp','poss','defPoss','mp','name','teamId','blka','pfd','fgp','tpp','ftp']);
 return raw.map(a=>{
  if(!a||!Number.isInteger(a.year)||a.year<1900||a.year>10000||years.has(a.year)||!a.rows)bad('invalid team statistics season.');
  years.add(a.year);const rows={};
  for(const type of ['regular','playoffs']){
   rows[type]={};
   for(const split of TEAM_ARCHIVE_SPLITS){
    const list=a.rows[type]?.[split];if(!Array.isArray(list)||list.length>36)bad('invalid team statistics split.');
    const ids=new Set();rows[type][split]=list.map(r=>{
     if(!r||!Number.isInteger(r.teamId)||r.teamId<0||r.teamId>35||ids.has(r.teamId)||typeof r.name!=='string'||r.name.length>150)bad('invalid archived team.');
     ids.add(r.teamId);const out={};
     for(const key of keys){const value=r[key];if(key==='name'||key==='teamId'){out[key]=value;continue}if(value===undefined)continue;if(value!==null&&(!Number.isFinite(value)||Math.abs(value)>10000000))bad('invalid archived team statistic.');out[key]=value}
     return out;
    });
   }
  }
  return {year:a.year,rows};
 });
}

// Match the profile's traditional shooting detail, advanced categories and game highs.
const statsRowsBeforeProfileColumns=statsRows;
statsRows=function(...args){
 return statsRowsBeforeProfileColumns(...args).map(r=>{
  const p=[...state.teams.flatMap(t=>t.roster),...state.free].find(p=>p.id===r.id);
  r.age=p?.age??null;r.pos=p?.pos||'—';
  r.twom=Number.isFinite(r.fgm)&&Number.isFinite(r.tpm)?r.fgm-r.tpm:null;
  r.twoa=Number.isFinite(r.fga)&&Number.isFinite(r.tpa)?r.fga-r.tpa:null;
  r.twopct=r.twom!==null&&r.twoa>0?r.twom/r.twoa:null;
  Object.assign(r,advancedProfileValues(r.games));
  r.highGames={};
  const games=profileHighGames(r.games).map(g=>({...g,gmsc:teamImpactGameScore(g)}));
  for(const [key] of HIGH_TABLE_COLUMNS){
   const valid=games.filter(g=>Number.isFinite(g[key])).sort((a,b)=>a.game.day-b.game.day||state.history.indexOf(b.game)-state.history.indexOf(a.game));
   const high=valid.reduce((best,g)=>!best||g[key]>best[key]?g:best,null);
   r['high_'+key]=high?high[key]:null;
   if(high)r.highGames['high_'+key]=high.game;
  }
  return r;
 });
};
function teamImpactGameScore(g){
 const keys=['pts','fgm','fga','ftm','fta','orb','drb','stl','ast','blk','pf','tov'];
 if(!keys.every(k=>Number.isFinite(g[k])))return null;
 return g.pts+.4*g.fgm-.7*g.fga-.4*(g.fta-g.ftm)+.7*g.orb+.3*g.drb+g.stl+.7*g.ast+.7*g.blk-.4*g.pf-g.tov;
}

function playerStatsYears(){return [...new Set([state.year,...(state.statsArchive||[]).map(r=>r.year),...(state.playerPostseasonArchive||[]).map(r=>r.year)])].sort((a,b)=>b-a)}
function playerArchivedRows(){
 if(statsUI.competition==='preseason')return [];
 const archives=statsUI.competition==='playoffs'?state.playerPostseasonArchive||[]:state.statsArchive||[];
 return archives.filter(r=>r.year!==state.year&&(statsUI.season==='career'||r.year===Number(statsUI.season))&&(statsUI.team==='all'||r.team.split(' / ').includes(state.teams[Number(statsUI.team)]?.abbr)));
}
function selectedPlayerStats(){
 if(statsUI.competition==='preseason')return [];
 const current=statsUI.season==='current'||Number(statsUI.season)===state.year;
 const live=current||statsUI.season==='career'?statsRows(statsEntries(current?statsUI.split:'all',statsUI.team,statsUI.competition)):[];
 if(current)return live;
 return mergePlayerSeasonRows([...playerArchivedRows(),...live]);
}
function mergePlayerSeasonRows(rows){
 const map=new Map();
 for(const r of rows){const key=r.id??r.name,list=map.get(key)||[];list.push(r);map.set(key,list)}
 return [...map.values()].map(list=>{
  const last=list.at(-1),r={id:last.id,name:last.name,age:last.age??null,pos:last.pos||'—',team:[...new Set(list.flatMap(x=>x.team.split(' / ')))].join(' / '),gp:list.reduce((n,x)=>n+x.gp,0),highGames:{}};
  for(const key of [...STATS_COUNTS,...MISC_TOTAL_KEYS])r[key]=list.every(x=>Number.isFinite(x[key]))?list.reduce((n,x)=>n+x[key],0):null;
  for(const [key] of HIGH_TABLE_COLUMNS){const k='high_'+key,valid=list.filter(x=>Number.isFinite(x[k]));r[k]=valid.length?Math.max(...valid.map(x=>x[k])):null;const winner=valid.find(x=>x[k]===r[k]);if(winner?.highGames?.[k])r.highGames[k]=winner.highGames[k]}
  const div=(n,d)=>Number.isFinite(n)&&Number.isFinite(d)&&d>0?n/d:null;
  r.fgp=div(r.fgm,r.fga);r.tpp=div(r.tpm,r.tpa);r.ftp=div(r.ftm,r.fta);
  r.twom=Number.isFinite(r.fgm)&&Number.isFinite(r.tpm)?r.fgm-r.tpm:null;r.twoa=Number.isFinite(r.fga)&&Number.isFinite(r.tpa)?r.fga-r.tpa:null;r.twopct=div(r.twom,r.twoa);
  Object.assign(r,advancedProfileValues([r]));
  r.ortg=div(r.onPts,r.poss);if(r.ortg!==null)r.ortg*=100;r.drtg=div(r.oppPts,r.defPoss);if(r.drtg!==null)r.drtg*=100;
  return r;
 });
}
function selectedPlayerHistory(){
 const current=statsUI.season==='current'||Number(statsUI.season)===state.year;
 const archive=[...playerArchivedRows(),...(current||statsUI.season==='career'?statsSnapshot(statsUI.competition).filter(r=>statsUI.team==='all'||r.team.split(' / ').includes(state.teams[Number(statsUI.team)]?.abbr)):[])];
 return {rows:mergePlayerSeasonRows(archive),archive};
}
function selectedPlayerAwards(){
 if(statsUI.competition!=='regular')return '<p class="note">These awards are based on regular-season performance.</p>';
 if(statsUI.season==='current')return statsAwardsView();
 const rows=selectedPlayerHistory().archive.filter(r=>r.mvpShare>0||r.awards?.length||r.allLeague||r.allDefense);
 return statsTable(rows,[['name','Player'],['year','Season'],['team','Team'],['mvpShare','MVP share'],['awards','Honors']]);
}

const PLAYER_LEADER_CATEGORIES=[['pts','Scoring'],['reb','Rebounding'],['ast','Assists'],['stl','Steals'],['blk','Blocks'],['fgp','Field goal percentage'],['tpp','Three-point percentage'],['ftp','Free throw percentage']];
function playerLeaderRows(rows,key){const attempts={fgp:['fga',5],tpp:['tpa',2],ftp:['fta',2]}[key];return rows.filter(r=>r.gp>0&&Number.isFinite(statsValue(r,key))&&(!attempts||Number.isFinite(r[attempts[0]])&&r[attempts[0]]>=r.gp*attempts[1])).slice().sort((a,b)=>statsValue(b,key)-statsValue(a,key)||b.gp-a.gp||a.name.localeCompare(b.name)).slice(0,5)}
function playerLeagueLeaders(rows){const label={pergame:'Per game',per36:'Per 36 minutes',per100:'Per 100 on-court possessions',totals:'Totals'}[statsUI.mode]||'Per game';return `<div class="player-leaders"><div class="note"><h3>League Leaders</h3><p>${label} · Selected season, competition, team and split filters apply. Shooting leaders require at least 5 FGA, 2 three-point attempts, or 2 free-throw attempts per game respectively. Other categories require one recorded appearance; small samples can lead early.</p></div><div class="player-leader-grid">${PLAYER_LEADER_CATEGORIES.map(([key,title])=>{const leaders=playerLeaderRows(rows,key),pct=['fgp','tpp','ftp'].includes(key);return `<section class="player-leader-card"><h3>${title}</h3>${leaders.length?`<table><thead><tr><th>#</th><th>Player / Team</th><th>${pct?'%':label}</th></tr></thead><tbody>${leaders.map((r,i)=>{const value=statsValue(r,key),available=playerContext(r.id);return `<tr><td>${i+1}</td><th scope="row">${available?`<button class="namebutton" onclick="profile(${r.id})">${escapeHTML(r.name)}</button>`:escapeHTML(r.name)}<small>${escapeHTML(r.team)} · ${r.gp} GP</small></th><td><strong>${pct?(value*100).toFixed(1)+'%':value.toFixed(statsUI.mode==='totals'?0:1)}</strong></td></tr>`}).join('')}</tbody></table>`:'<p class="muted">No qualifying players in this view.</p>'}</section>`}).join('')}</div></div>`}
