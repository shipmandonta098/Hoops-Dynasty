/* Custom calendars use exact per-team matchup counts and one game per team per day. */
const CUSTOM_SCHEDULE_KEYS=['seasonGames','divisionGames','conferenceGames','seasonStart','seasonEnd'];
function seasonMonthDay(value){if(typeof value!=='string'||!/^\d{2}-\d{2}$/.test(value)||value==='02-29')return false;const date=new Date('2025-'+value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(5,10)===value}
// The season year is the year the season ENDS (2026 = 2025–26, as in NBA / Basketball-Reference usage). A calendar that
// crosses New Year starts in year-1; single-year calendars (WNBA, May–September) run within the year.
function seasonDateRange(year,rules){const cross=rules.seasonEnd<rules.seasonStart,start=new Date(`${cross?year-1:year}-${rules.seasonStart}T00:00:00Z`),end=new Date(`${year}-${rules.seasonEnd}T00:00:00Z`);return {start,end,days:Math.round((end-start)/86400000)+1}}
// Day count under the earlier start-year convention: seasons saved before the switch keep their stored calendar length,
// which can differ by one day when only one of the two spans contains February 29.
function legacySeasonDays(year,rules){return seasonDateRange(rules.seasonEnd<rules.seasonStart?year+1:year,rules).days}
function seasonCrossesYear(rules=leagueRules(),format=state.scheduleFormat){return format!=='custom'||rules.seasonEnd<rules.seasonStart}
function seasonStartYear(year=state.year){return seasonCrossesYear()?year-1:year}
// Display label: '2025–26' for cross-year seasons, '2024' for single-year seasons.
function seasonLabel(year=state.year){return seasonCrossesYear()?(year-1)+'–'+String(year).slice(-2):String(year)}
function calendarSettingDefaults(career){const t=career?.teams?.[0],games=career?.schedule?.flat().filter(p=>p.includes(0))||[],counts=[0,0];for(const pair of games){const o=career.teams[pair.find(id=>id!==0)];if(t.conference===o.conference)counts[customCategory(t,o)]++}const end=new Date(Date.UTC(career?.year||2026,9,28+Math.max(0,(career?.schedule?.length||174)-1)));return {seasonGames:games.length||82,divisionGames:t?counts[0]:16,conferenceGames:t?counts[1]:36,seasonStart:'10-28',seasonEnd:end.toISOString().slice(5,10)}}
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
 const reserved=allStarWindow(days,rules,gender),available=Array.from({length:days},(_,i)=>i).filter(i=>!rules.allStarEnabled||i+1<reserved.breakStart||i+1>reserved.breakEnd);if(available.length<rules.seasonGames)throw Error('Extend the season dates to fit the games and All-Star break.');
 const requiredDates=Math.ceil(teams.length*rules.seasonGames/2/Math.floor(teams.length/2));if(available.length<requiredDates)throw Error('The league requires at least '+requiredDates+' available dates for '+(teams.length*rules.seasonGames/2)+' games; only '+available.length+' remain after the All-Star break.');
 const random=scheduleRandom(year*971+rules.seasonGames*31),pairs=orientSeasonPairs(customPairings(teams,targets,random),teams.length,year);let best=null;
 for(let attempt=0;attempt<20;attempt++){let pending=scheduleShuffle(pairs,random),rounds=[];while(pending.length){const degree=teams.map((_,i)=>pending.filter(p=>p.includes(i)).length),round=[],seen=new Set();pending.sort((a,b)=>Math.max(...b.map(i=>degree[i]))-Math.max(...a.map(i=>degree[i])));pending=pending.filter(p=>{if(p.some(i=>seen.has(i)))return true;p.forEach(i=>seen.add(i));round.push(p);return false});rounds.push(round)}if(!best||rounds.length<best.length)best=rounds;if(best.length<=available.length)break}
 if(best.length>available.length){best=exactScheduleRounds(pairs,teams.length,available.length);if(!best)throw Error('The required matchups cannot fit into '+available.length+' available dates without a team playing twice on one day. Extend the season or shorten the All-Star break.');}
 const calendar=Array.from({length:days},()=>[]);best.forEach((round,i)=>calendar[available[best.length===1?0:Math.round(i*(available.length-1)/(best.length-1))]].push(...round));return calendar;
}
function validateCustomSeason(calendar,teams,rules,year){const {days}=seasonDateRange(year,rules);if(calendar.length!==days&&calendar.length!==legacySeasonDays(year,rules))return false;const counts=teams.map(()=>[0,0,0]);for(const round of calendar){const seen=new Set();for(const [a,b] of round){if(!teams[a]||!teams[b]||a===b||seen.has(a)||seen.has(b))return false;seen.add(a);seen.add(b);const c=customCategory(teams[a],teams[b]);counts[a][c]++;counts[b][c]++}}return counts.every(c=>c[0]===rules.divisionGames&&c[1]===rules.conferenceGames&&c.reduce((a,b)=>a+b,0)===rules.seasonGames)}
function regenerateSeasonCalendar(){delete state.playoffConfig;if(state.scheduleFormat==='custom'){state.schedule=customSeasonSchedule(state.teams,state.year,leagueRules());state.customScheduleAlignment=managementAlignment(state.teams);state.meetings=leagueRules().seasonGames}else if(state.scheduleFormat!=='roundRobin'&&nbaAlignment(state.teams)){state.schedule=nbaSeasonSchedule(state.teams,state.year);state.scheduleFormat='nba82';state.meetings=82}else{state.schedule=schedule(state.teams.length>30?2:[1,2,4].includes(state.meetings)?state.meetings:2,state.teams.length);state.scheduleFormat='roundRobin'}if(state.scheduleFormat!=='custom'){delete state.customScheduleAlignment;Object.assign(leagueRules(),calendarSettingDefaults(state))}}
function readCustomAlignment(raw,teams,bad){if(!Array.isArray(raw)||raw.length!==teams.length||raw.some((t,i)=>!t||t.id!==i||typeof t.conference!=='string'||!t.conference||t.conference.length>35||typeof t.divisionId!=='string'||t.divisionId.length>80))bad('invalid custom schedule alignment.');return raw.map(t=>({id:t.id,conference:t.conference,divisionId:t.divisionId}))}

const beforeCustomCalendarNewSeason=newSeason;
newSeason=function(){if(state.scheduleFormat==='custom'&&state.champion!==null&&draftComplete()&&state.freeAgency?.phase==='complete'){try{customSeasonSchedule(state.teams,state.year+1,leagueRules())}catch(e){toast('Next season: '+e.message);return}}return beforeCustomCalendarNewSeason()};
