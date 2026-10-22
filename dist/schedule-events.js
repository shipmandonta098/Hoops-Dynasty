const WATCH_SPEEDS=[0.25,0.5,0.75,1,2,4,8];
/* Milestones are calendar-based; exhibitions never call the regular game engine. */
function seasonMilestones(){const base=state.schedule.length===182?116:110,weekday=new Date(Date.UTC(state.year,9,28+base)).getUTCDay(),breakIndex=base+(5-weekday+7)%7,protectedBreak=state.scheduleFormat==='nba82'&&[174,182].includes(state.schedule.length)&&state.schedule.slice(breakIndex,breakIndex+3).every(r=>!r.length),deadline=protectedBreak?breakIndex:Math.max(1,Math.floor(seasonLength()*.65));const custom=leagueRules().allStarSchedule==='custom',end=custom?Math.max(1,Math.round(seasonLength()*leagueRules().allStarPercent/100)):Math.min(seasonLength(),deadline+3),start=custom?Math.max(1,end-2):Math.min(end,deadline+1);return {deadline,start,end,protectedBreak:!custom&&protectedBreak}}
function tradeDeadlinePassed(){return state.champion===null&&state.day>=seasonMilestones().deadline}
function tradeDeadlineBanner(){const m=seasonMilestones();return `<div class="schedule-milestone"><strong>Trade deadline · ${scheduleDateLabel(m.deadline)}</strong><p>${tradeDeadlinePassed()?'Trading is closed until the championship is complete.':'Submit trades before advancing past day '+m.deadline+'.'}</p></div>`}
function allStarTeams(top,random){
 const r=leagueRules(),count=Math.min(r.allStarPlayers,Math.floor(top.length/2)),conferences=[...new Set(state.teams.map(t=>t.conference))];
 if(r.allStarAssignment==='conference'&&conferences.length===2){const units=conferences.map(c=>top.filter(x=>x.t.conference===c));if(units.every(u=>u.length>=count))return {left:units[0].slice(0,count),right:units[1].slice(0,count),names:conferences,mode:'By conference'};}
 const pool=top.slice(0,count*2);
 if(r.allStarAssignment==='draft'){const left=[pool[0]],right=[pool[1]];for(let i=2;i<pool.length;i++)(((i-2)%4===0||(i-2)%4===3)?right:left).push(pool[i]);return {left,right,names:['Team '+pool[0].p.name,'Team '+pool[1].p.name],mode:'Captains draft · Automatic snake selections'};}
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return {left:pool.slice(0,count),right:pool.slice(count),names:['Team Gold','Team Orange'],mode:r.allStarAssignment==='conference'?'Mixed · Conference field unavailable':'Mixed'};
}
function allStarReport(){
 const r=leagueRules();if(!r.allStarEnabled)return [];
 const random=scheduleRandom(state.year*1741+39),players=state.teams.flatMap(t=>t.roster.map(p=>({p,t}))),top=[...players].sort((a,b)=>b.p.ovr-a.p.ovr||a.p.id-b.p.id),label=x=>x.p.name+' ('+x.t.abbr+')',report=[];
 if(top.length<2)return ['Not enough players for the All-Star showcases.'];
 const list=(title,rows)=>{for(let i=0;i<rows.length;i+=5)report.push(title+(i?' (continued)':'')+': '+rows.slice(i,i+5).map(label).join(', ')+'.')};
 if(r.threeContestEnabled){const entrants=[...players].sort((a,b)=>b.p.attributes.tp-a.p.attributes.tp||a.p.id-b.p.id).slice(0,r.threeParticipants),scores=entrants.map(x=>({...x,score:Array.from({length:27},()=>random()<(.2+x.p.attributes.tp*.006)?1:0).reduce((a,b)=>a+b,0),tie:random()})).sort((a,b)=>b.score-a.score||b.tie-a.tie),winner=scores[0];report.push('Three-point contest: '+label(winner)+' wins with '+winner.score+'/27 makes ('+entrants.length+' participants; tied scores use a shoot-off).');list('Three-point field',entrants);}
 if(r.dunkEnabled){const rating=x=>(x.p.attributes.dnk??x.p.attributes.lay)*.6+x.p.attributes.jmp*.4,entrants=[...players].sort((a,b)=>rating(b)-rating(a)||a.p.id-b.p.id).slice(0,r.dunkParticipants),scores=entrants.map(x=>({...x,score:Math.round(Math.min(100,50+rating(x)*.4+random()*15)),tie:random()})).sort((a,b)=>b.score-a.score||b.tie-a.tie),winner=scores[0];report.push('Dunk contest: '+label(winner)+' wins with '+winner.score+'/100 ('+entrants.length+' participants; ties use an extra dunk).');list('Dunk field',entrants);}
 const skills=[...players].sort((a,b)=>(b.p.attributes.pss+b.p.attributes.drb)-(a.p.attributes.pss+a.p.attributes.drb)).slice(0,8).map(x=>({...x,time:Math.round((75-(x.p.attributes.pss+x.p.attributes.drb)*.14+random()*12)*10)/10})).sort((a,b)=>a.time-b.time)[0];
 const {left,right,names,mode}=allStarTeams(top,random),points=unit=>Math.round(90+unit.reduce((n,x)=>n+x.p.ovr,0)/unit.length*.4+random()*25);let a=points(left),b=points(right);if(a===b)b++;const winners=a>b?left:right,mvp=winners[Math.floor(random()*Math.min(5,winners.length))];
 report.push('Skills challenge: '+label(skills)+' wins in '+skills.time.toFixed(1)+' seconds.','All-Star Game: '+names[0]+' '+a+' — '+names[1]+' '+b+'. Exhibition only.','Showcase MVP: '+label(mvp)+'.',mode+' · '+left.length+' players per team.');list(names[0]+' roster',left);list(names[1]+' roster',right);return report;
}
function seasonMilestoneDay(){const m=seasonMilestones();if(state.day===m.deadline)say('TRADE DEADLINE: Trading is closed until the championship is complete.');if(leagueRules().allStarEnabled&&state.day===m.start)say('ALL-STAR WEEKEND: The league celebrates its stars. Exhibition results do not affect standings.');if(leagueRules().allStarEnabled&&state.day===m.end&&!state.allStarReport?.length){state.allStarReport=allStarReport();state.allStarReport.filter(s=>/^(Three-point contest:|Dunk contest:|Skills challenge:|All-Star Game:|Showcase MVP:)/.test(s)).forEach(say)}}
function showAllStarWeekend(){if(!leagueRules().allStarEnabled)return titleModal('All-Star Weekend','<p>All-Star showcases are disabled for this season. Existing calendar rest days are retained.</p>');const m=seasonMilestones(),finished=state.day>=m.end,report=state.allStarReport||[];titleModal('All-Star Weekend',`<p>${scheduleDateLabel(m.start)}–${scheduleDateLabel(m.end)} · ${state.year}–${state.year+1}</p><p>${[leagueRules().dunkEnabled?'Dunk contest':null,leagueRules().threeContestEnabled?'Three-point contest':null,'Skills challenge','All-Star Game'].filter(Boolean).join(', ')}. Selection favors the league’s top ratings. These ceremonial events do not change player statistics, injuries, or standings.</p>${report.length?report.map(s=>`<p>${escapeHTML(s)}</p>`).join(''):finished?'<p>No showcase results were recorded for this older season.</p>':'<p>Results will appear after the final day of the weekend.</p>'}<button onclick="closeTitleModal()">Close</button>`)}
function seasonCalendarBanner(){const m=seasonMilestones();return `<div class="schedule-milestones"><div><span>TRADE DEADLINE</span><strong>${scheduleDateLabel(m.deadline)}</strong><small>${tradeDeadlinePassed()?'Trades locked':state.champion!==null?'Offseason trading open':'Before advancing past day '+m.deadline}</small></div><div><span>ALL-STAR WEEKEND</span><strong>${scheduleDateLabel(m.start)}–${scheduleDateLabel(m.end)}</strong><small>${!leagueRules().allStarEnabled?'Showcases disabled · Rest days retained':m.protectedBreak?'League-wide break · No regular-season games':'Ceremonial events · Existing game dates preserved'}</small><button onclick="showAllStarWeekend()">${state.allStarReport?.length?'View results':'Voting & weekend'}</button></div></div>`}
function scheduleRowsWithEvents(rows,nextDay){const m=seasonMilestones(),events=scheduleVisibleRows([{day:m.deadline,event:'Trade deadline'},...allStarEventPlan().map(e=>({day:e.day,event:e.title,allStarKey:e.key})),...(leagueRules().allStarEnabled&&m.protectedBreak?[{day:m.breakStart,event:'All-Star break begins'},{day:m.breakEnd,event:'All-Star break ends'}]:[])]);let lastDay=null;return [...rows,...events].sort((a,b)=>a.day-b.day||(a.event?-1:b.event?1:0)).map(row=>{if(row.event)return `<div class="schedule-milestone${row.allStarKey?' schedule-all-star-event':''}"><div><strong>${scheduleWeekdayDateLabel(row.day)} · ${row.event}</strong><small>${row.day===m.deadline?'Last chance to trade before advancing this day.':'Ceremonial · Does not affect standings'}</small></div>${row.allStarKey?allStarEventActions(row.allStarKey):''}</div>`;let heading='';if(row.league&&lastDay!==row.day){lastDay=row.day;heading=`<div class="schedule-day-heading"><strong>${scheduleDate(row.day).toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric',timeZone:'UTC'})}</strong><span>${state.schedule[row.day-1].length} games</span></div>`}return heading+scheduleGameRow(row,nextDay)}).join('')}

function leagueScheduleRows(){const results=new Map(state.history.map((g,index)=>[g.day+':'+g.a+':'+g.b,{result:g,resultIndex:index}]));return state.schedule.flatMap((round,i)=>round.map(pair=>({day:i+1,pair,league:true,...results.get((i+1)+':'+pair.join(':'))})))}
function watchGameButton(day,pair,result){if(result)return `<button onclick="viewScheduledResults(${day},${pair[0]},${pair[1]})">View results</button>`;return day>state.day?`<button class="primary" onclick="openWatchGame(${day},${pair[0]},${pair[1]})">Watch live</button>`:''}
function viewScheduledResults(day,a,b){const index=state.history.findIndex(g=>g.day===day&&g.a===a&&g.b===b&&g.stage==='Regular season');if(index<0)return toast('This result is unavailable.');clearTimeout(liveWatchTimer);showResult(index)}
function leagueScheduleGameRow(row){const [a,b]=row.pair.map(id=>state.teams[id]),r=row.result,top=r?.box.slice().sort((a,b)=>b.pts-a.pts)[0];return `<article class="league-schedule-game"><div><strong>${scheduleDateLabel(row.day)}</strong><small>${scheduleWeekday(row.day)} · Day ${row.day}</small></div><div class="league-matchup"><div>${teamLogo(a)}<strong>${escapeHTML(a.city+' '+a.name)}</strong><small>HOME</small></div><div>${teamLogo(b)}<strong>${escapeHTML(b.city+' '+b.name)}</strong><small>AWAY</small></div></div><div>${r?`<button class="namebutton" onclick="showResult(${row.resultIndex})">${r.sa}–${r.sb} · Final ↗</button><small>${escapeHTML(top?.name||'')} · ${top?.pts||0} PTS</small>`:'<span class="muted">Scheduled</span>'}</div><div class="schedule-watch-actions">${scheduleSpread(row.pair[0],row.pair[1],r)}${scheduleMatchupButton(row.day,row.pair)}${watchGameButton(row.day,row.pair,r)}${scheduleInjuryField(row.day,row.pair,r)}${!r&&row.day>state.day?`<button onclick="scheduleSimulateThrough(${row.day})">Sim to game</button>`:''}</div></article>`}
let watchCapture=null,liveWatch=null,liveWatchTimer=null;
function watchDialog(){let dialog=document.getElementById('game-watch');if(!dialog){dialog=document.createElement('dialog');dialog.id='game-watch';dialog.className='game-watch';dialog.setAttribute('aria-labelledby','game-watch-title');dialog.addEventListener('close',()=>{clearTimeout(liveWatchTimer);liveWatch=null});document.body.appendChild(dialog)}return dialog}
function openWatchGame(day,a,b){if(!state.schedule[day-1]?.some(p=>p[0]===a&&p[1]===b))return;clearTimeout(liveWatchTimer);const result=state.history.find(g=>g.day===day&&g.a===a&&g.b===b&&g.stage==='Regular season'),dialog=watchDialog();if(result){liveWatch={result,index:0,paused:true,speed:leagueRules().playbackSpeed};renderWatchGame()}else{if(day<=state.day||!ownerCanManage())return toast('This game is unavailable.');dialog.innerHTML=`<div class="watch-header"><h2 id="game-watch-title">Watch live</h2><button onclick="document.getElementById('game-watch').close()" aria-label="Close live game">✕</button></div><h3>${escapeHTML(state.teams[b].city)} at ${escapeHTML(state.teams[a].city)}</h3><p>${scheduleDateLabel(day,true)}</p><p>This advances the entire league through this date and saves the results, then plays the game’s possession feed. Closing the viewer will not undo the game.</p><button class="primary" onclick="startWatchGame(${day},${a},${b})">Tip off · Advance to game</button>`}if(!dialog.open)dialog.showModal()}
async function startWatchGame(day,a,b){if(simulationBusy||day<=state.day||!ownerCanManage())return;const dialog=watchDialog();dialog.innerHTML='<p>Simulating to tip-off…</p>';watchCapture={day,a,b};const original=showResult;try{showResult=()=>{};await sim(day-state.day)}finally{showResult=original;watchCapture=null}const result=state.history.find(g=>g.day===day&&g.a===a&&g.b===b&&g.stage==='Regular season');if(!result){dialog.close();return toast('The league stopped before this game.')}liveWatch={result,index:0,paused:false,speed:leagueRules().playbackSpeed};renderWatchGame();scheduleWatchTick()}
function watchFrame(game,index){if(index<=0)return {a:0,b:0,text:'Tip-off'};const event=game.playByPlay[index-1]||'',match=event.match(/^\[(\d+)–(\d+)\] (.*)$/);if(match)return {a:Number(match[1]),b:Number(match[2]),text:match[3]};return {a:index>=game.playByPlay.length?game.sa:'—',b:index>=game.playByPlay.length?game.sb:'—',text:event}}
function watchClock(game,index){if(index<=0)return {period:'Q1',time:(game.gameRules?.periodMinutes||12)+':00'};if(index>=game.playByPlay.length)return {period:'FINAL',time:'0:00'};const m=(game.playByPlay[index-1]||'').match(/\] (Q\d+|OT\d+) (\d+:\d{2})/);return m?{period:m[1],time:m[2]}:{period:'—',time:'—'};}
function watchActionTeam(game,event){
 const parts=event.replace(/^\[\d+–\d+\] /,'').split(' · ');if(parts.length<3)return null;
 const text=parts.slice(2).join(' · ');if(/^(Start of |End of )/.test(text))return null;
 const clubs=[state.teams[game.a],state.teams[game.b]],action=text.replace(/^(MADE|MISS|MISSED|BLOCKED): /,'');
 const actors=game.box.filter(p=>{const names=p.name.split(/\s+/),short=names[0][0]+'. '+names.slice(1).join(' ');return action.startsWith(p.name+' ')||action.startsWith(short+' ')});
 const actorTeams=[...new Set(actors.map(p=>p.team))];if(actorTeams.length===1){const club=clubs.find(t=>t.abbr===actorTeams[0]);if(club)return club;}
 return clubs.find(t=>t.abbr===parts[1])||null;
}
function watchHiddenDiagnostic(event){
 if(typeof event!=='string')return false;
 return (event.includes(' · Home court: ')&&event.includes('Road pressure:'))||
  /: second night of a back-to-back after .* minutes; (?:physical |stamina consumption )/.test(event)||
  /: fully recovered after (?:two rest days|\d+ days off)[ ·;]/.test(event)||
  event.includes(': below 70 energy; load management targets 18 minutes, subject to healthy lineup availability.');
}
function watchActionMarkup(game,event,text){if(watchHiddenDiagnostic(event))return ''; const club=watchActionTeam(game,event||'');return `<span class="watch-action">${club?`<span class="watch-action-logo" title="${escapeHTML(club.city+' '+club.name)}">${secondaryTeamLogo(club)}</span>`:''}<span class="watch-action-text">${escapeHTML(text)}</span></span>`;}
function setWatchView(view){if(!liveWatch||!['play','box','summary'].includes(view))return;liveWatch.view=view;renderWatchGame()}
function renderWatchGame(){if(!liveWatch)return;const {result:g,index,paused,speed}=liveWatch,frame=watchFrame(g,index),clock=watchClock(g,index),finished=index>=g.playByPlay.length,view=liveWatch.view||(finished?'box':'play'),a=state.teams[g.a],b=state.teams[g.b];const scrollPositions=[...watchDialog().querySelectorAll('.watch-box-panel,.watch-summary-panel,.watch-table-scroll,.summary-table-scroll,.summary-event-list')].map(el=>[el.scrollTop,el.scrollLeft]);const focus=document.activeElement,action=focus?.getAttribute?.('onclick'),speedFocused=focus?.getAttribute?.('aria-label')==='Playback speed',atmosphereFocused=focus?.id==='watch-atmosphere-toggle';updateWatchShell(watchDialog(),`<div class="watch-header"><div><div class="eyebrow">${scheduleDateLabel(g.day)} · SIMULATED GAME FEED</div><h2 id="game-watch-title">${finished?'Final buzzer':'Courtside'}</h2></div><button onclick="document.getElementById('game-watch').close()" aria-label="Close live game">✕</button></div><div class="watch-scoreboard"><div>${teamLogo(a)}<strong>${escapeHTML(a.city+' '+a.name)}</strong><small>HOME</small></div><div class="watch-score-center"><div class="watch-game-clock" role="timer" aria-label="Game clock"><span>${clock.period}</span><strong>${clock.time}</strong></div><b>${frame.a} : ${frame.b}</b></div><div>${teamLogo(b)}<strong>${escapeHTML(b.city+' '+b.name)}</strong><small>AWAY</small></div></div>${displayAttendanceUI(g.gameAtmosphere)}${g.gameAtmosphere?`<details class="watch-atmosphere"><summary id="watch-atmosphere-toggle">Game Atmosphere</summary>${displayAttendanceUI(g.gameAtmosphere,'side')}${finished?displayAttendanceUI(g.gameAtmosphere,'summary'):''}</details>`:''}<p class="watch-current" aria-live="polite">${watchActionMarkup(g,g.playByPlay[index-1],frame.text)}</p><progress value="${index}" max="${g.playByPlay.length||1}" aria-label="Game playback progress"></progress><div class="watch-controls"><button onclick="toggleWatchPause()" ${finished?'disabled':''}>${paused?'Play':'Pause'}</button><button onclick="stepWatchGame()" ${finished?'disabled':''}>Next play</button><label>Speed <select aria-label="Playback speed" onchange="setWatchSpeed(this.value)">${WATCH_SPEEDS.map(n=>`<option ${n===speed?'selected':''} value="${n}">${n}×</option>`).join('')}</select></label><button onclick="finishWatchGame()" ${finished?'disabled':''}>Skip to final</button></div><nav class="watch-view-toggle" aria-label="Game simulation view"><button class="${view==='play'?'primary':''}" aria-pressed="${view==='play'}" aria-controls="watch-play-panel" onclick="setWatchView('play')">Play-by-Play</button><button class="${view==='box'?'primary':''}" aria-pressed="${view==='box'}" aria-controls="watch-box-panel" onclick="setWatchView('box')">Box Score</button><button class="${view==='summary'?'primary':''}" aria-pressed="${view==='summary'}" aria-controls="watch-summary-panel" onclick="setWatchView('summary')">Game Summary</button></nav><div class="watch-live-layout watch-single-view"><section id="watch-box-panel" class="watch-box-panel" ${view==='box'?'':'hidden'}><h2>${finished?'Final box score':'Live box score'}</h2>${altitudePanel(g.altitude)}${gameBoxTables(g,watchBoxRows(g,index))}</section><section id="watch-summary-panel" class="watch-summary-panel" ${view==='summary'?'':'hidden'}>${view==='summary'?gameSummaryMarkup(g,index):''}</section><ol id="watch-play-panel" aria-label="Play-by-play" class="watch-feed" ${view==='play'?'':'hidden'}></ol></div><small class="muted">Playback controls do not change the saved result.</small>`);[...watchDialog().querySelectorAll('.watch-box-panel,.watch-summary-panel,.watch-table-scroll,.summary-table-scroll,.summary-event-list')].forEach((el,i)=>{el.scrollTop=scrollPositions[i]?.[0]||0;el.scrollLeft=scrollPositions[i]?.[1]||0});if(action||speedFocused){const restore=[...watchDialog().querySelectorAll('button,select')].find(el=>action?el.getAttribute('onclick')===action:el.getAttribute('aria-label')==='Playback speed');restore?.focus({preventScroll:true})}if(atmosphereFocused)document.getElementById('watch-atmosphere-toggle')?.focus({preventScroll:true})}
function scheduleWatchTick(){clearTimeout(liveWatchTimer);if(!liveWatch||liveWatch.paused||liveWatch.index>=liveWatch.result.playByPlay.length)return;liveWatchTimer=setTimeout(()=>{if(!liveWatch)return;liveWatch.index++;renderWatchGame();scheduleWatchTick()},800/liveWatch.speed)}
function toggleWatchPause(){if(!liveWatch)return;liveWatch.paused=!liveWatch.paused;renderWatchGame();scheduleWatchTick()}
function setWatchSpeed(value){if(!liveWatch||!WATCH_SPEEDS.includes(Number(value)))return;liveWatch.speed=Number(value);scheduleWatchTick()}
function stepWatchGame(){if(!liveWatch)return;liveWatch.paused=true;clearTimeout(liveWatchTimer);liveWatch.index=Math.min(liveWatch.index+1,liveWatch.result.playByPlay.length);renderWatchGame()}
function finishWatchGame(){if(!liveWatch)return;clearTimeout(liveWatchTimer);liveWatch.index=liveWatch.result.playByPlay.length;liveWatch.paused=true;renderWatchGame()}
function watchBoxScore(){if(!liveWatch)return;const index=state.history.indexOf(liveWatch.result);watchDialog().close();if(index>=0)showResult(index)}

// Sparse absolute stat updates, aligned one-to-one with the commentary events.
const LIVE_BOX_KEYS=['mp','pts','reb','ast','stl','blk','tov','pf','fgm','fga','tpm','tpa','ftm','fta','onCourt','plusMinus','stamina','orb'];
function readBoxTimeline(h,bad){
 if(h.boxTimeline===undefined)return undefined;
 if(!Array.isArray(h.boxTimeline)||h.boxTimeline.length!==(h.playByPlay||[]).length)bad('invalid live box score.');
 return h.boxTimeline.map(frame=>{
  if(!Array.isArray(frame)||frame.length%3||frame.length>h.box.length*LIVE_BOX_KEYS.length*3)bad('invalid live stat frame.');
  for(let i=0;i<frame.length;i+=3){const [row,key,value]=frame.slice(i,i+3);if(!Number.isInteger(row)||row<0||row>=h.box.length||!Number.isInteger(key)||key<0||key>=LIVE_BOX_KEYS.length||!Number.isFinite(value)||value<(LIVE_BOX_KEYS[key]==='plusMinus'?-500:0)||value>(key===0?200:500)||(key!==0&&!Number.isInteger(value)))bad('invalid live stat update.');}
  return [...frame];
 });
}
function watchBoxRows(game,index){
 if(index>=game.playByPlay.length)return game.box;
 if(!game.boxTimeline)return null;
 const rows=game.box.map(p=>({...p,...Object.fromEntries(LIVE_BOX_KEYS.map(k=>[k,['plusMinus','stamina'].includes(k)&&!Number.isFinite(p[k])?undefined:0]))}));
 for(const frame of game.boxTimeline.slice(0,index))for(let j=0;j<frame.length;j+=3)rows[frame[j]][LIVE_BOX_KEYS[frame[j+1]]]=frame[j+2];
 if(index===0){for(const row of rows){row.onCourt=row.gs===1?1:0;row.stamina=undefined}const first=game.boxTimeline[0]||[],key=LIVE_BOX_KEYS.indexOf('stamina');for(let j=0;j<first.length;j+=3)if(first[j+1]===key)rows[first[j]].stamina=first[j+2];}
 if(!game.summaryData)for(const row of rows)row.orb=undefined;return rows;
}
function gameBoxShootingPercent(made,attempted){
 return Number.isFinite(made)&&Number.isFinite(attempted)&&attempted>0?(100*made/attempted).toFixed(1)+'%':'—';
}
function gameBoxStatHeaders(){return ['MIN','PTS','REB','AST','STL','BLK','TO','PF','FG','FG%','3PT','3P%','FT','FT%','+/−','STA%'].map(k=>'<th scope="col"'+(k==='+/−'?' title="Team point differential while this player is on court"':k==='STA%'?' title="Remaining in-game stamina; — means unavailable"':'')+'>'+k+'</th>').join('')}
function gameBoxStatCells(p){
 const stat=(p,k)=>Number.isFinite(p[k])?(k==='mp'?p[k].toFixed(1):k==='plusMinus'&&p[k]>0?'+'+p[k]:p[k]):'—';
 return '<td>'+stat(p,'mp')+'</td><td><strong>'+stat(p,'pts')+'</strong></td>'+['reb','ast','stl','blk','tov','pf'].map(k=>'<td>'+stat(p,k)+'</td>').join('')+[['fgm','fga'],['tpm','tpa'],['ftm','fta']].map(([m,a])=>'<td>'+stat(p,m)+'–'+stat(p,a)+'</td><td>'+gameBoxShootingPercent(p[m],p[a])+'</td>').join('')+'<td>'+stat(p,'plusMinus')+'</td><td>'+ (Number.isFinite(p.stamina)?Math.round(p.stamina)+'%':'—')+'</td>';
}
function gameBoxTables(game,rows,showRecord=false){
 if(!rows)return '<p class="muted">Live stats were not recorded for this older game. The final box score appears at the final buzzer.</p>';

 const pos=boxPositionMap(),live=typeof liveWatch!=='undefined'&&liveWatch?.result===game&&liveWatch.index<(game.playByPlay||[]).length,dnp=live?new Map():boxDNPReasons(game);
 return [game.a,game.b].map(id=>{const team=state.teams[id],players=rows.filter(p=>p.team===team.abbr),total=gameBoxTeamTotals(game,rows,team,rows===game.box?Infinity:(typeof liveWatch!=='undefined'&&liveWatch?.result===game?liveWatch.index:Infinity));return '<section class="watch-team-box"><h3>'+teamLogo(team)+'<span>'+escapeHTML(team.city+' '+team.name)+(showRecord?'<small class="result-record">'+resultTeamRecord(game,id)+'</small>':'')+'</span></h3><div class="watch-table-scroll" tabindex="0" role="region" aria-label="'+escapeHTML(team.abbr)+' box score"><table><thead><tr><th scope="col">Player</th>'+gameBoxStatHeaders()+'</tr></thead><tbody>'+boxCourtGroups(game,players).map(([label,list])=>'<tr class="watch-lineup-heading"><th colspan="17" scope="colgroup">'+label+' <span>'+list.length+'</span></th></tr>'+list.map(p=>{const name='<th scope="row">'+escapeHTML(p.name)+(pos.get(p.playerId)?' <span class="box-pos">'+pos.get(p.playerId)+'</span>':'')+'</th>',reason=dnp.get(p);return reason?'<tr class="box-dnp">'+name+'<td colspan="16">'+escapeHTML(reason)+'</td></tr>':'<tr>'+name+gameBoxStatCells(p)+'</tr>'}).join('')).join('')+'</tbody><tfoot><tr><th scope="row">Total</th>'+gameBoxStatCells(total)+'</tr></tfoot></table></div></section>'}).join('');
}

// Box rows store playerId, not position: look positions up from the current player pool.
// Retired players are no longer in the pool, so their old rows show the name only.
function boxPositionMap(){return new Map([...state.teams.flatMap(t=>t.roster),...state.free,...(state.draftRights||[]).map(r=>r.player)].map(p=>[p.id,p.pos]))}

function resultTeamRecord(game,teamId){
 const index=state.history.indexOf(game),regular=game.stage==='Regular season';
 if(index<0)return 'Record unavailable';
 const games=state.history.slice(index).filter(g=>(g.a===teamId||g.b===teamId)&&(regular?g.stage==='Regular season':g.stage!=='Regular season'));
 const wins=games.filter(g=>g.winner===teamId).length;
 return wins+'–'+(games.length-wins)+' · '+(regular?'Regular season':'Playoffs');
}

function boxCourtGroups(game,players){
 const tracked=game.box.some(p=>Number.isFinite(p.onCourt));
 const active=p=>tracked?p.onCourt===1:p.gs===1,sat=p=>!p.mp&&p.played!==true;
 // Players who never checked in are listed last on the bench.
 const bench=players.filter(p=>!active(p));return [[tracked?'On Court':'Starters',players.filter(active)],['Bench',[...bench.filter(p=>!sat(p)),...bench.filter(sat)]]];
}
// Final box scores label players who never entered. Injuries come from the game's own
// tip-off report, so old games keep the injury that applied that day. Games saved before
// injury reports existed show a plain DNP rather than a guessed reason.
function boxDNPReasons(game){
 const reasons=new Map(),rows=(game.box||[]).filter(p=>!p.mp&&p.played!==true);if(!rows.length)return reasons;
 const injured=new Map();
 for(const line of game.injuryReport||[]){const m=/^Unavailable at tip-off: (.+?) · (.+?) · (.+?) · /.exec(line);if(!m)continue;const injury=m[3].replace(/^(Minor|Moderate|Severe|Major)\s+/,'');injured.set(m[1]+'|'+m[2],injury==='Injury'?'':injury.replace(/\b\w/g,c=>c.toUpperCase()))}
 for(const p of rows){const team=state.teams.find(t=>t.abbr===p.team),named=[...injured.keys()].filter(k=>k.startsWith(p.name+'|')),key=named.find(k=>team&&k===p.name+'|'+team.city+' '+team.name)??(named.length===1?named[0]:undefined);
  reasons.set(p,key!==undefined?'DNP – Injured'+(injured.get(key)?' ('+injured.get(key)+')':''):game.injuryReport?'DNP – Coach’s Decision':'DNP')}
 return reasons;
}

// Keep the feed connected: shell refreshes must not discard rows or their animations.
function updateWatchShell(dialog,html){
 const template=document.createElement('template');template.innerHTML=html;
 const oldLayout=dialog.querySelector('.watch-live-layout'),oldFeed=dialog.querySelector('.watch-feed');
 if(!oldLayout||!oldFeed||oldFeed._game!==liveWatch.result){
  dialog.innerHTML=html;const feed=dialog.querySelector('.watch-feed');initializeWatchFeed(feed);updateWatchFeed(feed);return;
 }
 const oldAtmosphere=dialog.querySelector('.watch-atmosphere'),nextAtmosphere=template.content.querySelector('.watch-atmosphere');
 if(oldAtmosphere&&nextAtmosphere)nextAtmosphere.open=oldAtmosphere.open;
 const nextLayout=template.content.querySelector('.watch-live-layout'),nextFeed=nextLayout.querySelector('.watch-feed');
 oldFeed.hidden=nextFeed.hidden;
 oldLayout.querySelector('.watch-box-panel').replaceWith(nextLayout.querySelector('.watch-box-panel'));
 const oldSummary=oldLayout.querySelector('.watch-summary-panel'),nextSummary=nextLayout.querySelector('.watch-summary-panel');
 [...oldSummary.querySelectorAll('details')].forEach((d,i)=>{if(nextSummary.querySelectorAll('details')[i])nextSummary.querySelectorAll('details')[i].open=d.open});
 oldSummary.replaceWith(nextSummary);
 // Replace surrounding shell siblings without detaching the feed or its scroll container.
 while(oldLayout.previousSibling)oldLayout.previousSibling.remove();
 while(oldLayout.nextSibling)oldLayout.nextSibling.remove();
 while(template.content.firstChild!==nextLayout)dialog.insertBefore(template.content.firstChild,oldLayout);
 nextLayout.remove();dialog.append(template.content);
 updateWatchFeed(oldFeed);
}
function initializeWatchFeed(feed){
 feed._game=liveWatch.result;feed._count=0;feed._follow=true;feed._animations=[];feed._raf=0;feed._autoTop=0;
 feed.addEventListener('scroll',()=>{if(Math.abs(feed.scrollTop-feed._autoTop)>1)feed._follow=feed.scrollHeight-feed.clientHeight-feed.scrollTop<32},{passive:true});
 feed.addEventListener('wheel',e=>{if(e.deltaY<0)feed._follow=false},{passive:true});
 feed.addEventListener('touchstart',()=>{feed._follow=false},{passive:true});
 feed.addEventListener('keydown',e=>{if(['ArrowUp','PageUp','Home'].includes(e.key))feed._follow=false});
 feed.tabIndex=0;
}
function updateWatchFeed(feed){
 const end=liveWatch.index,begin=feed._count;if(end<=begin){if(!feed._raf)feed._raf=requestAnimationFrame(()=>animateWatchFeed(feed));return;}
 const animate=!feed.hidden&&end-begin<=4&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(let i=begin;i<end;i++){
  const event=liveWatch.result.playByPlay[i];if(watchHiddenDiagnostic(event))continue;const row=document.createElement('li');
  row.innerHTML=watchActionMarkup(liveWatch.result,event,event.replace(/^\[\d+–\d+\] /,''));feed.append(row);
  if(animate){const height=row.getBoundingClientRect().height;row.style.cssText='box-sizing:border-box;overflow:hidden;height:0;padding-top:0;padding-bottom:0;opacity:0';feed._animations.push({row,height,start:performance.now()});}
 }
 feed._count=end;
 if(!feed._raf)feed._raf=requestAnimationFrame(()=>animateWatchFeed(feed));
}
function animateWatchFeed(feed){
 feed._raf=0;if(!feed.isConnected||!liveWatch||feed._game!==liveWatch.result)return;
 const now=performance.now();feed._animations=feed._animations.filter(a=>{const t=Math.min(1,(now-a.start)/160),ease=1-Math.pow(1-t,3);a.row.style.height=a.height*ease+'px';a.row.style.paddingTop=4*ease+'px';a.row.style.paddingBottom=4*ease+'px';a.row.style.opacity=String(ease);if(t===1){a.row.removeAttribute('style');return false}return true});
 if(feed._follow&&!feed.hidden){feed.scrollTop=feed.scrollHeight;feed._autoTop=feed.scrollTop;}
 if(feed._animations.length)feed._raf=requestAnimationFrame(()=>animateWatchFeed(feed));
}

function gameBoxTeamTotals(game,rows,team,index=Infinity){const players=rows.filter(p=>p.team===team.abbr),keys=[...new Set([...LIVE_BOX_KEYS,'orb'])],total=Object.fromEntries(keys.map(k=>[k,players.length&&players.every(p=>Number.isFinite(p[k]))?players.reduce((n,p)=>n+p[k],0):null]));total.plusMinus=null;total.stamina=null;if(total.tov!==null)total.tov+=teamTurnoverCount(game,team.abbr,index);return total}
