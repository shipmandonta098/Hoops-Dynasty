// Commissioner player editor and hometowns: international hometowns are the country only (US: 'State, USA'), with the
// flag, on creation, in the profile and on the draft board; old saves convert without touching nationality; first and
// last names (randomized from the name generator for the player's country and the league's gender, never duplicating
// another player) are saved into p.name and p.nameIdentity; hometown and college randomize from the creation pools; one
// secondary position at most; the profile's draft line reads '2026 · Round 2, Pick 32 (IND)'.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:47,strictDOM:false});l.setRandomSeed(47);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};save=async()=>true;confirm=()=>true;var d=makeDraft();d.gmName='Editor';state=validateCareerData(buildSetupCareer(d));
 var players=()=>allLeaguePlayers(),intl=()=>players().filter(p=>p.international),us=()=>players().filter(p=>!p.international);
 var givenPool=(code,gender)=>{const d=PLAYER_NAME_DATA[code];return new Set([d,...(d.variants||[])].flatMap(v=>[...(gender==='female'?v.female||[]:v.male||[]),...(v.neutral||[])]))};
 var surnamePool=code=>{const d=PLAYER_NAME_DATA[code];return new Set([d,...(d.variants||[])].flatMap(v=>[...(v.surnames||[]),...(v.femaleSurnames||[])]))};
 var form=p=>{withBasketballAttributes(p);p.tendencies??=generatedTendencies(p);const n=commissionerNameParts(p),v={first:n.first,last:n.last,pos:p.pos,age:String(p.age),ovr:String(p.ovr),pot:String(p.pot),heightInches:String(p.bio.heightInches),weightLbs:String(p.bio.weightLbs),birthdate:p.bio.birthdate,hometown:p.bio.hometown,college:p.bio.college,sec0:secondaryPositions(p)[0]||''};
  for(const k of ATTRIBUTE_KEYS)v['a_'+k]=String(p.attributes[k]);for(const k of TENDENCY_KEYS)v['t_'+k]=String(p.tendencies[k]);(p.personalityTraits||generateTraits(p)).forEach((t,i)=>v['trait'+i]=t);return v};`);
// 1. Hometowns: US 'State, USA'; international: the country only, matching the player's nationality.
assert(run(`intl().length>0&&us().length>0`));
assert(run(`us().every(p=>/^[A-Za-z ]+, USA$/.test(p.bio.hometown)&&PLAYER_HOMETOWN_STATES.includes(p.bio.hometown.slice(0,-5)))`),'US: State, USA');
assert(run(`intl().every(p=>p.bio.hometown===INTERNATIONAL_COUNTRIES[p.international.country].name)`),'international: country only');
// Profile and draft board show it with the flag.
const ip=run(`intl()[0].id`),country=run(`INTERNATIONAL_COUNTRIES[intl()[0].international.country].name`);
const facts=run(`playerBioFacts(players().find(p=>p.id===${ip}))`);assert(facts.includes(`flag" title="${country}"`)&&facts.includes(`</span> ${country}<`),'profile: flag + country');
l.run(`ensureDraft();var pro=state.draft.prospects.find(p=>p.international)||state.draft.prospects[0];var dlg={className:'',innerHTML:'',showModal(){},close(){},querySelector:()=>null};const ge=document.getElementById;document.getElementById=id=>id==='profile'?dlg:ge(id);draftReport(pro.id)`);
assert(run(`dlg.innerHTML.includes(pro.bio.hometown)&&(pro.international?dlg.innerHTML.includes('flag'):true)`),'draft board shows the hometown with its flag');
if(run('!!pro.international'))assert.equal(run('pro.bio.hometown'),run('INTERNATIONAL_COUNTRIES[pro.international.country].name'),'draft prospects: country only');
// Draft line format.
assert.match(run(`(()=>{const p=us()[0];p.bio={...p.bio,draftYear:2026,draftRound:2,draftPick:32,draftTeam:'IND'};delete p.international;return playerBioFacts(p)})()`),/2026 · Round 2, Pick 32 \(IND\)/);
// 2. Old saves: 'City, Country' hometowns become the country; nationality data and US hometowns are unchanged.
const old=run(`(()=>{const raw=JSON.parse(JSON.stringify(state)),all=[...raw.teams.flatMap(t=>t.roster),...raw.free];const i=all.find(p=>p.international),u=all.find(p=>!p.international);
  i.bio.hometown=INTERNATIONAL_COUNTRIES[i.international.country].city+', '+INTERNATIONAL_COUNTRIES[i.international.country].name;u.bio.hometown='Ohio, USA';const t=all.find(p=>p!==u&&!p.international);t.bio.hometown='Paris, Texas';
  const nat=JSON.stringify(i.international),v=validateCareerData(raw),find=id=>[...v.teams.flatMap(t=>t.roster),...v.free].find(p=>p.id===id);
  return {before:i.bio.hometown,after:find(i.id).bio.hometown,nat:JSON.stringify(find(i.id).international)===nat,us:find(u.id).bio.hometown,texas:find(t.id).bio.hometown,country:INTERNATIONAL_COUNTRIES[i.international.country].name}})()`);
assert.match(old.before,/, /);assert.equal(old.after,old.country,'converted to country only');assert(old.nat,'nationality untouched');assert.equal(old.us,'Ohio, USA');assert.equal(old.texas,'Paris, Texas','non-country text left alone');
// 3. Randomized names match country and gender and never duplicate another player's full name.
const names=run(`(()=>{const u=us()[0],i=intl()[0],out={usFirst:[],usLast:[],inFirst:[],inLast:[]};for(let k=0;k<25;k++){out.usFirst.push(commissionerRandomName(u,'first',commissionerNameParts(u).last));out.usLast.push(commissionerRandomName(u,'last',commissionerNameParts(u).first));out.inFirst.push(commissionerRandomName(i,'first',commissionerNameParts(i).last));out.inLast.push(commissionerRandomName(i,'last',commissionerNameParts(i).first))}
  const code=commissionerPlayerCountry(i),g=givenPool('US','male'),gi=givenPool(code,'male'),s=surnamePool('US'),si=surnamePool(code);
  return {code,us:out.usFirst.every(x=>g.has(x))&&out.usLast.every(x=>s.has(x)),intl:out.inFirst.every(x=>gi.has(x))&&out.inLast.every(x=>si.has(x)||[...si].some(y=>x.includes(y)))}})()`);
assert(names.us,'US names from the US pools');assert(names.intl,'international names from the '+names.code+' pools');
assert(run(`(()=>{state.leagueGender='female';const p=us()[1],pool=givenPool('US','female');const ok=[...Array(20)].every(()=>pool.has(commissionerRandomName(p,'first','Smith')));state.leagueGender='male';return ok})()`),"women's league: female given names");
const dup=run(`(()=>{const p=us()[0],other=us()[2],[f]=other.name.split(' '),rest=other.name.slice(f.length+1),real=generatePlayerName;let calls=0;
  generatePlayerName=o=>(calls++===0?{given:f,surname:rest,name:other.name}:real(o));try{return {value:commissionerRandomName(p,'first',rest),calls,taken:f}}finally{generatePlayerName=real}})()`);
assert(dup.calls>=2&&dup.value!==dup.taken,'a duplicate full name is skipped');
// 4. Editing saves first/last into p.name and p.nameIdentity (and survives a save).
const pid=run('us()[3].id');
const saved=run(`(()=>{const p=players().find(p=>p.id===${pid}),v=form(p);v.first='Marcus';v.last='Delacroix-Hill';commissionerEditPlayer(${pid},v);return {name:p.name,given:p.nameIdentity.given,surname:p.nameIdentity.surname,idName:p.nameIdentity.name}})()`);
assert.deepEqual(saved,{name:'Marcus Delacroix-Hill',given:'Marcus',surname:'Delacroix-Hill',idName:'Marcus Delacroix-Hill'});
assert.equal(run(`[...validateCareerData(JSON.parse(JSON.stringify(state))).teams.flatMap(t=>t.roster),...state.free].find(p=>p.id===${pid}).nameIdentity.surname`),'Delacroix-Hill');
assert.throws(()=>run(`commissionerEditPlayer(${pid},{...form(players().find(p=>p.id===${pid})),last:''})`),/first and last name/);
// A family-name-first identity keeps its order.
assert.equal(run(`(()=>{const p=us()[4];p.nameIdentity={...(p.nameIdentity||{version:1,country:'US',background:'local',order:'cultural',provenance:'generated'}),given:'Wei',surname:'Zhang',name:'Zhang Wei'};p.name='Zhang Wei';const v=form(p);v.first='Lei';commissionerEditPlayer(p.id,v);return p.name})()`),'Zhang Lei');
// The editor form: first/last with randomize buttons; filling a field doesn't save.
const html=run(`commissionerPlayerForm(us()[0])`);for(const x of ['name="first"','name="last"','Randomize first name','Randomize last name','Randomize hometown','Randomize college or club'])assert(html.includes(x),x);
assert(!html.includes('Secondary position 2')&&html.includes('Secondary position<'),'one secondary position');
const filled=run(`(()=>{const p=intl()[0],e={first:{value:'A'},last:{value:'B'},hometown:{value:''},college:{value:''}},nameBefore=p.name;for(const f of ['first','last','hometown','college'])commissionerRandomizeField(p.id,f,{elements:e});return {e:Object.fromEntries(Object.entries(e).map(([k,v])=>[k,v.value])),same:p.name===nameBefore,country:INTERNATIONAL_COUNTRIES[commissionerPlayerCountry(p)].name}})()`);
assert(filled.same,'randomizing only fills the form');assert.equal(filled.e.hometown,filled.country);assert(filled.e.first!=='A'&&filled.e.last!=='B');
// 5. Hometown and college pools.
assert(run(`(()=>{const p=us()[0];return [...Array(30)].every(()=>{const h=commissionerRandomHometown(p),c=commissionerRandomCollege(p);return PLAYER_HOMETOWN_STATES.includes(h.slice(0,-5))&&h.endsWith(', USA')&&PLAYER_COLLEGES.includes(c)})})()`),'US: state + college');
assert(run(`(()=>{const p=intl()[0],n=INTERNATIONAL_COUNTRIES[commissionerPlayerCountry(p)].name,seen=new Set();for(let k=0;k<80;k++){const c=commissionerRandomCollege(p);seen.add(PLAYER_COLLEGES.includes(c)?'college':c===n+' · Pro academy'||c===n+' · Pro league'?'club':'other')}return seen.has('college')&&seen.has('club')&&!seen.has('other')&&commissionerRandomHometown(p)===n})()`),'international: country, college or club');
// 6. Secondary positions: at most one everywhere.
assert(run(`players().every(p=>(p.secondaryPos||[]).length<=1)`));
console.log(`Player editor: US/international hometown formats (profile, draft board), old-save conversion, names by country (${names.code}) and gender without duplicates, first/last saved, hometown/college pools, one secondary position and the draft line passed.`);
