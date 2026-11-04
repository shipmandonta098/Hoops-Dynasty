// Commissioner player editor: age and birthdate stay consistent (age on October 1 of the season year).
// Changing only the age moves the birth year; changing only the birthdate recalculates the age; the form syncs both.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:73,strictDOM:false});l.setRandomSeed(73);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Commish';state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});
var formFor=p=>{withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const b=p.bio||generatePlayerBio(p,state.year,state.teams),t=p.personalityTraits||generateTraits(p);const n=commissionerNameParts(p);
 return {first:n.first,last:n.last,pos:p.pos,age:String(p.age),ovr:String(p.ovr),pot:String(p.pot),heightInches:String(b.heightInches),weightLbs:String(b.weightLbs),birthdate:b.birthdate,hometown:b.hometown,college:b.college,
  ...Object.fromEntries(ATTRIBUTE_KEYS.map(k=>['a_'+k,String(p.attributes[k])])),...Object.fromEntries(TENDENCY_KEYS.map(k=>['t_'+k,String(p.tendencies[k]??generatedTendencies(p)[k])])),...Object.fromEntries(t.map((x,i)=>['trait'+i,x]))}};
var p=state.teams[3].roster[0];`);
const year=run('state.year');
// Bio rule holds for generated players.
assert.equal(run('commissionerAgeOn(p.bio.birthdate)'),run('p.age'),'generated birthdate matches age');
// 1. The screenshot case: Oct 26 birthday, age set to 36 → born Oct 26 of (year − 37); age is on October 1.
l.run(`p.bio={...p.bio,birthdate:(state.year-34-1)+'-10-26'};p.age=34;commissionerEditPlayer(p.id,{...formFor(p),age:'36'})`);
assert.equal(run('p.age'),36);assert.equal(run('p.bio.birthdate'),`${year-37}-10-26`);assert.equal(run('commissionerAgeOn(p.bio.birthdate)'),36);
// Birthday before October 1 → year − age.
l.run(`p.bio={...p.bio,birthdate:'2000-03-15'};p.age=commissionerAgeOn('2000-03-15');commissionerEditPlayer(p.id,{...formFor(p),age:'25'})`);
assert.equal(run('p.bio.birthdate'),`${year-25}-03-15`);
// October 1 itself counts as already that age.
assert.equal(run(`commissionerBirthdateForAge('1999-10-01',30)`),`${year-30}-10-01`);
// Feb 29 into a non-leap year becomes Feb 28.
assert.match(run(`commissionerBirthdateForAge('2000-02-29',${year-2001})`),/^2001-02-28$/);
// Repair: an older save with age 36 and an Oct 26, 1992-style birthdate is fixed by saving the editor untouched.
l.run(`p.age=36;p.bio={...p.bio,birthdate:(state.year-35)+'-10-26'};commissionerEditPlayer(p.id,formFor(p))`);assert.equal(run('p.bio.birthdate'),`${year-37}-10-26`);assert.equal(run('p.age'),36);
// 2. Only the birthdate changed → the age follows it.
l.run(`commissionerEditPlayer(p.id,{...formFor(p),birthdate:'${year-29}-11-02'})`);assert.equal(run('p.age'),28);
assert.throws(()=>l.run(`commissionerEditPlayer(p.id,{...formFor(p),birthdate:'${year-5}-01-01'})`),/Age from the birthdate/);
// 3. Both changed → kept as entered (the form keeps them in step); nothing else touched.
l.run(`commissionerEditPlayer(p.id,{...formFor(p),age:'31',birthdate:'1980-06-01'})`);assert.equal(run('p.age'),31);assert.equal(run('p.bio.birthdate'),'1980-06-01');
// 4. Form: inputs wired, live sync both ways.
const html=run('commissionerPlayerForm(p)');assert.match(html,/name="age"[^>]*|oninput="commissionerSyncAge\(this.form,'age'\)"/);assert.match(html,/oninput="commissionerSyncAge\(this.form,'birthdate'\)"/);
assert.match(html,/<input oninput="commissionerSyncAge\(this.form,'age'\)" name="age"/);
const synced=run(`(()=>{const f={elements:{age:{value:'36'},birthdate:{value:'1992-10-26'}}};commissionerSyncAge(f,'age');const a=f.elements.birthdate.value;f.elements.birthdate.value='${year-40}-05-05';commissionerSyncAge(f,'birthdate');return [a,f.elements.age.value]})()`);
assert.deepEqual(synced,[`${year-37}-10-26`,40]);
// 5. Saves still validate.
l.run('validateCareerData(JSON.parse(JSON.stringify(state)))');
console.log('Commissioner age/birthdate: age moves the birth year, birthdate sets the age, Oct 1 rule, Feb 29, form sync, save round trip passed. Season year',year);
