/* Commissioner tools on the game's screens. While commissionerOn() is true each screen shows its tools with a gold
   Commissioner badge; when it is off nothing is added. Every control calls commissionerAction (commissioner.js), which
   confirms, applies the existing commissioner logic, logs the change and saves. Loads after every view it wraps. */
function commissionerBar(title,body){return `<section class="panel commissioner-inline"><div class="panelhead"><h2>${commissionerBadge()} ${title}</h2></div><div class="commissioner-inline-body">${body}</div></section>`}
function commissionerEditButton(id){return `<button type="button" class="commissioner-chip" onclick="commissionerOpenEditor(${id})">${commissionerBadge()} Edit player</button>`}
// Player profile and draft scouting report: an Edit player button under the name.
const commissionerProfileBefore=renderPlayerProfile;
renderPlayerProfile=function(...args){const result=commissionerProfileBefore(...args);if(commissionerOn()&&commissionerFindPlayer(activePlayerId))document.getElementById('profile')?.querySelector?.('.pp-header')?.insertAdjacentHTML?.('beforeend',`<div class="commissioner-profile">${commissionerEditButton(activePlayerId)}</div>`);return result};
const commissionerReportBefore=draftReport;
draftReport=function(id,...args){const result=commissionerReportBefore(id,...args);if(commissionerOn()&&commissionerFindPlayer(id))document.getElementById('profile')?.querySelector?.('.pp-header')?.insertAdjacentHTML?.('beforeend',`<div class="commissioner-profile">${commissionerEditButton(id)}</div>`);return result};
// Players list: an Edit player button next to each name.
const commissionerDirectoryBefore=playersDirectoryTable;
playersDirectoryTable=function(...args){const html=commissionerDirectoryBefore(...args);if(!commissionerOn())return html;
 return html.replace(/(<button class="namebutton" onclick="viewDirectoryPlayer\((\d+),'Overview'\)">[^<]*<\/button>)/g,(m,button,id)=>button+commissionerEditButton(Number(id)))};
// Roster and Team management: control, always win and AI roster moves for the team on screen.
const commissionerRosterBefore=roster;
roster=function(free=false,...args){const html=commissionerRosterBefore(free,...args);if(free||!commissionerOn())return html;const club=state.teams.find(t=>t.id===rosterTeamId)||team();return commissionerBar('Team tools · '+escapeHTML(club.city+' '+club.name),commissionerTeamTools(club))+html};
const commissionerManagementBefore=teamManagementView;
teamManagementView=function(...args){const html=commissionerManagementBefore(...args);if(!commissionerOn())return html;const club=state.teams[managedTeamId]||team();return commissionerBar('Team tools · '+escapeHTML(club.city+' '+club.name),commissionerTeamTools(club))+html};
// Schedule: header tools, and Force winner / Edit matchup on every game not yet played.
function commissionerRowIndex(day,pair){const round=state.schedule[day]||[],i=round.indexOf(pair);return i>=0?i:round.findIndex(p=>p[0]===pair[0]&&p[1]===pair[1])}
const commissionerScheduleRowBefore=scheduleGameRow;
scheduleGameRow=function(row,...args){const html=commissionerScheduleRowBefore(row,...args);if(!commissionerOn()||!row?.pair||row.result||row.day<=state.day)return html;const day=row.day-1,index=commissionerRowIndex(day,row.pair);return index<0?html:html+commissionerGameTools(day,index)};
const commissionerScheduleViewBefore=scheduleView;
scheduleView=function(...args){const html=commissionerScheduleViewBefore(...args);if(!commissionerOn()||scheduleSettings().competition==='playoffs')return html;return commissionerBar('Schedule tools',commissionerScheduleTools())+html};
// Draft & lottery, award races, league history, trades and the GM inbox.
const commissionerDraftViewBefore=draftView;
draftView=function(...args){const html=commissionerDraftViewBefore(...args);return commissionerOn()?commissionerBar('Draft tools',commissionerDraftTools())+html:html};
const commissionerRacesBefore=awardRacesView;
awardRacesView=function(...args){const html=commissionerRacesBefore(...args);return commissionerOn()?commissionerBar('Award winners',commissionerAwardTools())+html:html};
const commissionerHistoryBefore=leagueHistoryView;
leagueHistoryView=function(...args){const html=commissionerHistoryBefore(...args);return commissionerOn()?commissionerBar('Award winners',commissionerAwardTools())+html:html};
const commissionerTradesBefore=trades;
trades=function(...args){const html=commissionerTradesBefore(...args);return commissionerOn()?commissionerBar('Trade tools',commissionerTradeTools(commissioner(),{force:true}))+html:html};
const commissionerInboxBefore=gmInboxView;
gmInboxView=function(...args){const html=commissionerInboxBefore(...args);return commissionerOn()?commissionerBar('Trade review',commissionerTradeTools(commissioner()))+html:html};
