// Position-based starting lineups: best-total assignment by main/secondary position, out-of-position only when no
// healthy player fits (and flagged), auto teams reordered before games, manual lineups kept with a warning, bench
// minutes by OVR (sixth man), save field and old saves.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:91,strictDOM:false});l.setRandomSeed(91);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Lineups';state=validateCareerData(buildSetupCareer(d));
 // A club built by hand: players are copies of real ones with set positions and ratings.
 var club=state.teams[5],base=club.roster.slice();var set=(i,pos,ovr,sec=[])=>Object.assign(club.roster[i],{pos,ovr,secondaryPos:sec,injuredUntil:0,medicalInfo:undefined});
 var starters=()=>{const a=lineupAssignment(club);return Object.fromEntries(Object.entries(a).map(([pos,id])=>[pos,club.roster.find(p=>p.id===id).ovr+' '+club.roster.find(p=>p.id===id).pos]))};
 var build=specs=>{club.roster.forEach((p,i)=>set(i,'C',40));specs.forEach((s,i)=>set(i,...s));delete club.rotationPlan;club.lineupMode='auto'};`);
(async()=>{
// 1. The report's case: a 95 PF and a 95 C at the top of the roster start at PF and C, not at PG/SG.
l.run(`build([['PF',95],['C',95],['PG',70],['SG',72],['SF',74],['PG',60],['SG',61]])`);
assert.deepEqual(run('starters()'),{PG:'70 PG',SG:'72 SG',SF:'74 SF',PF:'95 PF',C:'95 C'});
// Best total, not greedy: a 90 SF/PF and an 85 PF with no other SF → the dual player starts at SF, the PF at PF.
l.run(`build([['SF',90,['PF']],['PF',85],['PG',70],['SG',70],['C',70],['SF',50]])`);
assert.deepEqual(run('starters()'),{PG:'70 PG',SG:'70 SG',SF:'90 SF',PF:'85 PF',C:'70 C'});
l.run(`build([['PF',90,['SF']],['PF',85],['PG',70],['SG',70],['C',70],['SF',50]])`);
assert.deepEqual(run('starters()'),{PG:'70 PG',SG:'70 SG',SF:'90 PF',PF:'85 PF',C:'70 C'},'a secondary SF beats a weak natural SF when the total is higher');
// Total OVR decides between eligible players (main or secondary): 75 PG + 80 SG beats 80 SG/PG at PG + 60 SG.
const t=run(`(()=>{build([['SG',80,['PG']],['PG',75],['SF',70],['PF',70],['C',70],['SG',60]]);const a=lineupAssignment(club);return [club.roster.find(p=>p.id===a.PG).ovr,club.roster.find(p=>p.id===a.SG).ovr]})()`);
assert.deepEqual(t,[75,80],'total OVR decides: 75 PG + 80 SG');
// Out of position only when nobody healthy fits, and the rotation view flags it.
l.run(`build([['PG',80],['SG',75],['SF',75],['PF',75],['C',75],['SG',70],['SF',65]]);club.roster[0].injuredUntil=moraleStamp()+30`);
const out=run(`(()=>{const a=lineupAssignment(club),p=club.roster.find(p=>p.id===a.PG);return {pos:p.pos,ovr:p.ovr,flag:lineupOutOfPosition(club,a).map(x=>x.pos)}})()`);
assert.deepEqual(out.flag,['PG'],'no healthy PG: one out-of-position starter, flagged');
l.run(`club.roster[0].injuredUntil=0`);
// 2. Auto teams: the roster is put in lineup order before a game (starters by position, then the bench by OVR).
l.run(`build([['PF',95],['C',95],['PG',70],['SG',72],['SF',74],['PG',60],['SG',61],['SF',80]])`);
const reordered=run(`(()=>{applyAutoLineup(club);return club.roster.slice(0,6).map(p=>p.ovr+' '+p.pos)})()`);
assert.deepEqual(reordered,['70 PG','72 SG','80 SF','95 PF','95 C','74 SF'],'starters first in position order, then the best bench player');
const plan=run(`(()=>{const p=rotationFromClub(club);return {sf:club.roster.find(x=>x.id===p.depth.SF[0]).ovr,role:p.roles[club.roster[5].id]}})()`);
assert.deepEqual(plan,{sf:80,role:'Sixth Man'});
// play() applies it before every game (CPU teams).
const beforeGame=run(`(()=>{const other=state.teams.find(t=>t!==club);club.roster.reverse();play(club.id,other.id);return club.roster.slice(0,5).map(p=>p.pos).join()})()`);
assert.equal(beforeGame,'PG,SG,SF,PF,C');
// 3. Manual lineups stay as set, with an out-of-position warning in the rotation view.
const mine=run(`(()=>{const me=team();me.lineupMode='auto';applyAutoLineup(me);const bench=me.roster[7];promote(bench.id);return {mode:me.lineupMode,starter:me.roster.slice(0,5).some(p=>p.id===bench.id)}})()`);
assert.deepEqual(mine,{mode:'manual',starter:true},'Start button → manual lineup');
const kept=run(`(()=>{const me=team(),order=me.roster.map(p=>p.id).join();applyAutoLineup(me);play(me.id,state.teams.find(t=>t!==me).id);return me.roster.map(p=>p.id).join()===order})()`);
assert(kept,'a manual lineup is not reordered');
const warn=run(`(()=>{const me=team();me.roster[0].pos='C';me.roster[0].secondaryPos=[];rotationDraft=null;delete me.rotationPlan;return lineupNotice(me)})()`);
assert.match(warn,/Out of position/);assert.match(warn,/Use auto lineup by position/);
const back=await l.run(`(async()=>{await setLineupMode('auto');const me=team(),a=lineupAssignment(me);return {mode:me.lineupMode,first:me.roster.slice(0,5).map(p=>p.id).join()===courtPositions().map(p=>a[p]).join()}})()`);
assert.deepEqual(JSON.parse(JSON.stringify(back)),{mode:'auto',first:true});
// 4. Bench minutes follow OVR, sum to 240, and never exceed a starter's.
const mins=run(`(()=>{const c=state.teams[8];applyAutoLineup(c);const m=c.roster.map(p=>playerMinutes(p,c));const bench=m.slice(5),ovr=c.roster.slice(5).map(p=>p.ovr);return {sum:m.reduce((a,b)=>a+b,0),six:bench[0],last:bench.at(-1),max:Math.max(...bench),starter:Math.min(...m.slice(0,5)),sorted:ovr.every((x,i)=>!i||ovr[i-1]>=x)}})()`);
assert.equal(mins.sum,240);assert(mins.six>mins.last&&mins.six>=12,'sixth man plays real minutes: '+JSON.stringify(mins));assert(mins.max<=mins.starter);
assert.deepEqual(run(`coachBenchMinutes({roster:[...Array(6)].map((_,i)=>({id:i,ovr:70}))},35)`),[65],'a one-player bench keeps the old split');
// The ad-hoc games above weren't on the schedule; reset records so saves check against season progress.
l.run(`state.teams.forEach(t=>{t.w=0;t.l=0});state.history=[]`);
// 5. Saves: lineupMode is checked; old saves keep a user rotation plan whose starters differ as manual; CPU teams are auto.
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[0].lineupMode='sometimes';validateCareerData(r)})()`),/lineup mode/);
const legacy=run(`(()=>{const r=JSON.parse(JSON.stringify(state)),you=controlledTeamId();for(const t of r.teams)delete t.lineupMode;const me=r.teams[you];delete me.rotationPlan;const v=validateCareerData(r);return {you:v.teams[you].lineupMode,cpu:v.teams.filter(t=>t.id!==you).every(t=>t.lineupMode==='auto')}})()`);
assert.deepEqual(legacy,{you:'auto',cpu:true},'old save without a saved plan: auto');
console.log('Position lineups: best-total assignment (main/secondary, OVR), out-of-position only when forced and flagged, auto reorder before games, manual lineups kept with a warning, OVR-weighted bench minutes, save field and old saves passed.');
})().catch(e=>{console.error(e);process.exit(1)});
