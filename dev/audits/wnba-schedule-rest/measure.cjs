// WNBA/custom schedule rest metrics. Usage: node measure.cjs <repo> <year> <teams> <seed> [extraYears]
const path=require('path');const [dir,year,nTeams,seed,extra]=process.argv.slice(2);const {loadLeague}=require(path.resolve(dir,'dev/load-league.cjs'));
const l=loadLeague({seed:+seed,strictDOM:false});l.setRandomSeed(+seed);l.context.Y=+year;l.context.N=+nTeams;
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Sched';d.year=Y;d.teams=d.teams.slice(0,N);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'east',name:'Eastern'},{id:'west',name:'Western'}];d.divisions=[];d.teams.forEach((t,i)=>{t.conferenceId=i<Math.ceil(N/2)?'east':'west';t.divisionId=''});
 var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules};syncAlignment(d);state=validateCareerData(buildSetupCareer(d));`);
const measure=(label,cal,yr)=>JSON.parse(l.run(`JSON.stringify((()=>{const cal=${cal},yr=${yr},r=leagueRules(),{start,days}=seasonDateRange(yr,r),date=i=>new Date(start.getTime()+i*86400000).toISOString().slice(0,10);
 const N=state.teams.length,as=r.allStarEnabled?allStarWindow(days,r,'female',yr):null,gaps=[],b2b=[],longest=[],longestOut=[],max7=[],three4=[];let first=1e9,last=-1;
 for(let t=0;t<N;t++){const ds=[];cal.forEach((round,i)=>{if(round.some(p=>p.includes(t)))ds.push(i)});first=Math.min(first,ds[0]);last=Math.max(last,ds.at(-1));let bb=0,lg=0,lo=0,m7=0,t4=0;
  for(let k=1;k<ds.length;k++){const g=ds[k]-ds[k-1]-1;gaps.push(g);if(g===0)bb++;lg=Math.max(lg,g);const spansBreak=as&&ds[k-1]+1<as.breakStart&&ds[k]+1>as.breakEnd;if(!spansBreak)lo=Math.max(lo,g)}
  for(let k=0;k<ds.length;k++){let c=0;for(let j=k;j<ds.length&&ds[j]-ds[k]<7;j++)c++;m7=Math.max(m7,c);if(k+2<ds.length&&ds[k+2]-ds[k]<=3)t4++}
  b2b.push(bb);longest.push(lg);longestOut.push(lo);max7.push(m7);three4.push(t4)}
 const bins={};for(const g of gaps){const k=g>=6?'6+':String(g);bins[k]=(bins[k]||0)+1}const pct=Object.fromEntries(['0','1','2','3','4','5','6+'].map(k=>[k,+(100*(bins[k]||0)/gaps.length).toFixed(1)]));
 const games=cal.reduce((n,x)=>n+x.length,0);let blackout=0,run=0,bStart=null,best='';for(let i=first;i<=last;i++){if(cal[i].length){run=0;continue}if(!run)bStart=i;run++;if(run>blackout){blackout=run;best=date(bStart)+'..'+date(i)}}
 return {seasonGames:r.seasonGames,teams:N,games,start:date(first),end:date(last),window:date(0)+'..'+date(days-1),allStar:as?date(as.breakStart-1)+'..'+date(as.breakEnd-1)+' (game '+date(as.end-1)+')':'none',
  restPct:pct,b2bPerTeam:+(b2b.reduce((a,b)=>a+b,0)/N).toFixed(2),b2bMax:Math.max(...b2b),b2bLeague:b2b.reduce((a,b)=>a+b,0),three4Total:three4.reduce((a,b)=>a+b,0),longestBreak:[Math.min(...longest),Math.max(...longest)],longestOutsideAllStar:[Math.min(...longestOut),Math.max(...longestOut)],max7:Math.max(...max7),blackout:blackout+'d '+best,openingNight:state.openingNight?(state.openingNight.games.length+' games'+(state.openingNight.constrained?' (constrained)':'')):'none',firstDayGames:cal[first].length,b2bByTeam:b2b,longestOutByTeam:longestOut,valid:validateCustomSeason(cal,state.teams,r,yr)}})())`));
const out={label:'year '+year,seed:+seed,...measure('',`state.schedule`,'state.year')};
if(extra)out.later=[...Array(+extra).keys()].map(k=>{const yr=+year+1+k;return {year:yr,...measure('',`customSeasonSchedule(state.teams,${yr},leagueRules())`,yr)}});
console.log(JSON.stringify(out));
