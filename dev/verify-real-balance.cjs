const fs=require('fs'),assert=require('assert/strict');const out={};
for(const league of ['nba','wnba']){
 const data=JSON.parse(fs.readFileSync(`dev/secondary-shot-audit/real-${league}-2024.json`));
 // NBA Cup championship is outside the 82-game regular season (UTC date below).
 const excluded=league==='nba'?data.games.filter(g=>g.date==='18/12/2024 01:30'&&g.home==='Oklahoma City Thunder'&&g.away==='Milwaukee Bucks'):[];
 if(league==='nba')assert.equal(excluded.length,1);
 const games=data.games.filter(g=>!excluded.includes(g)),teams={};
 for(const g of games){assert(g.score[0]!==g.score[1]);for(const [i,team] of [g.home,g.away].entries()){const t=teams[team]??={gp:0,w:0,pts:0,opp:0};t.gp++;t.w+=g.score[i]>g.score[1-i];t.pts+=g.score[i];t.opp+=g.score[1-i];}}
 assert.equal(games.length,league==='nba'?1230:240);assert.equal(Object.keys(teams).length,league==='nba'?30:12);assert(Object.values(teams).every(t=>t.gp===(league==='nba'?82:40)));
 const ids=games.map(g=>g.date+'|'+g.home+'|'+g.away);assert.equal(new Set(ids).size,ids.length);
 const margins=games.map(g=>Math.abs(g.score[0]-g.score[1])).sort((a,b)=>a-b),avg=values=>values.reduce((a,b)=>a+b,0)/values.length;
 out[league]={source:data.source,games:games.length,excluded,teams,meanMargin:avg(margins),medianMargin:(margins[margins.length/2-1]+margins[margins.length/2])/2,maxMargin:Math.max(...margins),ppg:avg(games.map(g=>(g.score[0]+g.score[1])/2)),homeWinPct:100*games.filter(g=>g.score[0]>g.score[1]).length/games.length,bins:Object.fromEntries([[1,5],[6,10],[11,19],[20,29],[30,39],[40,49],[50,999]].map(([a,b])=>[a+'-'+b,100*margins.filter(n=>n>=a&&n<=b).length/games.length]))};
 console.log(league,JSON.stringify({...out[league],teams:undefined,excluded:undefined}));
}
fs.writeFileSync('dev/secondary-shot-audit/real-summary.json',JSON.stringify(out,null,2));
