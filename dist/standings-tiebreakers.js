const TIEBREAKERS=[['tieHeadToHead','Head-to-head'],['tieDivisionLeader','Division winner'],['tieDivisionRecord','Division record'],['tieConferenceRecord','Conference record'],['tiePointDifferential','Point differential'],['tiePointRatio','Point ratio']];
function validateTiebreakerRules(rules){const priorities=TIEBREAKERS.map(([key])=>rules[key]).filter(n=>n>0);if(new Set(priorities).size!==priorities.length)throw Error('Give each enabled tiebreaker a unique priority from 1–6; use 0 to disable it.')}
function orderedTiebreakers(rules=leagueRules()){return TIEBREAKERS.filter(([key])=>rules[key]>0).sort((a,b)=>rules[a[0]]-rules[b[0]])}
function tiebreakCoin(t){let seed=2166136261;for(const c of `${state.year}:${t.key||t.id}`){seed^=c.charCodeAt(0);seed=Math.imul(seed,16777619)}return scheduleRandom(seed>>>0)()}
function recordCompare(a,b){return b.w*(a.w+a.l||1)-a.w*(b.w+b.l||1)||b.w-a.w}
function rankStandings(teams){
 const rules=orderedTiebreakers(),regular=state.history.filter(g=>g.stage==='Regular season'),games=new Map(state.teams.map(t=>[t.id,[]]));for(const g of regular){games.get(g.a)?.push(g);games.get(g.b)?.push(g)}
 const complete=t=>(games.get(t.id)||[]).length===t.w+t.l,divisionKey=t=>JSON.stringify([t.conference,t.divisionId||t.division]),leaders=new Set();
 const metric=(key,t,tied)=>{const all=games.get(t.id)||[],ids=new Set(tied.map(x=>x.id)),opponent=g=>state.teams[g.a===t.id?g.b:g.a];let rows=all;
  if(key==='tieDivisionLeader')return [leaders.has(t.id)?1:0,1];
  if(key==='tieHeadToHead')rows=all.filter(g=>ids.has(g.a===t.id?g.b:g.a));
  if(key==='tieDivisionRecord')rows=all.filter(g=>divisionKey(opponent(g))===divisionKey(t));
  if(key==='tieConferenceRecord')rows=all.filter(g=>opponent(g).conference===t.conference);
  if(key==='tiePointDifferential'||key==='tiePointRatio'){const scored=all.reduce((n,g)=>n+(g.a===t.id?g.sa:g.sb),0),allowed=all.reduce((n,g)=>n+(g.a===t.id?g.sb:g.sa),0);return key==='tiePointRatio'?(allowed>0?[scored,allowed]:null):[scored-allowed,1]}
  return rows.length?[rows.filter(g=>g.winner===t.id).length,rows.length]:null;
 };
 const resolve=(tied,criteria)=>{if(tied.length<2)return tied;
  for(const [key] of criteria){if(key==='tieDivisionRecord'&&new Set(tied.map(divisionKey)).size!==1||key==='tieConferenceRecord'&&new Set(tied.map(t=>t.conference)).size!==1)continue;if(key!=='tieDivisionLeader'&&!tied.every(complete))continue;
   const values=new Map(tied.map(t=>[t.id,metric(key,t,tied)]));if([...values.values()].some(v=>v===null))continue;const compare=(a,b)=>{const x=values.get(a.id),y=values.get(b.id);return y[0]*x[1]-x[0]*y[1]},sorted=[...tied].sort(compare),groups=[];for(const t of sorted){const group=groups.at(-1);if(!group||compare(group[0],t)!==0)groups.push([t]);else group.push(t)}
   if(groups.length>1)return groups.flatMap(group=>resolve(group,criteria));
  }
  return [...tied].sort((a,b)=>tiebreakCoin(b)-tiebreakCoin(a)||a.id-b.id);
 };
 const order=(list,criteria)=>{const sorted=[...list].sort(recordCompare),groups=[];for(const t of sorted){const last=groups.at(-1);if(!last||recordCompare(last[0],t)!==0)groups.push([t]);else last.push(t)}return groups.flatMap(group=>resolve(group,criteria))};
 if(rules.some(([key])=>key==='tieDivisionLeader')){const divisions=new Map();for(const t of state.teams){const key=divisionKey(t);if(!divisions.has(key))divisions.set(key,[]);divisions.get(key).push(t)}for(const division of divisions.values()){if(division.some(t=>t.w+t.l>0))leaders.add(order(division,rules.filter(([key])=>key!=='tieDivisionLeader'))[0].id)}}
 return order(teams,rules);
}
let tiebreakerSettingsBusy=false;
function standingsTiebreakerPanel(){const rules=leagueRules(),locked=seasonSettingsLocked(),fields=LEAGUE_SETTING_FIELDS.filter(([key])=>TIEBREAKERS.some(([k])=>k===key));return `<section class="panel"><form class="note" onsubmit="saveStandingsTiebreakers(event)">${leagueSettingsMarkup(rules,state.year,leagueSettingLock,[['Tiebreaker settings',fields]])}<p>Current order: ${orderedTiebreakers(rules).map(([,label])=>label).concat('Coin toss').join(' → ')}</p><p class="muted">Choose a unique priority for each enabled rule; 0 turns it off. Multi-team ties use games among the tied teams. When teams separate, the remaining tied teams restart the hierarchy. Unavailable statistics are skipped. Coin tosses are fixed for the season so refreshing does not reshuffle seeds.</p><p class="muted">Division winners are resolved with this same order, excluding the division-winner criterion.</p><p id="tiebreaker-error" role="alert"></p><button class="primary" ${locked||tiebreakerSettingsBusy?'disabled':''}>Save tiebreakers</button>${locked?'<small> Rules are locked until next preseason.</small>':''}</form></section>`}
async function saveStandingsTiebreakers(event){event.preventDefault();if(tiebreakerSettingsBusy||!ownerCanManage())return;const before=snapshotState();tiebreakerSettingsBusy=true;try{state.leagueSettings=readLeagueSettingsForm(Object.fromEntries(new FormData(event.target)));if(await save()===false)throw Error('Tiebreaker settings could not be saved. Please try again.');tiebreakerSettingsBusy=false;render();toast('Tiebreaker settings saved.')}catch(e){state=before;const el=document.getElementById('tiebreaker-error');if(el)el.textContent=e.message;else toast(e.message)}finally{tiebreakerSettingsBusy=false}}
