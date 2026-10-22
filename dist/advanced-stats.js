const GAME_HIGH_CATEGORIES=[['pts','Points'],['reb','Rebounds'],['ast','Assists'],['stl','Steals'],['blk','Blocks'],['fgm','Field goals made'],['tpm','Three-pointers made'],['ftm','Free throws made'],['tov','Turnovers']];
function selectedProfileGames(p){return state.history.flatMap((h,index)=>h.box.filter(b=>b.playerId===p.id&&b.played!==false).map(b=>({...b,index,day:h.day,stage:h.stage,foulLimit:h.gameRules?.foulLimit,opponent:state.teams[h.a].abbr===b.team?state.teams[h.b].abbr:state.teams[h.a].abbr}))).filter(g=>profileCompetitionMatches(g.stage))}
function profileGameHigh(games,key){const valid=games.filter(g=>Number.isFinite(g[key]));if(!valid.length)return null;const high=Math.max(...valid.map(g=>g[key])),tied=valid.filter(g=>g[key]===high).sort((a,b)=>a.day-b.day||b.index-a.index);return {value:high,game:tied[0],ties:tied.length,coverage:valid.length}}
function advancedProfileValues(games){const sum=key=>games.reduce((s,g)=>s+g[key],0);const metric=(keys,fn)=>{const complete=games.length>0&&games.every(g=>keys.every(k=>Number.isFinite(g[k])));return complete?fn(sum):null};const divide=(n,d)=>d>0?n/d:null;return {ts:metric(['pts','fga','fta'],s=>divide(s('pts'),2*(s('fga')+.44*s('fta')))),efg:metric(['fgm','tpm','fga'],s=>divide(s('fgm')+.5*s('tpm'),s('fga'))),threeRate:metric(['tpa','fga'],s=>divide(s('tpa'),s('fga'))),ftRate:metric(['fta','fga'],s=>divide(s('fta'),s('fga'))),tovRate:metric(['tov','fga','fta'],s=>divide(s('tov'),s('fga')+.44*s('fta')+s('tov'))),astTov:metric(['ast','tov'],s=>divide(s('ast'),s('tov')))}}
function showProfileHighGame(index,id){if(!state.history[index])return;showResult(index);document.getElementById('profile').innerHTML+=`<button class="primary" style="margin-top:16px" onclick="profile(${id});changePlayerTab('Stats')">Back to player stats</button>`}
// Compact season-row tables use the same metadata and column order as player reference tables.
const PROFILE_TABLE_META=[['season','Season','Season'],['age','Age','Age'],['team','Team','Team'],['league','Lg','League'],['pos','Pos','Position']];
const ADVANCED_TABLE_COLUMNS=[
 ['gp','G','Games'],['mp','MP','Minutes played'],['per','PER','Player efficiency rating'],
 ['ts','TS%','True shooting percentage'],['threeRate','3PAr','Three-point attempt rate'],['ftRate','FTr','Free-throw attempt rate'],
 ['orbPct','ORB%','Offensive rebound percentage'],['drbPct','DRB%','Defensive rebound percentage'],['trbPct','TRB%','Total rebound percentage'],
 ['astPct','AST%','Assist percentage'],['stlPct','STL%','Steal percentage'],['blkPct','BLK%','Block percentage'],
 ['tovRate','TOV%','Turnover percentage'],['usgPct','USG%','Usage percentage'],
 ['ows','OWS','Offensive win shares'],['dws','DWS','Defensive win shares'],['ws','WS','Win shares'],['ws48','WS/48','Win shares per 48 minutes'],
 ['obpm','OBPM','Offensive box plus/minus'],['dbpm','DBPM','Defensive box plus/minus'],['bpm','BPM','Box plus/minus'],['vorp','VORP','Value over replacement player']
];
const HIGH_TABLE_COLUMNS=[
 ['mp','MP','Minutes played'],['fgm','FG','Field goals'],['fga','FGA','Field goal attempts'],
 ['tpm','3P','Three-pointers'],['tpa','3PA','Three-point attempts'],['twom','2P','Two-pointers'],['twoa','2PA','Two-point attempts'],
 ['ftm','FT','Free throws'],['fta','FTA','Free throw attempts'],['orb','ORB','Offensive rebounds'],['drb','DRB','Defensive rebounds'],
 ['reb','TRB','Total rebounds'],['ast','AST','Assists'],['stl','STL','Steals'],['blk','BLK','Blocks'],['tov','TOV','Turnovers'],['pf','PF','Personal fouls'],['pts','PTS','Points'],['gmsc','GmSc','Game score']
];
function referenceProfileRows({p,club},games){
 const teams=[...new Set(games.map(g=>g.team))];
 const leagueName=state.leagueName||'Dynasty Basketball League';
 const metadata={season:state.year+'–'+String(state.year+1).slice(-2),age:p.age,league:leagueName.split(/\s+/).map(w=>w[0]).join('').slice(0,6),pos:p.pos};
 const row=(team,entries)=>({...metadata,team,gp:entries.length,games:entries,...advancedProfileValues(entries)});
 return [row(teams.length>1?'TOT':teams[0]||club?.abbr||'FA',games),...(teams.length>1?teams.map(t=>row(t,games.filter(g=>g.team===t))):[])];
}
function profileHighGames(games){return games.map(g=>({...g,
 twom:Number.isFinite(g.fgm)&&Number.isFinite(g.tpm)?g.fgm-g.tpm:null,
 twoa:Number.isFinite(g.fga)&&Number.isFinite(g.tpa)?g.fga-g.tpa:null
}))}
function referenceAdvancedCell(row,key){
 const value=row[key];
 if(!Number.isFinite(value))return '<span class="stat-unavailable" title="Not available from recorded game data">—</span>';
 if(['ts','threeRate','ftRate'].includes(key))return value.toFixed(3).replace(/^0/,'');
 return key==='tovRate'?(value*100).toFixed(1):String(value);
}
function profileReferenceTable(ctx,rows,kind){
 const highs=kind==='highs',columns=[...PROFILE_TABLE_META,...(highs?HIGH_TABLE_COLUMNS:ADVANCED_TABLE_COLUMNS)];
 const title=highs?'Game Highs':'Advanced';
 const competition=profileStatsStage==='regular'?'Regular season':profileStatsStage==='playoffs'?'Playoffs':'All competitions';
 const body=rows.map((row,i)=>{
  const games=highs?profileHighGames(row.games):[];
  return '<tr class="'+(i===0?'stat-total':'stat-team-split')+'">'+columns.map(([key,label],j)=>{
   let value;
   if(PROFILE_TABLE_META.some(c=>c[0]===key))value=escapeHTML(String(row[key]));
   else if(!highs)value=referenceAdvancedCell(row,key);
   else {
    const high=profileGameHigh(games,key);
    const description=high?label+': '+high.value+' · Day '+high.game.day+' vs '+high.game.opponent+' · '+high.game.stage+' · '+high.ties+' tied game(s)':'Not recorded';
    value=high?'<button class="high-result" title="'+escapeHTML(description)+'" aria-label="'+escapeHTML(description)+'" onclick="showProfileHighGame('+high.game.index+','+ctx.p.id+')">'+high.value+'</button>':'<span class="stat-unavailable" title="Not recorded">—</span>';
   }
   return '<'+(j===0?'th scope="row"':'td')+'>'+value+'</'+(j===0?'th':'td')+'>';
  }).join('')+'</tr>';
 }).join('');
 return '<section class="reference-stats bref-table"><div class="reference-controls"><h3>'+title+'</h3><span>'+competition+'</span></div><div class="reference-scroll" tabindex="0" role="region" aria-label="'+title+' table, scroll horizontally for more columns"><table><caption>'+escapeHTML(ctx.p.name)+' · '+title+'</caption><thead><tr>'+columns.map(([,label,name])=>'<th scope="col"><abbr title="'+name+'">'+label+'</abbr></th>').join('')+'</tr></thead><tbody>'+body+'</tbody></table></div><p class="reference-note">'+(highs?'Each cell is a single-game season high. Select a value for its box score; ties open the earliest recorded game.':'Rates use summed totals from recorded games. — means the required tracking or calculation is not available.')+'</p></section>';
}
function advancedProfileSections(ctx){
 const games=selectedProfileGames(ctx.p),rows=referenceProfileRows(ctx,games);
 return profileReferenceTable(ctx,rows,'advanced')+profileReferenceTable(ctx,rows,'highs')+
 '<p class="reference-note">'+games.length+' recorded games in this view. Current season only; earlier-season history is not available. Competition filters apply to both tables.</p>';
}
playerStats=function(ctx){
 let content;
 if(profileStatsView==='misc')content=miscProfileTable(ctx);
 else if(profileStatsView==='traditional')content=referenceStatsTable(ctx)+statsBeforeTable(ctx);
 else if(profileStatsView==='per36')content=referenceStatsTable(ctx,true);
 else content=profileReferenceTable(ctx,referenceProfileRows(ctx,selectedProfileGames(ctx.p)),profileStatsView==='highs'?'highs':'advanced');
 return profileStatsControls()+content;
};
