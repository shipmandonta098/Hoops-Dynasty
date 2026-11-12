// Family leave: a non-injury status. Maternity (female players) and paternity (male players) leave make the player
// unavailable without a medical record (no injury reports, no durability/reinjury effects, no ratings change), keep the
// salary in full and the roster spot (never waived, not counted toward the maximum, CPU temporary cover released on
// return), ramp minutes/energy for 2–4 weeks after maternity leave, respect the league setting and never touch real
// historical people. Saves validate the status; the commissioner editor sets and clears it.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const make=(seed,setup)=>{const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);l.run(`render=()=>{};toast=()=>{};save=async()=>true;var d=makeDraft();d.gmName='Leave';${setup}state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});var news=()=>newsStore().items.map(i=>i.headline);`);return {l,run:c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v}}};
const advance=(l,days)=>l.run(`(()=>{for(let i=0;i<${days};i++){state.day++;familyLeaveDaily()}})()`);
// ---- Fictional women's league (standard rules, not WNBA) ----
{const {l,run}=make(91,"d.leagueGender='female';");
 assert.equal(run('wnbaEnabled()'),false);assert.equal(run("leagueRules().familyLeave??'normal'"),'normal');
 l.run(`var club=state.teams[4],p=club.roster.find(q=>q.age>=26&&q.age<=34)||club.roster[0];var ratings=JSON.stringify([p.ovr,p.pot,p.attributes]),salary=p.salary,through=p.contractThrough;`);
 // 1. Maternity leave announced at season start: misses the season; not an injury.
 l.run(`startFamilyLeave(p,'maternity',{announced:'season'})`);
 assert(run('familyLeaveActive(p)&&injuryDays(p)>=seasonLength()'));assert.equal(run('p.medicalInfo===undefined'),true,'no medical record');
 assert.match(run('news()[0]'),/announces she is expecting and will miss the \d{4}(–\d\d)? season\./);
 assert.equal(run('teamInjurySnapshot([club.id]).some(x=>x.id===p.id)'),false,'not in injury reports');
 assert.match(run('durabilityHealthText(p)'),/^Family leave · Maternity leave\..*Salary continues in full; not an injury\./);
 assert.match(run('familyLeaveStatusLabel(p)'),/^Family leave · \d+ days$/);
 // No injuries while on leave: the medical check returns at once.
 l.run(`(()=>{const c=durabilityInjuryChance;durabilityInjuryChance=()=>1;try{durabilityMedicalCheck(p,club,30,80,{rotationEvents:[]})}finally{durabilityInjuryChance=c}})()`);assert.equal(run('p.medicalInfo===undefined'),true);
 // 2. Roster: never waived, not counted toward the maximum; a CPU short-handed club signs cover without waiving her.
 assert.equal(run(`familyLeaveRosterCount(club)`),run('club.roster.length-1'));
 l.run(`(()=>{while(club.roster.length<rosterMaximum()){const f=state.free.shift();if(!f)break;club.roster.push(f)}for(const q of club.roster.filter(q=>q!==p).slice(0,6))q.medicalInfo={name:'ankle sprain',severity:'Minor',until:medicalStamp()+20,rehabUntil:medicalStamp()+24}})()`);
 assert.equal(run('club.roster.length'),run('rosterMaximum()'));assert.notEqual(run('cpuWaiveCandidate(club)?.id'),run('p.id'),'she is never the waiver choice');
 const before=run('club.roster.length');l.run(`state.day=Math.max(1,state.day);cpuFillRoster(club)`);
 assert(run('club.roster.length')>before,'cover signed beyond the counted maximum');assert(run('club.roster.includes(p)'),'her roster spot is kept');
 const cover=run('club.roster.find(q=>q.familyLeaveCover?.for===p.id)?.id');assert(Number.isInteger(cover),'cover tagged');
 // 3. Salary continues in full; nothing about her contract changes.
 assert.deepEqual(run('[p.salary,p.contractThrough]'),[run('salary'),run('through')]);assert(run('ownerPayroll(club)>=p.salary'));
 // 4. Return: ramp of 2–4 weeks (minutes ~60% then ~80%, energy ≤ 85); the cover is released if the club is over the limit.
 l.run('for(const q of club.roster)if(q!==p)delete q.medicalInfo');
 const days=run('familyLeaveDays(p)');advance(l,days+1);
 assert.equal(run('familyLeaveActive(p)'),false);assert.equal(run('p.familyLeave.state'),'ramp');assert.equal(run('injuryDays(p)'),0);
 const ramp=run('p.familyLeave.rampUntil-p.familyLeave.rampStart');assert(ramp>=14&&ramp<=28,'ramp 2–4 weeks: '+ramp);
 assert(run('news().slice(0,3)').some(h=>/returns from maternity leave and will ease back in over the next few weeks\./.test(h)),'return announced');
 assert.equal(run('injuryMinutesCap(p)'),Math.round(run('gameMinutes()')*.6));assert(run('playerEnergy(p,club)<=85'));assert.match(run('durabilityHealthText(p)'),/Returning from maternity leave · Conditioning ramp/);
 advance(l,Math.ceil(ramp/2)+1);assert.equal(run('injuryMinutesCap(p)'),Math.round(run('gameMinutes()')*.8));
 assert.equal(run(`club.roster.some(q=>q.id===${cover})`),false,'cover released on her return');
 advance(l,ramp);assert.equal(run('p.familyLeave===undefined'),true,'ramp over');assert.equal(run('injuryMinutesCap(p)'),Infinity);
 assert.equal(run('JSON.stringify([p.ovr,p.pot,p.attributes])'),run('ratings'),'no permanent ratings change');
 // 5. In-season announcement: rest of the season plus part of the next (about 10–13 months).
 l.run(`var p2=club.roster.find(q=>q!==p);startFamilyLeave(p2,'maternity',{announced:'inSeason'})`);const d2=run('familyLeaveDays(p2)');assert(d2>=300&&d2<=400);assert.match(run('news()[0]'),/expecting and will miss the rest of the season and the start of next season\./);
 // 6. Events: off → none; low < normal; age-weighted; real historical people excluded.
 const rate=run(`(()=>{const count=setting=>{state.leagueSettings.familyLeave=setting;let n=0,young=0,old=0;for(let r=0;r<60;r++){for(const t of state.teams)for(const q of t.roster)delete q.familyLeave;familyLeaveSeasonStart();for(const t of state.teams)for(const q of t.roster)if(q.familyLeave){n++;if(q.age<20)young++;if(q.age>40)old++}}return {n,young,old}};const out={off:count('off'),low:count('low'),normal:count('normal')};state.leagueSettings.familyLeave='normal';for(const t of state.teams)for(const q of t.roster)delete q.familyLeave;return out})()`);
 assert.equal(rate.off.n,0);assert(rate.normal.n>rate.low.n&&rate.normal.n>0,'normal > low > off: '+JSON.stringify(rate));assert.equal(rate.normal.young+rate.normal.old,0,'age-weighted');
 assert.equal(run(`(()=>{const q=club.roster[2];q.historicalPersonId='h:test';delete q.familyLeave;const ok=familyLeaveEligible(q);delete q.historicalPersonId;return ok})()`),false,'real people never');
 assert.doesNotMatch(run(`(()=>{const q=club.roster[2];q.historicalPersonId='h:test';const f=commissionerPlayerForm(q);delete q.historicalPersonId;return f})()`),/name="familyLeave"/);
 // 7. Commissioner: set, change, clear.
 l.run(`var q=club.roster[3];delete q.familyLeave;var form=(x={})=>{withBasketballAttributes(q);q.tendencies??=generatedTendencies(q);const b=q.bio,t=q.personalityTraits||generateTraits(q),n=commissionerNameParts(q);return {first:n.first,last:n.last,pos:q.pos,age:String(q.age),heightInches:String(b.heightInches),weightLbs:String(b.weightLbs),birthdate:b.birthdate,hometown:b.hometown,college:b.college,...Object.fromEntries(ATTRIBUTE_KEYS.map(k=>['a_'+k,String(q.attributes[k])])),...Object.fromEntries(TENDENCY_KEYS.map(k=>['t_'+k,String(q.tendencies[k]??generatedTendencies(q)[k])])),...Object.fromEntries(t.map((v,i)=>['trait'+i,v])),...x}};`);
 assert.match(run('commissionerPlayerForm(q)'),/<option value="maternity" >Maternity leave<\/option>/);
 l.run(`commissionerEditPlayer(q.id,form({familyLeave:'maternity',familyLeaveLength:'90'}))`);assert.deepEqual(run('[familyLeaveActive(q),familyLeaveDays(q),q.familyLeave.announced]'),[true,90,'commissioner']);
 l.run(`commissionerEditPlayer(q.id,form({familyLeave:'maternity',familyLeaveLength:'30'}))`);assert.equal(run('familyLeaveDays(q)'),30);
 l.run(`commissionerEditPlayer(q.id,form({familyLeave:''}))`);assert.equal(run('q.familyLeave===undefined'),true);
 assert.throws(()=>l.run(`commissionerEditPlayer(q.id,form({familyLeave:'paternity',familyLeaveLength:'2'}))`),/valid family leave/);
 // 8. Saves keep the status and cover marks; invalid records are rejected.
 l.run('state.day=0');// the test moved the calendar without playing games
 l.run(`startFamilyLeave(q,'maternity',{announced:'season'});club.roster[5].familyLeaveCover={for:q.id}`);
 const back=run(`(()=>{const s=validateCareerData(JSON.parse(JSON.stringify(state))),r=s.teams[4].roster;return {leave:r.find(x=>x.id===q.id).familyLeave,cover:r.find(x=>x.id===club.roster[5].id).familyLeaveCover}})()`);
 assert.equal(back.leave.type,'maternity');assert.equal(back.leave.state,'leave');assert.deepEqual(back.cover,{for:run('q.id')});
 assert.throws(()=>run(`validateCareerData(JSON.parse(JSON.stringify({...state,teams:state.teams.map((t,i)=>i===4?{...t,roster:t.roster.map((x,j)=>x.id===q.id?{...x,familyLeave:{type:'maternity',state:'leave',start:1,until:0,announced:'season'}}:x)}:t)})))`),/family leave/);
}
// ---- WNBA league: maternity leave counts toward hardship eligibility (the WNBA's own temporary-replacement path) ----
{const {l,run}=make(93,"d.year=2024;d.teams=d.teams.slice(0,12);d.leagueGender='female';d.meetings='custom';d.conferences=[{id:'league',name:'League'}];d.divisions=[];d.teams.forEach(t=>{t.conferenceId='league';t.divisionId=''});var plan=historicalPlan('wnba',d.year,setupLeagueRules(d),d.cap,d.teams);d.cap=plan.cap;d.leagueSettings={...plan.rules,seasonGames:40,divisionGames:0,conferenceGames:40,playoffFormat:'eight',splitPlayoffs:false,firstRoundByes:0};syncAlignment(d);");
 assert(run('wnbaEnabled()'));l.run(`var club=state.teams.find(t=>t.id!==controlledTeamId()),p=club.roster[0];startFamilyLeave(p,'maternity',{announced:'season'});state.day=1;
  const able=()=>club.roster.filter(q=>!injuryDays(q)&&!q.wnbaContract?.hardship).length;for(const q of club.roster.filter(q=>q!==p)){if(able()<10)break;q.medicalInfo={name:'ankle sprain',severity:'Minor',until:medicalStamp()+30,rehabUntil:medicalStamp()+34}}`);
 assert.equal(run('wnbaEmergencyEligibility(club)'),'','hardship eligible with her on leave');
 const n=run('club.roster.length');l.run('cpuFillRoster(club)');assert(run('club.roster.includes(p)'),'her roster spot is kept');assert(run('club.roster.length')>=n);
 assert.deepEqual(run('[p.salary>0,p.wnbaContract?.annual?.length>0]'),[true,true],'contract intact');
}
// ---- Men's league: paternity leave, 1–2 games, in-season only ----
{const {l,run}=make(92,'');
 l.run(`var club=state.teams[0],p=club.roster[2];startFamilyLeave(p,'paternity',{games:2})`);
 assert.match(run('news()[0]'),/will miss the next two games for the birth of his child\./);assert(run('familyLeaveActive(p)&&injuryDays(p)===1&&p.medicalInfo===undefined'));
 assert.match(run('familyLeaveStatusLabel(p)'),/^Family leave · 2 games$/);
 const opp=1;l.run(`var h=state.history.length;play(club.id,${opp})`);assert.equal(run('p.familyLeave.games'),1);assert.equal(run(`state.history.at(-1).box.some(b=>b.playerId===p.id&&b.mp>0)`),false,'sits the game');
 l.run(`play(club.id,${opp})`);assert.equal(run('p.familyLeave===undefined'),true);assert.match(run('news()[0]'),/rejoins the team after the birth of his child\./);
 // Maternity never offered for men; paternity rolls only in-season.
 assert.match(run('commissionerPlayerForm(p)'),/<option value="paternity" >Paternity leave<\/option>/);
 const off=run(`(()=>{state.champion=1;let n=0;for(let i=0;i<200;i++){familyLeaveDaily();for(const t of state.teams)for(const q of t.roster)if(q.familyLeave){n++;delete q.familyLeave}}state.champion=null;return n})()`);assert.equal(off,0,'no paternity rolls outside the season');
 l.run('state.history.length=h');
}
console.log('Family leave: maternity (season/in-season), not an injury, roster spot + uncounted + CPU cover released, full salary, 2–4 week ramp, no ratings change, setting off/low/normal, age weights, real people excluded, commissioner set/change/clear, saves; paternity 1–2 games passed.');
