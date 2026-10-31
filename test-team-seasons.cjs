const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
const source=fs.readFileSync('dist/dashboard.js','utf8'),nav=source.match(/const nav=(\[.*?\]);document/)[1];
const pages=vm.runInContext(nav,context).map(x=>x[0]);pages.push('GM Office','GM Inbox','Attendance rankings','Power rankings');
vm.runInContext("state=validateCareerData(fresh(defaultTeams().slice(0,6),2));ownerCanManage=()=>true;notice='';",context);

vm.runInContext(`
const baseline=JSON.stringify(state),t=state.teams[0];
assert(teamHistoryPage(t).includes('openFranchiseSeason(0,'+state.year+')'));
openFranchiseSeason(0,state.year);assert.equal(franchiseHistoryPage,'seasonDetail');assert(teamSeasonPage(t).includes('Roster and Stats'));assert(teamSeasonPage(t).includes('No recorded games'));
for(const [a,b] of state.schedule[0])play(a,b);state.day++;
const departingPlayer=t.roster[0],other=state.teams[1],replacement=other.roster[0];t.roster[0]=replacement;other.roster[0]=departingPlayer;
for(const [a,b] of state.schedule[1])play(a,b);state.day++;
const snap=currentTeamSeason(t),row=snap.roster.find(p=>p.id===departingPlayer.id),expected=state.history.flatMap(g=>g.box.filter(p=>p.playerId===departingPlayer.id&&p.team===t.abbr&&p.played!==false&&p.mp>0));
assert.equal(row.regular.gp,expected.length);assert.equal(row.regular.pts,expected.reduce((s,p)=>s+p.pts,0));assert(snap.roster.some(p=>p.id===replacement.id));assert.equal(snap.games[0].date,scheduleDateLabel(snap.games[0].day));
assert.equal(snap.regular.pts,state.history.filter(g=>g.a===0||g.b===0).reduce((sum,g)=>sum+(g.a===0?g.sa:g.sb),0));
archiveTeamSeasonDetails();const frozen=JSON.stringify(currentTeamSeason(t));departingPlayer.name='Changed later';departingPlayer.age++;t.city='Renamed';assert.equal(JSON.stringify(currentTeamSeason(t)),frozen);
const restored=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(restored.teamSeasonArchive,state.teamSeasonArchive);
const year=state.year;state.year++;state.history=[];assert.equal(JSON.stringify(historicalTeamSeason(t,year)),frozen);franchiseSeasonYear=year;state.franchiseArchive=[{year,key:t.key,name:'Original franchise',w:1,l:1,playoffs:false,champion:false}];assert(teamSeasonPage(t).includes('Next season →'));assert(!teamSeasonPage(t).includes('Changed later'));
const bad=JSON.parse(JSON.stringify(restored));{const line=bad.teamSeasonArchive[0].roster[0].regular;if(Array.isArray(line))line[SEASON_COUNTS.indexOf('pts')]=-1;else line.pts=-1}assert(restored.teamSeasonArchive.every(r=>r.compact),'sealed seasons are stored compactly');assert.equal(teamSeasonFull(restored.teamSeasonArchive[0]).roster[0].regular.gp,restored.teamSeasonArchive[0].roster[0].regular[0]);assert.throws(()=>validateCareerData(bad),/team player split/);
state=JSON.parse(baseline);state.franchiseArchive=[{year:state.year-1,key:state.teams[0].key,name:'Historic club',w:4,l:6,playoffs:false,champion:false}];franchiseSeasonYear=state.year-1;const legacy=historicalTeamSeason(state.teams[0],franchiseSeasonYear);assert(legacy.partial);assert.equal(legacy.roster.length,0);assert(teamSeasonPage(state.teams[0]).includes('limited archived data'));
assert.equal(seasonStatCell({gp:2,fgm:1,fga:4},'fgpct'),'.250');franchiseSeasonMode='pergame';assert.equal(seasonStatCell({gp:2,pts:25},'pts'),'12.5');franchiseSeasonMode='totals';assert.equal(seasonStatCell({gp:2,pts:25},'pts'),'25');
`,context);
console.log('PASS: season links/navigation, empty season, team-only traded-departingPlayer splits, game dates and totals, frozen historical identity, save/load validation, legacy missing-data fallback and stat display modes.');
