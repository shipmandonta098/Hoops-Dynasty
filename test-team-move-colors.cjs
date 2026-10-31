// Team editors: color names are generated (no text boxes), Move relocates to an available city with its
// metro population, and Oklahoma City is a franchise preset appended after the original twelve.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:61,strictDOM:false});l.setRandomSeed(61);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};save=async()=>true;toast=()=>{};var d=makeDraft();d.gmName='Move';state=validateCareerData(buildSetupCareer(d));`);
// 1. Color names from hue; unchanged colors keep names; preset-supplied names are kept.
assert.deepEqual(run(`['#FF803E','#202632','#F6C76A','#739DFF','#2EC4C6','#C8102E','#FFFFFF','#000000','#B9C2CC'].map(colorNameForHex)`),['Orange','Charcoal','Gold','Light blue','Teal','Red','White','Black','Silver']);
assert.equal(run(`teamColorName({hex:'#FF803E',name:'Flame orange'},'#ff803e','Flame orange')`),'Flame orange','unchanged color keeps its name');
assert.equal(run(`teamColorName({hex:'#FF803E',name:'Flame orange'},'#1E3A8A','Flame orange')`),'Blue','a picked color does not keep a stale name');
assert.equal(run(`teamColorName({hex:'#FF803E',name:'Flame orange'},'#2EC4C6','Aqua')`),'Aqua','a preset-supplied name is kept');
// 2. Editors: no visible color-name text boxes; a Move picker is present.
const tm=run(`teamManagementView()`);
assert(!/<input name="colorName\d"/.test(tm)&&/<input type="hidden" name="colorName0"/.test(tm),'team management has no color name text boxes');
assert(/<select name="moveCity"/.test(tm),'team management has the Move picker');
l.run(`setupDraft=makeDraft();onSetup=true;`);
const setup=run(`(()=>{let html='';const before=editorModal;editorModal=(t,b)=>{html=b};try{openTeamEditor(0)}finally{editorModal=before}return html})()`);
assert(!/<input name="colorName\d"/.test(setup)&&/<input type="hidden" name="colorName0"/.test(setup),'setup editor has no color name text boxes');
assert(/<select name="moveCity"/.test(setup),'setup editor has the Move picker');
assert(!/name="arenaCity"/.test(tm)&&!/name="arenaCity"/.test(setup)&&!/Arena city/.test(tm+setup),'arena city is not shown in either editor');
// 3. Team Management save: a changed color gets a generated name; unchanged colors keep theirs.
const formFor=id=>`(()=>{const t=state.teams[${id}],c=t.colors;return {city:t.city,name:t.name,abbr:t.abbr,arenaName:t.arenaName||t.city+' Arena',population:metroPopulationMillions(t.population),logo:String(logoChoices().findIndex(x=>x.logoAtlas===t.logoAtlas&&x.logoIndex===t.logoIndex)),divisionId:t.divisionId,color0:c[0].hex,colorName0:c[0].name,color1:c[1].hex,colorName1:c[1].name,color2:c[2].hex,colorName2:c[2].name}})()`;
const before=run('state.teams[2].colors');
const after=run(`(()=>{const v=${formFor(2)};v.color0='#1E3A8A';applyManagedTeam(2,v);return state.teams[2].colors})()`);
assert.deepEqual([after[0].hex,after[0].name],['#1E3A8A','Blue']);assert.deepEqual(after.slice(1),before.slice(1));
// 4. Move options: cities with a known metro population that no other team uses (Oklahoma City included).
const opts=run(`(()=>{const t=state.teams[0];return moveCityOptions(t.city,state.teams.filter(x=>x.id!==t.id).map(x=>x.city))})()`);
const used=run('state.teams.map(t=>t.city)');assert(opts.length>=20&&opts.every(o=>!used.includes(o.city)&&o.population>=1e5));
assert(opts.some(o=>o.city==='Oklahoma City'&&o.population===1497821));
// applyMoveCity fills the form (city, population, default arena name; clears arena city / elevation).
const filled=run(`(()=>{const el=v=>({value:v,dispatchEvent(){}}),f={moveCity:el('Oklahoma City'),city:el('Atlanta'),population:el('6.4'),arenaName:el('Atlanta Arena'),arenaCity:el('Somewhere'),elevationFt:el('900')};applyMoveCity({elements:f});return Object.fromEntries(Object.entries(f).map(([k,v])=>[k,v.value]))})()`);
assert.deepEqual(filled,{moveCity:'Oklahoma City',city:'Oklahoma City',population:'1.5',arenaName:'Oklahoma City Arena',arenaCity:'',elevationFt:''});
// Saving the moved form keeps the exact metro estimate and recalculates the tier; roster and finances stay.
const moved=run(`(()=>{const t=state.teams[0],roster=t.roster.map(p=>p.id).join(),v={...${formFor(0)},city:'Oklahoma City',population:'1.5',arenaName:'Oklahoma City Arena'};applyManagedTeam(0,v);return {city:t.city,population:t.population,marketSize:t.marketSize,arena:t.arenaName,sameRoster:t.roster.map(p=>p.id).join()===roster}})()`);
assert.deepEqual(moved,{city:'Oklahoma City',population:1497821,marketSize:'Small',arena:'Oklahoma City Arena',sameRoster:true});
assert(!run(`moveCityOptions(state.teams[1].city,state.teams.filter(x=>x.id!==1).map(x=>x.city)).some(o=>o.city==='Oklahoma City')`),'a taken city is no longer offered');
// A custom value that is unchanged on re-save is not snapped to the city estimate.
assert.equal(run(`metroPopulationEdit('6.4',6400000,'Atlanta').population`),6400000);
// 5. Setup editor move: city, population and a default arena name follow; the tier is recalculated.
const s=run(`(()=>{setupDraft=makeDraft();const t=setupDraft.teams[0];t.arenaName=t.city+' Arena';const v={arenaCity:'',elevationFt:'',city:'Oklahoma City',name:t.name,abbr:t.abbr,population:'1.5',stadiumCapacity:18000,divisionId:t.divisionId,logo:logoChoices().findIndex(x=>x.logoAtlas===t.logoAtlas&&x.logoIndex===t.logoIndex),secondaryLogoIndex:0,primaryReset:false,secondaryReset:false,colors:t.colors.map(c=>({name:c.name,hex:c.hex}))};applyTeamEdit(0,v);const n=setupDraft.teams[0];return [n.city,n.population,n.marketSize,n.arenaName]})()`);
assert.deepEqual(s,['Oklahoma City',1497821,'Small','Oklahoma City Arena']);
// 6. Oklahoma City preset: appended (index 12) so the original twelve keep their logo indices.
const okc=run(`(()=>{const p=franchisePreset('OKC'),t=presetTeamDefinition(p);return {index:FRANCHISE_PRESETS.indexOf(p),city:p.city,name:p.name,tz:p.timeZone,ft:p.elevationFt,state:p.state,pop:t.population,tier:t.marketSize,logoIndex:t.logoIndex,atlas:t.logoAtlas,alt:altitudeVenue({city:p.city,name:'X'}).feet,secondary:secondaryTeamLogo(t)}})()`);
assert.deepEqual({...okc,secondary:undefined},{index:12,city:'Oklahoma City',name:'Twisters',tz:'America/Chicago',ft:1201,state:'Oklahoma',pop:1497821,tier:'Small',logoIndex:12,atlas:'preset',alt:1201,secondary:undefined});
assert.match(okc.secondary,/secondary-logos\/OKC\.png/);
assert.deepEqual(run(`FRANCHISE_PRESETS.slice(0,12).map(p=>p.abbr)`),['ANA','BUF','CGY','CIN','GBY','NSH','NWK','OTT','SJO','STL','TPA','WPG'],'existing preset order (and logo indices) unchanged');
// Setup can add it; a save holding it round-trips.
l.run(`setupDraft=makeDraft();onSetup=true;document.getElementById=id=>id==='new-team-division'?{value:'northwest'}:null;closeTitleModal=()=>{};renderSetup=()=>{};addSetupPreset('OKC');`);
assert.equal(run(`setupDraft.teams.find(t=>t.abbr==='OKC')?.city`),'Oklahoma City');
assert.equal(run(`(()=>{const s=fresh([...defaultTeams().slice(0,29),presetTeamDefinition(franchisePreset('OKC'))],2,2026,'male',10);s.gmName='OKC';const t=validateCareerData(JSON.parse(JSON.stringify(s))).teams.find(t=>t.abbr==='OKC');return t.logoIndex+' '+t.population})()`),'12 1497821');
// Setup editor: Arena name field; typed names stick, an automatic "<City> Arena" follows a move, blank is rejected.
const arena=run(`(()=>{renderSetup=()=>{};onSetup=true;setupDraft=makeDraft();setupDraft.gmName='Arena';let html='';editorModal=(a,b)=>{html=b};openTeamEditor(2);
 const base=i=>{const t=setupDraft.teams[i];return {city:t.city,name:t.name,abbr:t.abbr,population:(t.population/1e6).toFixed(1),stadiumCapacity:18000,divisionId:t.divisionId,logo:logoChoices().findIndex(c=>c.logoAtlas===t.logoAtlas&&c.logoIndex===t.logoIndex),colors:copy(t.colors),elevationFt:''}};
 const auto=setupDraft.teams[4].city+' Arena';applyTeamEdit(2,{...base(2),arenaName:' The Pit '});applyTeamEdit(4,{...base(4),city:'Omaha',arenaName:auto});applyTeamEdit(5,{...base(5),city:'Tulsa',arenaName:'Oil Dome'});
 let blank='';try{applyTeamEdit(6,{...base(6),arenaName:'  '})}catch(e){blank=e.message}const s=validateCareerData(buildSetupCareer(copy(setupDraft)));
 return {field:/name="arenaName"[^>]*value="[^"]+ Arena"/.test(html),names:[2,4,5].map(i=>s.teams[i].arenaName),blank}})()`);
assert(arena.field,'the setup editor has an Arena name field');assert.deepEqual(arena.names,['The Pit','Omaha Arena','Oil Dome']);assert.match(arena.blank,/arena name/);
console.log('Team editors: arena name, generated color names, Move to an available city with metro population, Oklahoma City preset passed.');
