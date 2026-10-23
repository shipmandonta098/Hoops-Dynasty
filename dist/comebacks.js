/* Comebacks and blown leads: per-game lead tracking from recorded scoring events,
 * persistent league/season/playoff/franchise record tables, broadcast-style callouts
 * (Courtside banner, Game Summary "Game Story", postgame card, News Feed stories).
 * Every value comes from summaryData scoring events; nothing is estimated. In one game
 * the winner's largest deficit equals the loser's largest lead, so a comeback win and a
 * blown lead are the same amount seen from each franchise's side.
 * Tables are bounded: all-time and playoff top lists, every 10+ game of the current season
 * (past seasons keep their top entries) and an exact best per franchise. Entries tied with
 * a cutoff are kept, so ranks and "tied for" wording stay correct within the listed ranks. */
const COMEBACK_CONFIG=Object.freeze({
 leadMilestone:15,leadStep:5,         // Courtside: lead banners at 15, 20, 25…
 watchMin:20,watchCutTo:9,            // comeback watch: down 20+, cut to single digits
 takeLeadMin:15,                      // banner when a team takes the lead after trailing by 15+
 noteMin:15,newsMin:20,franchiseMinGames:20,               // historical notes from 15; news from 20 (or any league/playoff/season record)
 leagueRankMax:10,playoffRankMax:5,seasonRankMax:3,
 keepAllTime:50,keepPlayoffs:25,keepSeason:5,seasonDetailMin:10,
 bannerPlays:25                       // a live banner stays up for this many plays
});
const COMEBACK_STAGES=['Regular season','First round','Conference semifinal','Conference final','Semifinal','Championship'];
const comebackOrdinal=n=>n+(n%100>=11&&n%100<=13?'th':['th','st','nd','rd'][n%10]||'th');

// ---- Per-game computation --------------------------------------------------------------
function comebackStats(g,upto=Infinity){
 const data=g?.summaryData;if(!data||!Array.isArray(data.events))return null;
 const events=data.events.filter(e=>upto===Infinity||e.index<=upto),score=[0,0],lead=[0,0],leadAt=[null,null],flow=[];
 for(const e of events){score[e.side]+=e.points;const diff=score[0]-score[1];for(const side of [0,1]){const v=side?-diff:diff;if(v>lead[side]){lead[side]=v;leadAt[side]={period:e.period,seconds:e.seconds,index:e.index}}}flow.push({e,diff,score:[...score]})}
 const final=upto===Infinity;if(final&&(!data.complete||score[0]!==g.sa||score[1]!==g.sb))return null;
 const out={lead,leadAt,score,flow,events};
 if(final){const w=g.sa>g.sb?0:1,l=1-w;out.winner=w;out.amount=lead[l];
  // Loser's best comeback attempt: its largest deficit, then the closest it got afterwards.
  const peak=flow.findIndex(f=>(w?-f.diff:f.diff)===lead[w]);let to=lead[w];for(const f of flow.slice(peak+1))to=Math.min(to,Math.max(0,w?-f.diff:f.diff));
  out.attempt={side:l,from:lead[w],to}}
 return out}
function comebackGameId(g,year=state.year){return year+':'+g.day+':'+g.a+':'+g.b+':'+COMEBACK_STAGES.indexOf(g.stage)}
function comebackTeamSnap(t){return {key:t.key,abbr:t.abbr,city:t.city,name:t.name}}

// ---- Persistent store --------------------------------------------------------------------
function comebackStore(){
 if(state.comebackRecords)return state.comebackRecords;
 const full=!(state.leagueHistory?.length)&&!(state.championsArchive?.length);
 const store=state.comebackRecords={version:1,since:{year:state.year,day:state.day},full,games:0,allTime:[],playoffs:[],seasons:{},franchise:{}};
 // Backfill completed games still in this season's history (stats only; notes are not written retroactively).
 for(const g of state.history.filter(g=>COMEBACK_STAGES.includes(g.stage)).sort((a,b)=>a.day-b.day)){const s=comebackStats(g);if(s){comebackRecord(g,s);store.backfilled=(store.backfilled||0)+1;store.since.day=Math.min(store.since.day,g.day-1)}}
 return store}
function comebackTrim(list,keep){list.sort((a,b)=>b.amount-a.amount||a.year-b.year||a.day-b.day);if(list.length<=keep)return list;const cutoff=list[keep-1].amount;return list.filter((e,i)=>i<keep||e.amount===cutoff)}
function comebackFranchise(key){const f=comebackStore().franchise;return f[key]??={games:0,comeback:{all:null,playoffs:null},blown:{all:null,playoffs:null}}}
function comebackBest(rec,amount,id){if(!rec||amount>rec.amount)return {amount,games:[id]};if(amount===rec.amount&&!rec.games.includes(id))rec.games=[...rec.games,id].slice(-10);return rec}
function comebackRecord(g,s){
 const store=comebackStore(),id=comebackGameId(g),playoff=g.stage!=='Regular season',w=state.teams[s.winner?g.b:g.a],l=state.teams[s.winner?g.a:g.b];
 const entry={id,year:state.year,day:g.day,stage:g.stage,playoff,amount:s.amount,winner:comebackTeamSnap(w),loser:comebackTeamSnap(l),score:[Math.max(g.sa,g.sb),Math.min(g.sa,g.sb)],lead:s.leadAt[1-s.winner]?{period:s.leadAt[1-s.winner].period,seconds:s.leadAt[1-s.winner].seconds}:null};
 if([store.allTime,store.playoffs,...Object.values(store.seasons)].some(list=>list.some(e=>e.id===id)))return entry;
 store.games++;for(const t of [w,l])comebackFranchise(t.key).games++;
 if(s.amount>0){
  for(const [part,key] of [['comeback',w.key],['blown',l.key]]){const f=comebackFranchise(key)[part];f.all=comebackBest(f.all,s.amount,id);if(playoff)f.playoffs=comebackBest(f.playoffs,s.amount,id)}
  store.allTime=comebackTrim([...store.allTime,entry],COMEBACK_CONFIG.keepAllTime);if(playoff)store.playoffs=comebackTrim([...store.playoffs,entry],COMEBACK_CONFIG.keepPlayoffs);
  if(s.amount>=COMEBACK_CONFIG.seasonDetailMin)(store.seasons[state.year]??=[]).push(entry);
 }
 // Past seasons keep only their top entries; the current season stays complete from the detail threshold.
 for(const y of Object.keys(store.seasons))if(+y<state.year&&store.seasons[y].length>COMEBACK_CONFIG.keepSeason)store.seasons[y]=comebackTrim(store.seasons[y],COMEBACK_CONFIG.keepSeason);
 return entry}
// Rank among a list that excludes the game itself: 1 + games strictly larger; tie if any equal.
function comebackRank(list,amount,id){const others=list.filter(e=>e.id!==id);return {rank:1+others.filter(e=>e.amount>amount).length,tied:others.some(e=>e.amount===amount)}}
function comebackRankText({rank,tied},what,scope){return (tied?'Tied for '+(rank===1?'the largest':comebackOrdinal(rank)+'-largest'):rank===1?'Largest':comebackOrdinal(rank)+'-largest')+' '+what+' '+scope}
function comebackScopeLabel(){const s=comebackStore();return s.full?'in league history':'since tracking began ('+s.since.year+')'}
function comebackContext(g){const store=comebackStore(),best=list=>list.length?Math.max(...list.map(e=>e.amount)):0,season=(store.seasons[state.year]||[]),fr=t=>{const f=store.franchise[t.key];return {comeback:f?.comeback.all?.amount||0,blown:f?.blown.all?.amount||0,comebackPlayoffs:f?.comeback.playoffs?.amount||0,blownPlayoffs:f?.blown.playoffs?.amount||0}};
 return {league:best(store.allTime),playoffs:best(store.playoffs),season:best(season),franchise:[fr(state.teams[g.a]),fr(state.teams[g.b])]}}
function comebackNotes(g,s,ctx){
 const store=comebackStore(),id=comebackGameId(g),c=COMEBACK_CONFIG,notes=[],A=s.amount,playoff=g.stage!=='Regular season',w=s.winner,l=1-w,clubs=[state.teams[g.a],state.teams[g.b]];if(A<c.noteMin)return notes;
 const established=store.games>=state.teams.length*41,league=comebackRank(store.allTime,A,id);if(league.rank<=(established?c.leagueRankMax:3))notes.push({kind:'league',side:w,text:comebackRankText(league,'comeback win',comebackScopeLabel())});
 if(playoff){const p=comebackRank(store.playoffs,A,id);if(p.rank<=c.playoffRankMax)notes.push({kind:'playoffs',side:w,text:comebackRankText(p,'playoff comeback',comebackScopeLabel())})}
 const season=comebackRank(store.seasons[state.year]||[],A,id);if(season.rank<=c.seasonRankMax)notes.push({kind:'season',side:w,text:comebackRankText(season,'comeback win','of the '+state.year+' season')});
 const fw=ctx.franchise[w],fl=ctx.franchise[l],seasoned=t=>(store.franchise[t.key]?.games||0)>=c.franchiseMinGames;
 if(seasoned(clubs[w])&&A>=fw.comeback)notes.push({kind:'franchise',side:w,text:(A===fw.comeback?'Ties the largest':'Largest')+' comeback win in '+clubs[w].city+' franchise history'});
 if(playoff&&seasoned(clubs[w])&&A>=fw.comebackPlayoffs)notes.push({kind:'franchise',side:w,text:(A===fw.comebackPlayoffs?'Ties the largest':'Largest')+' playoff comeback in '+clubs[w].city+' franchise history'});
 if(seasoned(clubs[l])&&A>=fl.blown)notes.push({kind:'blown',side:l,text:(A===fl.blown?'Ties the largest':'Largest')+' blown lead in '+clubs[l].city+' franchise history'});
 return notes.slice(0,4)}

// ---- Game hook ---------------------------------------------------------------------------
function comebackClock(g,at){return at?summaryClock(g,at):''}
function comebackNews(g,s,notes,result){
 const c=COMEBACK_CONFIG,A=s.amount,w=state.teams[s.winner?g.b:g.a],l=state.teams[s.winner?g.a:g.b],playoff=g.stage!=='Regular season',kinds=new Set(notes.map(n=>n.kind));
 const seasonTop=notes.some(n=>n.kind==='season'&&/^(Largest|Tied for the largest)/.test(n.text)),leagueTop=notes.some(n=>n.kind==='league'&&/^(Largest|Tied for the largest)/.test(n.text));
 if(!(A>=c.newsMin||leagueTop||kinds.has('playoffs')))return;
 const headline=kinds.has('league')&&/^Largest/.test(notes.find(n=>n.kind==='league').text)?'Historic rally: '+w.city+' erase '+A+'-point deficit, largest comeback '+comebackScopeLabel()
  :playoff?'Playoff collapse: '+l.city+' '+l.name+' lose after leading by '+A
  :kinds.has('blown')&&A>=c.newsMin?l.city+' blow biggest lead in team history as '+w.city+' rally from '+A+' down'
  :seasonTop?'Largest comeback of the season: '+w.city+' stun '+l.city+' after trailing by '+A
  :w.city+' erase '+A+'-point deficit to stun '+l.city;
 const at=s.leadAt[1-s.winner],top=t=>[...result.box].filter(p=>p.team===t.abbr).sort((a,b)=>b.pts-a.pts)[0],periods=[0,0].map(()=>[]);
 for(const f of s.flow){const p=f.e.period;(periods[0][p]??=0);(periods[1][p]??=0);periods[f.e.side][p]+=f.e.points}
 const late=periods[0].length-1,lateW=periods[s.winner][late]||0,lateL=periods[1-s.winner][late]||0,players=[top(w),top(l)].filter(Boolean);
 const detail=[l.abbr+' led by '+A+(at?' ('+comebackClock(g,at)+')':'')+'; '+w.abbr+' won '+Math.max(g.sa,g.sb)+'–'+Math.min(g.sa,g.sb)+'.',
  w.abbr+' outscored '+l.abbr+' '+lateW+'–'+lateL+' in '+summaryPeriodName(g,late)+'.',
  players.length?'Key players: '+players.map(p=>p.name+' ('+p.team+') '+p.pts+' PTS').join(', ')+'.':'',
  notes.length?'Historical: '+notes.map(n=>n.text).join('; ')+'.':''].filter(Boolean).join(' ');
 addNewsItem({category:'Results',headline,detail:detail.slice(0,2000),teams:[g.a,g.b],day:g.day,phase:g.stage,game:{year:state.year,day:g.day,a:g.a,b:g.b,stage:g.stage}})}
// Runs once per completed game, before the result is stored in history.
function comebackProcess(r){if(!COMEBACK_STAGES.includes(r?.stage))return null;const s=comebackStats(r);if(!s)return null;comebackStore();const ctx=comebackContext(r);comebackRecord(r,s);const notes=comebackNotes(r,s,ctx);
 r.comeback={version:1,largestLeadHome:s.lead[0],largestLeadAway:s.lead[1],leadAt:s.leadAt.map(x=>x?{period:x.period,seconds:x.seconds}:null),winningTeamLargestDeficit:s.amount,losingTeamLargestLead:s.amount,comebackWinAmount:s.amount,blownLeadAmount:s.amount,attempt:s.attempt,notes,context:ctx};
 comebackNews(r,s,notes,r);return r.comeback}
const playBeforeComebacks=play;play=function(a,b,stage='Regular season'){
 const r=playBeforeComebacks(a,b,stage);
 try{comebackProcess(r)}catch(e){if(typeof simulationHeadless==='function'&&simulationHeadless())throw e;console.error('Comeback tracking failed',e)}
 return r};

// ---- Validation (save/load) ----------------------------------------------------------------
function readGameComeback(v,bad){
 const n=(x,max=500)=>Number.isInteger(x)&&x>=0&&x<=max,at=x=>x===null||x&&Number.isInteger(x.period)&&x.period>=0&&x.period<20&&Number.isInteger(x.seconds)&&x.seconds>=0&&x.seconds<=50000;
 if(!v||v.version!==1||!['largestLeadHome','largestLeadAway','winningTeamLargestDeficit','losingTeamLargestLead','comebackWinAmount','blownLeadAmount'].every(k=>n(v[k]))||!Array.isArray(v.leadAt)||v.leadAt.length!==2||!v.leadAt.every(at)||!v.attempt||![0,1].includes(v.attempt.side)||!n(v.attempt.from)||!n(v.attempt.to)||!Array.isArray(v.notes)||v.notes.length>6||v.notes.some(x=>!x||typeof x.text!=='string'||x.text.length>200||![0,1].includes(x.side)||!['league','playoffs','season','franchise','blown'].includes(x.kind))||!v.context||!['league','playoffs','season'].every(k=>n(v.context[k]))||!Array.isArray(v.context.franchise)||v.context.franchise.length!==2||v.context.franchise.some(f=>!f||!['comeback','blown','comebackPlayoffs','blownPlayoffs'].every(k=>n(f[k]))))bad('invalid comeback data');
 return {version:1,largestLeadHome:v.largestLeadHome,largestLeadAway:v.largestLeadAway,leadAt:v.leadAt.map(x=>x&&{period:x.period,seconds:x.seconds}),winningTeamLargestDeficit:v.winningTeamLargestDeficit,losingTeamLargestLead:v.losingTeamLargestLead,comebackWinAmount:v.comebackWinAmount,blownLeadAmount:v.blownLeadAmount,attempt:{side:v.attempt.side,from:v.attempt.from,to:v.attempt.to},notes:v.notes.map(x=>({kind:x.kind,side:x.side,text:x.text})),context:{league:v.context.league,playoffs:v.context.playoffs,season:v.context.season,franchise:v.context.franchise.map(f=>({comeback:f.comeback,blown:f.blown,comebackPlayoffs:f.comebackPlayoffs,blownPlayoffs:f.blownPlayoffs}))}}}
function readComebackRecords(v,bad){
 if(v===undefined)return undefined;
 const str=(s,max=80)=>typeof s==='string'&&s.length<=max,yr=y=>Number.isInteger(y)&&y>=1900&&y<=10000,team=t=>t&&['key','abbr','city','name'].every(k=>str(t[k])),id=s=>str(s,80)&&/^\d+:\d+:\d+:\d+:\d+$/.test(s);
 const entry=e=>{if(!e||!id(e.id)||!yr(e.year)||!Number.isInteger(e.day)||e.day<0||e.day>400||!COMEBACK_STAGES.includes(e.stage)||typeof e.playoff!=='boolean'||!Number.isInteger(e.amount)||e.amount<0||e.amount>500||!team(e.winner)||!team(e.loser)||!Array.isArray(e.score)||e.score.length!==2||!e.score.every(x=>Number.isInteger(x)&&x>=0&&x<=500)||e.lead!==null&&!(e.lead&&Number.isInteger(e.lead.period)&&Number.isInteger(e.lead.seconds)))bad('invalid comeback record');return {id:e.id,year:e.year,day:e.day,stage:e.stage,playoff:e.playoff,amount:e.amount,winner:{...e.winner},loser:{...e.loser},score:[...e.score],lead:e.lead&&{period:e.lead.period,seconds:e.lead.seconds}}};
 const list=(l,max)=>{if(!Array.isArray(l)||l.length>max)bad('invalid comeback table');return l.map(entry)};
 const best=r=>{if(r===null)return null;if(!r||!Number.isInteger(r.amount)||r.amount<0||r.amount>500||!Array.isArray(r.games)||r.games.length>10||!r.games.every(id))bad('invalid franchise comeback record');return {amount:r.amount,games:[...r.games]}};
 if(!v||v.version!==1||!Number.isInteger(v.games)||v.games<0||!v.since||!yr(v.since.year)||!Number.isInteger(v.since.day)||typeof v.full!=='boolean'||!v.seasons||typeof v.seasons!=='object'||!v.franchise||typeof v.franchise!=='object')bad('invalid comeback records');
 const seasons={};for(const [y,l] of Object.entries(v.seasons)){if(!yr(Number(y)))bad('invalid comeback season');seasons[y]=list(l,3000)}
 const franchise={};for(const [k,f] of Object.entries(v.franchise)){if(!str(k)||!f?.comeback||!f?.blown)bad('invalid franchise comeback records');if(!Number.isInteger(f.games)||f.games<0)bad('invalid franchise comeback records');franchise[k]={games:f.games,comeback:{all:best(f.comeback.all),playoffs:best(f.comeback.playoffs)},blown:{all:best(f.blown.all),playoffs:best(f.blown.playoffs)}}}
 return {version:1,since:{year:v.since.year,day:v.since.day},full:v.full,games:v.games,...(Number.isInteger(v.backfilled)?{backfilled:v.backfilled}:{}),allTime:list(v.allTime,500),playoffs:list(v.playoffs,500),seasons,franchise}}

// ---- Courtside banner ----------------------------------------------------------------------
const comebackTriggerCache=new WeakMap();
function comebackTriggers(g){
 if(comebackTriggerCache.has(g))return comebackTriggerCache.get(g);
 const s=comebackStats(g,Number.MAX_SAFE_INTEGER),c=COMEBACK_CONFIG,teams=[state.teams[g.a],state.teams[g.b]],ctx=g.comeback?.context,out=[];
 if(s){const nextMilestone=[c.leadMilestone,c.leadMilestone],high=[0,0],deficit=[0,0],watched=[false,false],tookLead=[false,false];let leader=null;
  for(const f of s.flow){const idx=f.e.index;for(const side of [0,1]){const v=side?-f.diff:f.diff;deficit[1-side]=Math.max(deficit[1-side],v);
    if(v>high[side])high[side]=v;
    if(v>=nextMilestone[side]&&v>=high[side]){out.push({index:idx,type:'lead',side,text:teams[side].abbr+' leads by '+v,sub:'Largest lead tonight'});while(nextMilestone[side]<=v)nextMilestone[side]+=c.leadStep}}
   for(const side of [0,1]){const now=Math.max(0,side?f.diff:-f.diff);
    if(!watched[side]&&deficit[side]>=c.watchMin&&now<=c.watchCutTo){watched[side]=true;const D=deficit[side],fr=ctx?.franchise[side];
     out.push({index:idx,type:'watch',side,text:'Comeback watch: '+teams[side].abbr+' has cut a '+D+'-point deficit to '+now,sub:ctx?(D>ctx.league&&ctx.league?'This would be the largest comeback '+comebackScopeLabel():D>ctx.season?'This would be the largest comeback this season':fr&&D>fr.comeback?'This would be the largest comeback in '+teams[side].city+' franchise history':''):''})}}
   const lead=f.diff>0?0:f.diff<0?1:null;
   if(lead!==null&&lead!==leader&&!tookLead[lead]&&deficit[lead]>=c.takeLeadMin){tookLead[lead]=true;out.push({index:idx,type:'flip',side:lead,text:teams[lead].abbr+' takes the lead after trailing by '+deficit[lead],sub:''})}
   if(lead!==null)leader=lead}}
 comebackTriggerCache.set(g,out);return out}
function comebackBannerCard(g,b,final=false){const t=state.teams[b.side?g.b:g.a];
 return `<aside class="cb-banner ${final?'cb-final':''}" style="--team:${t.color}" aria-live="polite"><span class="cb-mark">${secondaryTeamLogo(t)}</span><div><strong>${escapeHTML(b.text)}</strong>${b.sub?`<small>${escapeHTML(b.sub)}</small>`:''}${(b.notes||[]).map(n=>`<small class="cb-note">${escapeHTML(n)}</small>`).join('')}</div></aside>`}
function comebackWatchBanner(g,index){
 const finished=index>=(g.playByPlay?.length||0),cb=g.comeback;
 if(finished){if(!cb||cb.comebackWinAmount<COMEBACK_CONFIG.noteMin&&!cb.notes.length)return '';const w=g.sa>g.sb?0:1,l=1-w,loser=state.teams[l?g.b:g.a];
  return comebackBannerCard(g,{side:w,text:loser.abbr+' led by '+cb.blownLeadAmount+' · '+state.teams[w?g.b:g.a].abbr+' wins '+Math.max(g.sa,g.sb)+'–'+Math.min(g.sa,g.sb),notes:cb.notes.map(n=>n.text)},true)}
 const live=comebackTriggers(g).filter(t=>t.index<=index).at(-1);
 if(!live)return '';const plays=index-live.index;return plays<=COMEBACK_CONFIG.bannerPlays?comebackBannerCard(g,live):''}

// ---- Game Summary, postgame card, record tables ----------------------------------------------
// Best net-scoring stretch for the winner within an 8-minute game-clock window.
function comebackDecisiveRun(s,w,window=480){let best=null;const ev=s.flow.map(f=>f.e);for(let i=0;i<ev.length;i++){if(ev[i].side!==w)continue;let net=0,pf=0,pa=0;for(let j=i;j<ev.length&&ev[j].seconds-ev[i].seconds<=window;j++){const v=ev[j].side===w?ev[j].points:-ev[j].points;net+=v;if(v>0)pf+=v;else pa-=v;if(ev[j].side===w&&(!best||net>best.net))best={net,for:pf,against:pa,start:ev[i],end:ev[j]}}}return best}
function comebackStorySection(g,index){
 const s=comebackStats(g,index);if(!s)return '';const final=index===Infinity||index>=(g.playByPlay?.length||0),teams=summaryTeams(g),name=side=>escapeHTML(teams[side].city+' '+teams[side].name),row=(k,v)=>'<p>'+k+' <strong>'+v+'</strong></p>';
 const leads=[0,1].map(side=>s.lead[side]?escapeHTML(teams[side].abbr)+' +'+s.lead[side]+(s.leadAt[side]?' · '+summaryClock(g,s.leadAt[side]):''):escapeHTML(teams[side].abbr)+' never led');
 let html=row('Largest lead',leads.join(' · '));
 if(final&&s.winner!==undefined){const w=s.winner,l=1-w,run=comebackDecisiveRun(s,w);
  html+=row('Biggest comeback',s.amount?name(w)+' came back from down '+s.amount:name(w)+' never trailed');
  if(s.amount)html+=row('Blown lead',name(l)+' led by '+s.amount+' and lost');
  if(s.attempt.from>=10)html+=row('Comeback attempt',name(l)+' trailed by '+s.attempt.from+' and cut it to '+s.attempt.to);
  if(run&&run.net>=8)html+=row('Decisive run',escapeHTML(teams[w].abbr)+' '+run.for+'–'+run.against+' · '+summaryClock(g,run.start)+' → '+summaryClock(g,run.end))}
 const notes=final?(g.comeback?.notes||[]):[];
 return '<section class="cb-story"><h3>Game Story</h3><div class="summary-facts">'+html+'</div>'+(notes.length?'<ul class="cb-notes">'+notes.map(n=>'<li><span class="cb-note-tag">'+({league:'League',playoffs:'Playoffs',season:'Season',franchise:'Franchise',blown:'Franchise'}[n.kind])+'</span>'+escapeHTML(n.text)+'</li>').join('')+'</ul>':'')+'</section>'}
const gameSummaryBeforeComebacks=gameSummaryMarkup;gameSummaryMarkup=function(g,index=Infinity){const html=gameSummaryBeforeComebacks(g,index),marker='<section><h3>Game leaders</h3>';return html.includes(marker)?html.replace(marker,comebackStorySection(g,index)+marker):html};
function comebackPostgameCard(g){const cb=g.comeback,s=cb?null:comebackStats(g),amount=cb?cb.comebackWinAmount:s?.amount;if(!(amount>=COMEBACK_CONFIG.noteMin))return '';
 const w=g.sa>g.sb?0:1,winner=state.teams[w?g.b:g.a],loser=state.teams[w?g.a:g.b];
 return comebackBannerCard(g,{side:w,text:'Comeback from '+amount+' · '+loser.abbr+' led by '+amount,notes:(cb?.notes||[]).map(n=>n.text)},true)}
function comebackRecordTables(){
 const store=state.comebackRecords;if(!store)return '';const scope=comebackScopeLabel(),fmt=e=>`<tr><td>${e.amount}</td><td>${escapeHTML(e.winner.city+' '+e.winner.name)}</td><td>${escapeHTML(e.loser.city+' '+e.loser.name)}</td><td>${e.score.join('–')}</td><td>${e.year} · ${escapeHTML(e.stage)}</td></tr>`;
 const table=(title,rows,empty)=>`<h3>${title}</h3><div class="scroll" tabindex="0" role="region" aria-label="${title}"><table><thead><tr><th>Deficit</th><th>Comeback win</th><th>Blown lead</th><th>Score</th><th>Season</th></tr></thead><tbody>${rows.map(fmt).join('')||`<tr><td colspan="5">${empty}</td></tr>`}</tbody></table></div>`;
 const top=(list,n)=>comebackTrim([...list],n);
 const seasons=Object.keys(store.seasons).map(Number).sort((a,b)=>b-a).map(y=>comebackTrim([...store.seasons[y]],1)[0]).filter(Boolean);
 const clubs=state.teams.map(t=>{const f=store.franchise[t.key];return `<tr><th scope="row">${escapeHTML(t.city+' '+t.name)}</th><td>${f?.comeback.all?.amount??'—'}</td><td>${f?.blown.all?.amount??'—'}</td><td>${f?.comeback.playoffs?.amount??'—'}</td><td>${f?.blown.playoffs?.amount??'—'}</td></tr>`}).join('');
 return `<section class="panel league-history cb-records"><div class="panelhead"><h2>Comebacks &amp; blown leads</h2><span>Tracked ${store.full?'since the first season':'since '+store.since.year}</span></div><p class="note">Largest deficit overcome by the winner, which is also the loser’s largest blown lead. Computed from recorded scoring; equal deficits are ties. ${store.backfilled?store.backfilled+(store.backfilled===1?' earlier game':' earlier games')+' from the tracking season '+(store.backfilled===1?'was':'were')+' added from recorded scoring.':''}</p>${table('All-time ('+escapeHTML(scope)+')',top(store.allTime,10),'No completed games yet.')}${table('Playoffs',top(store.playoffs,5),'No playoff games yet.')}${table('This season',top(store.seasons[state.year]||[],5),'No 10+ point comebacks yet this season.')}${table('Largest by season',seasons,'No completed seasons yet.')}<h3>Franchise records</h3><div class="scroll" tabindex="0" role="region" aria-label="Franchise comeback records"><table><thead><tr><th>Franchise</th><th>Largest comeback</th><th>Largest blown lead</th><th>Playoff comeback</th><th>Playoff blown lead</th></tr></thead><tbody>${clubs}</tbody></table></div></section>`}
const leagueHistoryBeforeComebacks=leagueHistoryView;leagueHistoryView=function(...args){return leagueHistoryBeforeComebacks(...args)+comebackRecordTables()};
