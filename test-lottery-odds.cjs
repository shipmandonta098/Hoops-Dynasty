// Draft lottery odds match the configured system over many simulated lotteries: weighted (linear by record), equal and
// custom weights, drawn without replacement. Each team's frequency at each pick must sit within 4.5 standard errors of
// the exact probability; a smaller run goes through runDraftLottery itself to check it uses the configured weights.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:5,strictDOM:false});const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var seed=12345;var rng=()=>(seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296;`);
const check=(label,weights,draws,trials)=>{
 const r=run(`(()=>{const w=${JSON.stringify(weights)},n=w.length,counts=w.map(()=>Array(n).fill(0));
  for(let k=0;k<${trials};k++){const eligible=w.map((weight,id)=>({id,weight})),order=[...lotteryDraw(eligible,${draws},rng),...eligible.map(t=>t.id)];order.forEach((id,slot)=>counts[id][slot]++)}
  return {counts,odds:lotteryOdds(w,${draws})}})()`);
 let worst=0;
 for(let t=0;t<weights.length;t++)for(let s=0;s<Math.min(weights.length,draws+2);s++){const p=r.odds[t][s],f=r.counts[t][s]/trials,se=Math.sqrt(Math.max(p*(1-p),1e-9)/trials);worst=Math.max(worst,Math.abs(f-p)/se);assert(Math.abs(f-p)<=4.5*se+1e-9,`${label}: team ${t} pick ${s+1}: ${f.toFixed(4)} vs ${p.toFixed(4)}`)}
 // Exact odds are a probability distribution for every team and every slot.
 for(const row of r.odds)assert(Math.abs(row.reduce((a,b)=>a+b,0)-1)<1e-9,label+': team odds sum to 1');
 for(let s=0;s<weights.length;s++)assert(Math.abs(r.odds.reduce((a,row)=>a+row[s],0)-1)<1e-9,label+': slot odds sum to 1');
 return {odds:r.odds,worst};
};
const trials=100000;
// Weighted: 14 lottery teams, the worst team weighted 14 down to 1, four drawn picks.
const linear=Array.from({length:14},(_,i)=>14-i),w=check('weighted',linear,4,trials);
assert(Math.abs(w.odds[0][0]-14/105)<1e-12,'worst team: 14/105 for the first pick');
// Teams outside the drawn picks can only fall: the worst team picks no lower than 5th.
assert.equal(w.odds[0].slice(5).reduce((a,b)=>a+b,0),0);
// Equal chance.
const e=check('equal',Array(14).fill(1),4,trials);assert(e.odds.every(row=>Math.abs(row[0]-1/14)<1e-12));
// Custom: NBA-style 2019 weights (per 1,000 combinations).
const nba=[140,140,140,125,105,90,75,60,45,30,20,15,10,5],c=check('custom',nba,4,trials);
assert(Math.abs(c.odds[0][0]-.14)<1e-12&&Math.abs(c.odds[0].slice(0,4).reduce((a,b)=>a+b,0)-.521)<.001,'worst team ~52.1% top four, 14% first');
// runDraftLottery uses the configured custom weights.
(async()=>{const live=l.run(`(async()=>{const d=makeDraft();d.gmName='Lottery';state=validateCareerData(buildSetupCareer(d));
 state.leagueSettings={...state.leagueSettings,lotteryMode:'custom',lotteryChances:'${nba.join(',')}',lotterySelections:4};
 const ranked=[...state.teams].sort((a,b)=>b.id-a.id);rankStandings=()=>ranked;ownerPlayoffClub=t=>t.id<16;draftReady=()=>true;gmCanAdvance=()=>true;draftCommit=async()=>true;
 const worst=ranked.filter(t=>!ownerPlayoffClub(t)).reverse()[0].id;let first=0,top4=0;const n=3000;
 for(let k=0;k<n;k++){ensureDraft().order=[];await runDraftLottery();const o=state.draft.order;if(o[0]===worst)first++;if(o.slice(0,4).includes(worst))top4++}
 return {first:first/n,top4:top4/n,mode:state.draft.type}})()`);
const p=JSON.parse(JSON.stringify(await live));const se=q=>Math.sqrt(q*(1-q)/3000);
assert.equal(p.mode,'custom');assert(Math.abs(p.first-.14)<=4.5*se(.14),`live first pick ${p.first}`);assert(Math.abs(p.top4-.521)<=4.5*se(.521),`live top four ${p.top4}`);
console.log(`Lottery odds: weighted, equal and custom match exact odds over ${trials} draws each (worst deviation ${Math.max(w.worst,e.worst,c.worst).toFixed(2)} SE); runDraftLottery honors custom weights (first ${p.first}, top four ${p.top4}).`);
})().catch(e=>{console.error(e);process.exit(1)});
