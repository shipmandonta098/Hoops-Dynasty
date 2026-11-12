/* Custom calendars use exact per-team matchup counts and one game per team per day. */
const CUSTOM_SCHEDULE_KEYS=['seasonGames','divisionGames','conferenceGames','seasonStart','seasonEnd'];
function seasonMonthDay(value){if(typeof value!=='string'||!/^\d{2}-\d{2}$/.test(value)||value==='02-29')return false;const date=new Date('2025-'+value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(5,10)===value}
// The season year is the year the season ENDS (2026 = 2025–26, as in NBA / Basketball-Reference usage). A calendar that
// crosses New Year starts in year-1; single-year calendars (WNBA, May–September) run within the year.
function seasonDateRange(year,rules){const cross=rules.seasonEnd<rules.seasonStart,start=new Date(`${cross?year-1:year}-${rules.seasonStart}T00:00:00Z`),end=new Date(`${year}-${rules.seasonEnd}T00:00:00Z`);return {start,end,days:Math.round((end-start)/86400000)+1}}
// Day count under the earlier start-year convention: seasons saved before the switch keep their stored calendar length,
// which can differ by one day when only one of the two spans contains February 29.
function legacySeasonDays(year,rules){return seasonDateRange(rules.seasonEnd<rules.seasonStart?year+1:year,rules).days}
// A season crosses New Year only when its dates do (end month/day before start month/day), whatever the schedule
// format: an October–April league is '2025–26', a May–September league is '2026'. Matches seasonDateRange.
function seasonCrossesYear(rules=leagueRules()){return (rules?.seasonEnd||'04-19')<(rules?.seasonStart||'10-28')}
// End month/day for a calendar of the given length opening on start ('MM-DD'); the start falls in the season's first
// calendar year (only matters for February 29).
function calendarEndFor(start,days,year=2026){const [m,d]=start.split('-').map(Number),first=m>=7?year-1:year;return new Date(Date.UTC(first,m-1,d+Math.max(0,days-1))).toISOString().slice(5,10)}
function seasonStartYear(year=state.year){return seasonCrossesYear()?year-1:year}
// Display label: '2025–26' for cross-year seasons, '2024' for single-year seasons.
function seasonLabel(year=state.year){return seasonCrossesYear()?(year-1)+'–'+String(year).slice(-2):String(year)}
function calendarSettingDefaults(career){const t=career?.teams?.[0],games=career?.schedule?.flat().filter(p=>p.includes(0))||[],counts=[0,0];for(const pair of games){const o=career.teams[pair.find(id=>id!==0)];if(t.conference===o.conference)counts[customCategory(t,o)]++}const chosen=career?.leagueSettings?.seasonStart,start=typeof chosen==='string'&&seasonMonthDay(chosen)?chosen:'10-28';return {seasonGames:games.length||82,divisionGames:t?counts[0]:16,conferenceGames:t?counts[1]:36,seasonStart:start,seasonEnd:calendarEndFor(start,career?.schedule?.length||174,career?.year||2026)}}
function customCategory(a,b){return a.conference!==b.conference?2:a.divisionId&&a.divisionId===b.divisionId?0:1}
// Edmonds' augmenting-path matching, including odd-cycle (blossom) contraction.
// Used by the degree-factor reduction below; this is not a randomized retry test.
function schedulePerfectMatching(graph){
 const n=graph.length,match=Array(n).fill(-1);
 for(let root=0;root<n;root++)if(match[root]<0){
  const parent=Array(n).fill(-1),base=Array.from({length:n},(_,i)=>i),seen=Array(n).fill(false),queue=[root];seen[root]=true;
  const ancestor=(a,b)=>{const path=new Set();while(true){a=base[a];path.add(a);if(match[a]<0)break;a=parent[match[a]]}while(!path.has(base[b]))b=parent[match[base[b]]];return base[b]};
  const mark=(v,b,child,blossom)=>{while(base[v]!==b){blossom[base[v]]=blossom[base[match[v]]]=true;parent[v]=child;child=match[v];v=parent[match[v]]}};
  let finish=-1;
  for(let head=0;head<queue.length&&finish<0;head++){
   const v=queue[head];for(const u of graph[v]){
    if(base[v]===base[u]||match[v]===u)continue;
    if(u===root||(match[u]>=0&&parent[match[u]]>=0)){
     const b=ancestor(v,u),blossom=Array(n).fill(false);mark(v,b,u,blossom);mark(u,b,v,blossom);
     for(let i=0;i<n;i++)if(blossom[base[i]]){base[i]=b;if(!seen[i]){seen[i]=true;queue.push(i)}}
    }else if(parent[u]<0){parent[u]=v;if(match[u]<0){finish=u;break}const w=match[u];seen[w]=true;queue.push(w)}
   }
  }
  if(finish<0)continue;
  while(finish>=0){const p=parent[finish],next=p<0?-1:match[p];match[finish]=p;if(p>=0)match[p]=finish;finish=next}
 }
 return match.every(v=>v>=0)?match:null;
}
function scheduleDegreeFactor(edges,demands){
 if(demands.some(d=>d<0)||demands.reduce((s,d)=>s+d,0)%2)return null;
 if(demands.every(d=>d===0))return [];
 const degree=demands.map(()=>0);edges.forEach(([a,b])=>{degree[a]++;degree[b]++});
 if(demands.some((d,i)=>d>degree[i]))return null;
 // Solve the smaller complementary factor when that reduces the gadget size.
 const complement=demands.reduce((s,d)=>s+d,0)>edges.length;
 const need=demands.map((d,i)=>complement?degree[i]-d:d),graph=[],node=()=>{graph.push([]);return graph.length-1},link=(a,b)=>{graph[a].push(b);graph[b].push(a)};
 const slots=need.map(d=>Array.from({length:d},node)),ends=edges.map(([a,b])=>{const x=node(),y=node();link(x,y);slots[a].forEach(s=>link(x,s));slots[b].forEach(s=>link(y,s));return [x,y]});
 const matched=schedulePerfectMatching(graph);if(!matched)return null;
 return edges.filter((_,i)=>(matched[ends[i][0]]!==ends[i][1])!==complement);
}
function customPairings(teams,targets,random){const pairs=[];
 for(let category=0;category<3;category++){
  const count=targets[category];if(!count)continue;
  const label=['Division','Conference (outside division)','Interconference'][category],allowed=teams.map((t,i)=>teams.map((o,j)=>i!==j&&customCategory(t,o)===category));
  const pending=new Set(teams.map((_,i)=>i));
  while(pending.size){
   const ids=[pending.values().next().value];pending.delete(ids[0]);for(let k=0;k<ids.length;k++)for(const j of [...pending])if(allowed[ids[k]][j]){ids.push(j);pending.delete(j)}
   const name=i=>teams[i].abbr||teams[i].name||String(i);
   if(ids.length===1)throw Error(`${label}: ${name(ids[0])} has no eligible opponent for its ${count} requested games.`);
   if(ids.length*count%2)throw Error(`${label}: ${ids.length} teams × ${count} games is odd; reciprocal games require an even total in this group (${ids.map(name).join(', ')}).`);
   // Category components are complete multipartite graphs. A part cannot supply
   // more game endpoints than all of its eligible opponents combined.
   for(const i of ids){const part=ids.filter(j=>j===i||!allowed[i][j]);if(part.length>ids.length-part.length)throw Error(`${label}: ${part.length} teams require ${part.length*count} game endpoints, but their ${ids.length-part.length} eligible opponents supply only ${(ids.length-part.length)*count}. Check conference/division sizes.`)}
   const edges=scheduleShuffle(ids.flatMap((a,i)=>ids.slice(i+1).filter(b=>allowed[a][b]).map(b=>[a,b])),random),degree=teams.map((_,i)=>allowed[i].filter(Boolean).length);
   let solution=null;
   // First require each team's opponent counts to be floor/ceil of its ideal.
   // Widen only when the exact factor solver proves those bounds infeasible.
   for(let slack=0;slack<=count&&!solution;slack++){
    const need=teams.map(()=>0);ids.forEach(i=>need[i]=count);const base=[],extras=[];let invalid=false;
    for(const [a,b] of edges){const lo=Math.max(0,Math.max(Math.floor(count/degree[a]),Math.floor(count/degree[b]))-slack),hi=Math.min(count,Math.min(Math.ceil(count/degree[a]),Math.ceil(count/degree[b]))+slack);if(lo>hi){invalid=true;break}need[a]-=lo;need[b]-=lo;for(let k=0;k<lo;k++)base.push([a,b]);for(let k=lo;k<hi;k++)extras.push([a,b])}
    if(invalid||need.some(n=>n<0))continue;const factor=scheduleDegreeFactor(extras,need);if(factor)solution=base.concat(factor);
   }
   if(!solution)throw Error(`${label}: no reciprocal allocation satisfies ${count} games per team.`);
   pairs.push(...solution);
  }
 }
 return pairs;
}
function orientSeasonPairs(pairs,n,year=0){
 // Split even multiplicities equally. Orient only odd leftovers along Euler
 // trails, so both individual matchups and season home totals stay balanced.
 const counts=new Map(),out=[],odd=[];
 for(const [a,b] of pairs){const lo=Math.min(a,b),hi=Math.max(a,b),key=lo+':'+hi;const record=counts.get(key)||{a:lo,b:hi,n:0};record.n++;counts.set(key,record)}
 for(const {a,b,n:count} of counts.values()){for(let k=0;k<Math.floor(count/2);k++)out.push([a,b],[b,a]);if(count%2)odd.push([a,b])}
 const edges=odd.map(p=>[...p]),degree=Array(n).fill(0);edges.forEach(p=>p.forEach(i=>degree[i]++));const vertices=degree.map((v,i)=>v%2?i:-1).filter(i=>i>=0);for(let i=0;i<vertices.length;i+=2)edges.push([vertices[i],vertices[i+1]]);
 const adj=Array.from({length:n},()=>[]),used=new Set();edges.forEach(([a,b],i)=>{adj[a].push(i);adj[b].push(i)});
 for(let start=0;start<n;start++){const stack=[start];while(stack.length){const a=stack.at(-1);while(adj[a].length&&used.has(adj[a].at(-1)))adj[a].pop();if(!adj[a].length){stack.pop();continue}const id=adj[a].pop(),b=edges[id].find(x=>x!==a);used.add(id);if(id<odd.length)out.push(year%2?[b,a]:[a,b]);stack.push(b)}}return out;
}
// Exact edge coloring is a fallback for tight calendars where greedy rounds fail.
// Identical games and empty days are symmetry-reduced; rest preferences are soft.
function exactScheduleRounds(pairs,n,limit){
 const grouped=new Map();for(const pair of pairs){const key=[...pair].sort((a,b)=>a-b).join(':');if(!grouped.has(key))grouped.set(key,{a:pair[0],b:pair[1],games:[],last:-1});grouped.get(key).games.push(pair)}
 const groups=[...grouped.values()],occupied=Array.from({length:n},()=>Array(limit).fill(false)),rounds=Array.from({length:limit},()=>[]);
 function place(left){
  if(!left)return true;let selected=null,choices=null;
  for(const g of groups)if(g.games.length){const options=[];for(let d=g.last+1;d<limit;d++)if(!occupied[g.a][d]&&!occupied[g.b][d])options.push(d);if(options.length<g.games.length)return false;if(!selected||options.length-g.games.length<choices.length-selected.games.length){selected=g;choices=options}}
  const g=selected,old=g.last,game=g.games.pop(),tried=new Set();
  for(const d of choices){const signature=occupied.map(row=>row[d]?'1':'0').join('')+groups.map(item=>item.last<d?'1':'0').join('');if(tried.has(signature))continue;tried.add(signature);g.last=d;occupied[g.a][d]=occupied[g.b][d]=true;rounds[d].push(game);if(place(left-1))return true;rounds[d].pop();occupied[g.a][d]=occupied[g.b][d]=false}
  g.last=old;g.games.push(game);return false;
 }
 return place(pairs.length)?rounds:null;
}
function customSeasonSchedule(teams,year,rules,gender=teams[0]?.roster?.[0]?.gender||'male'){
 const {days}=seasonDateRange(year,rules),targets=[rules.divisionGames,rules.conferenceGames,rules.seasonGames-rules.divisionGames-rules.conferenceGames];
 if(targets.some(n=>!Number.isInteger(n))||targets[0]<0||targets[1]<0)throw Error('Matchup counts must be nonnegative whole numbers.');if(targets[2]<0)throw Error('Division ('+targets[0]+') and conference ('+targets[1]+') totals sum to '+(targets[0]+targets[1])+', which exceeds the '+rules.seasonGames+' games per season.');if(teams.length*rules.seasonGames%2)throw Error('An odd number of teams requires an even number of games per season.');if(days<rules.seasonGames)throw Error('The season date range needs at least as many days as games per team.');
 const reserved=allStarWindow(days,rules,gender,year),available=Array.from({length:days},(_,i)=>i).filter(i=>!rules.allStarEnabled||i+1<reserved.breakStart||i+1>reserved.breakEnd);if(available.length<rules.seasonGames)throw Error('Extend the season dates to fit the games and All-Star break.');
 const requiredDates=Math.ceil(teams.length*rules.seasonGames/2/Math.floor(teams.length/2));if(available.length<requiredDates)throw Error('The league requires at least '+requiredDates+' available dates for '+(teams.length*rules.seasonGames/2)+' games; only '+available.length+' remain after the All-Star break.');
 const random=scheduleRandom(year*971+rules.seasonGames*31),pairs=orientSeasonPairs(customPairings(teams,targets,random),teams.length,year);let best=null;
 for(let attempt=0;attempt<20;attempt++){let pending=scheduleShuffle(pairs,random),rounds=[];while(pending.length){const degree=teams.map((_,i)=>pending.filter(p=>p.includes(i)).length),round=[],seen=new Set();pending.sort((a,b)=>Math.max(...b.map(i=>degree[i]))-Math.max(...a.map(i=>degree[i])));pending=pending.filter(p=>{if(p.some(i=>seen.has(i)))return true;p.forEach(i=>seen.add(i));round.push(p);return false});rounds.push(round)}if(!best||rounds.length<best.length)best=rounds;if(best.length<=available.length)break}
 if(best.length>available.length){best=exactScheduleRounds(pairs,teams.length,available.length);if(!best)throw Error('The required matchups cannot fit into '+available.length+' available dates without a team playing twice on one day. Extend the season or shorten the All-Star break.');}
 const assigned=customAssignDates(pairs,teams.length,days,available,rules.allStarEnabled?reserved:null,rules.seasonGames,scheduleRandom(year*7741+rules.seasonGames*13+teams.length));if(assigned)return assigned;
 // Fallback (calendars too tight for the rest rules): evenly spaced rounds.
 const calendar=Array.from({length:days},()=>[]);best.forEach((round,i)=>calendar[available[best.length===1?0:Math.round(i*(available.length-1)/(best.length-1))]].push(...round));return calendar;
}
// Rest rules for custom calendars, scaled to how dense the season is. Sparse (WNBA-like) seasons: at most 4
// back-to-backs per team, no 3 games in 4 nights unless the end of the season forces it, never 3 straight days, and
// no break longer than about a week outside the All-Star break. Dense (NBA-like) seasons follow the 82-game limit.
function customRestLimits(games,availableDays){const density=games/Math.max(1,availableDays),sparse=density<=.45;return {sparse,b2b:sparse?4:16,b2bTarget:sparse?2:12,maxGap:Math.max(7,Math.ceil(2.5/density)),threeInFour:sparse?0:Infinity}}
// Gaps between a team's games; a gap that spans the All-Star break is reported separately and not counted as rest.
function customTeamRest(calendar,id,breakWin){const ds=calendar.flatMap((games,d)=>games.some(g=>g.includes(id))?[d]:[]),gaps=[],r={days:ds,gaps,b2b:0,threeInFour:0,threeStraight:0,maxGap:0,breakGap:null};
 for(let i=1;i<ds.length;i++){const g=ds[i]-ds[i-1]-1;if(breakWin&&ds[i-1]+1<breakWin.breakStart&&ds[i]+1>breakWin.breakEnd){r.breakGap=g;continue}gaps.push(g);if(!g)r.b2b++;r.maxGap=Math.max(r.maxGap,g)}
 for(let i=2;i<ds.length;i++){if(ds[i]-ds[i-2]<=3)r.threeInFour++;if(ds[i]-ds[i-2]===2)r.threeStraight++}return r}
// The same rest checks on a team's occupancy (true = plays that day), for code that moves games after scheduling.
function customOccupancyRest(occupied,breakWin){return customTeamRest(occupied.map(v=>v?[[0,0]]:[]),0,breakWin)}
function customCalendarLimits(c){const b=c.allStarCalendar,len=b?b.breakEnd-b.breakStart+1:0;return customRestLimits(c.leagueSettings?.seasonGames||(c.schedule.flat().filter(p=>p.includes(0)).length),Math.max(1,c.schedule.length-len))}
function customOccupancyValid(c,occupied){const r=customOccupancyRest(occupied,c.allStarCalendar),l=customCalendarLimits(c);return r.threeStraight===0&&r.b2b<=l.b2b&&r.threeInFour<=(l.sparse?0:Infinity)&&r.maxGap<=l.maxGap}
// A move is acceptable when it keeps the team within the limits, or at least does not make any measure worse.
function customOccupancyNoWorse(c,before,after){if(customOccupancyValid(c,after))return true;const a=customOccupancyRest(before,c.allStarCalendar),b=customOccupancyRest(after,c.allStarCalendar);return b.threeStraight<=a.threeStraight&&b.b2b<=a.b2b&&b.threeInFour<=a.threeInFour&&b.maxGap<=a.maxGap}
function customRestReport(calendar,n,breakWin,limits){const teams=Array.from({length:n},(_,id)=>customTeamRest(calendar,id,breakWin));return {teams,valid:teams.every(t=>t.b2b<=limits.b2b&&t.threeStraight===0&&t.threeInFour<=(limits.sparse?1:Infinity)&&t.maxGap<=limits.maxGap)}}
// Day-by-day assignment: each day plays a share of the remaining games, chosen by team urgency (rest so far, pace
// against the games left, approaching a long break). Teams that played yesterday sit unless forced, and only within the
// back-to-back limit. Several seeded attempts; the best-scoring complete calendar wins, or null when none completes.
function customAssignDates(pairs,n,days,available,breakWin,games,random){
 const limits=customRestLimits(games,available.length),pace=games/available.length,spans=(a,b)=>breakWin&&a+1<breakWin.breakStart&&b+1>breakWin.breakEnd,breakLen=breakWin?breakWin.breakEnd-breakWin.breakStart+1:0;
 const attempt=()=>{const calendar=Array.from({length:days},()=>[]),last=Array(n).fill(-1e3),prev=Array(n).fill(-1e3),b2b=Array(n).fill(0),left=Array(n).fill(0),met=new Map();let pending=pairs.slice();for(const [a,b] of pairs){left[a]++;left[b]++}
  for(let k=0;k<available.length&&pending.length;k++){const day=available[k],remaining=available.length-k;
   const gap=t=>last[t]<0?99:day-last[t]-1-(spans(last[t],day)?breakLen:0),must=t=>left[t]>=remaining;
   const ok=t=>{if(!left[t])return false;if(day-last[t]>1)return prev[t]<day-3||must(t)||!limits.sparse;if(prev[t]===day-2)return false;return must(t)||b2b[t]<(limits.sparse?limits.b2bTarget+(random()<.35?1:0):limits.b2b)&&(prev[t]<day-3||!limits.sparse)};
   const urgency=t=>{const g=gap(t);let u=6*(left[t]/remaining)/pace;u+=g>=99?6:g<=0?-3.5:g===1?0:g===2?1.5+random()*2:g===3?3.5+random()*2:7+(g-4)*2;if(g>=limits.maxGap-1)u+=40;if(must(t))u+=200;return u};
   const target=pending.length/remaining,count=Math.min(Math.floor(n/2),Math.floor(target)+(random()<target%1?1:0));
   const scored=pending.map((p,i)=>({p,i,score:ok(p[0])&&ok(p[1])?urgency(p[0])+urgency(p[1])+random()*2-(day-(met.get(Math.min(...p)*n+Math.max(...p))??-99)<=2?4:0):-Infinity})).filter(x=>x.score>-Infinity).sort((a,b)=>b.score-a.score);
   const busy=new Set(),taken=[];for(const x of scored){if(busy.has(x.p[0])||busy.has(x.p[1]))continue;const urgent=x.p.every(t=>gap(t)>=limits.maxGap-1||must(t));if(taken.length>=count&&!urgent)continue;busy.add(x.p[0]);busy.add(x.p[1]);taken.push(x)}
   for(const {p} of taken){calendar[day].push(p);for(const t of p){if(day-last[t]===1)b2b[t]++;prev[t]=last[t];last[t]=day;left[t]--}met.set(Math.min(...p)*n+Math.max(...p),day)}
   const used=new Set(taken.map(x=>x.i));pending=pending.filter((_,i)=>!used.has(i))}
  return pending.length?null:calendar};
 const score=calendar=>{const r=customRestReport(calendar,n,breakWin,limits);let cost=r.valid?0:1e4;for(const t of r.teams){cost+=t.b2b*t.b2b*3+t.threeInFour*25+t.threeStraight*500+Math.max(0,t.maxGap-limits.maxGap)*60;for(const g of t.gaps)cost+=g>=6?3:g>=4?1:0}
  const played=calendar.flatMap((games,d)=>games.length?[d]:[]);return cost+Math.max(0,played[0]-available[0])*5+Math.max(0,available.at(-1)-played.at(-1))*5};
 let best=null;for(let i=0;i<24;i++){const c=attempt();if(!c)continue;const cost=score(c);if(!best||cost<best.cost)best={calendar:c,cost}}
 return best?.calendar||null;
}
function validateCustomSeason(calendar,teams,rules,year){const {days}=seasonDateRange(year,rules);if(calendar.length!==days&&calendar.length!==legacySeasonDays(year,rules))return false;const counts=teams.map(()=>[0,0,0]);for(const round of calendar){const seen=new Set();for(const [a,b] of round){if(!teams[a]||!teams[b]||a===b||seen.has(a)||seen.has(b))return false;seen.add(a);seen.add(b);const c=customCategory(teams[a],teams[b]);counts[a][c]++;counts[b][c]++}}return counts.every(c=>c[0]===rules.divisionGames&&c[1]===rules.conferenceGames&&c.reduce((a,b)=>a+b,0)===rules.seasonGames)}
function regenerateSeasonCalendar(){delete state.playoffConfig;if(state.scheduleFormat==='custom'){state.schedule=customSeasonSchedule(state.teams,state.year,leagueRules());state.customScheduleAlignment=managementAlignment(state.teams);state.meetings=leagueRules().seasonGames}else if(state.scheduleFormat!=='roundRobin'&&nbaAlignment(state.teams)){state.schedule=nbaSeasonSchedule(state.teams,state.year);state.scheduleFormat='nba82';state.meetings=82}else{state.schedule=schedule(state.teams.length>30?2:[1,2,4].includes(state.meetings)?state.meetings:2,state.teams.length);state.scheduleFormat='roundRobin'}if(state.scheduleFormat!=='custom'){delete state.customScheduleAlignment;Object.assign(leagueRules(),calendarSettingDefaults(state))}}
function readCustomAlignment(raw,teams,bad){if(!Array.isArray(raw)||raw.length!==teams.length||raw.some((t,i)=>!t||t.id!==i||typeof t.conference!=='string'||!t.conference||t.conference.length>35||typeof t.divisionId!=='string'||t.divisionId.length>80))bad('invalid custom schedule alignment.');return raw.map(t=>({id:t.id,conference:t.conference,divisionId:t.divisionId}))}

const beforeCustomCalendarNewSeason=newSeason;
function modernizeWnbaCalendarRules(rules){if(rules.historicalSource!=='wnba'||rules.seasonStart!=='05-01'||rules.seasonEnd!=='09-30')return false;Object.assign(rules,wnbaSeasonWindow(rules.seasonGames));if(rules.allStarRestLength===7)rules.allStarRestLength=5;return true}
newSeason=function(){if(state.scheduleFormat==='custom'&&state.champion!==null&&draftComplete()&&state.freeAgency?.phase==='complete'){modernizeWnbaCalendarRules(leagueRules());try{customSeasonSchedule(state.teams,state.year+1,leagueRules())}catch(e){toast('Next season: '+e.message);return}}return beforeCustomCalendarNewSeason()};
