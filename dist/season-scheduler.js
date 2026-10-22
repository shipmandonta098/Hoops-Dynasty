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
function allStarBreakIndex(year){const day=new Date(Date.UTC(year,9,28+110)).getUTCDay();return 110+(5-day+7)%7}
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
 return calendar;
}
/* Date preferences are soft targets. Matchups and rest limits remain hard rules. */
function balanceScheduleDates(calendar,year,breakDay,random){
 const last=calendar.length-1,occupied=Array.from({length:30},(_,id)=>calendar.map(games=>games.some(pair=>pair.includes(id)))),blocked=day=>day>=breakDay&&day<breakDay+3;
 const preference=day=>[8,3,8,8,3,11,11][new Date(Date.UTC(year,9,28+day)).getUTCDay()];
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
