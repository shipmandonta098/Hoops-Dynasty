// In-season practice injuries: eligible off days only, intensity setting, minor-skewed severity, varied headlines,
// practice tags in injury reports, league toggle and frequency, and unchanged loading of older saves.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:91,strictDOM:false});l.setRandomSeed(91);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Practice';state=validateCareerData(buildSetupCareer(d));var said=[];const s0=say;say=t=>{said.push(t);return s0(t)};var realRandom=Math.random;`);
// 1. Eligibility: no practice on game days, the day before a back-to-back, or during the All-Star break.
const elig=run(`(()=>{const out={game:0,b2b:0,breakDay:0,open:0,wrong:0};for(let day=0;day<seasonLength()-2;day++)for(const t of state.teams){const ok=practiceEligible(t,day),plays=teamPlaysOn(t.id,day),b2b=teamPlaysOn(t.id,day+1)&&teamPlaysOn(t.id,day+2),brk=practiceBreakDay(day);
 if(plays)out.game++;else if(b2b)out.b2b++;else if(brk)out.breakDay++;else out.open++;if(ok!==(!plays&&!b2b&&!brk))out.wrong++}return out})()`);
assert.equal(elig.wrong,0);assert(elig.b2b>0&&elig.open>0,JSON.stringify(elig));
// 2. A practice day: only eligible teams practice; injuries are tagged practice with a practice headline.
const day=run(`(()=>{let day=1;while(!state.teams.some(t=>practiceEligible(t,day)))day++;return day})()`);
const forced=run(`(()=>{said.length=0;Math.random=()=>0;let held;try{held=runPracticeDay(${day})}finally{Math.random=realRandom}
 const hurt=state.teams.flatMap(t=>t.roster.filter(p=>p.medicalInfo?.context==='practice').map(p=>({team:t.id,label:medicalLabel(p),health:durabilityHealthText(p),snap:teamInjurySnapshot([t.id]).find(x=>x.id===p.id)?.text})));
 return {held,eligible:state.teams.filter(t=>practiceEligible(t,${day})).map(t=>t.id),hurt,said:[...said],healthy:state.teams.map(t=>t.roster.filter(p=>!injuryDays(p)).length)}})()`);
assert.deepEqual(forced.held,forced.eligible,'every eligible team practices when the roll allows');
assert(forced.hurt.length>0&&forced.hurt.every(h=>forced.held.includes(h.team)),'only practicing teams get practice injuries');
assert(forced.healthy.every(n=>n>=5),'medical check keeps a playable lineup');
for(const h of forced.hurt){assert.match(h.label,/\(practice\)$/);assert.match(h.health,/\(practice\)/);assert.match(h.snap,/\(practice\)/)}
assert(forced.said.length>=forced.hurt.length&&forced.said.every(t=>/practice/.test(t)&&run(`newsCategory(${JSON.stringify(t)})`)==='Injuries'),JSON.stringify(forced.said.slice(0,3)));
// 3. Headlines vary by severity.
const head=(name,severity,days)=>run(`practiceInjuryHeadline({name:'Sam Doe'},{abbr:'TST'},{name:'${name}',severity:'${severity}',days:${days}})`);
assert.equal(head('twisted ankle','Minor',2),'Sam Doe (TST) left practice with a twisted ankle (day-to-day).');
assert.equal(head('back spasms','Minor',4),'Sam Doe (TST) left practice with back spasms (out 4 days).');
assert.equal(head('hamstring strain','Moderate',15),'Sam Doe (TST) will miss 2–3 weeks after straining a hamstring in practice.');
assert.equal(head('torn Achilles','Severe',320),'Sam Doe (TST) suffers a torn Achilles in practice and is expected to miss the season.');
assert.match(head('torn meniscus','Severe',60),/torn meniscus in practice and is expected to miss about 2 months\.$/);
for(const t of [head('twisted ankle','Minor',2),head('hamstring strain','Moderate',15),head('torn Achilles','Severe',320)])assert.equal(run(`newsCategory(${JSON.stringify(t)})`),'Injuries');
// 4. Severity: practice skews minor (rare moderate, very rare severe); every injury type has a valid day range.
const sev=run(`(()=>{const p=state.teams[1].roster[0],dur=p.attributes.dur;p.attributes.dur=40;const count=ctx=>{const c={Minor:0,Moderate:0,Severe:0};for(let i=0;i<20000;i++)c[durabilityInjuryDetails(p,50,Math.random(),ctx).severity]++;return c};const out={game:count(null),practice:count('practice')};p.attributes.dur=dur;return out})()`);
assert(sev.practice.Severe<sev.game.Severe*.4&&sev.practice.Moderate<sev.game.Moderate*.6&&sev.practice.Minor>sev.game.Minor,JSON.stringify(sev));
const typical=run(`(()=>{const p=state.teams[1].roster[0],dur=p.attributes.dur;p.attributes.dur=75;const c={Minor:0,Moderate:0,Severe:0};for(let i=0;i<20000;i++)c[durabilityInjuryDetails(p,50,Math.random(),'practice').severity]++;p.attributes.dur=dur;return c})()`);
assert(typical.Minor/20000>.9&&typical.Severe/20000<.005,JSON.stringify(typical));
const types=run(`Object.entries(INJURY_TYPES).flatMap(([s,list])=>list.map(t=>[s,...t]))`);assert.equal(new Set(types.map(t=>t[1])).size,types.length);
for(const [s,name,min,max,phrase] of types)assert(Number.isInteger(min)&&min>=1&&max>=min&&phrase,name);
for(const n of ['twisted ankle','back spasms','jammed finger','sore knee','hip contusion','hamstring strain','sprained wrist','bone bruise','groin strain','torn Achilles','torn ACL','fractured foot','torn meniscus'])assert(types.some(t=>t[1]===n),n);
// 5. League setting: disabling or zero frequency stops practice injuries (practices still happen).
for(const rule of ['state.leagueSettings.practiceInjuries=false','state.leagueSettings.practiceInjuryFrequency=0']){
 const r=run(`(()=>{const saved={...state.leagueSettings};${rule};const before=state.teams.flatMap(t=>t.roster).filter(p=>p.medicalInfo?.context==='practice').length;Math.random=()=>0;let held;try{held=runPracticeDay(${day}+1)}finally{Math.random=realRandom;}const after=state.teams.flatMap(t=>t.roster).filter(p=>p.medicalInfo?.context==='practice').length;state.leagueSettings=saved;return {held:held.length,added:after-before}})()`);
 assert.equal(r.added,0,rule);
}
assert.deepEqual(run(`[LEAGUE_SETTING_DEFAULTS.practiceInjuries,LEAGUE_SETTING_DEFAULTS.practiceInjuryFrequency]`),[true,1]);
assert.throws(()=>l.run(`readLeagueSettings({...state.leagueSettings,practiceInjuryFrequency:5})`),/Practice injury frequency/);
assert.equal(run(`readLeagueSettingsForm({rule_practiceInjuries:'false',rule_practiceInjuryFrequency:'1.5'}).practiceInjuryFrequency`),1.5);
assert.equal(run(`practiceInjuryScale()`)>0,true);
// 6. Intensity: coach default, editable for your team, conditioning bonus, saved and validated.
assert.deepEqual(run(`['Grit & Grind','Seven Seconds or Less','Triangle'].map(system=>practiceIntensity({coach:{system}}))`),['intense','light','standard']);
const cond=run(`(()=>{const t=team(),out={};for(const k of ['light','standard','intense']){t.practiceIntensity=k;out[k]=coachingSkill(t,'conditioning')}return out})()`);assert(cond.intense>cond.standard&&cond.standard>cond.light,JSON.stringify(cond));
assert(run(`PRACTICE_LEVELS.intense.minutes>PRACTICE_LEVELS.standard.minutes&&PRACTICE_LEVELS.standard.minutes>PRACTICE_LEVELS.light.minutes`));
l.run(`setPracticeIntensity(controlledTeamId(),'light');setPracticeIntensity(5,'intense');`);
assert.equal(run(`team().practiceIntensity`),'light');assert.equal(run(`state.teams[5].practiceIntensity`),undefined,'CPU teams are not editable outside commissioner mode');
assert(/<select onchange="setPracticeIntensity\(/.test(run(`coachRosterCard(team())`))&&/Practice intensity: /.test(run(`coachRosterCard(state.teams[5])`)));
const card=run(`roster()`),coach=card.slice(card.indexOf('HEAD COACH'));assert(coach.indexOf('practice-intensity')>0&&coach.indexOf('practice-intensity')<coach.indexOf('</section>'),'intensity control sits inside the head coach panel');
assert.equal(run(`validateCareerData(JSON.parse(JSON.stringify(state))).teams[controlledTeamId()].practiceIntensity`),'light');
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams[2].practiceIntensity='brutal';validateCareerData(r)})()`),/practice intensity/);
assert.throws(()=>l.run(`(()=>{const r=JSON.parse(JSON.stringify(state));const p=r.teams[1].roster[0];p.medicalInfo={name:'x',severity:'Minor',until:1,rehabUntil:2,context:'gym'};validateCareerData(r)})()`),/medical record/);
// 7. Older saves load unchanged: no practice fields, older injury names, settings without practice keys.
const old=run(`(()=>{const r=JSON.parse(JSON.stringify(state));r.teams.forEach(t=>delete t.practiceIntensity);delete r.leagueSettings.practiceInjuries;delete r.leagueSettings.practiceInjuryFrequency;
 r.teams.flatMap(t=>t.roster).forEach(p=>{if(p.medicalInfo)delete p.medicalInfo.context});const p=r.teams[3].roster[0];p.medicalInfo={name:'ACL tear',severity:'Severe',until:99999,rehabUntil:100013};
 const v=validateCareerData(JSON.parse(JSON.stringify(r)));return {teamsSame:JSON.stringify(v.teams.map(t=>t.roster.map(p=>p.medicalInfo??null)))===JSON.stringify(r.teams.map(t=>t.roster.map(p=>p.medicalInfo??null))),noIntensity:v.teams.every(t=>!('practiceIntensity' in t)),rules:[v.leagueSettings.practiceInjuries,v.leagueSettings.practiceInjuryFrequency],label:(()=>{const q=v.teams[3].roster[0];return q.medicalInfo.name})()}})()`);
assert.deepEqual(old,{teamsSame:true,noIntensity:true,rules:[true,1],label:'ACL tear'});
console.log('Practice injuries: eligibility, tagging, headlines, minor skew, league toggle, intensity and old saves passed.');
