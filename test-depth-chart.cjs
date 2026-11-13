// Depth chart: backups come from the bench (starters only where no bench player can play the spot), ranked by
// position fit then value, spread so each bench player has a home; minutes match the chart; in games the bigs are
// placed first and a C/PF stays on the floor; hand-made charts are kept with a warning.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:44,strictDOM:false});l.setRandomSeed(44);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=()=>Promise.resolve(true);var d=makeDraft();d.gmName='Depth';state=validateCareerData(buildSetupCareer(d));`);
// The reported case: starters PG/SG/SF/PF/C, a 78 SG Sixth Man and a PF/C on the bench.
l.run(`var club=team(),set=(p,pos,sec,ovr)=>{p.pos=pos;p.secondaryPos=[pos,...sec];p.ovr=ovr;p.pot=Math.max(p.pot,ovr);delete p.injury;p.medicalInfo=null};
 club.roster.forEach(p=>{p.medicalInfo=null});
 var r=club.roster.slice().sort((a,b)=>b.ovr-a.ovr);[['PG',[],84],['SG',['SF'],83],['SF',['PF'],82],['PF',[],81],['C',[],80],['SG',['PG'],78],['PF',['C'],74],['PG',[],72],['SF',[],70],['PF',[],66],['SG',[],64],['PF',[],62],['PG',[],60]].forEach(([pos,sec,ovr],i)=>{if(r[i])set(r[i],pos,sec,ovr)});r.slice(13).forEach((p,i)=>set(p,['SG','SF'][i%2],[],55-i));
 club.roster=r;club.lineupMode='auto';delete club.rotationPlan;var plan=rotationFromClub(club),byId=id=>club.roster.find(p=>p.id===id),spots=courtPositions(),starters=new Set(spots.map(pos=>plan.depth[pos][0]));`);
const chart=run("Object.fromEntries(spots.map(pos=>[pos,plan.depth[pos].map(id=>id===null?null:byId(id).name+' '+positionLabel(byId(id))+' '+byId(id).ovr)]))");
assert.equal(run("spots.flatMap(pos=>plan.depth[pos].slice(1)).filter(id=>starters.has(id)).length"),0,'no starter listed as a backup: '+JSON.stringify(chart));
assert.equal(run("byId(plan.depth.C[1]).pos==='C'||secondaryPositions(byId(plan.depth.C[1])).includes('C')"),true,'center backed up by a C or PF/C: '+chart.C);
assert.equal(run("byId(plan.depth.C[1]).ovr"),74,'the PF/C is the center\'s primary backup');
assert.equal(run("byId(plan.depth.SG[1]).ovr"),78,'the 78 Sixth Man backs up his own position');
assert(run("spots.every(pos=>rotationFitTier(byId(plan.depth[pos][1]),pos)>=2)"),'every primary backup plays that position');
assert.equal(run("club.roster.filter(p=>!starters.has(p.id)&&(plan.targets[p.id]||0)>0&&!spots.some(pos=>plan.depth[pos].includes(p.id))).length"),0,'every bench player with minutes is on the chart');
assert(run("new Set(spots.map(pos=>plan.depth[pos][1])).size")>=4,'primary backups spread over the bench');
assert(run("(()=>{const seen=new Map();for(const pos of spots){const id=plan.depth[pos][1];if(seen.has(id)&&!rotationAdjacent(seen.get(id),pos))return false;seen.set(id,pos)}return true})()"),'a player covers two spots only when they are adjacent');
console.log('PASS reported roster:',JSON.stringify(Object.fromEntries(Object.entries(chart).map(([k,v])=>[k,v.slice(1).join(' / ')]))));
// Fit order: main > secondary > adjacent > anything else.
assert.deepEqual(run("[rotationFitTier({pos:'C',secondaryPos:['C']},'C'),rotationFitTier({pos:'PF',secondaryPos:['PF','C']},'C'),rotationFitTier({pos:'PF',secondaryPos:['PF']},'C'),rotationFitTier({pos:'PG',secondaryPos:['PG']},'C')]"),[3,2,1,0]);
// Starters back up a spot only when no bench player can play it at all.
l.run(`var bigs=club.roster.filter(p=>!starters.has(p.id)&&playsPosition(p,'C'));bigs.forEach(p=>{p.pos='SG';p.secondaryPos=['SG']});var startPF=byId(plan.depth.PF[0]);startPF.secondaryPos=['PF','C'];var plan2=rotationFromClub(club);`);
assert.equal(run("plan2.depth.C[1]"),run("startPF.id"),'no bench big: the starting PF/C backs up the center');
assert.equal(run("spots.filter(pos=>pos!=='C').flatMap(pos=>plan2.depth[pos].slice(1)).filter(id=>new Set(spots.map(p=>plan2.depth[p][0])).has(id)).length"),0,'starters stay out of every other backup spot');
console.log('PASS fit order; a starter covers only a spot the bench cannot play');
// Auto-Allocate (the Rotations screen) builds the same chart.
l.run(`club.roster.forEach(p=>{if(p.id!==startPF.id&&!p.pos)p.pos='SG'});rotationDraft=null;autoAllocateRotation();var auto=draftRotation(),autoStarters=new Set(spots.map(pos=>auto.depth[pos][0]));`);
assert.equal(run("spots.flatMap(pos=>auto.depth[pos].slice(1)).filter(id=>autoStarters.has(id)&&spots.some(pos=>auto.depth[pos].slice(1).includes(id)&&club.roster.some(p=>!autoStarters.has(p.id)&&!injuryDays(p)&&playsPosition(p,pos)))).length"),0,'auto-allocate: no avoidable starter backups');
assert.equal(run("club.roster.filter(p=>!autoStarters.has(p.id)&&(auto.targets[p.id]||0)>0&&!spots.some(pos=>auto.depth[pos].includes(p.id))).length"),0,'auto-allocate: bench minutes on the chart');
console.log('PASS Auto-Allocate uses the same bench chart');
// Hand-made charts are kept, with a warning when a starter is also a backup.
l.run(`bigs.forEach(p=>{p.pos='C';p.secondaryPos=['C']});club.lineupMode='manual';var manual=rotationFromClub(club);manual.depth.C[1]=manual.depth.SG[0];club.rotationPlan=JSON.parse(JSON.stringify(manual));var kept=rotationFromClub(club);`);
assert.equal(run("kept.depth.C[1]"),run("manual.depth.SG[0]"),'manual chart kept');
assert.match(run("rotationWarningHTML(kept,club)"),/Starters listed as backups: .*\(starts at SG\) at C/);
l.run("club.rotationPlan.depth.C[1]=987654321");assert.notEqual(run("rotationFromClub(club).depth.C[1]"),987654321,'an invalid entry is replaced');
assert.equal(run("rotationWarningHTML(rotationFromClub(Object.assign(club,{lineupMode:'auto'})),club)"),'','no warning on a generated chart');
l.run("view='Rotations';rotationDraft=null;club.lineupMode='manual';club.rotationPlan.depth.C[1]=manual.depth.SG[0]");assert(run("rotationsView()").includes('Starters listed as backups'),'warning on the Rotations screen');
console.log('PASS hand-made chart kept with a warning; invalid entries replaced');
// In games: bigs placed first and a C/PF kept on the floor; depth backups used. Across a few seeded days.
l.run(`delete club.rotationPlan;club.lineupMode='auto';globalThis.cs={snaps:0,noBig:0,guardC:0,subs:0,depthSubs:0};{const before=refreshGameRotation;refreshGameRotation=function(c,rt,minute,rows,...rest){const prev=new Set(rt.court);const r=before(c,rt,minute,rows,...rest);const ps=[...rt.court].map(id=>c.roster.find(p=>p.id===id)),big=p=>playerPositions(p).some(q=>q==='C'||q==='PF');cs.snaps++;if(!ps.some(big)&&c.roster.some(p=>!rt.court.has(p.id)&&big(p)&&rotationEligible(p,rt,rows,minute)))cs.noBig++;const cp=c.roster.find(p=>p.id===rt.positions?.C);if(cp&&playerPositions(cp).every(q=>q==='PG'||q==='SG'))cs.guardC++;for(const [pos,id] of Object.entries(rt.positions||{}))if(!prev.has(id)&&prev.size){cs.subs++;if(rt.plan.depth[pos]?.includes(id))cs.depthSubs++}return r}}simulationExecution.mode='headless';`);
(async()=>{await l.run('sim(3)');l.run("simulationExecution.mode='normal'");const cs=run('cs');
 assert(cs.snaps>1000,'games simulated');assert.equal(cs.noBig,0,'an eligible C/PF is always used when none is on the floor');
 assert(cs.guardC/cs.snaps<.02,`guards at C ${(cs.guardC/cs.snaps*100).toFixed(2)}%`);assert(cs.depthSubs/cs.subs>.5,`most substitutes come from that position's depth chart (${(cs.depthSubs/cs.subs*100).toFixed(0)}%)`);
 console.log('PASS in games:',cs.snaps,'checks, no-big-while-available 0, guard at C',(cs.guardC/cs.snaps*100).toFixed(2)+'%, subs from that spot\'s depth chart',(cs.depthSubs/cs.subs*100).toFixed(0)+'%');
 // Three- and four-player courts still build complete charts.
 for(const n of [3,4]){l.run(`state.leagueSettings.courtPlayers=${n};var small=rotationFromClub(state.teams[2]),smallSpots=courtPositions(),ss=new Set(smallSpots.map(pos=>small.depth[pos][0]));`);
  assert.equal(run("smallSpots.length"),n);assert(run("smallSpots.every(pos=>small.depth[pos][0]!==null&&small.depth[pos][1]!==null&&!ss.has(small.depth[pos][1]))"),n+'-player court chart')}
 l.run('state.leagueSettings.courtPlayers=5');console.log('PASS 3- and 4-player courts');
})().catch(e=>{console.error(e);process.exit(1)});
