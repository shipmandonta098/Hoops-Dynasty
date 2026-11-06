// Hometowns: US hometowns cover all 50 states (generation weighted by population); the commissioner hometown dice
// always changes the value: another state for US players, another international country for international players;
// saving an international player with a new hometown country makes it their nationality (draft board / FA list).
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:76,strictDOM:false});l.setRandomSeed(76);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Commish';state=validateCareerData(buildSetupCareer(d));Object.assign(commissioner(),{enabled:true,everUsed:true});`);
// 1. The state list: all 50, unique, weights positive.
const states=run('PLAYER_HOMETOWN_STATES');assert.equal(states.length,50);assert.equal(new Set(states).size,50);
for(const s of ['Wyoming','Vermont','Alaska','Hawaii','Maine','Delaware','California','Texas','Louisiana','Georgia'])assert(states.includes(s),s);
assert(run('PLAYER_HOMETOWN_STATE_WEIGHTS.every(x=>x[1]>0)'));
// weightedHometownState covers the whole range.
assert.equal(run('new Set([...Array(PLAYER_HOMETOWN_STATE_TOTAL).keys()].map(weightedHometownState)).size'),50);
// 2. Generated US hometowns use many states, weighted toward big ones.
const gen=run(`(()=>{const c={};for(let id=1;id<=6000;id++){const b=generatePlayerBio({id,name:'P'+id,age:25,pos:'SF',gender:'male'},2026,[{abbr:'X'}]);const s=b.hometown.replace(/, USA$/,'');c[s]=(c[s]||0)+1}return c})()`);
assert(Object.keys(gen).length>=45,'states seen: '+Object.keys(gen).length);assert(Object.keys(gen).every(s=>states.includes(s)));assert((gen.California||0)>(gen.Wyoming||0)*5);
// 3. US dice: 60 rolls, always a different state, many states, format "State, USA".
const us=run(`(()=>{const p=state.teams.flatMap(t=>t.roster).find(p=>commissionerPlayerCountry(p)==='US');let cur=p.bio.hometown;const seen=new Set();let changed=true;for(let i=0;i<60;i++){const h=commissionerRandomHometown(p,cur);if(h===cur||!/^[A-Za-z ]+, USA$/.test(h))changed=false;seen.add(h);cur=h}return {changed,seen:seen.size}})()`);
assert(us.changed);assert(us.seen>=20,'US states rolled: '+us.seen);
// 4. International dice (the Australia bug): different country every time, many countries.
l.run(`var ip=state.teams.flatMap(t=>t.roster).find(p=>p.international)||state.free.find(p=>p.international);if(!ip){ip=state.teams[0].roster[0];ip.international={country:'AU',training:'balanced',pathway:'professional'};ip.bio.hometown='Australia'};ip.international.country='AU';ip.bio.hometown='Australia';`);
const intl=run(`(()=>{let cur='Australia';const seen=new Set();let ok=true;for(let i=0;i<60;i++){const h=commissionerRandomHometown(ip,cur);if(h===cur||!Object.values(INTERNATIONAL_COUNTRIES).some(c=>c.name===h))ok=false;seen.add(h);cur=h}return {ok,seen:seen.size}})()`);
assert(intl.ok);assert(intl.seen>=8,'countries rolled: '+intl.seen);
// 5. Dice in the form: name/college follow the form's (unsaved) hometown country.
assert.equal(run(`commissionerFormPlayer(ip,{elements:{hometown:{value:'Spain'}}}).international.country`),'ES');
assert.equal(run(`commissionerFormPlayer(ip,{elements:{hometown:{value:'Australia'}}}).international.country`),'AU');
assert.equal(run(`ip.international.country`),'AU','form preview does not touch the player');
// 6. Saving an international player with a new hometown country updates nationality.
l.run(`withBasketballAttributes(ip);ip.tendencies??=generatedTendencies(ip);var f=(p,h)=>{const b=p.bio,t=p.personalityTraits||generateTraits(p),n=commissionerNameParts(p);return {first:n.first,last:n.last,pos:p.pos,age:String(p.age),heightInches:String(b.heightInches),weightLbs:String(b.weightLbs),birthdate:b.birthdate,hometown:h,college:b.college,...Object.fromEntries(ATTRIBUTE_KEYS.map(k=>['a_'+k,String(p.attributes[k])])),...Object.fromEntries(TENDENCY_KEYS.map(k=>['t_'+k,String(p.tendencies[k]??generatedTendencies(p)[k])])),...Object.fromEntries(t.map((x,i)=>['trait'+i,x]))}};
 commissionerEditPlayer(ip.id,f(ip,'Spain'))`);
assert.deepEqual(run('[ip.bio.hometown,ip.international.country,playerHometownFlag(ip)?.length>0]'),['Spain','ES',true]);
l.run('validateCareerData(JSON.parse(JSON.stringify(state)))');
console.log('Hometowns: 50 states (generated',Object.keys(gen).length,'states in 6000 bios), US dice',us.seen,'states, international dice',intl.seen,'countries, form follows hometown, nationality synced on save passed.');
