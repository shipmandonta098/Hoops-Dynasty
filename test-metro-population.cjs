// Metro population replaces the market-size dropdown: team.population (people) is stored, marketSize is
// derived from it, old saves keep their tier, editors reject invalid input, media scales with population.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:51,strictDOM:false});l.setRandomSeed(51);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};`);
// 1. Tier cutoffs live in one config spot; editor input is millions with one decimal, 0.1–30.
assert.deepEqual(run(`[2499999,2.5e6,5999999,6e6,1e5,3e7].map(marketSizeForPopulation)`),['Small','Medium','Medium','Large','Small','Large']);
assert.deepEqual(run(`[MARKET_TIER_CUTOFFS.medium,MARKET_TIER_CUTOFFS.large]`),[2.5e6,6e6]);
for(const bad of ['0','0.05','30.1','31','abc','2.55','','-1','1e6'])assert.throws(()=>run(`readMetroPopulationInput(${JSON.stringify(bad)})`),/Metro population/,bad);
assert.deepEqual(run(`['0.1','30','4.2'].map(v=>readMetroPopulationInput(v))`),[1e5,3e7,4.2e6]);
assert.equal(run(`readMetroPopulationInput('3.1',3050000)`),3050000,'an unchanged value keeps the stored estimate');
assert.equal(run(`readMetroPopulationInput('3.2',3050000)`),3200000);
// 2. New leagues: every default NBA/WNBA city and every preset has a metro population, and its tier follows it.
const defs=run(`[...defaultTeams(),...FRANCHISE_PRESETS.map(presetTeamDefinition),...NEW_TEAM_PRESETS.map(([city,,,marketSize])=>withMetroPopulation({city,marketSize}))].map(t=>({city:t.city,population:t.population,marketSize:t.marketSize}))`);
assert.equal(defs.length,30+run('FRANCHISE_PRESETS.length')+8);
for(const t of defs){assert(Number.isFinite(t.population)&&t.population>=1e5&&t.population<=3e7,t.city);assert.equal(t.marketSize,run(`marketSizeForPopulation(${t.population})`),t.city)}
assert.equal(defs.filter(t=>run(`cityMetroPopulation(${JSON.stringify(t.city)})`)===null&&!run(`FRANCHISE_PRESETS.some(p=>p.city===${JSON.stringify(t.city)})`)).length,0,'no city falls back to a tier default');
l.run(`var d=makeDraft();d.gmName='Metro';state=validateCareerData(buildSetupCareer(d));`);
assert(run(`state.teams.every(t=>validMetroPopulation(t.population)&&t.marketSize===marketSizeForPopulation(t.population))`));
// 3. Old saves: no population → tier default, tier unchanged; the save checker accepts the field and rejects bad values.
const old=run(`(()=>{const raw=JSON.parse(JSON.stringify(state));const tiers=raw.teams.map(t=>t.marketSize);raw.teams[0].marketSize='Small';tiers[0]='Small';raw.teams.forEach(t=>delete t.population);const v=validateCareerData(raw);return {same:v.teams.every((t,i)=>t.marketSize===tiers[i]),pops:v.teams.map(t=>[t.marketSize,t.population])}})()`);
assert(old.same,'old saves keep their tiers');for(const [tier,pop] of old.pops)assert.equal(pop,{Small:1.8e6,Medium:4e6,Large:9e6}[tier]);
assert.equal(run(`(()=>{const raw=JSON.parse(JSON.stringify(state));raw.teams[1].population=1e6;raw.teams[1].marketSize='Large';return validateCareerData(raw).teams[1].marketSize})()`),'Small','population is the source of the tier');
for(const bad of [0,50,5e7,'4000000',null])assert.throws(()=>run(`(()=>{const raw=JSON.parse(JSON.stringify(state));raw.teams[0].population=${JSON.stringify(bad)};return validateCareerData(raw)})()`),/metro population/,String(bad));
assert.equal(run(`validateCareerData(JSON.parse(JSON.stringify(state))).teams[2].population`),run('state.teams[2].population'),'round trip');
// 4. Team Management: the population field replaces the dropdown; editing recalculates the tier; invalid input is rejected.
const tmHtml=run(`teamManagementView()`);assert(/name="population"[^>]*min="0.1" max="30" step="0.1"/.test(tmHtml)&&/<output[^>]*>(Small|Medium|Large) market<\/output>/.test(tmHtml),'team management shows the population input and tier');assert(!/name="marketSize"/.test(tmHtml),'no market dropdown');
const form=id=>`(()=>{const t=state.teams[${id}],c=t.colors;return {city:t.city,name:t.name,abbr:t.abbr,logo:String(logoChoices().findIndex(x=>x.logoAtlas===t.logoAtlas&&x.logoIndex===t.logoIndex)),divisionId:t.divisionId,color0:c[0].hex,colorName0:c[0].name,color1:c[1].hex,colorName1:c[1].name,color2:c[2].hex,colorName2:c[2].name}})()`;
const tm=(id,pop)=>run(`(()=>{const v={...${form(id)},population:${JSON.stringify(pop)}};try{const t=applyManagedTeam(${id},v);return {ok:true,population:t.population,marketSize:t.marketSize}}catch(e){return {ok:false,error:e.message,population:state.teams[${id}].population}}})()`);
const before=run('state.teams[3].population');
let r=tm(3,'7.5');assert(r.ok,r.error);assert.deepEqual([r.population,r.marketSize],[7.5e6,'Large']);
r=tm(3,'2.4');assert.deepEqual([r.population,r.marketSize],[2.4e6,'Small']);r=tm(3,'2.5');assert.equal(r.marketSize,'Medium');
for(const bad of ['0','30.5','x','2.25','']){r=tm(3,bad);assert(!r.ok,'team management rejects '+bad);assert.equal(r.population,2.5e6,'rejected input leaves the team unchanged')}
assert(before>0);
// 5. Setup screen: editor shows the population input and tier label; edits recalculate the tier; invalid input is rejected.
l.run(`setupDraft=makeDraft();onSetup=true;`);
const setupHtml=run(`(()=>{let html='';const before=editorModal;editorModal=(title,body)=>{html=body};try{openTeamEditor(0)}finally{editorModal=before}return html})()`);assert(/name="population"/.test(setupHtml)&&/<output[^>]*>(Small|Medium|Large) market<\/output>/.test(setupHtml),'setup editor shows the population input and tier');assert(!/name="market"/.test(setupHtml),'no market dropdown');
const edit=(pop)=>run(`(()=>{const t=setupDraft.teams[0];const v={arenaCity:'',elevationFt:'',city:t.city,name:t.name,abbr:t.abbr,population:${JSON.stringify(pop)},stadiumCapacity:18000,divisionId:t.divisionId,logo:logoChoices().findIndex(x=>x.logoAtlas===t.logoAtlas&&x.logoIndex===t.logoIndex),secondaryLogoIndex:0,primaryReset:false,secondaryReset:false,colors:t.colors.map(c=>({name:c.name,hex:c.hex}))};try{applyTeamEdit(0,v);const n=setupDraft.teams[0];return {ok:true,population:n.population,marketSize:n.marketSize}}catch(e){return {ok:false,error:e.message,population:setupDraft.teams[0].population}}})()`);
r=edit('1.1');assert(r.ok,r.error);assert.deepEqual([r.population,r.marketSize],[1.1e6,'Small']);
r=edit('12.0');assert.deepEqual([r.population,r.marketSize],[12e6,'Large']);
for(const bad of ['0.0','40','2.55','abc','']){r=edit(bad);assert(!r.ok,'setup rejects '+bad);assert.equal(r.population,12e6)}
assert.match(run(`validateDraft({...setupDraft,teams:setupDraft.teams.map((t,i)=>i?t:{...t,population:20})})`)||'',/metro populations/);
assert.match(run(`validateDraft({...setupDraft,teams:setupDraft.teams.map((t,i)=>i?t:{...t,marketSize:'Small'})})`)||'',/metro populations/,'tier must match population');
// Quick-add presets take their own city's population, not the copied default team's.
l.run(`document.getElementById=id=>id==='new-team-division'?{value:setupDraft.divisions[0].id}:null;closeTitleModal=()=>{};renderSetup=()=>{};addSetupTeam(7);`);
assert.deepEqual(run(`(()=>{const t=setupDraft.teams.find(t=>t.abbr==='MEX');return [t.population,t.marketSize]})()`),[21804515,'Large']);
// 6. Expansion: form value in millions, stored config in people, pre-population configs keep their tier.
const exp=v=>run(`(()=>{try{const c=expansionConfig({city:'Austin',name:'Hawks',abbr:'AUS',arenaName:'Austin Arena',divisionId:state.divisions[0]?.id||'',primary:'#112233',secondary:'#445566',cap:'standard',seed:'equal',rebuild:true,capacity:18000,ticket:75,protect:8,maximum:1,target:13,fee:0,hype:50,...${JSON.stringify(v)}});return [c.population,c.marketSize]}catch(e){return e.message}})()`);
assert.deepEqual(exp({population:'2.6'}),[2.6e6,'Medium']);assert.deepEqual(exp({population:7e6}),[7e6,'Large']);assert.deepEqual(exp({marketSize:'Small'}),[1.8e6,'Small']);
assert.match(String(exp({population:'0'})),/Metro population/);assert.match(String(exp({population:9e9})),/metro population/);
// 7. Media rights scale smoothly with population; tier defaults reproduce the old flat values.
assert.deepEqual(run(`[1.8e6,4e6,9e6].map(p=>mediaRightsValue({population:p}))`),[65,80,95]);
const curve=run(`[1e5,5e5,1e6,2e6,3e6,5e6,8e6,1.2e7,2e7,3e7].map(p=>mediaRightsValue({population:p}))`);
assert(curve.every((x,i)=>!i||x>=curve[i-1])&&curve[0]===50&&curve.at(-1)===110,JSON.stringify(curve));
assert.equal(run(`mediaRightsValue({marketSize:'Large'})`),95,'teams without a population use the tier default');
console.log('Metro population: tier from population, old saves keep tiers, setup/team management/expansion validate input, media scales with population.');
