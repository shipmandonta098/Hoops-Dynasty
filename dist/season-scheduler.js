/* Calendar days contain [home, away] pairs. Legacy round-robin saves keep their calendar. */
function nbaAlignment(teams){
 if(teams.length!==30)return null;
 const conferences=new Map();
 for(let id=0;id<teams.length;id++){
  const t=teams[id];if(!t.conference||!t.divisionId)return null;
  if(!conferences.has(t.conference))conferences.set(t.conference,new Map());
  const divisions=conferences.get(t.conference);
  if(!divisions.has(t.divisionId))divisions.set(t.divisionId,[]);
  divisions.get(t.divisionId).push(id);
 }
 if(conferences.size!==2)return null;
 const groups=[...conferences].sort(([a],[b])=>a.localeCompare(b)).map(([,divisions])=>[...divisions].sort(([a],[b])=>a.localeCompare(b)).map(([,ids])=>ids.sort((a,b)=>teams[a].key.localeCompare(teams[b].key))));
 return groups.every(g=>g.length===3&&g.every(d=>d.length===5))?groups:null;
}
function scheduleRandom(seed){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n^=n+Math.imul(n^n>>>7,61|n);return ((n^n>>>14)>>>0)/4294967296}}
function scheduleShuffle(items,random){const a=[...items];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function scheduleRestValid(days){let b2b=0;for(let d=1;d<days.length;d++)if(days[d]&&days[d-1]){b2b++;if(d>1&&days[d-2])return false}return b2b<=16}
// The 82-game calendar opens October 28 of the year before the season year (2026 = 2025–26).
function allStarBreakIndex(year){const day=new Date(Date.UTC(year-1,9,28+110)).getUTCDay();return 110+(5-day+7)%7}
function nbaSeasonSchedule(teams,year){
 const groups=nbaAlignment(teams);if(!groups)throw Error('82 games requires two conferences, each with three five-team divisions.');
 const random=scheduleRandom(year*7919+82),conferenceRounds=Array.from({length:60},()=>[]);
 // Four conference cycles give 56 games. A balanced directed graph removes
 // two home and two away games per team, all against non-division opponents.
 for(const divisions of groups){
  const removed=new Set(),offset=((year%5)+5)%5;
  for(let d=0;d<3;d++)for(let i=0;i<5;i++)for(let k=0;k<2;k++)removed.add(divisions[d][i]+':'+divisions[(d+1)%3][(i+offset+k)%5]);
  const ids=divisions.flat(),rounds=schedule(4,15);
  rounds.forEach((round,r)=>round.forEach(([h,a])=>{const pair=[ids[h],ids[a]];if(r>=30&&removed.has(pair.join(':')))return;conferenceRounds[r].push(pair)}));
 }
 const [east,west]=groups.map(g=>g.flat()),inter=[];
 for(let cycle=0;cycle<2;cycle++)for(let r=0;r<15;r++)inter.push(east.map((id,i)=>cycle?[west[(i+r)%15],id]:[id,west[(i+r)%15]]));
 // Keep a complete 15-game round for the finale; all other dates are optimized.
 const final=inter.pop(),rounds=[...scheduleShuffle([...conferenceRounds,...inter],random),final],calendar=Array.from({length:171},()=>[]);
 rounds.forEach((games,r)=>calendar[Math.floor(r*170/89)].push(...games));
 const breakDay=allStarBreakIndex(year);calendar.splice(breakDay,0,[],[],[]);
 balanceScheduleDates(calendar,year,breakDay,random);
 optimizeRoadTrips(calendar,teams,year,breakDay,random);
 return calendar;
}
/* Road trips and homestands. Simulated annealing over three moves that never change matchups or home/away counts:
   swapping the dates of two games that share a team, swapping the dates of a pair's home and away meetings, and moving a
   game to another free day (rest limits re-checked whenever another team's days change).
   The cost is each team's season travel (home → road cities → home, back-to-back hops weighted extra) plus penalties for
   single-game road trips, trips over six games and very long homestands, and the existing games-per-day balance. */
const ROAD_TRIP_COST={backToBack:1.5,singleTrip:1500,longTrip:20000,longHomestand:900,load:60};
function optimizeRoadTrips(calendar,teams,year,breakDay,random,iterations=260000){
 const geo=typeof leagueGeography==='function'?leagueGeography(teams):null;if(!geo)return;
 const n=teams.length,D=calendar.length,last=D-1,blocked=d=>d>=breakDay&&d<breakDay+3,dist=teams.map((_,i)=>teams.map((_,j)=>geoMiles(geo[i],geo[j]))),C=ROAD_TRIP_COST;
 const games=[],occ=teams.map(()=>new Int16Array(D).fill(-1)),load=calendar.map(r=>r.length),b2b=new Int16Array(n);
 calendar.forEach((r,day)=>r.forEach(([h,a])=>{const g={h,a,day};occ[h][day]=occ[a][day]=games.length;games.push(g)}));
 const meetings=new Map();games.forEach((g,i)=>{const k=Math.min(g.h,g.a)+':'+Math.max(g.h,g.a);(meetings.get(k)||meetings.set(k,[]).get(k)).push(i)});
 for(let t=0;t<n;t++)for(let d=1;d<D;d++)if(occ[t][d]>=0&&occ[t][d-1]>=0)b2b[t]++;
 const preference=day=>[8,3,8,8,3,11,11][new Date(Date.UTC(year-1,9,28+day)).getUTCDay()],goals=calendar.map((_,d)=>blocked(d)?0:d===last?15:preference(d)),scale=1215/goals.slice(0,last).reduce((a,b)=>a+b,0);for(let d=0;d<last;d++)goals[d]*=scale;
 const loadCost=(d,c)=>C.load*(c-goals[d])**2;
 const teamCost=t=>{let cost=0,at=t,prev=-9,run=0,stand=0;const row=occ[t];for(let d=0;d<D;d++){const gi=row[d];if(gi<0)continue;const g=games[gi],home=g.h===t,venue=home?t:g.h,m=dist[at][venue];cost+=m;if(d-prev===1)cost+=C.backToBack*m;at=venue;prev=d;
   if(home){if(run){cost+=run===1?C.singleTrip:run>6?C.longTrip*(run-6):0;run=0}stand++;if(stand>7)cost+=C.longHomestand}else{run++;stand=0}}
  if(run)cost+=run===1?C.singleTrip:run>6?C.longTrip*(run-6):0;return cost+dist[at][t]};
 const costs=teams.map((_,t)=>teamCost(t));
 const triple=(t,d)=>{const r=occ[t];for(let s=d-2;s<=d;s++)if(s>=0&&s+2<D&&r[s]>=0&&r[s+1]>=0&&r[s+2]>=0)return true;return false};
 const adjacent=(t,d)=>(d>0&&occ[t][d-1]>=0?1:0)+(d<D-1&&occ[t][d+1]>=0?1:0);
 let temperature=2500;const cooling=Math.pow(4/2500,1/iterations);
 for(let it=0;it<iterations;it++,temperature*=cooling){
  const gi=Math.floor(random()*games.length),g=games[gi];if(g.day===last)continue;
  const roll=random();
  if(roll<.3){
   // Swap the dates of two games that share a team (reorders a trip or homestand); every other team must be free.
   const t=random()<.5?g.h:g.a,d1=g.day,d2=d1+Math.floor(random()*15)-7;if(d2<0||d2>=last||d2===d1||blocked(d2))continue;const oi=occ[t][d2];if(oi<0)continue;const o=games[oi];
   const ga=[g.h,g.a].filter(x=>x!==t)[0],ob=[o.h,o.a].filter(x=>x!==t)[0];if(ga===ob||occ[ga][d2]>=0||occ[ob][d1]>=0)continue;
   const moved=[[ga,d1,d2],[ob,d2,d1]],before=moved.map(([x,from])=>adjacent(x,from));
   occ[ga][d1]=-1;occ[ob][d2]=-1;occ[ga][d2]=gi;occ[ob][d1]=oi;occ[t][d1]=oi;occ[t][d2]=gi;g.day=d2;o.day=d1;
   const after=moved.map(([x,,to])=>adjacent(x,to)),ok=moved.every(([x,,to],k)=>!triple(x,to)&&b2b[x]-before[k]+after[k]<=16);
   const undo=()=>{occ[ga][d2]=-1;occ[ob][d1]=-1;occ[ga][d1]=gi;occ[ob][d2]=oi;occ[t][d1]=gi;occ[t][d2]=oi;g.day=d1;o.day=d2};if(!ok){undo();continue}
   const cs=[t,ga,ob].map(teamCost),delta=cs[0]+cs[1]+cs[2]-costs[t]-costs[ga]-costs[ob];
   if(delta<=0||random()<Math.exp(-delta/temperature)){[t,ga,ob].forEach((x,k)=>{costs[x]=cs[k]});moved.forEach(([x],k)=>{b2b[x]+=after[k]-before[k]})}else undo();
  }else if(roll<.6){
   // Swap the dates of this game and an opposite-venue meeting of the same pair.
   const others=meetings.get(Math.min(g.h,g.a)+':'+Math.max(g.h,g.a)).filter(j=>games[j].h!==g.h&&games[j].day!==last);if(!others.length)continue;
   const oi=others[Math.floor(random()*others.length)],o=games[oi],d1=g.day,d2=o.day;
   occ[g.h][d1]=occ[g.a][d1]=oi;occ[g.h][d2]=occ[g.a][d2]=gi;g.day=d2;o.day=d1;
   const ch=teamCost(g.h),ca=teamCost(g.a),delta=ch+ca-costs[g.h]-costs[g.a];
   if(delta<=0||random()<Math.exp(-delta/temperature)){costs[g.h]=ch;costs[g.a]=ca}else{occ[g.h][d1]=occ[g.a][d1]=gi;occ[g.h][d2]=occ[g.a][d2]=oi;g.day=d1;o.day=d2}
  }else{
   // Move the game to a nearby free day.
   const d1=g.day,d2=d1+Math.floor(random()*29)-14;if(d2<0||d2>=last||d2===d1||blocked(d2)||occ[g.h][d2]>=0||occ[g.a][d2]>=0)continue;
   const before=[g.h,g.a].map(t=>adjacent(t,d1));occ[g.h][d1]=occ[g.a][d1]=-1;occ[g.h][d2]=occ[g.a][d2]=gi;g.day=d2;
   const after=[g.h,g.a].map(t=>adjacent(t,d2)),ok=[g.h,g.a].every((t,k)=>!triple(t,d2)&&b2b[t]-before[k]+after[k]<=16);
   const undo=()=>{occ[g.h][d2]=occ[g.a][d2]=-1;occ[g.h][d1]=occ[g.a][d1]=gi;g.day=d1};if(!ok){undo();continue}
   const ch=teamCost(g.h),ca=teamCost(g.a),delta=ch+ca-costs[g.h]-costs[g.a]+loadCost(d1,load[d1]-1)+loadCost(d2,load[d2]+1)-loadCost(d1,load[d1])-loadCost(d2,load[d2]);
   if(delta<=0||random()<Math.exp(-delta/temperature)){costs[g.h]=ch;costs[g.a]=ca;load[d1]--;load[d2]++;[g.h,g.a].forEach((t,k)=>{b2b[t]+=after[k]-before[k]})}else undo();
  }
 }
 for(const r of calendar)r.length=0;for(const g of games)calendar[g.day].push([g.h,g.a]);
}
/* Date preferences are soft targets. Matchups and rest limits remain hard rules. */
function balanceScheduleDates(calendar,year,breakDay,random){
 const last=calendar.length-1,occupied=Array.from({length:30},(_,id)=>calendar.map(games=>games.some(pair=>pair.includes(id)))),blocked=day=>day>=breakDay&&day<breakDay+3;
 const preference=day=>[8,3,8,8,3,11,11][new Date(Date.UTC(year-1,9,28+day)).getUTCDay()];
 const goals=calendar.map((_,d)=>blocked(d)?0:d===last?15:preference(d));
 const weight=goals.slice(0,last).reduce((a,b)=>a+b,0),scale=1215/weight;
 for(let d=0;d<last;d++)goals[d]*=scale;
 const cost=(d,count)=>(count-goals[d])**2;
 for(let pass=0;pass<12;pass++){
  let changed=0;
  for(const source of scheduleShuffle(Array.from({length:last},(_,i)=>i),random)){
   if(blocked(source))continue;
   for(const pair of scheduleShuffle(calendar[source],random)){
    const targets=Array.from({length:last},(_,d)=>d).filter(d=>d!==source&&!blocked(d)&&Math.abs(d-source)<=28&&calendar[d].length<14&&!pair.some(id=>occupied[id][d])).map(d=>({d,delta:cost(source,calendar[source].length-1)+cost(d,calendar[d].length+1)-cost(source,calendar[source].length)-cost(d,calendar[d].length)})).filter(x=>x.delta<-.001).sort((a,b)=>a.delta-b.delta||Math.abs(a.d-source)-Math.abs(b.d-source));
    for(const {d} of targets){
     pair.forEach(id=>{occupied[id][source]=false;occupied[id][d]=true});
     if(pair.every(id=>scheduleRestValid(occupied[id]))){calendar[source].splice(calendar[source].indexOf(pair),1);calendar[d].push(pair);changed++;break}
     pair.forEach(id=>{occupied[id][source]=true;occupied[id][d]=false});
    }
   }
  }
  if(!changed)break;
 }
}
function validateNBASeason(calendar,teams){
 if(!nbaAlignment(teams)||calendar.length<170||calendar.length>200)return false;
 const counts=teams.map(()=>Array(30).fill(0)),home=Array(30).fill(0),days=teams.map(()=>Array(calendar.length).fill(false));
 for(let day=0;day<calendar.length;day++)for(const [h,a] of calendar[day]){
  if(days[h][day]||days[a][day])return false;
  days[h][day]=days[a][day]=true;counts[h][a]++;counts[a][h]++;home[h]++;
 }
 return teams.every((t,i)=>home[i]===41&&counts[i].reduce((a,b)=>a+b,0)===82&&scheduleRestValid(days[i])&&teams.every((opp,j)=>{
  if(i===j)return counts[i][j]===0;
  return t.conference!==opp.conference?counts[i][j]===2:t.divisionId===opp.divisionId?counts[i][j]===4:[3,4].includes(counts[i][j]);
 })&&teams.every((opp,j)=>i===j||Math.abs(calendar.reduce((sum,games)=>sum+games.filter(([h,a])=>h===i&&a===j).length,0)*2-counts[i][j])<=1));
}
