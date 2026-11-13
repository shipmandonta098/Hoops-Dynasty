// Depth-chart audit: 10 generated leagues (5 NBA 2025, 5 WNBA 2024). Charts as games build them (rotationFromClub,
// wrappers included) on opening day and after 12 simulated days (injuries), plus in-game court snapshots.
// Usage: node audit.cjs <repo dir> <out.json>
const path=require('path'),fs=require('fs'),repo=path.resolve(process.argv[2]||'.'),out=process.argv[3];
const {loadLeague}=require(path.join(repo,'dev/load-league.cjs'));
const LEAGUES=[...[1,2,3,4,5].map(s=>['nba',9100+s]),...[1,2,3,4,5].map(s=>['wnba',9200+s])];
const SETUP=lg=>`var d=makeDraft();d.gmName='Depth audit';d.year=${lg==='nba'?2025:2024};${lg==='wnba'?"d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});":''}var plan=historicalPlan('${lg}',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,${lg==='wnba'?"seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0":''}};syncAlignment(d);state=validateCareerData(buildSetupCareer(d));render=()=>{};toast=()=>{};`;
const MEASURE=`(()=>{const guard=p=>playerPositions(p).every(q=>q==='PG'||q==='SG'),big=p=>playerPositions(p).some(q=>q==='C'||q==='PF'),cap=p=>playsPosition(p,'C');
 const r={teams:0,starterBackups:0,avoidable:0,cGuard:0,cNonBigAvoidable:0,missing:0,benchWithMinutes:0,distinctPrimaries:0,primarySlots:0,examples:[]};
 for(const t of state.teams){const plan=rotationFromClub(t),spots=courtPositions(),starters=new Set(spots.map(pos=>plan.depth[pos][0])),healthy=t.roster.filter(p=>!injuryDays(p)),bench=healthy.filter(p=>!starters.has(p.id)),byId=id=>t.roster.find(p=>p.id===id);r.teams++;
  for(const pos of spots)for(const id of plan.depth[pos].slice(1)){if(id!==null&&starters.has(id)){r.starterBackups++;if(bench.some(p=>playsPosition(p,pos))){r.avoidable++;if(r.examples.length<4)r.examples.push(t.abbr+' '+pos+': starter '+byId(id).name+' ('+positionLabel(byId(id))+')')}}}
  if(spots.includes('C')){const b=byId(plan.depth.C[1]);if(b&&guard(b))r.cGuard++;if(b&&!cap(b)&&healthy.some(p=>p.id!==plan.depth.C[0]&&cap(p)&&!starters.has(p.id)))r.cNonBigAvoidable++}
  const listed=new Set(spots.flatMap(pos=>plan.depth[pos]));for(const p of bench)if((plan.targets[p.id]||0)>0){r.benchWithMinutes++;if(!listed.has(p.id))r.missing++}
  const prim=spots.map(pos=>plan.depth[pos][1]).filter(id=>id!==null);r.primarySlots+=prim.length;r.distinctPrimaries+=new Set(prim).size}
 return r})()`;
const GAME_HOOK=`globalThis.courtStats={snaps:0,noBig:0,noBigAvoidable:0,guardAtC:0};{const before=refreshGameRotation;refreshGameRotation=function(club,runtime,...rest){const r=before(club,runtime,...rest);const ids=[...runtime.court],ps=ids.map(id=>club.roster.find(p=>p.id===id)),big=p=>playerPositions(p).some(q=>q==='C'||q==='PF');courtStats.snaps++;if(!ps.some(big)){courtStats.noBig++;if(club.roster.some(p=>!injuryDays(p)&&big(p)&&!ids.includes(p.id)))courtStats.noBigAvoidable++}const c=runtime.positions?.C;const cp=c!==undefined&&club.roster.find(p=>p.id===c);if(cp&&playerPositions(cp).every(q=>q==='PG'||q==='SG'))courtStats.guardAtC++;return r}}`;
(async()=>{const rows=[];
 for(const [lg,seed] of LEAGUES){const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.run(SETUP(lg));
  const day0=JSON.parse(l.run('JSON.stringify('+MEASURE+')'));l.run(GAME_HOOK+";simulationExecution.mode='headless';");await l.run('sim(12)');l.run('simulationExecution.mode="normal"');
  const day12=JSON.parse(l.run('JSON.stringify('+MEASURE+')')),court=JSON.parse(l.run('JSON.stringify(courtStats)'));
  rows.push({league:lg,seed,day0,day12,court});console.error(lg,seed,'day0',day0.starterBackups,day0.cGuard,day0.missing,'day12',day12.starterBackups,day12.cGuard,day12.missing,'court',court.noBig,court.guardAtC,'/',court.snaps)}
 const sum=(k,f)=>rows.reduce((n,r)=>n+r[k][f],0),fields=['teams','starterBackups','avoidable','cGuard','cNonBigAvoidable','missing','benchWithMinutes','distinctPrimaries','primarySlots'];
 const total={day0:Object.fromEntries(fields.map(f=>[f,sum('day0',f)])),day12:Object.fromEntries(fields.map(f=>[f,sum('day12',f)])),court:Object.fromEntries(['snaps','noBig','noBigAvoidable','guardAtC'].map(f=>[f,sum('court',f)]))};
 const result={repo,total,rows};if(out)fs.writeFileSync(out,JSON.stringify(result,null,1));console.log(JSON.stringify(total))})().catch(e=>{console.error(e);process.exit(1)});
