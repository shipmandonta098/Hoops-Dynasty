/* Commissioner mode: edit players, the schedule and award winners; force results; rig the draft; control any team
   and shield managed teams from AI moves; review (veto) AI trades. The tools appear inline on each screen
   (commissioner-inline.js) while the mode is on; Settings keeps the on/off switch and the log of every edit.
   state.commissioner is optional and validated by readCommissioner. everUsed stays true once enabled.
   Loads after the systems it wraps and before career-bootstrap.js. */
let commissionerUI={playerId:null,awardYear:null,message:''};
const COMMISSIONER_PLAYER_AWARDS=['mvp','finalsMvp','dpoy','roy','mip','sixth'];
const COMMISSIONER_MAX_REROLLS=60;
const COMMISSIONER_LOG_LIMIT=500;
function commissionerDefaults(){return {enabled:false,everUsed:false,activeTeam:null,managedTeams:[],alwaysWin:[],forcedGames:{},tradeReview:false,pendingTrades:[],scheduleEdited:false,lotteryWinner:null,log:[]}}
function commissioner(){return state.commissioner??=commissionerDefaults()}
function commissionerOn(data=state){return !!data?.commissioner?.enabled}
function readCommissioner(raw,bad,teamCount){
 if(raw===undefined)return undefined;
 const team=id=>Number.isInteger(id)&&id>=0&&id<teamCount,ids=v=>Array.isArray(v)&&v.length<=teamCount&&new Set(v).size===v.length&&v.every(team);
 const pick=p=>p&&Number.isInteger(p.year)&&Number.isInteger(p.round)&&p.round>=1&&p.round<=5&&team(p.origin);
 if(!raw||typeof raw!=='object'||typeof raw.enabled!=='boolean'||typeof raw.everUsed!=='boolean'||!(raw.activeTeam===null||team(raw.activeTeam))||!ids(raw.managedTeams)||!ids(raw.alwaysWin)||typeof raw.tradeReview!=='boolean'||typeof raw.scheduleEdited!=='boolean'||!(raw.lotteryWinner===null||team(raw.lotteryWinner)))bad('invalid commissioner settings.');
 if(!raw.forcedGames||typeof raw.forcedGames!=='object'||Array.isArray(raw.forcedGames)||Object.keys(raw.forcedGames).length>5000||Object.entries(raw.forcedGames).some(([k,w])=>{const m=/^(\d+):(\d+)-(\d+)$/.exec(k);return !m||!team(+m[2])||!team(+m[3])||![+m[2],+m[3]].includes(w)}))bad('invalid forced results.');
 const text=(x,max)=>typeof x==='string'&&x.length<=max;
 if(raw.log!==undefined&&(!Array.isArray(raw.log)||raw.log.length>COMMISSIONER_LOG_LIMIT||raw.log.some(e=>!e||!text(e.at,40)||!Number.isInteger(e.year)||!Number.isInteger(e.day)||e.day<0||!text(e.what,200)||!text(e.from,300)||!text(e.to,300))))bad('invalid commissioner log.');
 if(!Array.isArray(raw.pendingTrades)||raw.pendingTrades.length>50||raw.pendingTrades.some(t=>!t||!Number.isInteger(t.id)||!team(t.a)||!team(t.b)||t.a===t.b||!Array.isArray(t.out)||!Array.isArray(t.into)||![...t.out,...t.into].every(Number.isInteger)||!Array.isArray(t.outPicks)||!Array.isArray(t.inPicks)||![...t.outPicks,...t.inPicks].every(pick)||typeof t.text!=='string'||t.text.length>600))bad('invalid pending trades.');
 return {enabled:raw.enabled,everUsed:raw.everUsed||raw.enabled,activeTeam:raw.activeTeam,managedTeams:[...raw.managedTeams],alwaysWin:[...raw.alwaysWin],forcedGames:{...raw.forcedGames},tradeReview:raw.tradeReview,
  pendingTrades:raw.pendingTrades.map(t=>({id:t.id,a:t.a,b:t.b,out:[...t.out],into:[...t.into],outPicks:t.outPicks.map(p=>({year:p.year,origin:p.origin,round:p.round})),inPicks:t.inPicks.map(p=>({year:p.year,origin:p.origin,round:p.round})),text:t.text})),scheduleEdited:raw.scheduleEdited,lotteryWinner:raw.lotteryWinner,log:(raw.log||[]).map(e=>({at:e.at,year:e.year,day:e.day,what:e.what,from:e.from,to:e.to}))};
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
// Age and birthdate stay consistent with the bio rule (age on October 1 of the season year): changing only the age
// moves the birth year (same month and day), and so does saving with the birthdate untouched (repairs an older edit
// that changed the age alone); changing only the birthdate recalculates the age.
function commissionerAgeOn(birthdate,year=state.year){return year-Number(birthdate.slice(0,4))-(birthdate.slice(5)>'10-01'?1:0)}
function commissionerBirthdateForAge(birthdate,age,year=state.year){const md=birthdate.slice(5),y=year-age-(md>'10-01'?1:0),leap=y%4===0&&(y%100!==0||y%400===0);return String(y).padStart(4,'0')+'-'+(md==='02-29'&&!leap?'02-28':md)}
function commissionerSyncAge(form,from){const a=form.elements.age,b=form.elements.birthdate,age=Number(a.value);if(!/^\d{4}-\d{2}-\d{2}$/.test(b.value))return;if(from==='age'){if(Number.isInteger(age)&&age>=16&&age<=60)b.value=commissionerBirthdateForAge(b.value,age)}else{const n=commissionerAgeOn(b.value);if(n>=16&&n<=60)a.value=n}}
function commissionerEditPlayer(id,v){const p=commissionerFindPlayer(id);if(!p)throw Error('Player not found.');const int=(x,lo,hi,label)=>{const n=Number(x);if(!Number.isInteger(n)||n<lo||n>hi)throw Error(label+' must be a whole number from '+lo+' to '+hi+'.');return n};
 const parts=v.first!==undefined||v.last!==undefined?{first:String(v.first||'').trim(),last:String(v.last||'').trim()}:commissionerSplitName(String(v.name||'').trim());
 if(!parts.first||!parts.last||parts.first.length>40||parts.last.length>40)throw Error('Enter a first and last name (up to 40 characters each).');const name=commissionerJoinName(p,parts.first,parts.last);if(name.length>80)throw Error('Enter a name (up to 80 characters).');if(!['PG','SG','SF','PF','C'].includes(v.pos))throw Error('Choose a position.');
 const next={name,pos:v.pos,age:int(v.age,16,60,'Age'),ovr:int(v.ovr,1,99,'Overall'),pot:int(v.pot,1,99,'Potential')};
 const attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,int(v['a_'+k],1,99,ATTRIBUTE_GROUPS.flatMap(g=>g[1]).find(a=>a[0]===k)[1])]));
 const tendencies=Object.fromEntries(TENDENCY_KEYS.map(k=>[k,int(v['t_'+k],0,100,TENDENCY_GROUPS.flatMap(g=>g[1]).find(t=>t[0]===k)[1])]));
 const traits=TRAIT_GROUPS.map((g,i)=>{if(!g.includes(v['trait'+i]))throw Error('Choose a personality trait in each group.');return v['trait'+i]});
 const text=(x,label)=>{const s=String(x||'').trim();if(!s||s.length>80)throw Error(label+' is required (up to 80 characters).');return s};const birthdate=String(v.birthdate||'');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(birthdate)||!Number.isFinite(Date.parse(birthdate))||new Date(birthdate).toISOString().slice(0,10)!==birthdate)throw Error('Enter a valid birthdate.');
 const oldBio=p.bio||generatePlayerBio(p,state.year,state.teams);let bornOn=birthdate;if(birthdate===oldBio.birthdate)bornOn=commissionerBirthdateForAge(birthdate,next.age);else if(next.age===p.age&&birthdate!==oldBio.birthdate)next.age=int(commissionerAgeOn(birthdate),16,60,'Age from the birthdate');
 const bio={...oldBio,heightInches:int(v.heightInches,48,100,'Height (inches)'),weightLbs:int(v.weightLbs,80,500,'Weight (lbs)'),birthdate:bornOn,hometown:hometownCountryOnly(text(v.hometown,'Hometown')),college:text(v.college,'College / club')};
 // Secondary position (when the form has it): at most one, never the main position; a change marks it as set by hand
 // so the offseason recalculation leaves it alone.
 let secondary=null;if(v.sec0!==undefined){secondary=[v.sec0].filter(Boolean);if(secondary.some(x=>!['PG','SG','SF','PF','C'].includes(x)))throw Error('Choose valid secondary positions.');if(secondary.includes(v.pos))throw Error('A secondary position cannot be the main position.')}
 const before=secondaryPositions(p).join();Object.assign(p,next,{attributes,tendencies,personalityTraits:traits,bio});commissionerSetNameIdentity(p,parts.first,parts.last);
 if(secondary){if(secondary.join()!==before)p.secondaryPosManual=true;p.secondaryPos=secondary}else if(Array.isArray(p.secondaryPos))p.secondaryPos=p.secondaryPos.filter(x=>x!==p.pos);if(typeof ensurePlayerArchetype==='function')ensurePlayerArchetype(p,state.year,true);return p}

/* Awards: player honors in regular-season awards and league history (both stores stay in step). */
function commissionerAwardYears(){return [...new Set([...(state.regularAwards||[]),...(state.leagueHistory||[])].map(r=>r.year))].sort((a,b)=>b-a)}
function commissionerSetAward(year,key,playerId){if(!COMMISSIONER_PLAYER_AWARDS.includes(key))throw Error('That award cannot be edited here.');let value=null;
 if(playerId!==''&&playerId!==null){const p=commissionerFindPlayer(Number(playerId));if(!p)throw Error('Player not found.');const t=state.teams.find(t=>t.roster.includes(p));value={id:p.id,name:p.name,team:t?t.city+' '+t.name:'Free agent'}}
 let found=false;for(const list of [state.regularAwards,state.leagueHistory]){const r=(list||[]).find(r=>r.year===year);if(r&&(Object.hasOwn(r,key)||list===state.leagueHistory||AWARD_RACES.some(([k])=>k===key))){r[key]=value;found=true}}if(!found)throw Error('No award record for '+year+'.')}


/* ---- Tools (shown inline on each screen by commissioner-inline.js) ---- */
function commissionerBadge(){return '<span class="commissioner-badge">Commissioner</span>'}
function commissionerTeamName(id){const t=state.teams[id];return t?t.city+' '+t.name:'—'}
function commissionerTeamOptions(selected,{blank=null}={}){return (blank!==null?`<option value="">${blank}</option>`:'')+state.teams.map(t=>`<option value="${t.id}" ${selected===t.id?'selected':''}>${escapeHTML(t.city+' '+t.name)}</option>`).join('')}
// Team control, AI roster moves and always-win for one team (Roster and Team management).
function commissionerTeamTools(t){const c=commissioner(),active=c.activeTeam===t.id,managed=c.managedTeams.includes(t.id),always=c.alwaysWin.includes(t.id);
 return `<div class="commissioner-tools">${active?`<span>You control the ${escapeHTML(t.city+' '+t.name)}.</span><button type="button" onclick="commissionerAction(null,'control',{team:null})">Return to your franchise</button>`:`<button type="button" class="primary" onclick="commissionerAction(null,'control',{team:${t.id}})">Control this team</button>`}<button type="button" aria-pressed="${always}" onclick="commissionerAction(null,'alwaysWinTeam',{team:${t.id},on:${!always}})">Always win: ${always?'On':'Off'}</button><button type="button" aria-pressed="${managed}" onclick="commissionerAction(null,'managed',{team:${t.id},on:${!managed}})">AI roster moves: ${managed?'Off (managed)':'On'}</button></div>`}
// Player editor (opened from the profile and the Players list).
function commissionerPlayerForm(p){withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const bio=p.bio||generatePlayerBio(p,state.year,state.teams),num=(name,value,lo,hi,label)=>`<label>${label}<input name="${name}" type="number" min="${lo}" max="${hi}" step="1" required value="${value}"></label>`,traits=p.personalityTraits||generateTraits(p);
 return `<form onsubmit="commissionerAction(event,'player',{id:${p.id}})" class="commissioner-player"><h4>Bio</h4><div class="tm-grid">${(()=>{const n=commissionerNameParts(p);return `<div class="commissioner-labeled"><label for="commissioner-first">First name</label><span class="commissioner-field"><input id="commissioner-first" name="first" maxlength="40" required value="${escapeHTML(n.first)}"><button type="button" title="Randomize first name" aria-label="Randomize first name" onclick="commissionerRandomizeField(${p.id},'first',this.form)">🎲</button></span></div><div class="commissioner-labeled"><label for="commissioner-last">Last name</label><span class="commissioner-field"><input id="commissioner-last" name="last" maxlength="40" required value="${escapeHTML(n.last)}"><button type="button" title="Randomize last name" aria-label="Randomize last name" onclick="commissionerRandomizeField(${p.id},'last',this.form)">🎲</button></span></div>`})()}<label>Position<select name="pos">${['PG','SG','SF','PF','C'].map(x=>`<option ${x===p.pos?'selected':''}>${x}</option>`).join('')}</select></label><label>Secondary position<select name="sec0"><option value="">None</option>${['PG','SG','SF','PF','C'].map(x=>`<option ${secondaryPositions(p)[0]===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Birthdate<input name="birthdate" type="date" required value="${bio.birthdate}" oninput="commissionerSyncAge(this.form,'birthdate')"></label><div class="commissioner-labeled"><label for="commissioner-hometown">Hometown</label><span class="commissioner-field"><input id="commissioner-hometown" name="hometown" maxlength="80" required value="${escapeHTML(bio.hometown)}"><button type="button" title="Randomize hometown" aria-label="Randomize hometown" onclick="commissionerRandomizeField(${p.id},'hometown',this.form)">🎲</button></span></div><div class="commissioner-labeled"><label for="commissioner-college">College / club</label><span class="commissioner-field"><input id="commissioner-college" name="college" maxlength="80" required value="${escapeHTML(bio.college)}"><button type="button" title="Randomize college or club" aria-label="Randomize college or club" onclick="commissionerRandomizeField(${p.id},'college',this.form)">🎲</button></span></div>${num('age',p.age,16,60,'Age').replace('<input ','<input oninput="commissionerSyncAge(this.form,\'age\')" ')}${num('heightInches',bio.heightInches,48,100,'Height (inches)')}${num('weightLbs',bio.weightLbs,80,500,'Weight (lbs)')}</div>
 <h4>Ratings</h4><div class="tm-grid">${num('ovr',p.ovr,1,99,'Overall')}${num('pot',p.pot,1,99,'Potential')}</div>
 <details><summary>Attributes (1–99)</summary>${ATTRIBUTE_GROUPS.map(([g,rows])=>`<div class="commissioner-grid"><strong>${g}</strong>${rows.map(([k,label])=>num('a_'+k,p.attributes[k],1,99,label)).join('')}</div>`).join('')}</details>
 <details><summary>Tendencies (0–100)</summary>${TENDENCY_GROUPS.map(([g,rows])=>`<div class="commissioner-grid"><strong>${g}</strong>${rows.map(([k,label])=>num('t_'+k,p.tendencies[k]??generatedTendencies(p)[k],0,100,label)).join('')}</div>`).join('')}</details>
 <details><summary>Personality</summary><div class="tm-grid">${TRAIT_GROUPS.map((g,i)=>`<label>Trait ${i+1}<select name="trait${i}">${g.map(x=>`<option ${traits[i]===x?'selected':''}>${x}</option>`).join('')}</select></label>`).join('')}</div></details>
 <p class="muted">Contracts change through normal roster moves; the editor covers bio, ratings, tendencies and personality.</p><button class="primary">Save player</button></form>`}
// Names: first and last are kept in p.nameIdentity (given / surname) and joined into p.name in the player's order
// (some naming cultures put the family name first).
function commissionerFamilyFirst(p){const n=p.nameIdentity;return !!n&&n.name===n.surname+' '+n.given&&n.given!==n.surname}
function commissionerSplitName(name){const i=name.indexOf(' ');return i<0?{first:name,last:''}:{first:name.slice(0,i),last:name.slice(i+1)}}
function commissionerNameParts(p){const n=p.nameIdentity;if(n&&[n.given+' '+n.surname,n.surname+' '+n.given].includes(p.name))return {first:n.given,last:n.surname};return commissionerSplitName(p.name)}
function commissionerJoinName(p,first,last){return commissionerFamilyFirst(p)?last+' '+first:first+' '+last}
// The player's country for names, hometowns and colleges: international nationality, else the name's country, else US.
function commissionerPlayerCountry(p){const x=p.international?.country;if(x&&INTERNATIONAL_COUNTRIES[x])return x;const n=p.nameIdentity?.country;if(n&&n!=='US'&&INTERNATIONAL_COUNTRIES[n])return n;return 'US'}
function commissionerSetNameIdentity(p,first,last){const country=p.nameIdentity?.country||commissionerPlayerCountry(p);
 if(typeof PLAYER_NAME_DATA==='object'&&PLAYER_NAME_DATA[country])p.nameIdentity={version:1,background:'local',order:'cultural',provenance:'generated',...(p.nameIdentity||{}),country,name:p.name,given:first,surname:last};
 if(typeof reservePlayerName==='function')reservePlayerName(p.name,state)}
// Name gender follows the league setting (men's or women's league), else the player's own.
function commissionerNameGender(p){return state.leagueGender==='female'||state.leagueGender==='male'?state.leagueGender:p.gender==='female'?'female':'male'}
// A first or last name from the name generator for the player's country and gender, such that the full name is not
// already used by another player.
function commissionerRandomName(p,part,other){const country=p.nameIdentity?.country&&PLAYER_NAME_DATA[p.nameIdentity.country]?p.nameIdentity.country:commissionerPlayerCountry(p),gender=commissionerNameGender(p);
 const taken=new Set(allLeaguePlayers().filter(q=>q.id!==p.id).map(q=>q.name.toLowerCase()));
 for(let i=0;i<60;i++){const info=generatePlayerName({country,gender,s:state}),value=part==='first'?info.given:info.surname,full=part==='first'?commissionerJoinName(p,value,other):commissionerJoinName(p,other,value);if(value&&!taken.has(full.toLowerCase()))return value}
 throw Error('Could not find an unused name; try again.')}
function commissionerRandomHometown(p){const c=commissionerPlayerCountry(p);return c==='US'?PLAYER_HOMETOWN_STATES[Math.floor(Math.random()*PLAYER_HOMETOWN_STATES.length)]+', USA':INTERNATIONAL_COUNTRIES[c].name}
function commissionerRandomCollege(p){const c=commissionerPlayerCountry(p),pool=c==='US'?PLAYER_COLLEGES:[...PLAYER_COLLEGES,INTERNATIONAL_COUNTRIES[c].name+' · Pro academy',INTERNATIONAL_COUNTRIES[c].name+' · Pro league'];return pool[Math.floor(Math.random()*pool.length)]}
// 🎲 buttons in the editor fill the field; nothing is saved until Save player.
function commissionerRandomizeField(id,field,form){const p=commissionerFindPlayer(id);if(!p||!form)return;try{const e=form.elements;
 e[field].value=field==='first'?commissionerRandomName(p,'first',e.last.value.trim()):field==='last'?commissionerRandomName(p,'last',e.first.value.trim()):field==='hometown'?commissionerRandomHometown(p):commissionerRandomCollege(p)}catch(error){toast(error.message)}}
function commissionerOpenEditor(id){const p=commissionerFindPlayer(id);if(!p||!commissionerOn())return;commissionerUI.playerId=id;const d=document.getElementById('profile');d.className='commissioner-editor';d.removeAttribute('aria-labelledby');
 d.innerHTML=`<div class="panelhead"><h2>${commissionerBadge()} Edit ${escapeHTML(p.name)}</h2><button onclick="document.getElementById('profile').close()" aria-label="Close editor">✕</button></div>${commissionerPlayerForm(p)}`;if(!d.open)d.showModal()}
// Schedule: one future game (force winner, edit matchup) and the schedule header (regenerate, add a game).
function commissionerGameTools(day,index){const pair=state.schedule[day]?.[index];if(!pair)return '';const c=commissioner(),f=c.forcedGames[day+':'+pair[0]+'-'+pair[1]],abbr=id=>escapeHTML(state.teams[id].abbr);
 return `<div class="commissioner-tools commissioner-game">${commissionerBadge()}<label>Force winner<select onchange="commissionerAction(null,'schedule',{action:'force',day:${day},index:${index},winner:this.value})"><option value="">Normal result</option>${pair.map(id=>`<option value="${id}" ${f===id?'selected':''}>${abbr(id)} win</option>`).join('')}</select></label><details class="commissioner-edit"><summary>Edit matchup</summary><div><button type="button" onclick="commissionerAction(null,'schedule',{action:'swap',day:${day},index:${index}})">Swap home court</button><button type="button" onclick="const to=prompt('Move to which day? (${state.day+1}–${state.schedule.length})');if(to)commissionerAction(null,'schedule',{action:'move',day:${day},index:${index},to:Number(to)-1})">Move to another day</button><button type="button" onclick="commissionerAction(null,'schedule',{action:'remove',day:${day},index:${index}})">Remove game</button></div></details></div>`}
function commissionerScheduleTools(){const c=commissioner(),remaining=state.schedule.length-state.day;if(remaining<1)return '<p class="muted">The regular season is complete.</p>';
 return `<div class="commissioner-tools"><button type="button" onclick="commissionerAction(null,'regenerate')">${state.day===0?'Regenerate schedule':'Reshuffle remaining schedule'}</button><small>${state.day===0?'Builds a new schedule with the league’s current format.':'Keeps every remaining matchup and reshuffles the remaining '+remaining+' days.'}</small></div><form class="commissioner-tools" onsubmit="commissionerAction(event,'schedule')"><input type="hidden" name="action" value="add"><label>Day<select name="day">${state.schedule.slice(state.day).map((r,k)=>`<option value="${state.day+k}">Day ${state.day+k+1}</option>`).join('')}</select></label><label>Home<select name="home">${commissionerTeamOptions(null)}</select></label><label>Away<select name="away">${commissionerTeamOptions(null)}</select></label><button>Add game</button></form>${c.scheduleEdited?'<p class="muted">This season’s schedule has commissioner edits.</p>':''}`}
// Draft: lottery winner and first-round order.
function commissionerDraftTools(c=commissioner()){const d=state.draft,editable=commissionerDraftEditable();
 const winner=`<form class="commissioner-tools" onsubmit="commissionerAction(event,'lottery')"><label>Set lottery winner<select name="lotteryWinner"><option value="">No change · normal lottery</option>${commissionerTeamOptions(c.lotteryWinner)}</select></label><button>Save lottery winner</button><small>Applied when the lottery runs: this team moves to the first pick.</small></form>`;
 if(!editable)return winner+`<p class="muted">${d?.picks?.length?'The draft has started; the order is locked.':'Moving teams in the draft order opens after the lottery.'}</p>`;
 return winner+`<h4>Move team in draft order</h4><ol class="commissioner-order">${d.order.map((id,i)=>`<li>${escapeHTML(commissionerTeamName(id))} <button type="button" ${i===0?'disabled':''} onclick="commissionerAction(null,'draftMove',{id:${id},position:${i-1}})" aria-label="Move up">↑</button> <button type="button" ${i===d.order.length-1?'disabled':''} onclick="commissionerAction(null,'draftMove',{id:${id},position:${i+1}})" aria-label="Move down">↓</button> <button type="button" ${i===0?'disabled':''} onclick="commissionerAction(null,'draftMove',{id:${id},position:0})">Make #1</button></li>`).join('')}</ol>`}
// Awards: set the winner of each player award for a season.
function commissionerAwardTools(){const years=commissionerAwardYears();if(!years.length)return '<p class="muted">Award winners can be set after a regular season ends.</p>';const year=years.includes(commissionerUI.awardYear)?commissionerUI.awardYear:years[0],labels=Object.fromEntries(LEAGUE_HONORS),rec=k=>(state.regularAwards||[]).find(r=>r.year===year)?.[k]??(state.leagueHistory||[]).find(r=>r.year===year)?.[k]??null,players=commissionerPlayers();
 return `<div class="commissioner-tools"><label>Season<select onchange="commissionerUI.awardYear=Number(this.value);render()">${years.map(y=>`<option value="${y}" ${y===year?'selected':''}>${seasonLabel(y)}</option>`).join('')}</select></label></div><div class="tm-grid">${COMMISSIONER_PLAYER_AWARDS.map(k=>{const cur=rec(k);return `<label>Set winner · ${labels[k]||k}<select onchange="commissionerAction(null,'award',{year:${year},key:'${k}',player:this.value})"><option value="">${cur?escapeHTML(cur.name)+' (current)':'No winner'}</option>${players.map(x=>`<option value="${x.p.id}" ${cur?.id===x.p.id?'selected':''}>${escapeHTML(x.p.name)} · ${x.where}</option>`).join('')}</select></label>`}).join('')}</div><p class="muted">Changes update league history, player awards and the Hall of Fame record.</p>`}
// Trades: review switch, pending AI trades (approve / veto) and, in the Trade Center, forcing your offer through.
function commissionerTradeTools(c=commissioner(),{force=false}={}){
 return `<div class="commissioner-tools"><button type="button" aria-pressed="${c.tradeReview}" onclick="commissionerAction(null,'tradeReview',{on:${!c.tradeReview}})">Trade review: ${c.tradeReview?'On · AI trades wait here':'Off'}</button>${force?`<button type="button" onclick="commissionerAction(null,'forceTrade')">Force current offer</button><small>Completes your Trade Center offer even if the other team would decline.</small>`:''}</div>${c.pendingTrades.length?`<ul class="commissioner-trades">${c.pendingTrades.map(t=>`<li>${escapeHTML(t.text)} <button type="button" class="primary" onclick="commissionerAction(null,'trade',{id:${t.id},approve:true})">Approve</button> <button type="button" onclick="commissionerAction(null,'trade',{id:${t.id},approve:false})">Veto</button></li>`).join('')}</ul>`:'<p class="muted">No AI trades are waiting.</p>'}`}

/* ---- Commissioner home (Settings): on/off and the log of every edit ---- */
const COMMISSIONER_TOOL_SCREENS=[['Players','Edit player (profile and Players list)'],['Roster','Control a team, always win, AI roster moves'],['Team management','Same team tools'],['Schedule','Force winner, edit matchup, regenerate, add games'],['Draft','Lottery winner, draft order'],['Award races','Set award winners'],['League history','Set award winners by season'],['Trades','Trade review, approve / veto, force your offer'],['GM Inbox','Approve / veto AI trades']];
// Local date and time of a log entry (stored as ISO time).
function commissionerLogTime(at){const d=new Date(at);if(!Number.isFinite(d.getTime()))return at;const z=n=>String(n).padStart(2,'0');return d.getFullYear()+'-'+z(d.getMonth()+1)+'-'+z(d.getDate())+' '+z(d.getHours())+':'+z(d.getMinutes())}
function commissionerLogTable(c){const rows=(c.log||[]).slice(0,100);return rows.length?`<div class="scroll"><table class="commissioner-log"><thead><tr><th>When</th><th>Change</th><th>Before</th><th>After</th></tr></thead><tbody>${rows.map(e=>`<tr><td>${escapeHTML(seasonLabel(e.year))} · Day ${e.day}<small>${escapeHTML(commissionerLogTime(e.at))}</small></td><td>${escapeHTML(e.what)}</td><td>${escapeHTML(e.from)}</td><td>${escapeHTML(e.to)}</td></tr>`).join('')}</tbody></table></div>${(c.log||[]).length>100?'<p class="muted">Showing the latest 100 of '+c.log.length+' edits.</p>':''}`:'<p class="muted">No commissioner edits yet.</p>'}
function commissionerPanel(){const c=state.commissioner;
 if(!c?.enabled)return `<section class="panel commissioner"><div class="panelhead"><h2>Commissioner mode</h2><span>${c?.everUsed?'Previously used':'Off'}</span></div><div class="note"><p>Edit players, the schedule and award winners; force results; rig the draft; control any team; review AI trades. The tools appear on each screen with a gold Commissioner badge. This save will be marked as having used commissioner mode.</p><button class="primary" onclick="commissionerAction(null,'toggle',{enabled:true})">Enable commissioner mode</button>${c?.log?.length?`<h3>Commissioner log</h3>${commissionerLogTable(c)}`:''}</div></section>`;
 return `<section class="panel commissioner"><div class="panelhead"><h2>${commissionerBadge()} Commissioner mode</h2><span>On${c.pendingTrades.length?' · '+c.pendingTrades.length+' trade'+(c.pendingTrades.length===1?'':'s')+' to review':''}</span></div><div class="note"><p id="commissioner-message" class="muted" role="status">${escapeHTML(commissionerUI.message)}</p><p>Tools appear on these screens while commissioner mode is on:</p><ul class="commissioner-screens">${COMMISSIONER_TOOL_SCREENS.map(([v,what])=>`<li><button type="button" class="namebutton" onclick="go('${v}')">${v}</button> · ${what}</li>`).join('')}</ul><p><button type="button" onclick="commissionerAction(null,'toggle',{enabled:false})">Turn off commissioner mode</button> <small>Control returns to your franchise; managed teams, forced results and trade review pause until it is back on.</small></p><h3>Commissioner log</h3>${commissionerLogTable(c)}</div></section>`}

/* ---- Confirmation and log ---- */
function commissionerConfirm(question){return typeof confirm!=='function'||confirm(question)}
function commissionerGameLabel(pair){return state.teams[pair[1]].abbr+' @ '+state.teams[pair[0]].abbr}
function commissionerAwardLabel(key){return Object.fromEntries(LEAGUE_HONORS)[key]||key}
function commissionerQuestion(kind,a,v){const name=commissionerTeamName,day=Number(a.day??v.day),pair=state.schedule[day]?.[Number(a.index)];
 const q={control:()=>a.team===null?'Return control to your franchise?':`Control the ${name(a.team)}?`,managed:()=>`${a.on?'Stop':'Resume'} AI roster moves for the ${name(a.team)}?`,alwaysWinTeam:()=>a.on?`Make the ${name(a.team)} win every game?`:`Stop the ${name(a.team)} winning every game?`,tradeReview:()=>`Turn trade review ${a.on?'on':'off'}?`,
  player:()=>`Save changes to ${commissionerFindPlayer(a.id??commissionerUI.playerId)?.name||'this player'}?`,regenerate:()=>state.day===0?'Regenerate the whole schedule?':'Reshuffle the remaining schedule?',
  schedule:()=>{const act=a.action||v.action,g=pair?commissionerGameLabel(pair):'';return act==='force'?`Set the ${g} result on day ${day+1} to ${a.winner===''?'normal':state.teams[a.winner]?.abbr+' win'}?`:act==='swap'?`Swap home court for ${g} on day ${day+1}?`:act==='move'?`Move ${g} from day ${day+1} to day ${Number(a.to)+1}?`:act==='remove'?`Remove ${g} from day ${day+1}?`:`Add ${state.teams[v.away]?.abbr} @ ${state.teams[v.home]?.abbr} on day ${day+1}?`},
  lottery:()=>v.lotteryWinner===''?'Let the lottery run normally?':`Make the ${name(Number(v.lotteryWinner))} win the lottery?`,draftMove:()=>`Move the ${name(a.id)} to pick #${a.position+1}?`,
  award:()=>`Set the ${seasonLabel(a.year)} ${commissionerAwardLabel(a.key)} to ${a.player===''?'no winner':commissionerFindPlayer(Number(a.player))?.name||'this player'}?`,
  trade:()=>`${a.approve?'Approve':'Veto'} this trade? ${commissioner().pendingTrades.find(t=>t.id===a.id)?.text||''}`,forceTrade:()=>'Force your current Trade Center offer through? The other team accepts regardless of value.'}[kind];
 return 'Commissioner: '+(q?q():'Apply this change?')}
// What changed, read from the state before the edit (prev) and after it (state).
function commissionerDescribe(kind,a,v,prev,message){const pc=prev.commissioner||commissionerDefaults(),c=commissioner(),name=commissionerTeamName,onOff=x=>x?'On':'Off';
 const find=(data,id)=>[...data.teams.flatMap(t=>t.roster),...data.free,...(data.draft?.prospects||[])].find(p=>p.id===id);
 switch(kind){
  case 'toggle':return {what:'Commissioner mode',from:onOff(pc.enabled),to:onOff(c.enabled)};
  case 'control':return {what:'Controlled team',from:pc.activeTeam===null?'Your franchise':name(pc.activeTeam),to:c.activeTeam===null?'Your franchise':name(c.activeTeam)};
  case 'managed':return {what:'AI roster moves · '+name(a.team),from:pc.managedTeams.includes(a.team)?'Off (managed)':'On',to:c.managedTeams.includes(a.team)?'Off (managed)':'On'};
  case 'alwaysWinTeam':return {what:'Always win · '+name(a.team),from:onOff(pc.alwaysWin.includes(a.team)),to:onOff(c.alwaysWin.includes(a.team))};
  case 'tradeReview':return {what:'Trade review',from:onOff(pc.tradeReview),to:onOff(c.tradeReview)};
  case 'player':{const id=a.id??commissionerUI.playerId,old=find(prev,id),now=commissionerFindPlayer(id),fields=[['Name',p=>p?.name],['POS',p=>p?.pos],['Secondary',p=>(p?.secondaryPos||[]).join('/')||'none'],['Age',p=>p?.age],['OVR',p=>p?.ovr],['POT',p=>p?.pot],['Born',p=>p?.bio?.birthdate],['Hometown',p=>p?.bio?.hometown],['College',p=>p?.bio?.college],['Height',p=>p?.bio?.heightInches],['Weight',p=>p?.bio?.weightLbs]];
   const diff=fields.filter(([,f])=>String(f(old))!==String(f(now))),attrs=ATTRIBUTE_KEYS.filter(k=>old?.attributes?.[k]!==now.attributes[k]).length,tend=TENDENCY_KEYS.filter(k=>old?.tendencies?.[k]!==now.tendencies?.[k]).length;
   const side=p=>diff.map(([label,get])=>label+' '+get(p)).join(', '),extra=(attrs?` · ${attrs} attribute${attrs===1?'':'s'}`:'')+(tend?` · ${tend} tendenc${tend===1?'y':'ies'}`:'');
   return {what:'Player · '+now.name,from:(side(old)||'—')+extra,to:(side(now)||'No bio change')+(extra?' · edited':'')}}
  case 'schedule':{const act=a.action||v.action,day=Number(a.day??v.day),key=(d,p)=>d+':'+p[0]+'-'+p[1];
   if(act==='add')return {what:'Day '+(day+1)+' · game added',from:'—',to:commissionerGameLabel([Number(v.home),Number(v.away)])};
   const pair=prev.schedule[day][Number(a.index)],label=commissionerGameLabel(pair);
   if(act==='force'){const res=w=>w===undefined?'Normal result':state.teams[w].abbr+' win';return {what:'Day '+(day+1)+' · '+label+' result',from:res(pc.forcedGames[key(day,pair)]),to:res(c.forcedGames[key(day,pair)])}}
   if(act==='swap')return {what:'Day '+(day+1)+' · home court',from:label,to:commissionerGameLabel([pair[1],pair[0]])};
   if(act==='move')return {what:label+' · date',from:'Day '+(day+1),to:'Day '+(Number(a.to)+1)};
   return {what:'Day '+(day+1)+' · '+label,from:'Scheduled',to:'Removed'}}
  case 'regenerate':return {what:'Schedule',from:(prev.schedule.length-prev.day)+' days remaining',to:message};
  case 'lottery':return {what:'Lottery winner',from:pc.lotteryWinner===null?'Normal lottery':name(pc.lotteryWinner),to:c.lotteryWinner===null?'Normal lottery':name(c.lotteryWinner)};
  case 'draftMove':return {what:'Draft order · '+name(a.id),from:'Pick #'+(prev.draft.order.indexOf(a.id)+1),to:'Pick #'+(state.draft.order.indexOf(a.id)+1)};
  case 'award':{const get=data=>(data.regularAwards||[]).find(r=>r.year===a.year)?.[a.key]??(data.leagueHistory||[]).find(r=>r.year===a.year)?.[a.key]??null;return {what:seasonLabel(a.year)+' '+commissionerAwardLabel(a.key),from:get(prev)?.name||'No winner',to:get(state)?.name||'No winner'}}
  case 'trade':return {what:'Trade · '+(pc.pendingTrades.find(t=>t.id===a.id)?.text||'pending trade'),from:'Pending',to:message.replace(/\.$/,'')};
  case 'forceTrade':return {what:String(state.news?.[0]||'Trade Center offer'),from:'Declined by AI',to:'Forced through'};
  default:return {what:kind,from:'—',to:message}}}
function commissionerLog(entry){const c=commissioner();c.log??=[];c.log.unshift({at:new Date().toISOString(),year:state.year,day:state.day,what:String(entry.what).slice(0,200),from:String(entry.from).slice(0,300),to:String(entry.to).slice(0,300)});if(c.log.length>COMMISSIONER_LOG_LIMIT)c.log.length=COMMISSIONER_LOG_LIMIT}
// Forces the Trade Center offer through finalizeTradeCenter: the AI's decision is read as accepted for this one call.
async function commissionerForceTrade(){const m=tradeCenterModel();if(m.errors.length)throw Error(m.errors[0]);if(!m.out.length&&!m.incoming.length&&!m.outPicks.length&&!m.inPicks.length)throw Error('Build an offer in the Trade Center first.');
 const news=state.news[0],model=tradeCenterModel;tradeCenterModel=function(){const x=model();return {...x,fair:{...x.fair,accepted:true}}};
 try{await finalizeTradeCenter()}finally{tradeCenterModel=model}if(state.news[0]===news)throw Error('The trade could not be completed.');return 'Trade forced through.'}
// One entry point for every commissioner change: confirm, apply, log, save (or roll back), re-render with a message.
async function commissionerAction(event,kind,args={}){if(event){event.preventDefault()}const form=event?.target,v=form?Object.fromEntries(new FormData(form)):{};
 if(kind!=='toggle'&&!commissionerConfirm(commissionerQuestion(kind,args,v))){render();return false}const before=snapshotState();
 try{const c=commissioner();let message='Saved.';
  if(kind==='toggle'){c.enabled=!!args.enabled;if(c.enabled)c.everUsed=true;message=c.enabled?'Commissioner mode is on.':'Commissioner mode is off.'}
  else if(!c.enabled)throw Error('Turn on commissioner mode first.');
  else if(kind==='control'){const id=args.team===null||args.team===''?null:Number(args.team);if(id!==null&&!state.teams[id])throw Error('Choose a team.');c.activeTeam=id;message=id===null?'Control returned to your franchise.':'You now control the '+commissionerTeamName(id)+'.'}
  else if(kind==='managed'){if(!state.teams[args.team])throw Error('Choose a team.');c.managedTeams=c.managedTeams.filter(id=>id!==args.team).concat(args.on?[args.team]:[]);message='AI roster moves updated.'}
  else if(kind==='alwaysWinTeam'){if(!state.teams[args.team])throw Error('Choose a team.');c.alwaysWin=c.alwaysWin.filter(id=>id!==args.team).concat(args.on?[args.team]:[]);message='Always-win teams saved.'}
  else if(kind==='tradeReview'){c.tradeReview=!!args.on;message='Trade review is '+(c.tradeReview?'on.':'off.')}
  else if(kind==='player'){const p=commissionerEditPlayer(args.id??commissionerUI.playerId,v);message=p.name+' updated.'}
  else if(kind==='schedule'){commissionerScheduleEdit(args.action||v.action,{...v,...args});message='Schedule updated.'}
  else if(kind==='regenerate')message=commissionerRegenerateSchedule();
  else if(kind==='lottery'){c.lotteryWinner=v.lotteryWinner===''?null:Number(v.lotteryWinner);message=c.lotteryWinner===null?'Lottery will run normally.':state.teams[c.lotteryWinner].city+' will win the lottery.'}
  else if(kind==='draftMove'){commissionerMoveDraftTeam(args.id,args.position);message='Draft order updated.'}
  else if(kind==='award'){commissionerSetAward(args.year,args.key,args.player);message='Award updated.'}
  else if(kind==='trade')message=commissionerReviewTrade(args.id,args.approve);
  else if(kind==='forceTrade')message=await commissionerForceTrade();
  else throw Error('Unknown commissioner action.');
  commissionerLog(commissionerDescribe(kind,args,v,before,message));
  if(await save()===false)throw Error('Could not save. Please try again.');commissionerUI.message=message;toast(message)}
 catch(e){state=before;commissionerUI.message=e.message;toast(e.message);render();return false}
 if(kind==='player'){const d=document.getElementById('profile'),id=args.id??commissionerUI.playerId;if(d?.open&&typeof playerContext==='function'&&playerContext(id))openPlayerProfile(id);else d?.close?.()}
 render();return true}
const settingsBeforeCommissioner=settingsView;settingsView=function(){return settingsBeforeCommissioner()+commissionerPanel()};
// Editor validation: the browser's own message ("Value must be less than or equal to 99") never names the field and,
// on a phone, the field can be scrolled off or inside a closed section. Name the field and its range, open its
// section and mark it; typing clears the mark.
function commissionerFieldMessage(input){const label=input.labels?.[0]||input.closest('label'),name=(label?[...label.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim():'')||input.name,v=input.validity;
 if(v.valueMissing)return name+' is required.';if(v.rangeOverflow||v.rangeUnderflow||v.stepMismatch||v.badInput)return input.min!==''&&input.max!==''?name+': enter a whole number from '+input.min+' to '+input.max+'.':name+': enter a whole number.';return ''}
if(typeof document!=='undefined'&&document.addEventListener){
 document.addEventListener('invalid',e=>{const input=e.target;if(!input?.closest?.('.commissioner-player'))return;input.setCustomValidity('');const message=commissionerFieldMessage(input);if(message)input.setCustomValidity(message);input.classList.add('commissioner-invalid');const d=input.closest('details');if(d&&!d.open)d.open=true},true);
 document.addEventListener('input',e=>{const input=e.target;if(!input?.closest?.('.commissioner-player')||!input.classList?.contains('commissioner-invalid'))return;input.setCustomValidity('');if(input.checkValidity())input.classList.remove('commissioner-invalid')},true)}
