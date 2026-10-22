/* One pregame snapshot per result. Dollars here; the finance ledger uses millions. */
const atmosphereClamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
function updateFanEnergy(fillRate){return atmosphereClamp(Math.round(fillRate*3),1,3)}
function updateRevenue(attendance,ticketPrice){return Math.round(attendance*ticketPrice*100)/100}
function calculateAttendance(teamPerformance,opponentQuality,fanSentiment,ticketPrice,capacity=18000,baseTicket=75){
 const ticketPriceEffect=atmosphereClamp((1-ticketPrice/baseTicket)*.3,-.6,.3);
 const attendance=Math.round(capacity*atmosphereClamp(.75+teamPerformance+opponentQuality+fanSentiment+ticketPriceEffect,0,1));
 const fillRate=attendance/capacity;
 return {attendance,capacity,fillRate,fanEnergy:updateFanEnergy(fillRate),ticketPrice,revenue:updateRevenue(attendance,ticketPrice),seasonAverageAttendance:attendance,factors:{teamPerformance,opponentQuality,fanSentiment,ticketPriceEffect}};
}
function atmosphereHomeHistory(id){return state.history.filter(g=>g.a===id&&g.gameAtmosphere).slice().reverse()}
function atmosphereForm(club){const recent=state.history.filter(g=>g.a===club.id||g.b===club.id).slice(0,10);let streak=0;for(const g of recent){if(g.winner!==club.id)break;streak++}return {recent,streak,rate:recent.length?recent.filter(g=>g.winner===club.id).length/recent.length:.5}}
function atmosphereSentiment(club){const form=atmosphereForm(club);return atmosphereClamp((club.id===controlledTeamId()?(state.decisions?.fanSentiment||0):0)+(form.rate-.5)*20,-20,20)}
function createGameAtmosphere(home,away,stage='Regular season',planOverride=null){
 const f=financeFor(home),plan=planOverride||ownerFor(home).plan,form=atmosphereForm(home),pct=home.w+home.l?home.w/(home.w+home.l):.5;
 const star=away?.roster.filter(p=>!injuryDays(p)).sort((a,b)=>b.ovr-a.ovr)[0],oppPct=away&&away.w+away.l?away.w/(away.w+away.l):.5;
 const performance=atmosphereClamp((pct-.5)*.2+form.streak*.015,-.1,.2);
 const quality=atmosphereClamp((oppPct-.5)*.1+Math.max(0,(star?.ovr||0)-80)*.01, -.05,.25);
 const atmosphere=calculateAttendance(performance,quality,atmosphereSentiment(home)*.005,stage==='Regular season'?plan.ticketPrice:f.prices.playoff,teamStadiumCapacity(home),plan.baseTicket);
 const history=atmosphereHomeHistory(home.id),values=history.map(g=>g.gameAtmosphere.attendance);
 atmosphere.seasonAverageAttendance=Math.round((values.reduce((a,b)=>a+b,0)+atmosphere.attendance)/(values.length+1));
 atmosphere.recentHomeAttendance=[...values,atmosphere.attendance].slice(-10);
 atmosphere.fanSentimentScore=atmosphereSentiment(home);
 atmosphere.context={homeWinningStreak:form.streak,visitingStar:star?.ovr>=85?star.name:null};
 return atmosphere;
}
function syncAttendanceWithGMOffice(gameAtmosphere,game){
 // Read-only displays use this saved snapshot; effects execute once on a new result.
 if(game.attendanceEffectsApplied)return;game.attendanceEffectsApplied=true;
 const owner=ownerFor(state.teams[game.a]);if(!owner.fired&&gameAtmosphere.fillRate>=.95&&atmosphereHomeHistory(game.a).length%5===0)owner.patience=Math.min(100,owner.patience+1);
 if(game.a!==controlledTeamId())return;
 const prior=atmosphereHomeHistory(controlledTeamId()).filter(g=>g!==game).slice(-10),baseline=prior.length?prior.reduce((n,g)=>n+g.gameAtmosphere.fillRate,0)/prior.length:null;
 const trade=(state.decisions?.entries||[]).slice().reverse().find(d=>d.type==='Trade'&&d.season===state.year&&d.players.some(p=>team().roster.some(r=>r.id===p.id&&r.ovr>=85))&&team().w+team().l-d.baseline.wins-d.baseline.losses<=10);
 if(trade&&baseline!==null&&gameAtmosphere.fillRate-baseline>=.1){
 const id='attendance-'+trade.id;if(!decisionState().entries.some(d=>d.id===id)){addDecision({id,type:'Attendance',description:'Home attendance rose to '+(gameAtmosphere.fillRate*100).toFixed(1)+'% after a major trade.',reasoning:'Compared with the previous '+prior.length+' tracked home games. Results, opponent and ticket price also affect demand.',players:trade.players});updateLongTermOutcome(id,'Observed increase: '+((gameAtmosphere.fillRate-baseline)*100).toFixed(1)+' percentage points. '+trade.description)}}
}
let activeGameAtmosphere=null;
const simulateBeforeAtmosphere=simulateAttributeGame;
simulateAttributeGame=function(a,b,stage='Regular season'){const atmosphere=createGameAtmosphere(state.teams[a],state.teams[b],stage);const previous=activeGameAtmosphere;let game;try{activeGameAtmosphere=atmosphere;game=simulateBeforeAtmosphere(a,b,stage)}finally{activeGameAtmosphere=previous}game.gameAtmosphere=atmosphere;syncAttendanceWithGMOffice(atmosphere,game);if(stage!=='Regular season'){financeHome(state.teams[a],true,b,game.day,game);financeSync(state.teams[a])}return game};
function atmosphereMoney(n){return n.toLocaleString('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2})}
function atmosphereSummary(a){const reasons=[];if(a.context.homeWinningStreak>=2)reasons.push('a '+a.context.homeWinningStreak+'-game winning streak');if(a.context.visitingStar)reasons.push('visiting star '+a.context.visitingStar);if(a.factors.fanSentiment>0)reasons.push('positive fan sentiment');if(a.factors.ticketPriceEffect>0)reasons.push('lower ticket prices');return 'Tonight’s attendance reached '+(a.fillRate*100).toFixed(1)+'% capacity'+(reasons.length?', supported by '+reasons.join(' and '):'. Team results, opponent quality, fan sentiment and ticket price shaped demand')+'.'}
function attendanceTrend(values){if(!values.length)return '<p>No tracked home games yet.</p>';const max=Math.max(1,...values),points=values.map((n,i)=>`${values.length===1?140:10+i*260/(values.length-1)},${65-n/max*55}`).join(' ');return `<svg viewBox="0 0 280 80" class="attendance-trend" role="img" aria-label="Home attendance, oldest to newest: ${values.join(', ')}"><line x1="10" y1="66" x2="270" y2="66" stroke="currentColor" opacity=".25"/><polyline points="${points}" fill="none" stroke="currentColor" stroke-width="3"/>${values.map((n,i)=>`<circle cx="${values.length===1?140:10+i*260/(values.length-1)}" cy="${65-n/max*55}" r="3" fill="currentColor"/>`).join('')}</svg>`}
function displayAttendanceUI(a,zone='header'){
 if(!a)return zone==='header'?'<p class="atmosphere-header">Attendance was not recorded for this game.</p>':'';
 const flames='🔥'.repeat(a.fanEnergy);
 if(zone==='header')return `<div class="atmosphere-header"><strong>Attendance: ${a.attendance.toLocaleString()} (${(a.fillRate*100).toFixed(1)}% capacity filled)</strong><span>Fan Energy: <span aria-label="${a.fanEnergy} out of 3">${flames}</span></span><span tabindex="0" class="attendance-help" aria-label="Attendance information">ⓘ<span role="tooltip">Attendance responds to team performance, opponent quality, and ticket price.</span></span></div>`;
 if(zone==='summary')return `<section class="atmosphere-summary"><h3>Tonight’s crowd</h3><p>${escapeHTML(atmosphereSummary(a))}</p><strong>Revenue: ${atmosphereMoney(a.revenue)} | Fan Energy: ${flames}</strong><small>Ticket revenue · Home team</small></section>`;
 return `<aside class="atmosphere-panel" aria-label="Home crowd and revenue"><h3>HOME CROWD</h3><dl><div><dt>Revenue This Game</dt><dd>${atmosphereMoney(a.revenue)}</dd></div><div><dt>Season Avg Attendance</dt><dd>${a.seasonAverageAttendance.toLocaleString()}</dd></div><div><dt>Ticket Price</dt><dd>${atmosphereMoney(a.ticketPrice)}</dd></div></dl><small>Ticket revenue · Tracked home games, including tonight</small><h4>Last ${a.recentHomeAttendance.length} home games</h4>${attendanceTrend(a.recentHomeAttendance)}<label>Fan Sentiment: ${a.fanSentimentScore>3?'😊 Positive':a.fanSentimentScore< -3?'😟 Unhappy':'😐 Neutral'}<meter min="-20" max="20" value="${a.fanSentimentScore}" aria-label="Fan sentiment">${a.fanSentimentScore}</meter></label></aside>`;
}
function atmosphereFanDashboard(){const games=atmosphereHomeHistory(controlledTeamId()),last=games.at(-1)?.gameAtmosphere,plan=ownerFor(team()).plan;return `<section class="gm-panel atmosphere-office"><h2>Fan & attendance dashboard</h2>${last?displayAttendanceUI(last,'side'):'<p>Attendance tracking starts with your next home game.</p>'}<p>Current fan sentiment: ${atmosphereSentiment(team()).toFixed(0)} / 20</p><label>Regular-season ticket price ($)<input type="number" min="37.5" max="150" step=".5" value="${plan.ticketPrice}" onchange="ownerTicketPrice(this.value)" ${ownerFor(team()).fired?'disabled':''}></label><button onclick="go('Attendance rankings')">Home & road rankings →</button><small>Latest home-game snapshot. Wins and losses affect sentiment through recent form; trades affect your existing fan reaction score.</small></section>`}
const officeBeforeAtmosphere=gmOfficePage;gmOfficePage=function(){return officeBeforeAtmosphere()+(officeTab==='overview'?atmosphereFanDashboard():'')};
function readGameAtmosphere(a,bad){
 const number=(v,min,max)=>Number.isFinite(v)&&v>=min&&v<=max;
 if(!a||!Number.isInteger(a.capacity)||!number(a.capacity,1,100000)||!Number.isInteger(a.attendance)||!number(a.attendance,0,a.capacity)||!number(a.fillRate,0,1)||Math.abs(a.fillRate-a.attendance/a.capacity)>1e-9||a.fanEnergy!==updateFanEnergy(a.fillRate)||!number(a.ticketPrice,0,1000)||a.revenue!==updateRevenue(a.attendance,a.ticketPrice)||!Number.isInteger(a.seasonAverageAttendance)||!number(a.seasonAverageAttendance,0,100000)||!a.factors||['teamPerformance','opponentQuality','fanSentiment','ticketPriceEffect'].some(k=>!number(a.factors[k],-1,1))||!number(a.fanSentimentScore,-20,20)||!Array.isArray(a.recentHomeAttendance)||a.recentHomeAttendance.length<1||a.recentHomeAttendance.length>10||a.recentHomeAttendance.some(n=>!Number.isInteger(n)||!number(n,0,100000))||!a.context||!Number.isInteger(a.context.homeWinningStreak)||!number(a.context.homeWinningStreak,0,10)||(a.context.visitingStar!==null&&(typeof a.context.visitingStar!=='string'||a.context.visitingStar.length>80)))bad('invalid game atmosphere.');
 return JSON.parse(JSON.stringify(a));
}
DECISION_TYPES.push('Attendance');

const projectionBeforeAtmosphere=financeProjection;financeProjection=function(club,playoffs=false,planOverride=null){const base=projectionBeforeAtmosphere(club,playoffs,planOverride),pair=state.schedule.slice(state.day).flat().find(p=>p[0]===club.id),a=createGameAtmosphere(club,pair?state.teams[pair[1]]:null,playoffs?'Championship':'Regular season',planOverride);return {...base,attendance:a.fillRate,capacity:a.capacity,price:a.ticketPrice}};
