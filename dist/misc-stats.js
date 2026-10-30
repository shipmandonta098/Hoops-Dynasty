// Counts come from individual box scores; unknown historical fields stay unknown.
const MISC_TOTAL_KEYS=['doubleDouble','tripleDouble','flagrant','tech','ejected','dq','fd','plusMinus'];
const MISC_COLUMNS=[['season','Season'],['team','Team'],['gp','GP'],['gs','GS'],['mpg','MPG'],['doubleDouble','DBL DBL'],['tripleDouble','TRIP DBL'],['pf','PF'],['pfpg','PFPG'],['pf48','PF/48'],['flagrant','FLAG'],['tech','TECH'],['ejected','EJECT'],['dq','DQ'],['fd','FD'],['fdpg','FDPG'],['plusMinus','+/−']];
const MISC_HELP=['Season','Team','Games played','Games started','Minutes per game','Games with 10+ in at least two of PTS, REB, AST, STL, BLK','Games with 10+ in at least three of PTS, REB, AST, STL, BLK','Personal fouls','Personal fouls per game','Personal fouls per 48 minutes','Flagrant fouls','Technical fouls','Ejections','Disqualifications by fouling out','Personal fouls drawn','Personal fouls drawn per game','Total on-court point differential'];
function miscRates(row){const rate=(n,d,m=1)=>Number.isFinite(n)&&Number.isFinite(d)&&d>0?n*m/d:null;return {...row,mpg:rate(row.mp,row.gp),pfpg:rate(row.pf,row.gp),pf48:rate(row.pf,row.mp,48),fdpg:rate(row.fd,row.gp)}}
function miscAggregate(games){
 const rows=games.map(g=>{const keys=['pts','reb','ast','stl','blk'],known=keys.every(k=>Number.isFinite(g[k])),doubles=keys.filter(k=>g[k]>=10).length,limit=g.foulLimit??g.game?.gameRules?.foulLimit;return {...g,doubleDouble:known?Number(doubles>=2):null,tripleDouble:known?Number(doubles>=3):null,dq:Number.isFinite(g.dq)?g.dq:Number.isFinite(g.pf)&&Number.isFinite(limit)?Number(g.pf>=limit):null}});
 const totals={gp:rows.length};for(const key of ['gs','mp','pf',...MISC_TOTAL_KEYS])totals[key]=rows.every(g=>Number.isFinite(g[key]))?rows.reduce((n,g)=>n+g[key],0):null;
 return miscRates(totals);
}
function miscCell(row,key){const v=row[key];if(v==null||typeof v==='number'&&!Number.isFinite(v))return '—';if(typeof v==='string')return escapeHTML(v);if(['mpg','pfpg','pf48','fdpg'].includes(key))return v.toFixed(1);return key==='plusMinus'&&v>0?'+'+v:String(v)}
function miscProfileRows(ctx){
 const current=referenceProfileRows(ctx,selectedProfileGames(ctx.p)).map(r=>({...r,...miscAggregate(r.games)}));
 const archive=profileStatsStage==='regular'?state.statsArchive||[]:profileStatsStage==='playoffs'?state.playerPostseasonArchive||[]:[...(state.statsArchive||[]),...(state.playerPostseasonArchive||[])];
 const years=new Map();for(const r of archive.filter(r=>r.id===ctx.p.id&&r.year<state.year)){const entries=years.get(r.year)||[];entries.push(r);years.set(r.year,entries)}
 const past=[...years].sort((a,b)=>b[0]-a[0]).map(([year,rows])=>{const r={season:seasonLabel(year),team:[...new Set(rows.map(r=>r.team))].join(' / ')};for(const k of ['gp','gs','mp','pf',...MISC_TOTAL_KEYS])r[k]=rows.every(x=>Number.isFinite(x[k]))?rows.reduce((n,x)=>n+x[k],0):null;return miscRates(r)});
 return [...current,...past];
}
function miscProfileTable(ctx){return '<section class="reference-stats"><div class="reference-scroll" role="region" aria-label="Miscellaneous season statistics, scroll horizontally" tabindex="0"><table><caption>'+escapeHTML(ctx.p.name)+' · Miscellaneous</caption><thead><tr>'+MISC_COLUMNS.map(([,label],i)=>'<th scope="col"><abbr title="'+MISC_HELP[i]+'">'+label+'</abbr></th>').join('')+'</tr></thead><tbody>'+miscProfileRows(ctx).map(r=>'<tr>'+MISC_COLUMNS.map(([key],i)=>'<'+(i?'td':'th scope="row"')+'>'+miscCell(r,key)+'</'+(i?'td':'th')+'>').join('')+'</tr>').join('')+'</tbody></table></div><p class="reference-note">'+MISC_NOTE+'</p></section>'}
const MISC_NOTE='Counting stats are totals. DQ = foul-outs under that game’s foul limit; EJECT = ejections. Double-doubles include triple-doubles. PF/48 always uses 48 minutes, including WNBA games. +/− is total on-court point differential. — means required historical tracking is unavailable. Competition filters apply; archived traded-player seasons show combined totals.';
const miscStatsRowsBefore=statsRows;
statsRows=function(...args){return miscStatsRowsBefore(...args).map(r=>({...r,...miscAggregate(r.games),season:seasonLabel(state.year)}))};
const miscSelectedStatsBefore=selectedPlayerStats;
selectedPlayerStats=function(){return miscSelectedStatsBefore().map(r=>({...miscRates(r),season:statsUI.season==='career'?'Career':r.season||seasonLabel(Number(statsUI.season))}))};
const miscLeagueStatsBefore=leagueStatsView;
leagueStatsView=function(){return miscLeagueStatsBefore()+(statsUI.tab==='misc'?'<p class="note">'+MISC_NOTE+'</p>':'')};
const miscSelectProfileBefore=selectProfileStats;
selectProfileStats=async function(key,value){if(key==='view'&&value==='misc'&&typeof hydrateLeagueHistory==='function'){const player=activePlayerId,career=state;try{await hydrateLeagueHistory(['statsArchive','playerPostseasonArchive'])}catch(e){toast('Statistics could not load: '+e.message);return}if(state!==career||activePlayerId!==player)return;}return miscSelectProfileBefore(key,value)};
const miscStatsChangeBefore=statsChange;
statsChange=function(key,value){if(key==='split'&&value==='clutch'&&statsUI.tab==='misc')return toast('Miscellaneous season totals use full-game splits.');if(key==='tab'&&value==='misc'&&statsUI.split==='clutch')statsUI.split='all';return miscStatsChangeBefore(key,value)};
