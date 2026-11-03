// Secondary positions: assignment from height and ratings (deterministic, 0–2 neighbors, never the main position),
// display, rotation ranking (main > secondary > other) and labels, matchup weights, team needs at half weight,
// old saves filled in on load, the save checker, offseason recalculation, and commissioner edits.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:61,strictDOM:false});l.setRandomSeed(61);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;confirm=()=>true;var d=makeDraft();d.gmName='Positions';state=validateCareerData(buildSetupCareer(d));
 var base={hgt:50,stre:50,spd:50,jmp:50,endu:50,dur:50,lay:50,post:50,dnk:50,fg:50,tp:50,ft:50,drb:50,pss:50,per:50,rim:50,stl:50,sbl:50,reb:50,oiq:50,diq:50};
 var mk=(pos,h,a={})=>({id:900000+Math.floor(Math.random()*1e5),pos,ovr:70,bio:{heightInches:h},attributes:{...base,...a}});`);
// 1. Assignment rules.
const sec=(pos,h,a)=>run(`computeSecondaryPositions(mk('${pos}',${h},${JSON.stringify(a)}))`);
assert(sec('SG',75,{pss:90,drb:90,oiq:80,tp:55,per:55,fg:55}).includes('PG'),'a guard who passes and handles → PG');
assert(sec('SG',79,{per:80,tp:70,fg:70,diq:75,stl:70,reb:55}).includes('SF'),'a wing with size → SF');
assert(sec('SF',81,{reb:80,stre:80,post:70,sbl:70,tp:60,per:55,diq:55}).includes('PF'),'a big wing → PF');
assert(sec('C',84,{tp:85,reb:70,stre:70,post:70,sbl:65,rim:65}).includes('PF'),'a big with range → PF');
assert(sec('PF',84,{reb:85,sbl:85,rim:80,stre:80,tp:40,post:60}).includes('C'),'a rim protector → C');
assert.deepEqual(sec('PG',71,{pss:90,drb:90,oiq:85,tp:40,per:40,fg:40}),[],'a small pure point guard has none');
assert.deepEqual(sec('C',86,{reb:90,sbl:90,rim:90,stre:90,tp:20,post:60}),[],'a pure center has none');
// Deterministic (no random draws), at most one, only a neighbor, never the main position.
assert.equal(run(`(()=>{const r=Math.random;Math.random=()=>{throw Error('random used')};try{return allLeaguePlayers().map(p=>computeSecondaryPositions(p).join()).join('|')}finally{Math.random=r}})()`),run(`allLeaguePlayers().map(p=>computeSecondaryPositions(p).join()).join('|')`));
const dist=run(`(()=>{const ps=allLeaguePlayers(),P=['PG','SG','SF','PF','C'];return {n:ps.length,any:ps.filter(p=>p.secondaryPos.length).length,two:ps.filter(p=>p.secondaryPos.length===2).length,ok:ps.every(p=>p.secondaryPos.length<=1&&!p.secondaryPos.includes(p.pos)&&p.secondaryPos.every(x=>Math.abs(P.indexOf(x)-P.indexOf(p.pos))===1))}})()`);
assert(dist.ok,'at most one neighbor, never the main position');assert(dist.any/dist.n>.25&&dist.any/dist.n<.7&&dist.two===0,'distribution: '+JSON.stringify(dist));
// 2. Display.
l.run(`var g=state.teams[0].roster[0];g.pos='PG';g.secondaryPos=['SG'];var h=state.teams[0].roster[1];h.pos='C';h.secondaryPos=[]`);
assert.equal(run('positionLabel(g)'),'PG/SG');assert.equal(run('positionLabel(h)'),'C');assert.equal(run(`positionFullLabel(g)`),'PG · also SG');
l.run(`g.pos='SG';g.secondaryPos=['PG'];rosterTeamId=state.teams[0].id`);assert(run('roster()').includes('SG/PG'),'roster shows SG/PG');
// 3. Rotations: main > secondary > other for depth spots, regardless of rating; labels.
const depth=run(`(()=>{const club=state.teams[1],r=club.roster;delete club.rotationPlan;
  r.forEach((p,i)=>{p.secondaryPos=[];p.pos=['PG','SG','SF','PF','C'][i%5]});
  // Bench (index 5+): a weak natural SF, a strong SG who also plays SF, a stronger PG who doesn't.
  const [weak,flex,star]=[r[5],r[6],r[7]];weak.pos='SF';weak.ovr=55;flex.pos='SG';flex.secondaryPos=['SF'];flex.ovr=75;star.pos='PG';star.ovr=88;
  for(const p of r.slice(8))p.pos='C';
  const plan=rotationFromClub(club);return {backups:plan.depth.SF.slice(1),weak:weak.id,flex:flex.id,star:star.id}})()`);
assert.deepEqual(depth.backups,[depth.weak,depth.flex],'SF backups: natural SF, then the SG who also plays SF (not the higher-rated PG)');
const labels=run(`(()=>{const club=team();delete club.rotationPlan;rotationDraft=null;const r=club.roster;r.forEach((p,i)=>{p.secondaryPos=[];p.pos=['PG','SG','SF','PF','C'][i%5]});
  r[5].pos='PF';r[5].secondaryPos=['C'];r[6].pos='SG';r[6].secondaryPos=[];for(const p of r.slice(7))p.pos='PG';
  const plan=rotationFromClub(club);plan.depth.C[1]=r[5].id;plan.depth.C[2]=r[6].id;rotationDraft=plan;rotationDraftSignature=rotationSignature(club);return rotationsView().match(/rotation-fallback[^>]*>[^<]*/g)||[]})()`);
assert(labels.some(x=>/>Secondary position$/.test(x)),'a secondary-position assignment reads "Secondary position": '+labels.join(' | '));
assert(labels.some(x=>/>Out of position · SG → C$/.test(x)),'an out-of-position assignment is still flagged');
assert(!labels.some(x=>/Secondary · /.test(x)),'old "Secondary · X → Y" wording is gone');
// 4. Matchups: a defender whose main or secondary position matches is weighted 6; neighbors 3; others 1.
assert.equal(run(`(()=>{const q={pos:'SF',secondaryPos:['SG']};return [playsPosition(q,'SG'),playsPosition(q,'SF'),playsPosition(q,'PG')].join()})()`),'true,true,false');
// 5. Team needs: secondary positions count at half weight; a roster without secondaries scores exactly as before.
l.run(`var club=state.teams[2];club.roster.forEach(p=>p.secondaryPos=[])`);
assert.equal(run(`positionCount([{pos:'PG',secondaryPos:['SG']},{pos:'SG',secondaryPos:[]},{pos:'SF',secondaryPos:['SG','PF']}],'SG')`),2);
const draftNeed=run(`(()=>{const p={pos:'C',ovr:60,pot:70},old=(()=>{const at=club.roster.filter(x=>x.pos===p.pos),need=at.length?80-Math.max(...at.map(x=>x.ovr)):20;return p.ovr*.55+p.pot*.45+need*.2})(),now=draftRiskScoreBefore(p,club);
  const cs=club.roster.filter(x=>x.pos==='C');const saved=cs.map(x=>x.pos);cs.forEach(x=>x.pos='PF');const empty=draftRiskScoreBefore(p,club);const pf=club.roster.find(x=>x.pos==='PF'&&x.ovr>=70);pf.secondaryPos=['C'];const half=draftRiskScoreBefore(p,club);cs.forEach((x,i)=>x.pos=saved[i]);pf.secondaryPos=[];return {old,now,empty,half}})()`);
assert.equal(draftNeed.now,draftNeed.old,'draft need unchanged without secondaries');assert(draftNeed.half<draftNeed.empty,'a secondary center lowers the draft need for a center (half weight)');
// 6. Old saves: no secondaryPos anywhere → filled in on load; the save checker keeps and checks the field.
const old=run(`(()=>{const raw=JSON.parse(JSON.stringify(state));for(const p of [...raw.teams.flatMap(t=>t.roster),...raw.free])delete p.secondaryPos;return raw})()`);
l.run(`var oldRaw=${JSON.stringify(JSON.stringify(old))}`);
const loaded=run(`(()=>{const v=validateCareerData(JSON.parse(oldRaw));return {all:[...v.teams.flatMap(t=>t.roster),...v.free].every(p=>Array.isArray(p.secondaryPos)),some:[...v.teams.flatMap(t=>t.roster),...v.free].some(p=>p.secondaryPos.length)}})()`);
assert(loaded.all&&loaded.some,'old save gets secondary positions on load');
assert.deepEqual(run(`validateCareerData(JSON.parse(JSON.stringify(state))).teams[0].roster[0].secondaryPos`),run('state.teams[0].roster[0].secondaryPos'),'round trip');
assert.deepEqual(run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[0].roster[0].pos='SF';r.teams[0].roster[0].secondaryPos=['SG','PF'];return validateCareerData(r).teams[0].roster[0].secondaryPos})()`),['SG'],'an old save with two keeps the first');
for(const bad of [`['SG','SG']`,`['PG','SF','C']`,`['XX']`,`'SG'`])assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[0].roster[0].pos='PG';r.teams[0].roster[0].secondaryPos=${bad};validateCareerData(r)})()`),/secondary position/,bad);
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[0].roster[0].secondaryPos=[r.teams[0].roster[0].pos];validateCareerData(r)})()`),/secondary position/,'main position listed');
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[0].roster[0].secondaryPosManual='yes';validateCareerData(r)})()`),/secondary position setting/);
// 7. Offseason: recalculated from new ratings (a player can grow into a position) unless set by hand.
const grow=run(`(()=>{const p=state.teams[3].roster.find(p=>p.pos==='SG');Object.assign(p.attributes,{pss:40,drb:40,oiq:40});p.bio.heightInches=76;sweepSecondaryPositions(state,true);const before=p.secondaryPos.includes('PG');
  Object.assign(p.attributes,{pss:99,drb:99,oiq:95});sweepSecondaryPositions();const unchangedMidSeason=p.secondaryPos.includes('PG');sweepSecondaryPositions(state,true);const after=p.secondaryPos.includes('PG');
  const q=state.teams[3].roster.find(x=>x!==p&&x.pos==='SG')||p;q.secondaryPos=['SF'];q.secondaryPosManual=true;sweepSecondaryPositions(state,true);return {before,unchangedMidSeason,after,manual:q.secondaryPos.join()}})()`);
assert.deepEqual(grow,{before:false,unchangedMidSeason:false,after:true,manual:'SF'});
// 8. Commissioner edit sets secondary positions (marked as set by hand); the main position can't be one of them.
const pid=run('state.teams[4].roster[0].id');
const form=run(`(()=>{const p=state.teams[4].roster[0];withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const v={name:p.name,pos:'SF',age:String(p.age),ovr:String(p.ovr),pot:String(p.pot),heightInches:String(p.bio.heightInches),weightLbs:String(p.bio.weightLbs),birthdate:p.bio.birthdate,hometown:p.bio.hometown,college:p.bio.college,sec0:'SG'};
  for(const k of ATTRIBUTE_KEYS)v['a_'+k]=String(p.attributes[k]);for(const k of TENDENCY_KEYS)v['t_'+k]=String(p.tendencies[k]);(p.personalityTraits||generateTraits(p)).forEach((t,i)=>v['trait'+i]=t);return v})()`);
assert.match(run(`commissionerPlayerForm(state.teams[4].roster[0])`),/Secondary position</);
const edited=run(`(()=>{const p=commissionerEditPlayer(${pid},${JSON.stringify(form)});return {pos:p.pos,sec:p.secondaryPos,manual:p.secondaryPosManual}})()`);
assert.deepEqual(edited,{pos:'SF',sec:['SG'],manual:true});
assert.throws(()=>run(`commissionerEditPlayer(${pid},${JSON.stringify({...form,sec0:'SF'})})`),/cannot be the main position/);
console.log(`Secondary positions: assignment rules and distribution (${dist.any}/${dist.n} with a secondary position), labels, rotation ranking, matchups, half-weight needs, old saves, save checker, offseason recalculation and commissioner edits passed.`);
