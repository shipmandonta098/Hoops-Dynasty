// Controlled A/B of game margins: one frozen league, fixed matchups, rosters and schedule state restored
// before every game, so only the engine differs between checkouts (no trades, injuries or progression).
// Usage: node <checkout>/dev/blocks/ab-margins.cjs <nba|wnba> [games=3000] [seed=8301]
// Prints mean |margin|, 20+ share, and the slope of margin on the pre-game strength gap.
const path=require('path'),{loadLeague}=require(path.join(__dirname,'../load-league.cjs'));
const league=process.argv[2]||'nba',games=+(process.argv[3]||3000),seed=+(process.argv[4]||8301);
const l=loadLeague({seed,strictDOM:false});l.context.L=league;
l.run(`var d=makeDraft();d.gmName='AB';d.year=L==='nba'?2025:2024;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,injuriesEnabled:false,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};state=validateCareerData(buildSetupCareer(d));render=()=>{};simulationExecution.mode='headless';
 globalThis.abSnap=JSON.stringify(state.teams);globalThis.abStrength=state.teams.map(t=>strength(t));`);
l.setRandomSeed(seed+1);
const out=JSON.parse(l.run(`(()=>{const n=state.teams.length,rows=[];for(let i=0;i<${games};i++){state.teams=JSON.parse(abSnap);state.history.length=0;const a=i%n,b=(a+1+Math.floor(i/n)%(n-1))%n;const g=play(a,b,'Exhibition');rows.push([g.sa-g.sb,abStrength[a]-abStrength[b],g.box.reduce((s,p)=>s+(p.blk||0),0)])}return JSON.stringify(rows)})()`));
const m=out.map(r=>Math.abs(r[0])),gap=out.map(r=>r[1]),mar=out.map(r=>r[0]),mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
const mg=mean(gap),mm=mean(mar),slope=out.reduce((s,r)=>s+(r[1]-mg)*(r[0]-mm),0)/out.reduce((s,r)=>s+(r[1]-mg)**2,0);
const resid=out.map(r=>r[0]-mm-slope*(r[1]-mg)),sd=Math.sqrt(mean(resid.map(x=>x*x)));
console.log(JSON.stringify({root:path.resolve(__dirname,'../..').slice(-12),league,games:out.length,meanAbsMargin:+mean(m).toFixed(3),blow20Pct:+(100*m.filter(x=>x>=20).length/m.length).toFixed(2),slopePerStrength:+slope.toFixed(3),residualSD:+sd.toFixed(3),blkPerGame:+mean(out.map(r=>r[2])).toFixed(2)}));
