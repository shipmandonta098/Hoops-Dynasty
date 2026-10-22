const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./load-league.cjs');
const l=loadLeague({seed:91,strictDOM:false});
l.run(`var d=makeDraft();d.gmName='Altitude balance';d.teams=d.teams.slice(0,4);d.meetings=2;state=buildSetupCareer(d);state.leagueSettings.homeAdvantage=0;state.teams[1].roster=structuredClone(state.teams[0].roster).map((p,i)=>({...p,id:50000+i}));state.teams[1].coach=structuredClone(state.teams[0].coach);delete state.teams[0].rotationPlan;delete state.teams[1].rotationPlan;simulationExecution.mode='headless';var baseline=structuredClone(state);`);
const cases=[['Denver','Miami',false],['Salt Lake City','Miami',false],['Denver','Salt Lake City',false],['Miami','New York',false],['Denver','Miami',true]],results=[];
const seeds=100;
for(const [home,away,adapted] of cases){let wins=[0,0],margins=[0,0],stamina=[0,0],exposure=0;
 for(let seed=1;seed<=seeds;seed++)for(let on=0;on<=1;on++){
  l.run(`state=structuredClone(baseline);state.teams[0].city=${JSON.stringify(home)};state.teams[1].city=${JSON.stringify(away)};state.leagueSettings.altitudeStrength=${on};state.day=4;${adapted?"state.teams[1].altitudeVisits=[{year:state.year,day:0,feet:5280,city:'Denver',away:true}];":''}`);
  l.setRandomSeed(seed*1009);const r=l.run(`var g=simulateAttributeGame(0,1);({win:g.winner===0,margin:g.sa-g.sb,exposure:g.altitude.exposure,stamina:g.box.filter(p=>p.team===state.teams[1].abbr&&p.mp>0).reduce((n,p)=>n+p.stamina*p.mp,0)/g.box.filter(p=>p.team===state.teams[1].abbr).reduce((n,p)=>n+p.mp,0)})`);
  wins[on]+=+r.win;margins[on]+=r.margin;stamina[on]+=r.stamina;if(on)exposure=r.exposure;
 }
 const row={home,away,adapted,seeds,games:seeds*2,exposure,homeWinPct:wins.map(n=>n/seeds*100),meanHomeMargin:margins.map(n=>n/seeds),visitorFinalStamina:stamina.map(n=>n/seeds)};results.push(row);console.log(JSON.stringify(row));
 if(home==='Miami'||away==='Salt Lake City')assert.deepEqual([wins[0],margins[0]],[wins[1],margins[1]],'Negligible elevation should leave seeded outcomes unchanged');
}
fs.writeFileSync('dev/altitude-balance-results.json',JSON.stringify({note:'Paired seeds, identical rosters/coaches, no crowd advantage, equal rest, reset state each game. 100 seeds per case: exploratory balance, not scientific estimates.',results},null,2)+'\n');
