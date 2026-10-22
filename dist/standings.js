/* Standings use regular-season game results; the first scheduled team is home. */
const SECONDARY_TEAM_KEYS=['ATL','NYE','LAS','CHI','MIA','MEM','SEA','NOB','BOS','BKN','PHI','TOR','CLE','DET','IND','MIL','CHA','ORL','WAS','DEN','MIN','POR','SLP','DAL','HOU','SAV','PHX','SAC','SFG','SDS',...FRANCHISE_PRESETS.map(p=>p.abbr)];
function secondaryTeamLogo(t){
 if(t.secondaryLogo&&validTeamLogo(t.secondaryLogo))return `<img class="secondary-team-logo" src="${t.secondaryLogo}" alt="" width="36" height="36" loading="lazy">`;
 const key=SECONDARY_TEAM_KEYS[t.secondaryLogoIndex??defaultSecondaryLogoIndex(t)];
 return '<img class="secondary-team-logo" src="secondary-logos/'+key+'.png" alt="" width="36" height="36" loading="lazy">';
}
function standingsGames(t){return state.history.filter(g=>g.stage==='Regular season'&&(g.a===t.id||g.b===t.id)).sort((a,b)=>b.day-a.day)}
function standingDetails(t,games=standingsGames(t)){
 const total=t.w+t.l,complete=games.length===total;
 const record=rows=>rows.filter(g=>g.winner===t.id).length+'–'+rows.filter(g=>g.winner!==t.id).length;
 const own=g=>g.a===t.id?g.sa:g.sb,opp=g=>g.a===t.id?g.sb:g.sa;
 const opponent=g=>state.teams[g.a===t.id?g.b:g.a];
 let streak='—';if(complete&&games.length){const won=games[0].winner===t.id;let count=0;for(const g of games){if((g.winner===t.id)!==won)break;count++}streak=(won?'W':'L')+count}
 const average=fn=>complete&&games.length?(games.reduce((s,g)=>s+fn(g),0)/games.length).toFixed(1):'—';
 const mov=complete&&games.length?games.reduce((s,g)=>s+own(g)-opp(g),0)/games.length:null;
 return {record:t.w+'–'+t.l,pct:total?(t.w/total).toFixed(3).replace(/^0/,''):'.000',ppg:average(own),oppg:average(opp),
 conf:complete?record(games.filter(g=>opponent(g).conference===t.conference)):'—',
 home:complete?record(games.filter(g=>g.a===t.id)):'—',road:complete?record(games.filter(g=>g.b===t.id)):'—',
 division:complete?record(games.filter(g=>opponent(g).divisionId===t.divisionId)):'—',
 mov:mov===null?'—':(mov>0?'+':'')+mov.toFixed(1),streak,l10:complete?record(games.slice(0,10)):'—',complete};
}
const STANDINGS_COLUMNS=[['record','Record','Wins–losses'],['pct','Win%','Winning percentage'],['gb','GB','Games behind the group leader'],['ppg','PPG','Points per game'],['oppg','OPPG','Opponent points per game'],['conf','Conf','Conference record'],['home','Home','Home record'],['road','Road','Road record'],['division','Division','Division record'],['mov','MOV','Average margin of victory: points minus opponent points'],['streak','Streak','Current winning or losing streak'],['l10','L10','Record over the last 10 games, or all games if fewer than 10 played']];
const standingsBeforeExpansion=standings;
function standingsGroup(teams,label){
 const rows=rankStandings(teams),leader=rows[0];
 const details=rows.map(t=>{const d=standingDetails(t),gb=(leader.w-t.w+t.l-leader.l)/2;return {...d,gb:gb===0?'—':Number.isInteger(gb)?String(gb):gb.toFixed(1)}});
 return '<section class="panel expanded-standings"><div class="panelhead"><h2>'+escapeHTML(label)+'</h2><span class="eyebrow">'+state.year+'</span></div><div class="standings-scroll" tabindex="0" role="region" aria-label="'+escapeHTML(label)+'. Scroll horizontally for every statistic."><table><thead><tr><th scope="col">#</th><th scope="col">Team</th>'+STANDINGS_COLUMNS.map(([,label,title])=>'<th scope="col"><abbr title="'+title+'">'+label+'</abbr></th>').join('')+'</tr></thead><tbody>'+rows.map((t,i)=>'<tr class="'+(t.id===controlledTeamId()?'me':'')+'"><td>'+(i+1)+'</td><th scope="row"><button class="standings-team" onclick="rosterTeamId='+t.id+';go(\'Roster\')">'+secondaryTeamLogo(t)+'<span>'+escapeHTML(t.city+' '+t.name)+(t.id===controlledTeamId()?' <small class="orange">YOU</small>':'')+'</span></button></th>'+STANDINGS_COLUMNS.map(([key])=>'<td>'+details[i][key]+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><div class="note">Regular season only · Playoff qualification follows League settings · Conf and Division show wins–losses · MOV = average scoring margin · Swipe sideways for all columns.'+(details.some(d=>!d.complete)?'<br>Some older saves have incomplete game history. Unavailable splits and averages show —.':'')+'</div></section>';
};

let standingsGrouping='conference';
function setStandingsGrouping(mode){if(!['conference','division'].includes(mode))return;standingsGrouping=mode;render()}
function standingsGroups(){
 const groups=new Map();for(const t of state.teams){const key=standingsGrouping==='conference'?t.conference:JSON.stringify([t.conference,t.divisionId||t.division]);if(!groups.has(key))groups.set(key,{label:standingsGrouping==='conference'?t.conference+' Conference':t.division+' Division · '+t.conference,teams:[]});groups.get(key).teams.push(t)}return [...groups.values()];
}
standings=function(compact=false){
 if(compact)return standingsBeforeExpansion(true);
 return '<div class="standings-view-toggle" role="group" aria-label="Group standings by">'+['conference','division'].map(mode=>'<button aria-pressed="'+(standingsGrouping===mode)+'" class="'+(standingsGrouping===mode?'primary':'')+'" onclick="setStandingsGrouping(\''+mode+'\')">'+(mode==='conference'?'Conference':'Division')+'</button>').join('')+'</div>'+standingsGroups().map(g=>standingsGroup(g.teams,g.label)).join('');
};
