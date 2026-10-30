/* Commissioner mode (Settings tab): edit players, the schedule and award winners; force results; rig the
   draft; control any team and shield managed teams from AI moves; review (veto) AI trades.
   state.commissioner is optional and validated by readCommissioner. everUsed stays true once enabled.
   Loads after the systems it wraps and before career-bootstrap.js. */
let commissionerUI={tab:'teams',playerId:null,day:null,awardYear:null,message:''};
const COMMISSIONER_TABS=[['teams','Teams'],['players','Players'],['schedule','Schedule & results'],['draft','Draft'],['awards','Awards'],['trades','Trades']];
const COMMISSIONER_PLAYER_AWARDS=['mvp','finalsMvp','dpoy','roy','mip','sixth'];
const COMMISSIONER_MAX_REROLLS=60;
function commissionerDefaults(){return {enabled:false,everUsed:false,activeTeam:null,managedTeams:[],alwaysWin:[],forcedGames:{},tradeReview:false,pendingTrades:[],scheduleEdited:false,lotteryWinner:null}}
function commissioner(){return state.commissioner??=commissionerDefaults()}
function commissionerOn(data=state){return !!data?.commissioner?.enabled}
function readCommissioner(raw,bad,teamCount){
 if(raw===undefined)return undefined;
 const team=id=>Number.isInteger(id)&&id>=0&&id<teamCount,ids=v=>Array.isArray(v)&&v.length<=teamCount&&new Set(v).size===v.length&&v.every(team);
 const pick=p=>p&&Number.isInteger(p.year)&&Number.isInteger(p.round)&&p.round>=1&&p.round<=5&&team(p.origin);
 if(!raw||typeof raw!=='object'||typeof raw.enabled!=='boolean'||typeof raw.everUsed!=='boolean'||!(raw.activeTeam===null||team(raw.activeTeam))||!ids(raw.managedTeams)||!ids(raw.alwaysWin)||typeof raw.tradeReview!=='boolean'||typeof raw.scheduleEdited!=='boolean'||!(raw.lotteryWinner===null||team(raw.lotteryWinner)))bad('invalid commissioner settings.');
 if(!raw.forcedGames||typeof raw.forcedGames!=='object'||Array.isArray(raw.forcedGames)||Object.keys(raw.forcedGames).length>5000||Object.entries(raw.forcedGames).some(([k,w])=>{const m=/^(\d+):(\d+)-(\d+)$/.exec(k);return !m||!team(+m[2])||!team(+m[3])||![+m[2],+m[3]].includes(w)}))bad('invalid forced results.');
 if(!Array.isArray(raw.pendingTrades)||raw.pendingTrades.length>50||raw.pendingTrades.some(t=>!t||!Number.isInteger(t.id)||!team(t.a)||!team(t.b)||t.a===t.b||!Array.isArray(t.out)||!Array.isArray(t.into)||![...t.out,...t.into].every(Number.isInteger)||!Array.isArray(t.outPicks)||!Array.isArray(t.inPicks)||![...t.outPicks,...t.inPicks].every(pick)||typeof t.text!=='string'||t.text.length>600))bad('invalid pending trades.');
 return {enabled:raw.enabled,everUsed:raw.everUsed||raw.enabled,activeTeam:raw.activeTeam,managedTeams:[...raw.managedTeams],alwaysWin:[...raw.alwaysWin],forcedGames:{...raw.forcedGames},tradeReview:raw.tradeReview,
  pendingTrades:raw.pendingTrades.map(t=>({id:t.id,a:t.a,b:t.b,out:[...t.out],into:[...t.into],outPicks:t.outPicks.map(p=>({year:p.year,origin:p.origin,round:p.round})),inPicks:t.inPicks.map(p=>({year:p.year,origin:p.origin,round:p.round})),text:t.text})),scheduleEdited:raw.scheduleEdited,lotteryWinner:raw.lotteryWinner};
}
const validateBeforeCommissioner=validateCareerData;
validateCareerData=function(raw){const out=validateBeforeCommissioner(raw);const c=readCommissioner(raw?.commissioner,m=>{throw Error('Invalid save: '+m)},out.teams.length);if(c)out.commissioner=c;else delete out.commissioner;return out};

/* Team control: the commissioner can act as any team; managed teams are shielded from AI roster moves. */
const controlledBeforeCommissioner=controlledTeamId;
controlledTeamId=function(data=state){const c=data?.commissioner;return c?.enabled&&Number.isInteger(c.activeTeam)&&data.teams?.[c.activeTeam]?c.activeTeam:controlledBeforeCommissioner(data)};
function commissionerProtected(id){const c=state?.commissioner;return !!c?.enabled&&(c.managedTeams.includes(id)||c.activeTeam===id)}
const cpuClubsBeforeCommissioner=cpuRosterClubs;cpuRosterClubs=function(){return cpuClubsBeforeCommissioner().filter(t=>!commissionerProtected(t.id))};
const tradeCoolingBeforeCommissioner=aiTradeCoolingDown;aiTradeCoolingDown=function(t,...args){return commissionerProtected(t.id)||tradeCoolingBeforeCommissioner(t,...args)};
const faOffersBeforeCommissioner=faCPUOffers;faCPUOffers=function(...args){const f=state.freeAgency,before=new Set(f?.offers||[]),r=faOffersBeforeCommissioner(...args);if(state.freeAgency?.offers&&state.commissioner?.enabled)state.freeAgency.offers=state.freeAgency.offers.filter(o=>before.has(o)||!commissionerProtected(o.team));return r};

/* Forced results. A forced game is re-simulated (before any result is recorded) until the chosen team
   wins, up to COMMISSIONER_MAX_REROLLS times; the box score is a real simulated game (see commissionerReroll). */
let commissionerRerolls=0,commissionerForceMisses=0;
function commissionerForcedWinner(a,b,stage){const c=state?.commissioner;if(!c?.enabled)return null;
 if(stage==='Regular season'){const key=state.day+':'+a+'-'+b;if(Object.hasOwn(c.forcedGames,key))return c.forcedGames[key]}
 const wa=c.alwaysWin.includes(a),wb=c.alwaysWin.includes(b);return wa&&!wb?a:wb&&!wa?b:null}
/* Re-simulation for a forced result. After 15 misses the forced team plays with a temporary ratings boost
   that grows every 5 attempts (removed when the game ends), so a forced result cannot stall. */
function commissionerReroll(a,b,stage){const forced=commissionerForcedWinner(a,b,stage),boost=commissionerRerolls>15&&commissionerRerolls%5===1?4:0,club=state.teams[forced];
 if(!boost||!club)return coreSimulateAttributeGame(a,b,stage);const saved=club.roster.map(p=>[p,{...withBasketballAttributes(p).attributes}]);
 try{for(const p of club.roster)for(const k of ATTRIBUTE_KEYS)if(!['hgt','dur'].includes(k))p.attributes[k]=Math.min(99,p.attributes[k]+boost);return coreSimulateAttributeGame(a,b,stage)}finally{for(const [p,attrs] of saved)Object.assign(p.attributes,attrs)}}
function commissionerRerollWanted(a,b,stage,winner){const forced=commissionerForcedWinner(a,b,stage);if(forced===null||forced===winner){commissionerRerolls=0;return false}if(commissionerRerolls>=COMMISSIONER_MAX_REROLLS){commissionerRerolls=0;commissionerForceMisses++;return false}commissionerRerolls++;return true}

/* Trade review: with review on, AI trades wait for approval instead of executing. */
const aiExecuteBeforeCommissioner=aiTradeExecute;
aiTradeExecute=function(a,b,d){const c=state.commissioner;if(!c?.enabled||!c.tradeReview)return aiExecuteBeforeCommissioner(a,b,d);
 const text=a.city+' get '+[...d.into.map(p=>p.name),...d.inPicks.map(tradePickLabel)].join(', ')+' · '+b.city+' get '+[...d.out.map(p=>p.name),...d.outPicks.map(tradePickLabel)].join(', ');
 c.pendingTrades.push({id:(c.pendingTrades.reduce((m,t)=>Math.max(m,t.id),0)||0)+1,a:a.id,b:b.id,out:d.out.map(p=>p.id),into:d.into.map(p=>p.id),outPicks:d.outPicks.map(p=>({year:p.year,origin:p.origin,round:p.round})),inPicks:d.inPicks.map(p=>({year:p.year,origin:p.origin,round:p.round})),text:text.slice(0,600)});
 if(c.pendingTrades.length>50)c.pendingTrades.shift();say('Trade awaiting commissioner review: '+text+'.')};
function commissionerResolveTrade(t){const a=state.teams[t.a],b=state.teams[t.b];if(!a||!b)return null;const out=t.out.map(id=>a.roster.find(p=>p.id===id)),into=t.into.map(id=>b.roster.find(p=>p.id===id));if(out.some(p=>!p)||into.some(p=>!p))return null;
 const own=(team,picks)=>picks.map(p=>tradePicks(team).find(x=>tradePickKey(x)===tradePickKey(p)));const outPicks=own(a,t.outPicks),inPicks=own(b,t.inPicks);if(outPicks.some(p=>!p)||inPicks.some(p=>!p))return null;return {a,b,d:{out,into,outPicks,inPicks}}}
function commissionerReviewTrade(id,approve){const c=commissioner(),i=c.pendingTrades.findIndex(t=>t.id===id);if(i<0)return 'Trade not found.';const t=c.pendingTrades.splice(i,1)[0];
 if(!approve){say('Commissioner vetoed a trade: '+t.text+'.');return 'Trade vetoed.'}const r=commissionerResolveTrade(t);if(!r){say('A pending trade expired: '+t.text+'.');return 'Players or picks have moved; the trade can no longer be completed.'}aiExecuteBeforeCommissioner(r.a,r.b,r.d);return 'Trade approved.'}

/* Draft: name a lottery winner beforehand, or reorder the first round after the lottery. */
function commissionerDraftEditable(){const d=state.draft;return !!d&&d.year===state.year&&d.order.length>0&&!d.picks.length}
function commissionerMoveDraftTeam(id,position){if(!commissionerDraftEditable())throw Error('The draft order can be changed after the lottery and before the first pick.');const order=state.draft.order,from=order.indexOf(id);if(from<0)throw Error('Team not in the draft order.');if(!Number.isInteger(position)||position<0||position>=order.length)throw Error('Choose a valid pick number.');order.splice(from,1);order.splice(position,0,id)}
const lotteryBeforeCommissioner=runDraftLottery;
runDraftLottery=function(...args){const result=lotteryBeforeCommissioner(...args),rig=()=>{const c=state.commissioner;if(!c?.enabled||c.lotteryWinner===null||!commissionerDraftEditable())return;const id=c.lotteryWinner;c.lotteryWinner=null;commissionerMoveDraftTeam(id,0);say('Commissioner decision: '+state.teams[id].city+' '+state.teams[id].name+' receive the first overall pick.');save();render()};if(result&&typeof result.then==='function')return result.then(v=>{rig();return v});rig();return result};

/* Schedule: future days only. Any edit marks the season, and the save checker then validates structure
   (valid matchups, one game per team per day) rather than format balance. */
function commissionerFutureDay(day){if(!Number.isInteger(day)||day<state.day||day>=state.schedule.length)throw Error('Choose a day that has not been played.')}
// The All-Star break must stay free of games (the save checker enforces it).
function commissionerBreakDay(day){const c=state.allStarCalendar;return !!c&&c.year===state.year&&day+1>=c.breakStart&&day+1<=c.breakEnd}
function commissionerOpenDay(day){commissionerFutureDay(day);if(commissionerBreakDay(day))throw Error('Day '+(day+1)+' is in the All-Star break; no games can be scheduled.')}
function commissionerBusy(day,ids,except=null){return state.schedule[day].some(pair=>pair!==except&&pair.some(id=>ids.includes(id)))}
function commissionerScheduleEdit(action,v){const c=commissioner(),day=Number(v.day);commissionerFutureDay(day);const round=state.schedule[day];
 if(action==='add'){commissionerOpenDay(day);const home=Number(v.home),away=Number(v.away);if(!state.teams[home]||!state.teams[away]||home===away)throw Error('Choose two different teams.');if(commissionerBusy(day,[home,away]))throw Error('One of those teams already plays that day.');round.push([home,away])}
 else{const pair=round[Number(v.index)];if(!pair)throw Error('Game not found.');const key=k=>k+':'+pair[0]+'-'+pair[1];
  if(action==='swap'){delete c.forcedGames[key(day)];pair.reverse()}
  else if(action==='remove'){delete c.forcedGames[key(day)];round.splice(Number(v.index),1)}
  else if(action==='move'){const to=Number(v.to);commissionerOpenDay(to);if(to===day)return;if(commissionerBusy(to,pair))throw Error('A team in that game already plays on day '+(to+1)+'.');const forced=c.forcedGames[key(day)];delete c.forcedGames[key(day)];round.splice(Number(v.index),1);state.schedule[to].push(pair);if(forced!==undefined)c.forcedGames[key(to)]=forced}
  else if(action==='force'){const w=v.winner===''?null:Number(v.winner);if(w===null)delete c.forcedGames[key(day)];else if(pair.includes(w))c.forcedGames[key(day)]=w;else throw Error('Choose a team in that game.');return}
  else throw Error('Unknown schedule action.')}
 c.scheduleEdited=true}
// Preseason: a fresh schedule from the league's generator. In season: the remaining matchups are reshuffled
// across the remaining days (every team keeps the same opponents and game count).
function commissionerRegenerateSchedule(random=Math.random){const c=commissioner();
 if(state.day===0){const rules=leagueRules(),format=state.scheduleFormat,built=format==='custom'?customSeasonSchedule(state.teams,state.year,rules):format==='nba82'?nbaSeasonSchedule(state.teams,state.year):schedule(state.meetings,state.teams.length);
  // The generators are seeded by year, so relabel teams within each division: every team keeps its division,
  // conference and inter-conference game counts and rest pattern, but gets new dates and opponents per slot.
  const map=new Map(),groups=new Map();for(const t of state.teams){const g=t.divisionId||t.conferenceId||'all';(groups.get(g)||groups.set(g,[]).get(g)).push(t.id)}for(const ids of groups.values()){const shuffled=[...ids];for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]}ids.forEach((id,i)=>map.set(id,shuffled[i]))}
  state.schedule=built.map(round=>round.map(([h,a])=>[map.get(h)??h,map.get(a)??a]));delete state.scheduleAlignment;delete state.powerMovement;if(format==='custom')state.customScheduleAlignment=managementAlignment(state.teams);
  // Same as a Settings rebuild: the All-Star break and events follow the new calendar.
  delete state.allStarCalendar;delete state.allStarEvents;delete state.allStarVoting;state.allStarReport=[];applyAllStarCalendar(state,rules);c.forcedGames={};c.scheduleEdited=false;return 'Schedule regenerated.'}
 const days=state.schedule.length-state.day;if(days<1)return 'No games remain.';const games=state.schedule.slice(state.day).flat();for(let i=games.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[games[i],games[j]]=[games[j],games[i]]}
 const rounds=Array.from({length:days},()=>[]),open=rounds.map((_,k)=>!commissionerBreakDay(state.day+k));for(const pair of games){let best=-1;for(let k=0;k<rounds.length;k++)if(open[k]&&!rounds[k].some(p=>p.includes(pair[0])||p.includes(pair[1]))&&(best<0||rounds[k].length<rounds[best].length))best=k;if(best<0){rounds.push([]);open.push(true);best=rounds.length-1}rounds[best].push(pair)}
 state.schedule=[...state.schedule.slice(0,state.day),...rounds];for(const k of Object.keys(c.forcedGames))if(+k.split(':')[0]>=state.day)delete c.forcedGames[k];c.scheduleEdited=true;return 'Remaining schedule reshuffled'+(rounds.length>days?' (added '+(rounds.length-days)+' day'+(rounds.length-days===1?'':'s')+')':'')+'.'}

/* Players: everyone on a roster, in free agency or in the current draft class. */
function commissionerPlayers(){return [...state.teams.flatMap(t=>t.roster.map(p=>({p,where:t.abbr}))),...state.free.map(p=>({p,where:'FA'})),...(state.draft?.prospects||[]).map(p=>({p,where:'Draft'}))]}
function commissionerFindPlayer(id){return commissionerPlayers().find(x=>x.p.id===id)?.p}
function commissionerEditPlayer(id,v){const p=commissionerFindPlayer(id);if(!p)throw Error('Player not found.');const int=(x,lo,hi,label)=>{const n=Number(x);if(!Number.isInteger(n)||n<lo||n>hi)throw Error(label+' must be a whole number from '+lo+' to '+hi+'.');return n};
 const name=String(v.name||'').trim();if(!name||name.length>80)throw Error('Enter a name (up to 80 characters).');if(!['PG','SG','SF','PF','C'].includes(v.pos))throw Error('Choose a position.');
 const next={name,pos:v.pos,age:int(v.age,16,60,'Age'),ovr:int(v.ovr,1,99,'Overall'),pot:int(v.pot,1,99,'Potential')};
 const attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,int(v['a_'+k],1,99,ATTRIBUTE_GROUPS.flatMap(g=>g[1]).find(a=>a[0]===k)[1])]));
 const tendencies=Object.fromEntries(TENDENCY_KEYS.map(k=>[k,int(v['t_'+k],0,100,TENDENCY_GROUPS.flatMap(g=>g[1]).find(t=>t[0]===k)[1])]));
 const traits=TRAIT_GROUPS.map((g,i)=>{if(!g.includes(v['trait'+i]))throw Error('Choose a personality trait in each group.');return v['trait'+i]});
 const text=(x,label)=>{const s=String(x||'').trim();if(!s||s.length>80)throw Error(label+' is required (up to 80 characters).');return s};const birthdate=String(v.birthdate||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)||!Number.isFinite(Date.parse(birthdate))||new Date(birthdate).toISOString().slice(0,10)!==birthdate)throw Error('Enter a valid birthdate.');
 const bio={...(p.bio||generatePlayerBio(p,state.year,state.teams)),heightInches:int(v.heightInches,48,100,'Height (inches)'),weightLbs:int(v.weightLbs,80,500,'Weight (lbs)'),birthdate,hometown:text(v.hometown,'Hometown'),college:text(v.college,'College / club')};
 Object.assign(p,next,{attributes,tendencies,personalityTraits:traits,bio});if(typeof ensurePlayerArchetype==='function')ensurePlayerArchetype(p,state.year,true);return p}

/* Awards: player honors in regular-season awards and league history (both stores stay in step). */
function commissionerAwardYears(){return [...new Set([...(state.regularAwards||[]),...(state.leagueHistory||[])].map(r=>r.year))].sort((a,b)=>b-a)}
function commissionerSetAward(year,key,playerId){if(!COMMISSIONER_PLAYER_AWARDS.includes(key))throw Error('That award cannot be edited here.');let value=null;
 if(playerId!==''&&playerId!==null){const p=commissionerFindPlayer(Number(playerId));if(!p)throw Error('Player not found.');const t=state.teams.find(t=>t.roster.includes(p));value={id:p.id,name:p.name,team:t?t.city+' '+t.name:'Free agent'}}
 let found=false;for(const list of [state.regularAwards,state.leagueHistory]){const r=(list||[]).find(r=>r.year===year);if(r&&(Object.hasOwn(r,key)||list===state.leagueHistory||AWARD_RACES.some(([k])=>k===key))){r[key]=value;found=true}}if(!found)throw Error('No award record for '+year+'.')}

/* ---- Settings panel ---- */
function commissionerTeamOptions(selected,{blank=null}={}){return (blank!==null?`<option value="">${blank}</option>`:'')+state.teams.map(t=>`<option value="${t.id}" ${selected===t.id?'selected':''}>${escapeHTML(t.city+' '+t.name)}</option>`).join('')}
function commissionerTeamsTab(c){const own=controlledBeforeCommissioner(state);return `<form onsubmit="commissionerAction(event,'teams')"><div class="tm-grid"><label>Team you control<select name="activeTeam"><option value="">${own>=0?'Your franchise ('+escapeHTML(state.teams[own]?.abbr||'')+')':'Your franchise'}</option>${commissionerTeamOptions(c.activeTeam)}</select><small>Every screen acts for this team until you switch back.</small></label><label>Trade review<select name="tradeReview"><option value="false" ${!c.tradeReview?'selected':''}>Off · AI trades complete normally</option><option value="true" ${c.tradeReview?'selected':''}>On · AI trades wait for approval</option></select></label></div>
 <fieldset class="commissioner-teams"><legend>Managed teams <small>AI makes no trades, signings or releases for these teams. Switch control to run each one.</small></legend><label class="check"><input type="checkbox" onclick="this.closest('fieldset').querySelectorAll('input[name=managed]').forEach(x=>x.checked=this.checked)"> All teams</label>${state.teams.map(t=>`<label class="check"><input type="checkbox" name="managed" value="${t.id}" ${c.managedTeams.includes(t.id)?'checked':''}> ${escapeHTML(t.abbr)}</label>`).join('')}</fieldset><button class="primary">Save team control</button></form>`}
function commissionerPlayersTab(){const list=commissionerPlayers(),id=commissionerUI.playerId,p=list.find(x=>x.p.id===id)?.p,groups=[...new Set(list.map(x=>x.where))];
 const picker=`<label>Player<select onchange="commissionerUI.playerId=Number(this.value)||null;render()"><option value="">Choose a player</option>${groups.map(g=>`<optgroup label="${escapeHTML(g==='FA'?'Free agents':g==='Draft'?'Draft class':g)}">${list.filter(x=>x.where===g).map(x=>`<option value="${x.p.id}" ${x.p.id===id?'selected':''}>${escapeHTML(x.p.name)} · ${x.p.pos} · ${x.p.ovr}</option>`).join('')}</optgroup>`).join('')}</select></label>`;
 if(!p)return picker;withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const bio=p.bio||generatePlayerBio(p,state.year,state.teams),num=(name,value,lo,hi,label)=>`<label>${label}<input name="${name}" type="number" min="${lo}" max="${hi}" step="1" required value="${value}"></label>`,traits=p.personalityTraits||generateTraits(p);
 return picker+`<form onsubmit="commissionerAction(event,'player')" class="commissioner-player"><div class="tm-grid"><label>Name<input name="name" maxlength="80" required value="${escapeHTML(p.name)}"></label><label>Position<select name="pos">${['PG','SG','SF','PF','C'].map(x=>`<option ${x===p.pos?'selected':''}>${x}</option>`).join('')}</select></label>${num('age',p.age,16,60,'Age')}${num('ovr',p.ovr,1,99,'Overall')}${num('pot',p.pot,1,99,'Potential')}</div>
 <h4>Attributes (1–99)</h4>${ATTRIBUTE_GROUPS.map(([g,rows])=>`<div class="commissioner-grid"><strong>${g}</strong>${rows.map(([k,label])=>num('a_'+k,p.attributes[k],1,99,label)).join('')}</div>`).join('')}
 <h4>Tendencies (0–100)</h4>${TENDENCY_GROUPS.map(([g,rows])=>`<div class="commissioner-grid"><strong>${g}</strong>${rows.map(([k,label])=>num('t_'+k,p.tendencies[k]??generatedTendencies(p)[k],0,100,label)).join('')}</div>`).join('')}
 <h4>Personality</h4><div class="tm-grid">${TRAIT_GROUPS.map((g,i)=>`<label>Trait ${i+1}<select name="trait${i}">${g.map(x=>`<option ${traits[i]===x?'selected':''}>${x}</option>`).join('')}</select></label>`).join('')}</div>
 <h4>Bio</h4><div class="tm-grid">${num('heightInches',bio.heightInches,48,100,'Height (inches)')}${num('weightLbs',bio.weightLbs,80,500,'Weight (lbs)')}<label>Birthdate<input name="birthdate" type="date" required value="${bio.birthdate}"></label><label>Hometown<input name="hometown" maxlength="80" required value="${escapeHTML(bio.hometown)}"></label><label>College / club<input name="college" maxlength="80" required value="${escapeHTML(bio.college)}"></label></div>
 <button class="primary">Save player</button></form>`}
function commissionerScheduleTab(c){const remaining=state.schedule.length-state.day,day=Math.min(Math.max(commissionerUI.day??state.day,state.day),state.schedule.length-1),name=id=>escapeHTML(state.teams[id].abbr);
 const regen=`<p><button type="button" onclick="commissionerAction(null,'regenerate')">${state.day===0?'Regenerate schedule':'Reshuffle remaining schedule'}</button> <small>${state.day===0?'Builds a new schedule with the league’s current format.':'Keeps every remaining matchup and reshuffles the remaining '+remaining+' days.'}</small></p>`;
 const always=`<form onsubmit="commissionerAction(event,'alwaysWin')"><fieldset class="commissioner-teams"><legend>Always win <small>These teams win every game (regular season and playoffs) unless both teams in a game are listed.</small></legend>${state.teams.map(t=>`<label class="check"><input type="checkbox" name="alwaysWin" value="${t.id}" ${c.alwaysWin.includes(t.id)?'checked':''}> ${escapeHTML(t.abbr)}</label>`).join('')}</fieldset><button>Save always-win teams</button></form>`;
 if(remaining<1)return regen+always+'<p class="muted">The regular season is complete.</p>';
 const games=state.schedule[day].map((pair,i)=>{const key=day+':'+pair[0]+'-'+pair[1],f=c.forcedGames[key];return `<tr><td>${name(pair[1])} @ ${name(pair[0])}</td><td><select aria-label="Forced winner" onchange="commissionerAction(null,'schedule',{action:'force',day:${day},index:${i},winner:this.value})"><option value="">Normal result</option><option value="${pair[0]}" ${f===pair[0]?'selected':''}>${name(pair[0])} win</option><option value="${pair[1]}" ${f===pair[1]?'selected':''}>${name(pair[1])} win</option></select></td><td><button type="button" onclick="commissionerAction(null,'schedule',{action:'swap',day:${day},index:${i}})">Swap home</button> <button type="button" onclick="const to=prompt('Move to which day? (${state.day+1}–${state.schedule.length})');if(to)commissionerAction(null,'schedule',{action:'move',day:${day},index:${i},to:Number(to)-1})">Move</button> <button type="button" onclick="commissionerAction(null,'schedule',{action:'remove',day:${day},index:${i}})">Remove</button></td></tr>`}).join('');
 return regen+`<label>Day<select onchange="commissionerUI.day=Number(this.value);render()">${state.schedule.slice(state.day).map((r,k)=>`<option value="${state.day+k}" ${state.day+k===day?'selected':''}>Day ${state.day+k+1} · ${r.length} game${r.length===1?'':'s'}</option>`).join('')}</select></label><div class="scroll"><table><thead><tr><th>Game</th><th>Result</th><th>Edit</th></tr></thead><tbody>${games||'<tr><td colspan="3">No games this day.</td></tr>'}</tbody></table></div>
 <form onsubmit="commissionerAction(event,'schedule')"><input type="hidden" name="action" value="add"><input type="hidden" name="day" value="${day}"><div class="tm-grid"><label>Home<select name="home">${commissionerTeamOptions(null)}</select></label><label>Away<select name="away">${commissionerTeamOptions(null)}</select></label></div><button>Add game on day ${day+1}</button></form>${always}${c.scheduleEdited?'<p class="muted">This season’s schedule has commissioner edits.</p>':''}`}
function commissionerDraftTab(c){const d=state.draft,editable=commissionerDraftEditable();
 const winner=`<form onsubmit="commissionerAction(event,'lottery')"><label>Lottery winner<select name="lotteryWinner"><option value="">No change · normal lottery</option>${commissionerTeamOptions(c.lotteryWinner)}</select><small>Applied when the lottery runs: this team moves to the first pick.</small></label><button>Save lottery winner</button></form>`;
 if(!editable)return winner+`<p class="muted">${d?.picks?.length?'The draft has started; the order is locked.':'The draft order appears here after the lottery.'}</p>`;
 return winner+`<h4>First-round order</h4><ol class="commissioner-order">${d.order.map((id,i)=>`<li>${escapeHTML(state.teams[id].city+' '+state.teams[id].name)} <button type="button" ${i===0?'disabled':''} onclick="commissionerAction(null,'draftMove',{id:${id},position:${i-1}})">↑</button> <button type="button" ${i===d.order.length-1?'disabled':''} onclick="commissionerAction(null,'draftMove',{id:${id},position:${i+1}})">↓</button> <button type="button" ${i===0?'disabled':''} onclick="commissionerAction(null,'draftMove',{id:${id},position:0})">Make #1</button></li>`).join('')}</ol>`}
function commissionerAwardsTab(){const years=commissionerAwardYears();if(!years.length)return '<p class="muted">Award winners appear here after a regular season ends.</p>';const year=years.includes(commissionerUI.awardYear)?commissionerUI.awardYear:years[0],labels=Object.fromEntries(LEAGUE_HONORS),rec=k=>(state.regularAwards||[]).find(r=>r.year===year)?.[k]??(state.leagueHistory||[]).find(r=>r.year===year)?.[k]??null,players=commissionerPlayers();
 return `<label>Season<select onchange="commissionerUI.awardYear=Number(this.value);render()">${years.map(y=>`<option value="${y}" ${y===year?'selected':''}>${seasonLabel(y)}</option>`).join('')}</select></label><div class="tm-grid">${COMMISSIONER_PLAYER_AWARDS.map(k=>{const cur=rec(k);return `<label>${labels[k]||k}<select onchange="commissionerAction(null,'award',{year:${year},key:'${k}',player:this.value})"><option value="">${cur?escapeHTML(cur.name)+' (current)':'No winner'}</option>${players.map(x=>`<option value="${x.p.id}" ${cur?.id===x.p.id?'selected':''}>${escapeHTML(x.p.name)} · ${x.where}</option>`).join('')}</select></label>`}).join('')}</div><p class="muted">Changes update league history, player awards and the Hall of Fame record.</p>`}
function commissionerTradesTab(c){return `<p>${c.tradeReview?'Trade review is on: AI trades wait here.':'Trade review is off. Turn it on in Teams to approve or veto AI trades.'}</p>${c.pendingTrades.length?`<ul class="commissioner-trades">${c.pendingTrades.map(t=>`<li>${escapeHTML(t.text)} <button type="button" class="primary" onclick="commissionerAction(null,'trade',{id:${t.id},approve:true})">Approve</button> <button type="button" onclick="commissionerAction(null,'trade',{id:${t.id},approve:false})">Veto</button></li>`).join('')}</ul>`:'<p class="muted">No trades are waiting.</p>'}`}
function commissionerPanel(){const c=state.commissioner;
 if(!c?.enabled)return `<section class="panel commissioner"><div class="panelhead"><h2>Commissioner mode</h2><span>${c?.everUsed?'Previously used':'Off'}</span></div><div class="note"><p>Edit players, the schedule and award winners; force results; rig the draft; control any team; review AI trades. This save will be marked as having used commissioner mode.</p><button class="primary" onclick="commissionerAction(null,'toggle',{enabled:true})">Enable commissioner mode</button></div></section>`;
 const body={teams:commissionerTeamsTab,players:commissionerPlayersTab,schedule:commissionerScheduleTab,draft:commissionerDraftTab,awards:commissionerAwardsTab,trades:commissionerTradesTab}[commissionerUI.tab]||commissionerTeamsTab;
 return `<section class="panel commissioner"><div class="panelhead"><h2>Commissioner mode</h2><span>On${c.pendingTrades.length?' · '+c.pendingTrades.length+' trade'+(c.pendingTrades.length===1?'':'s')+' to review':''}</span></div><div class="note"><nav class="po-tabs" aria-label="Commissioner tools">${COMMISSIONER_TABS.map(([k,n])=>`<button type="button" class="${commissionerUI.tab===k?'selected':''}" onclick="commissionerUI.tab='${k}';commissionerUI.message='';render()">${n}</button>`).join('')}</nav><p id="commissioner-message" class="muted" role="status">${escapeHTML(commissionerUI.message)}</p>${body(c)}<p><button type="button" onclick="commissionerAction(null,'toggle',{enabled:false})">Turn off commissioner mode</button> <small>Control returns to your franchise; managed teams, forced results and trade review pause until it is back on.</small></p></div></section>`}
// One entry point for every commissioner change: apply, save (or roll back), re-render with a message.
async function commissionerAction(event,kind,args={}){if(event){event.preventDefault()}const form=event?.target,v=form?Object.fromEntries(new FormData(form)):{},before=copy(state);
 try{const c=commissioner();let message='Saved.';
  if(kind==='toggle'){c.enabled=!!args.enabled;if(c.enabled)c.everUsed=true;message=c.enabled?'Commissioner mode is on.':'Commissioner mode is off.'}
  else if(!c.enabled)throw Error('Turn on commissioner mode first.');
  else if(kind==='teams'){c.activeTeam=v.activeTeam===''?null:Number(v.activeTeam);if(c.activeTeam!==null&&!state.teams[c.activeTeam])throw Error('Choose a team.');c.managedTeams=[...new Set(form.querySelectorAll('input[name=managed]:checked').length?[...form.querySelectorAll('input[name=managed]:checked')].map(x=>Number(x.value)):[])];c.tradeReview=v.tradeReview==='true';message='Team control saved.'}
  else if(kind==='player'){const p=commissionerEditPlayer(commissionerUI.playerId,v);message=p.name+' updated.'}
  else if(kind==='schedule'){commissionerScheduleEdit(args.action||v.action,{...v,...args});message='Schedule updated.'}
  else if(kind==='regenerate')message=commissionerRegenerateSchedule();
  else if(kind==='alwaysWin'){c.alwaysWin=[...form.querySelectorAll('input[name=alwaysWin]:checked')].map(x=>Number(x.value));message='Always-win teams saved.'}
  else if(kind==='lottery'){c.lotteryWinner=v.lotteryWinner===''?null:Number(v.lotteryWinner);message=c.lotteryWinner===null?'Lottery will run normally.':state.teams[c.lotteryWinner].city+' will win the lottery.'}
  else if(kind==='draftMove'){commissionerMoveDraftTeam(args.id,args.position);message='Draft order updated.'}
  else if(kind==='award'){commissionerSetAward(args.year,args.key,args.player);message='Award updated.'}
  else if(kind==='trade')message=commissionerReviewTrade(args.id,args.approve);
  if(await save()===false)throw Error('Could not save. Please try again.');commissionerUI.message=message}
 catch(e){state=before;commissionerUI.message=e.message;toast(e.message)}render()}
const settingsBeforeCommissioner=settingsView;settingsView=function(){return settingsBeforeCommissioner()+commissionerPanel()};
