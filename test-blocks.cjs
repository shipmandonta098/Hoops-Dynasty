// Shot blocking: block tendency is willingness to contest (not a second skill roll), help-side rim
// protectors can rotate and block inside attempts, the block-tendency setting still scales/disables blocks.
// Rates and FG% neutrality are measured by dev/blocks/measure.cjs and the season scorecard.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:41,strictDOM:false});l.setRandomSeed(41);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`var d=makeDraft();d.gmName='Blocks';d.year=2025;var plan=historicalPlan('nba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings=plan.rules;state=validateCareerData(buildSetupCareer(d));render=()=>{};`);
// 1. Willingness: 0.6–1.0 of the skill roll at the default setting, monotonic in the block tendency.
const w=run(`(()=>{const ps=state.teams.flatMap(t=>t.roster);const v=ps.map(p=>[tendency(p,'block'),contestWillingness(p)]);return {min:Math.min(...v.map(x=>x[1])),max:Math.max(...v.map(x=>x[1])),mono:v.every(a=>v.every(b=>a[0]<=b[0]||a[1]>=b[1]))}})()`);
assert(w.min>=.6&&w.max<=1&&w.mono,JSON.stringify(w));
// 2. Games: blocks credited to defenders on the floor, help-side blocks happen, scores conserved.
const g=run(`(()=>{let blk=0,help=0,ok=true,bigs=0;for(let i=0;i<24;i++){const g=play(i%15*2,i%15*2+1,'Exhibition');const pos=new Map(state.teams.flatMap(t=>t.roster).map(p=>[p.id,p.pos]));
 for(const p of g.box){if(p.blk){blk+=p.blk;if(['C','PF'].includes(pos.get(p.playerId)))bigs+=p.blk;if(!(p.mp>0))ok=false}}help+=g.helpBlocks;if(g.box.reduce((n,p)=>n+p.pts,0)!==g.sa+g.sb||!g.summaryData.complete)ok=false;if(Object.keys(g).includes('helpBlocks'))ok=false}
 return {blk,help,ok,bigs,games:24}})()`);
assert(g.ok,'blockers played, scores conserved, counter not saved');assert(g.help>0&&g.help<g.blk,'help-side blocks are a share of all blocks');
assert(g.blk/(g.games*2)>3.5&&g.blk/(g.games*2)<6.5,'blocks per team per game in a plausible range: '+g.blk/(g.games*2));assert(g.bigs/g.blk>.55,'bigs block most shots');
// 3. The block-tendency setting still scales attempts: 0 removes every block (including help-side).
assert.equal(run(`(()=>{state.leagueSettings={...leagueRules(),blockTendency:0};let blk=0;for(let i=0;i<6;i++){const g=play(i*2,i*2+1,'Exhibition');blk+=g.box.reduce((n,p)=>n+(p.blk||0),0)}state.leagueSettings={...leagueRules(),blockTendency:1};return blk})()`),0);
console.log('Blocks: willingness model, help-side rim protection, box credit and the block-tendency setting passed.',JSON.stringify({perTeam:+(g.blk/(g.games*2)).toFixed(2),helpShare:+(g.help/g.blk).toFixed(2),bigShare:+(g.bigs/g.blk).toFixed(2)}));
