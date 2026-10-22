// Franchise presets: identity, assets, geography, altitude, rivalries, logos, setup/expansion/relocation paths and save/load.
// Full NBA/WNBA seasons: node dev/franchise-presets/season-check.cjs [nba|wnba]
const fs=require('node:fs'),assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:4242,strictDOM:false});l.setRandomSeed(4242);l.context.assert=assert;
l.context.FormData=class{constructor(form){return Object.entries(form)}};
const run=code=>{const v=l.run(code);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
const expected=[['Anaheim','Arrows','ANA'],['Buffalo','Blizzard','BUF'],['Calgary','Stampede','CGY'],['Cincinnati','Royals','CIN'],['Green Bay','Lumberjacks','GBY'],['Nashville','Sound','NSH'],['Newark','Ironworks','NWK'],['Ottawa','Capitals','OTT'],['San Jose','Circuit','SJO'],['St. Louis','Archers','STL'],['Tampa','Tritons','TPA'],['Winnipeg','Aurora','WPG']];
// 1–3. Identity, uniqueness, existing teams untouched.
assert.deepEqual(run('FRANCHISE_PRESETS.map(p=>[p.city,p.name,p.abbr])'),expected);
const existingAbbr=run('[...defaultTeams().map(t=>t.abbr),...NEW_TEAM_PRESETS.map(p=>p[2])]');
assert.equal(new Set(expected.map(e=>e[2])).size,12);for(const [, ,a] of expected)assert(!existingAbbr.includes(a),a+' collides with an existing team');
assert.equal(run('defaultTeams().length'),30);assert.equal(run('defaultTeams().some(t=>t.logoAtlas==="preset")'),false);
assert.equal(run('JSON.stringify(logoChoices().slice(0,30))'),run('JSON.stringify(defaultTeams())'));assert.equal(run('logoChoices().length'),42);
assert.deepEqual(run('FRANCHISE_PRESETS.map(p=>presetTeamDefinition(p).key)'),expected.map(e=>'preset-'+e[2]));
// 5. Colors: three valid named colors each, distinct palettes.
for(const p of run('FRANCHISE_PRESETS.map(p=>presetTeamDefinition(p))')){assert.equal(p.colors.length,3);assert(p.colors.every(c=>/^#[0-9A-F]{6}$/.test(c.hex)&&c.name.length<=35));}
assert.equal(new Set(run('FRANCHISE_PRESETS.map(p=>p.colors.map(c=>c[1]).join())')).size,12);
// 6–7. Geography: countries, provinces, coordinates, zones.
const geo=run('FRANCHISE_PRESETS.map(p=>({abbr:p.abbr,country:p.country,state:p.state,lat:p.lat,lon:p.lon,tz:p.timeZone,ft:p.elevationFt}))');
for(const g of geo){assert(g.lat>25&&g.lat<55&&g.lon<-70&&g.lon>-125,g.abbr);new Intl.DateTimeFormat('en-US',{timeZone:g.tz});}
assert.deepEqual(geo.filter(g=>g.country==='Canada').map(g=>[g.abbr,g.state]),[['CGY','Alberta'],['OTT','Ontario'],['WPG','Manitoba']]);
assert(geo.filter(g=>g.country!=='Canada').every(g=>g.country==='United States'));
assert.deepEqual(Object.fromEntries(geo.filter(g=>['ANA','SJO','NWK','STL','GBY'].includes(g.abbr)).map(g=>[g.abbr,g.state])),{ANA:'California',GBY:'Wisconsin',NWK:'New Jersey',SJO:'California',STL:'Missouri'});
assert.match(run('presetGeoLine(franchisePreset("CGY"))'),/^Calgary, Alberta, Canada · 51\.04°N 114\.07°W · MST · 3,428 ft$/);
// 8. Altitude: the lookup agrees with preset data; Calgary is Moderate, below Denver's High.
for(const g of geo)assert.equal(run(`altitudeVenue({city:${JSON.stringify(run(`franchisePreset('${g.abbr}').city`))},name:'X'}).feet`),g.ft,g.abbr);
run(`state=fresh([...defaultTeams(),presetTeamDefinition(franchisePreset('CGY'))],2,2025,'male',10);`);
const impact=run(`(()=>{const id=a=>state.teams.find(t=>t.abbr===a).id;return {cgy:altitudeEnvironment(id('CGY'),id('MIA'),'Regular season',0).impact,den:altitudeEnvironment(id('DEN'),id('MIA'),'Regular season',0).impact}})()`);
assert.deepEqual(impact,{cgy:'Moderate',den:'High'});
// 4. Logos: atlas markup, files, secondary marks, CSS.
assert.match(run('teamLogo(presetTeamDefinition(franchisePreset("WPG")))'),/logo-preset[^"]*" role="img" aria-label="Winnipeg Aurora logo" style="--logo-x:100%;--logo-y:100%"/);
assert.match(run('teamLogo(presetTeamDefinition(franchisePreset("ANA")))'),/--logo-x:0%;--logo-y:0%/);
const png=fs.readFileSync('dist/preset-logos.png');assert.equal(png.readUInt32BE(16),2048);assert.equal(png.readUInt32BE(20),1536);
for(const [, ,a] of expected){assert(fs.statSync(`dist/secondary-logos/${a}.png`).size>1000);assert(fs.readFileSync(`dist/preset-logos/${a}.svg`,'utf8').startsWith('<svg'));
 assert.match(run(`secondaryTeamLogo(presetTeamDefinition(franchisePreset('${a}')))`),new RegExp(`secondary-logos/${a}\\.png`));}
assert.match(run('secondaryTeamLogo(defaultTeams()[8])'),/secondary-logos\/BOS\.png/,'existing expansion secondary unchanged');
assert.match(fs.readFileSync('dist/style.css','utf8'),/\.franchise-logo\.logo-preset:before\{background-image:url\('preset-logos\.png'\);background-size:400% 300%/);
assert.equal(run('readTeamBrand({secondaryLogoIndex:41},m=>{throw Error(m)}).secondaryLogoIndex'),41);assert.throws(()=>run('readTeamBrand({secondaryLogoIndex:42},m=>{throw Error(m)})'),/secondary/);
// City photos: every preset city resolves through the registry (missing files fall back to the skyline layer).
for(const [city] of expected)assert.match(run(`resolveCityPhoto({city:${JSON.stringify(city)}},2025)`),/^city-photos\/[a-z-]+\.jpg$/);
// Setup validation accepts preset teams; save/load keeps their identity.
run(`var d=makeDraft();d.gmName='Preset test';d.teams=[...d.teams.slice(0,10),...['ANA','OTT'].map(a=>({...presetTeamDefinition(franchisePreset(a)),divisionId:'pacific'}))];syncAlignment(d);d.meetings=2;`);
assert.equal(run('validateDraft(d,false,true)'),'');
assert.equal(run(`(()=>{const x=copy(d);x.teams[10].logoIndex=12;return validateDraft(x,false,true)})()`),'Choose a valid team logo.');
run(`state=fresh(d.teams.map(t=>({...t})),2,2025,'male',10);state.gmName='Preset test';`);
const saved=run(`JSON.stringify(validateCareerData(JSON.parse(JSON.stringify(state))).teams.slice(10).map(t=>[t.key,t.abbr,t.logoAtlas,t.logoIndex,t.arenaName,t.stadiumCapacity,t.colors.map(c=>c.name+c.hex).join()]))`);
assert.equal(saved,JSON.stringify([['preset-ANA','ANA','preset',0,'Santa Ana River Arena',18200,'Arrow orange#F26B21,Navy#14213D,Silver#B9C2CC'],['preset-OTT','OTT','preset',7,'Rideau Arena',18000,'Capital red#C8102E,Black#111111,Silver#C3C8CE']]));
assert.throws(()=>run(`(()=>{const s=JSON.parse(JSON.stringify(state));s.teams[10].logoIndex=12;return validateCareerData(s)})()`),/invalid logo/);
// Existing saves without presets still load.
assert.equal(run(`validateCareerData(JSON.parse(JSON.stringify(fresh(defaultTeams(),2,2025,'male',10)))).teams.length`),30);
// Expansion config: presets validate and round-trip; unknown presets are rejected; custom expansions unchanged.
const base={city:'Ottawa',name:'Capitals',abbr:'OTT',arenaName:'Rideau Arena',divisionId:'atlantic',newDivision:'',conferenceId:'east',marketSize:'Medium',primary:'#C8102E',secondary:'#111111',cap:'standard',seed:'equal',capacity:18000,ticket:80,protect:4,maximum:2,target:13,fee:500,hype:80,rebuild:'on'};
l.context.base=base;
assert.equal(run(`expansionConfig({...base,preset:'ott'}).preset`),'OTT');
assert.equal(run(`'preset' in expansionConfig({...base})`),false);
assert.throws(()=>run(`expansionConfig({...base,preset:'XYZ'})`),/preset/);
// Relocation through the team editor: identity changes, franchise continuity preserved.
run(`state=fresh(defaultTeams(),2,2025,'male',10);state.gmName='Preset test';state.history=[{a:0,b:1,sa:100,sb:90,winner:0,day:1,stage:'Regular season',box:[{name:'X',team:'ATL',pts:10,reb:1,ast:1}]}];`);
const reloc=run(`(()=>{const t=state.teams[0],before={key:t.key,roster:t.roster.map(p=>p.id).join()},p=franchisePreset('NSH'),idx=PRESET_LOGO_OFFSET+FRANCHISE_PRESETS.indexOf(p),v={city:p.city,name:p.name,abbr:p.abbr,arenaName:p.arenaName,stadiumCapacity:String(p.capacity),marketSize:p.marketSize,logo:String(idx),secondaryLogoIndex:String(idx),arenaCity:'',elevationFt:'',...(state.scheduleFormat==='nba82'?{swap:''}:{divisionId:t.divisionId})};presetTeamDefinition(p).colors.forEach((c,i)=>{v['color'+i]=c.hex;v['colorName'+i]=c.name});applyManagedTeam(0,v);return {...before,after:{key:t.key,roster:t.roster.map(p=>p.id).join(),city:t.city,abbr:t.abbr,logoAtlas:t.logoAtlas,logoIndex:t.logoIndex,secondary:t.secondaryLogoIndex,capacity:t.stadiumCapacity,arena:t.arenaName,feet:altitudeVenue(t).feet},box:state.history[0].box[0].team}})()`);
assert.equal(reloc.after.key,reloc.key);assert.equal(reloc.after.roster,reloc.roster);
assert.deepEqual({...reloc.after,key:undefined,roster:undefined},{key:undefined,roster:undefined,city:'Nashville',abbr:'NSH',logoAtlas:'preset',logoIndex:5,secondary:35,capacity:17900,arena:'Music Row Arena',feet:597});
assert.equal(reloc.box,'NSH');
// 10. Rivalry geography: same city vs metro vs state/province vs regional; distant pairs stay neutral.
const riv=(a,b)=>run(`rivalryBase({city:${JSON.stringify(a)},roster:[]},{city:${JSON.stringify(b)},roster:[]}).map(e=>(e.label||RIVALRY_TYPES[e.kind])+'|'+e.kind)`);
assert.deepEqual(riv('Anaheim','Los Angeles'),['Metro Rivalry|geography']);
assert.deepEqual(riv('Newark','New York'),['Metro Rivalry|geography']);
assert.deepEqual(riv('San Jose','San Francisco'),['Metro Rivalry|geography']);
assert.deepEqual(riv('Brooklyn','New York'),['Cross-Town Feud|geography']);
assert.deepEqual(riv('Tampa','Orlando'),['In-State Rivalry|geography']);
assert.deepEqual(riv('Ottawa','Toronto'),['In-Province Rivalry|geography']);
assert.deepEqual(riv('Buffalo','Toronto'),['Regional Rivalry|regional']);
assert.deepEqual(riv('Calgary','Winnipeg'),['Regional Rivalry|regional']);
assert.deepEqual(riv('Cincinnati','Cleveland'),['In-State Rivalry|geography']);
assert.deepEqual(riv('Green Bay','Milwaukee'),['In-State Rivalry|geography']);
assert.deepEqual(riv('Calgary','Denver'),[]);assert.deepEqual(riv('Nashville','Atlanta'),[]);
assert.deepEqual(riv('Dallas','Houston'),['In-State Rivalry|geography'],'existing same-state pair keeps its effect with an accurate label');
// Regional ties never split the crowd; geography ties keep the existing 50/50 split.
run(`state=fresh([...defaultTeams(),presetTeamDefinition(franchisePreset('BUF'))],2,2025,'male',10);`);
assert.equal(run(`rivalryMatchup(state.teams.find(t=>t.abbr==='BUF'),state.teams.find(t=>t.abbr==='TOR')).split`),false);
assert.equal(run(`rivalryMatchup(state.teams.find(t=>t.abbr==='BUF'),state.teams.find(t=>t.abbr==='NYE')).split`),true);
console.log('Franchise presets: 12 identities, geography, altitude, logos, photos, setup/save validation, expansion config, relocation and rivalry classification passed.');
