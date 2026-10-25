// Block-rate measurement over part of a season.
// Usage (repo root): node dev/blocks/measure.cjs <nba|wnba> [days=60] [seed=8101] [year] [envJSON]
// envJSON (optional) overrides BLOCK_ENVIRONMENT for the league's gender, e.g. '{"primary":.8,"rotation":.6}'.
// Prints blocks per team per game, blocks as a share of opponent 2PA, the share by position, top per-game
// shot-blockers (at least 10 games), help-side share when recorded, inside FG%, overall FG% and points per team.
const {loadLeague}=require('../load-league.cjs');
const league=process.argv[2]||'nba',days=+(process.argv[3]||60),seed=+(process.argv[4]||8101),year=process.argv[5]&&process.argv[5]!=='-'?+process.argv[5]:(league==='nba'?2025:2024),tune=process.argv[6]||'';
(async()=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.context.L=league;l.context.Y=year;l.context.TUNE=tune;
 l.run(`var d=makeDraft();d.gmName='Blocks';d.year=Y;if(L==='wnba'){d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});}var plan=historicalPlan(L,d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,...(L==='wnba'?{seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0}:{})};state=validateCareerData(buildSetupCareer(d));render=()=>{};if(TUNE&&typeof BLOCK_ENVIRONMENT!=='undefined')Object.assign(BLOCK_ENVIRONMENT[L==='wnba'?'female':'male'],JSON.parse(TUNE));simulationExecution.mode='headless';
  globalThis.bk={games:0,blk:0,opp2pa:0,pts:0,fgm:0,fga:0,insideA:0,insideM:0,help:0,byPos:{},players:{}};const before=play;play=function(...a){const g=before.apply(this,a);if(!g||!g.box)return g;bk.games++;
   const pos=new Map(state.teams.flatMap(t=>t.roster).map(p=>[p.id,p.pos]));
   for(const t of [g.a,g.b]){const ab=state.teams[t].abbr,mine=g.box.filter(p=>p.team===ab),opp=g.box.filter(p=>p.team!==ab);bk.blk+=mine.reduce((n,p)=>n+(p.blk||0),0);bk.opp2pa+=opp.reduce((n,p)=>n+p.fga-p.tpa,0);bk.pts+=mine.reduce((n,p)=>n+p.pts,0);bk.fgm+=mine.reduce((n,p)=>n+p.fgm,0);bk.fga+=mine.reduce((n,p)=>n+p.fga,0)}
   for(const p of g.box){if(p.blk){const ps=pos.get(p.playerId)||'?';bk.byPos[ps]=(bk.byPos[ps]||0)+p.blk}if(p.mp>0){const r=bk.players[p.playerId]??={name:p.name,pos:pos.get(p.playerId),gp:0,blk:0};r.gp++;r.blk+=p.blk||0}}
   bk.insideA+=g.shotDistribution.inside.attempts;bk.insideM+=g.shotDistribution.inside.made;bk.help+=g.helpBlocks||0;return g};`);
 for(let i=0;i<days;i++)await l.run('simulateDayHeadless()');
 const b=JSON.parse(l.run('JSON.stringify(bk)')),teamGames=b.games*2,tot=Object.values(b.byPos).reduce((a,c)=>a+c,0);
 const leaders=Object.values(b.players).filter(r=>r.gp>=10).map(r=>({name:r.name,pos:r.pos,gp:r.gp,bpg:+(r.blk/r.gp).toFixed(2)})).sort((a,c)=>c.bpg-a.bpg).slice(0,8);
 console.log(JSON.stringify({league,year,seed,tune,games:b.games,blkPerTeam:+(b.blk/teamGames).toFixed(3),blkPctOpp2PA:+(100*b.blk/b.opp2pa).toFixed(2),helpShare:b.blk?+(100*b.help/b.blk).toFixed(1):0,
  byPosPct:Object.fromEntries(Object.entries(b.byPos).sort().map(([k,v])=>[k,+(100*v/tot).toFixed(1)])),bigShare:+(100*((b.byPos.C||0)+(b.byPos.PF||0))/tot).toFixed(1),leaders,
  insideFG:+(100*b.insideM/b.insideA).toFixed(2),fgPct:+(100*b.fgm/b.fga).toFixed(2),ptsPerTeam:+(b.pts/teamGames).toFixed(2)}));
})().catch(e=>{console.error(e.stack||e);process.exitCode=1});
