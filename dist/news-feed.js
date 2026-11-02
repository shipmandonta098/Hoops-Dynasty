// One season of stored (non-result) news plus undated legacy items; a 30-team season posts far fewer than this.
const NEWS_ITEM_LIMIT=5000;
const NEWS_CATEGORIES=['Results','All-Star','Injuries','Transactions','Draft','League','Franchise','Player Feat'];
let newsFeedUI={type:'all',scope:'all',query:'',season:'current',day:'all',group:'day',limit:30};
function newsIsInjury(text){return /\bmedical report:|\binjur(?:y|ies|ed)\b|\b(?:left|in) practice\b/i.test(text)}
function newsCategory(text){return /all.star/i.test(text)?'All-Star':newsIsInjury(text)?'Injuries':/draft|lottery|selects /i.test(text)?'Draft':/signs |signed |trade|release|contract/i.test(text)?'Transactions':/champion|playoff|all.star|season|deadline/i.test(text)?'League':'Franchise'}
function newsStore(){if(!state.newsFeed)state.newsFeed={nextId:1,items:[...state.news].map((text,i)=>({id:i+1,year:null,day:null,phase:'Earlier update',category:newsCategory(text),headline:text,detail:'',teams:[],game:null}))};state.newsFeed.items.forEach(n=>{if(n.category!=='Results'&&newsIsInjury(n.headline)){n.category='Injuries';for(const t of state.teams)if(n.headline.includes('('+t.abbr+')')&&!n.teams.includes(t.id))n.teams.push(t.id)}});state.newsFeed.nextId=Math.max(state.newsFeed.nextId,...state.newsFeed.items.map(n=>n.id+1),1);return state.newsFeed}
function addNewsItem(item){const feed=newsStore();feed.items.unshift({id:feed.nextId++,year:state.year,day:state.day,phase:seasonPhaseLabel(),detail:'',teams:[],game:null,...item});if(feed.items.length>NEWS_ITEM_LIMIT)feed.items=feed.items.slice(0,NEWS_ITEM_LIMIT)}
const sayBeforeNewsFeed=say;say=function(text){newsStore();sayBeforeNewsFeed(text);const teams=state.teams.filter(t=>text.includes(t.city+' ')||text.includes(t.city+':')||text.includes(t.city+'.')).map(t=>t.id);addNewsItem({category:newsCategory(text),headline:text,teams})};
// Game results aren't stored as news. Each game keeps its story facts (game-headlines.js) and the feed rebuilds the
// headline and box-score line from the season's games when a season or day is viewed.
const playBeforeNewsFeed=play;play=function(a,b,stage='Regular season'){const r=playBeforeNewsFeed(a,b,stage);r.story=gameHeadline(r).facts;return r};
function newsFeedChange(key,value){newsFeedUI[key]=value;if(key==='season')newsFeedUI.day='all';newsFeedUI.limit=30;if(key==='season'||key==='day')newsLoadSelection();render()}
function newsGameIndex(item){return item.game?.year===state.year?state.history.findIndex(g=>g.day===item.game.day&&g.a===item.game.a&&g.b===item.game.b&&g.stage===item.game.stage):-1}
function newsSeasonKey(n){return n.year===null?'unknown':String(n.year)}
function newsDayKey(n){return n.day===null?'unknown':String(n.day)}
// Day picker slots: Pre-season, Day 1…N, then the postseason and offseason phases.
const NEWS_PLAYOFF_STAGES=['First round','Conference semifinal','Conference final','Semifinal','Championship'],NEWS_LATE_PHASES=['Playoffs','Draft Lottery','Draft','Re-signing','Free Agency','Offseason'];
function newsSlot(n){if(n.day===null)return 'unknown';const phase=NEWS_PLAYOFF_STAGES.includes(n.phase)?'Playoffs':n.phase;if(NEWS_LATE_PHASES.includes(phase))return phase;if(n.day===0||phase==='Pre-season')return 'Pre-season';return String(n.day)}
function newsSlotLabel(slot){return slot==='unknown'?'Date unavailable':/^\d+$/.test(slot)?'Day '+slot:slot}
function newsSelectedSeason(){return newsFeedUI.season==='current'?String(state.year):newsFeedUI.season}
// Result items for games that carry story facts (games from before this update have none and keep their stored items).
function newsResultItem(g,year,order){const f=g.story;if(!f||!state.teams[g.a]||!state.teams[g.b])return null;const top=[...(g.box||[])].filter(r=>r.played!==false).sort((a,b)=>b.pts-a.pts)[0];
 return {id:'game:'+year+':'+g.day+':'+g.a+':'+g.b+':'+order,result:true,order,year,day:g.day,phase:g.stage,category:'Results',headline:headlineFromFacts(g,f),detail:top?`${top.name}: ${top.pts} PTS · ${top.reb} REB · ${top.ast} AST.`:'',teams:[g.a,g.b],game:{year,day:g.day,a:g.a,b:g.b,stage:g.stage}}}
let newsResultMemo=null;
function newsCurrentResults(){const h=state.history,key=state.year+':'+h.length+':'+(h[0]?.day??0);if(newsResultMemo?.key!==key)newsResultMemo={key,items:h.map((g,i)=>newsResultItem(g,state.year,i)).filter(Boolean)};return newsResultMemo.items}
// Finished seasons live in the archive storage. Their news and game days load when the season is picked; a day's game
// results load when that day (or Playoffs) is picked.
const newsArchive={league:null,years:null,seasons:new Map(),days:new Map()};
function newsArchiveReady(){return typeof careerStore!=='undefined'&&!!careerStore?.archivePage&&typeof activeSaveId!=='undefined'&&!!activeSaveId&&!simulationHeadless()}
function newsArchiveReset(){if(newsArchive.league!==(newsArchiveReady()?activeSaveId:null))Object.assign(newsArchive,{league:newsArchiveReady()?activeSaveId:null,years:null,seasons:new Map(),days:new Map()})}
async function newsArchiveLoad(map,key,work){if(map.has(key))return;const league=activeSaveId,entry={status:'loading'};map.set(key,entry);
 try{const value=await work(league);if(activeSaveId!==league)return;Object.assign(entry,{status:'ready'},value)}catch(e){entry.status='error';entry.error=e.message||String(e)}
 if(activeSaveId===league&&typeof view!=='undefined'&&view==='News feed')render()}
function newsLoadSelection(){if(!newsArchiveReady())return;newsArchiveReset();
 if(!newsArchive.years){newsArchive.years={status:'loading',list:[]};const league=activeSaveId,entry=newsArchive.years;Promise.all([careerStore.getArchiveYears(league,'news'),careerStore.getGameSeasons?.(league)||[]]).then(([a,b])=>{if(activeSaveId!==league)return;Object.assign(entry,{status:'ready',list:[...new Set([...a,...b])].filter(y=>y>0&&y<state.year)});if(view==='News feed')render()}).catch(e=>{entry.status='error';entry.error=e.message})}
 const year=Number(newsSelectedSeason());if(!Number.isInteger(year)||year>=state.year)return;
 newsArchiveLoad(newsArchive.seasons,year,async league=>{const items=[];let after=null;do{const page=await careerStore.archivePage(league,'news',{seasonId:year,limit:500,after});items.push(...page.rows.map(r=>r.value));after=page.next}while(after);return {items,gameDays:careerStore.getGameDays?await careerStore.getGameDays(league,year):[]}}).then(()=>{
  const season=newsArchive.seasons.get(year),day=newsArchiveGameDay(year,newsFeedUI.day);if(season?.status!=='ready'||day===null)return;
  newsArchiveLoad(newsArchive.days,year+':'+day,async league=>({items:(await careerStore.getDayGames(league,year,day)).map((g,i)=>newsResultItem(g,year,i)).filter(Boolean)}))})}
// The game day an archived selection needs: a day number, or the playoff day (every playoff game is on the day after
// the regular season).
function newsArchiveGameDay(year,slot){const days=newsArchive.seasons.get(year)?.gameDays||[];if(/^\d+$/.test(slot))return days.includes(Number(slot))?Number(slot):null;return slot==='Playoffs'&&days.length>1?Math.max(...days):null}
function newsArchiveLastDay(year){const days=newsArchive.seasons.get(year)?.gameDays||[];return days.length>1?Math.max(...days)-1:days.length?days[0]:0}
// Stored (non-result) items for the selected season: in memory for the current season and undated items, plus the
// archive for a finished season (an old save may still hold some finished-season items in memory).
function newsSeasonItems(season){const mem=newsStore().items.filter(n=>season==='all'||newsSeasonKey(n)===season),year=Number(season);
 if(season==='all'||season==='unknown'||year>=state.year)return mem;const loaded=newsArchive.seasons.get(year)?.items||[],ids=new Set(mem.map(n=>n.id));return [...mem,...loaded.filter(n=>!ids.has(n.id))]}
function newsSeasonResults(season,slot){const year=Number(season);if(season==='unknown')return [];if(season==='all'||year===state.year)return newsCurrentResults();if(year>state.year)return [];const day=newsArchiveGameDay(year,slot);return day===null?[]:newsArchive.days.get(year+':'+day)?.items||[]}
function newsDateChoices(){newsArchiveReset();const items=newsStore().items,current=String(state.year),archived=(newsArchive.years?.list||[]).map(String);
 const seasons=[...new Set([current,...items.map(newsSeasonKey),...archived])].sort((a,b)=>a==='unknown'?1:b==='unknown'?-1:Number(b)-Number(a));
 if(newsFeedUI.season!=='current'&&newsFeedUI.season!=='all'&&!seasons.includes(newsFeedUI.season)){newsFeedUI.season='current';newsFeedUI.day='all'}
 const season=newsSelectedSeason(),present=new Set([...newsSeasonItems(season),...(season==='all'?newsCurrentResults():[])].map(newsSlot));let days;
 if(season==='all'||season==='unknown')days=[...present].filter(x=>x!=='unknown').sort((a,b)=>newsSlotRank(b)-newsSlotRank(a)).concat(present.has('unknown')?['unknown']:[]);
 else{const year=Number(season),live=year===state.year,last=live?Math.min(state.day,seasonLength()):Math.max(newsArchiveLastDay(year),...[...present].filter(x=>/^\d+$/.test(x)).map(Number),0);
  const reached=live?NEWS_LATE_PHASES.filter(p=>present.has(p)||p===seasonPhaseLabel()||p==='Playoffs'&&state.day>=seasonLength()):NEWS_LATE_PHASES;
  days=[...[...reached].reverse(),...Array.from({length:last},(_,i)=>String(last-i)),'Pre-season',...(present.has('unknown')?['unknown']:[])]}
 if(newsFeedUI.day!=='all'&&!days.includes(newsFeedUI.day))newsFeedUI.day='all';return {seasons,days}}
function newsSlotRank(slot){return slot==='unknown'?-2:slot==='Pre-season'?-1:/^\d+$/.test(slot)?Number(slot):1e6+NEWS_LATE_PHASES.indexOf(slot)}
function newsDateControls(){const {seasons,days}=newsDateChoices(),season=newsSelectedSeason();return `<label>Season<select onchange="newsFeedChange('season',this.value)">${seasons.map(y=>`<option value="${y}" ${season===y?'selected':''}>${y==='unknown'?'Date unavailable':seasonLabel(Number(y))+' season'}</option>`).join('')}<option value="all" ${season==='all'?'selected':''}>All loaded seasons</option></select></label><label>Day<select onchange="newsFeedChange('day',this.value)"><option value="all">All days</option>${days.map(d=>`<option value="${d}" ${newsFeedUI.day===d?'selected':''}>${newsSlotLabel(d)}</option>`).join('')}</select></label><label>Group by<select onchange="newsFeedChange('group',this.value)">${[['day','Day'],['season','Season'],['none','Continuous feed']].map(([v,label])=>`<option value="${v}" ${newsFeedUI.group===v?'selected':''}>${label}</option>`).join('')}</select></label>`}
// Newest first: by season, then day slot; within a day, stored news (newest first) above that day's results.
function newsCompare(a,b){return (b.year??-1)-(a.year??-1)||newsSlotRank(newsSlot(b))-newsSlotRank(newsSlot(a))||(b.day??-1)-(a.day??-1)||(a.result?1:0)-(b.result?1:0)||(a.result?a.order-b.order:b.id-a.id)}
function newsFeedRows(){newsDateChoices();const season=newsSelectedSeason(),q=newsFeedUI.query.toLowerCase(),keep=n=>(newsFeedUI.day==='all'||newsSlot(n)===newsFeedUI.day)&&(newsFeedUI.type==='all'||n.category===newsFeedUI.type)&&(newsFeedUI.scope==='all'||n.teams.includes(controlledTeamId()))&&(!q||(n.headline+' '+n.detail).toLowerCase().includes(q));
 const stored=newsSeasonItems(season).filter(keep),results=newsSeasonResults(season,newsFeedUI.day).filter(keep);
 return newsFeedUI.group==='none'?[...stored,...results]:[...stored,...results].sort(newsCompare)}
// Status line for archived seasons (loading, errors, and the hint to pick a day for game results).
function newsArchiveNote(){const season=newsSelectedSeason(),year=Number(season);if(!Number.isInteger(year)||year>=state.year)return '';
 if(!newsArchiveReady())return '';const s=newsArchive.seasons.get(year);if(!s||s.status==='loading')return '<p class="note" role="status">Loading the '+escapeHTML(seasonLabel(year))+' season…</p>';
 if(s.status==='error')return '<p class="note" role="alert">This season could not load: '+escapeHTML(s.error)+'</p>';
 const day=newsArchiveGameDay(year,newsFeedUI.day),d=day===null?null:newsArchive.days.get(year+':'+day);
 if(d?.status==='loading')return '<p class="note" role="status">Loading game results…</p>';if(d?.status==='error')return '<p class="note" role="alert">Game results could not load: '+escapeHTML(d.error)+'</p>';
 return newsFeedUI.day==='all'?'<p class="note">Pick a day (or Playoffs) to see that day\'s game results.</p>':''}
// Resolve display text at render time; keep saved news as plain text.
function newsLinkEntities(){
 const names=new Map(),add=(name,kind,id,teamId=null)=>{if(!name||!Number.isInteger(id))return;const list=names.get(name)||[];if(!list.some(e=>e.kind===kind&&e.id===id))list.push({kind,id,teamId});names.set(name,list)};
 for(const t of state.teams){for(const name of [t.city+' '+t.name,t.city,t.name,t.abbr])add(name,'team',t.id,t.id);for(const p of t.roster)add(p.name,'player',p.id,t.id)}
 for(const p of state.free)add(p.name,'player',p.id);
 for(const p of state.draft?.prospects||[])add(p.name,'draft',p.id);
 const aliases=[...names.keys()].sort((a,b)=>b.length-a.length).map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));
 return {names,pattern:aliases.length?new RegExp('(^|[^\\p{L}\\p{N}_])('+aliases.join('|')+')(?=$|[^\\p{L}\\p{N}_])','gu'):null};
}
function newsLinkedText(text,item,links){
 if(!links.pattern)return escapeHTML(text);let end=0,result='';links.pattern.lastIndex=0;
 for(const match of text.matchAll(links.pattern)){const start=match.index+match[1].length,name=match[2],all=links.names.get(name),tagged=all.filter(e=>item.teams?.includes(e.teamId)),choices=all.length===1?all:tagged;
 result+=escapeHTML(text.slice(end,start));const e=choices.length===1?choices[0]:null;
 if(e){const action=e.kind==='team'?'newsOpenTeam':e.kind==='draft'?'draftReport':'profile',label=e.kind==='team'?'Open team roster':e.kind==='draft'?'Open prospect profile':'Open player profile';result+=`<button type="button" class="news-entity-link" onclick="${action}(${e.id})" aria-label="${label}: ${escapeHTML(name)}">${escapeHTML(name)}</button>`}else result+=escapeHTML(name);
 end=start+name.length;
 }
 return result+escapeHTML(text.slice(end));
}
const newsGoBefore=go;go=function(v){const r=newsGoBefore(v);if(v==='News feed')newsLoadSelection();return r};
function newsOpenTeam(id){if(!state.teams.some(t=>t.id===id))return;rosterTeamId=id;go('Roster')}
function newsFeedView(){const rows=newsFeedRows(),links=newsLinkEntities();let previousGroup=null;return `<section class="panel news-feed"><div class="panelhead"><div><div class="eyebrow">${escapeHTML(state.leagueName)}</div><h2>League wire</h2></div><span class="muted">${rows.length} updates</span></div><div class="news-controls"><label>Coverage<select onchange="newsFeedChange('scope',this.value)"><option value="all" ${newsFeedUI.scope==='all'?'selected':''}>Entire league</option><option value="team" ${newsFeedUI.scope==='team'?'selected':''}>My team</option></select></label><label>News type<select onchange="newsFeedChange('type',this.value)"><option value="all">All news</option>${NEWS_CATEGORIES.map(c=>`<option ${newsFeedUI.type===c?'selected':''}>${c}</option>`).join('')}</select></label>${newsDateControls()}<label class="news-search">Search<input type="search" value="${escapeHTML(newsFeedUI.query)}" placeholder="Player, team or headline" onchange="newsFeedChange('query',this.value)"></label></div>${newsArchiveNote()}<div class="news-timeline">${rows.slice(0,newsFeedUI.limit).map(n=>{const result=newsGameIndex(n),club=state.teams[n.teams[0]],group=newsFeedUI.group==='none'?null:newsSeasonKey(n)+(newsFeedUI.group==='day'?':'+newsSlot(n):''),heading=group!==previousGroup?`<h3 class="news-date-heading">${n.year===null?'Date unavailable':seasonLabel(n.year)+' season'}${newsFeedUI.group==='day'&&n.year!==null?' · '+(n.day===null?'Day unavailable':newsSlotLabel(newsSlot(n))):''}</h3>`:'';previousGroup=group;return `${heading}<article class="news-article"><div class="news-mark">${club?'<button class="namebutton" onclick="newsOpenTeam('+club.id+')" aria-label="Open team">'+secondaryTeamLogo(club)+'</button>':gmIcon(n.category==='Transactions'?'trade':'mail')}</div><div class="news-copy"><div class="news-meta"><span>${escapeHTML(n.category)}</span><span>${n.year===null?'Earlier update · date unavailable':seasonLabel(n.year)+' season · '+escapeHTML(n.phase)+(/^\d+$/.test(newsSlot(n))?' · Day '+n.day:'')}</span></div><h3>${newsLinkedText(n.headline,n,links)}</h3>${n.detail?`<p>${newsLinkedText(n.detail,n,links)}</p>`:''}${n.featId?featNewsExtras(n):''}${!n.featId&&result>=0?`<button onclick="showResult(${result})">View results</button>`:''}</div></article>`}).join('')||'<div class="note">No news matches these filters. Try another category or advance the season.</div>'}</div>${rows.length>newsFeedUI.limit?'<div class="news-more"><button onclick="newsFeedUI.limit+=30;render()">Load more updates</button></div>':''}<p class="note">Every season's news is kept with your career; earlier seasons load when you pick them. Game results come from each season's games. Earlier imported messages may not have dates or team tags.</p></section>`}
function readNewsFeed(raw,bad,count){if(raw===undefined)return undefined;if(!raw||!Number.isInteger(raw.nextId)||raw.nextId<1||!Array.isArray(raw.items)||raw.items.length>NEWS_ITEM_LIMIT)bad('invalid news feed');const ids=new Set();return {nextId:raw.nextId,items:raw.items.map(n=>{if(!n||!Number.isInteger(n.id)||n.id<1||ids.has(n.id)||!NEWS_CATEGORIES.includes(n.category)||typeof n.headline!=='string'||n.headline.length>2000||typeof n.detail!=='string'||n.detail.length>2000||typeof n.phase!=='string'||n.phase.length>80||n.year!==null&&(!Number.isInteger(n.year)||n.year<1900||n.year>10000)||n.day!==null&&(!Number.isInteger(n.day)||n.day<0||n.day>367)||!Array.isArray(n.teams)||n.teams.length>count||n.teams.some(id=>!Number.isInteger(id)||id<0||id>=count))bad('invalid news item');ids.add(n.id);const g=n.game;if(g&&(!Number.isInteger(g.year)||g.year<1900||g.year>10000||!Number.isInteger(g.day)||g.day<1||g.day>367||![g.a,g.b].every(id=>Number.isInteger(id)&&id>=0&&id<count)||g.a===g.b||!['Regular season','First round','Conference semifinal','Conference final','Semifinal','Championship'].includes(g.stage)))bad('invalid news result link');if(n.featId!==undefined&&(typeof n.featId!=='string'||n.featId.length>250))bad('invalid feat news reference');if(n.story!==undefined&&(typeof n.story!=='string'||!/^[A-Za-z]+:\d{1,2}$/.test(n.story)))bad('invalid news story reference');return {...(n.featId!==undefined?{featId:n.featId}:{}),...(n.story!==undefined?{story:n.story}:{}),id:n.id,year:n.year,day:n.day,phase:n.phase,category:n.category,headline:n.headline,detail:n.detail,teams:[...n.teams],game:g?{year:g.year,day:g.day,a:g.a,b:g.b,stage:g.stage}:null}})}}
