// Starting-lineup audit: for new leagues, at opening day and after half a season, counts starters playing out of
// position (main and secondary positions both count as in position) beyond what the healthy roster forces, and starters
// who are not the best available at their spot (a healthy non-starter who plays that position has a higher OVR).
// Starters are the rotation plan's (rotationFromClub, as used by the game). Self-contained checks, so the same script
// measures any build. Usage: node dev/lineup-audit.cjs [repo dir=.] [first seed=5100] [count=10] [out.json]
const path=require('node:path'),fs=require('node:fs');
const dir=path.resolve(process.argv[2]||'.'),first=Number(process.argv[3]||5100),count=Number(process.argv[4]||10),out=process.argv[5];
const {loadLeague}=require(dir+'/dev/load-league.cjs');
const AUDIT=`(()=>{const P=['PG','SG','SF','PF','C'],plays=(p,pos)=>p.pos===pos||(p.secondaryPos||[]).includes(pos);let oop=0,forced=0,notBest=0,teams=0,examples=[];
 for(const t of state.teams){const plan=rotationFromClub(t),healthy=t.roster.filter(p=>!injuryDays(p)),starters=P.map(pos=>[pos,t.roster.find(p=>p.id===plan.depth[pos][0])]);
  // Most spots the healthy roster can fill in position (exact, over all assignments).
  let best=new Map([[0,0]]);for(const p of healthy){const next=new Map(best);for(const [m,v] of best)for(let i=0;i<5;i++)if(!(m&1<<i)&&plays(p,P[i])&&(next.get(m|1<<i)??-1)<v+1)next.set(m|1<<i,v+1);best=next}
  const possible=Math.max(...best.values()),inPos=starters.filter(([pos,p])=>p&&plays(p,pos)).length,extra=Math.max(0,possible-inPos);
  const used=new Set(starters.map(([,p])=>p?.id)),weak=starters.filter(([pos,p])=>p&&healthy.some(q=>!used.has(q.id)&&plays(q,pos)&&q.ovr>p.ovr));
  oop+=5-inPos;forced+=5-possible;notBest+=weak.length;if(extra||weak.length)teams++;
  if(examples.length<3)for(const [pos,p] of starters)if(p&&!plays(p,pos)&&extra&&examples.length<3)examples.push(t.abbr+': '+p.ovr+' '+p.pos+' at '+pos)}
 return {spots:state.teams.length*5,outOfPosition:oop,forcedByRoster:forced,avoidable:oop-forced,notBestAvailable:notBest,teamsAffected:teams,examples}})()`;
(async()=>{const rows=[];
 for(let seed=first;seed<first+count;seed++){const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
  l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Lineup audit';state=validateCareerData(buildSetupCareer(d));simulationExecution.mode='headless';simulationExecution.autopilot=true;`);
  const opening=JSON.parse(l.run(`JSON.stringify(${AUDIT})`));const half=Math.floor(l.run('seasonLength()')/2);
  for(let d=0;d<half;d++)await l.run('simulateDayHeadless()');
  const mid=JSON.parse(l.run(`JSON.stringify(${AUDIT})`));rows.push({seed,opening,midseason:{day:l.run('state.day'),...mid}});
  console.log(JSON.stringify(rows.at(-1)));}
 const sum=(k,w)=>rows.reduce((n,r)=>n+r[w][k],0);
 const total={leagues:rows.length,opening:Object.fromEntries(['spots','outOfPosition','forcedByRoster','avoidable','notBestAvailable','teamsAffected'].map(k=>[k,sum(k,'opening')])),midseason:Object.fromEntries(['spots','outOfPosition','forcedByRoster','avoidable','notBestAvailable','teamsAffected'].map(k=>[k,sum(k,'midseason')]))};
 console.log('TOTAL',JSON.stringify(total));if(out)fs.writeFileSync(out,JSON.stringify({total,rows},null,1));
})().catch(e=>{console.error(e);process.exit(1)});
