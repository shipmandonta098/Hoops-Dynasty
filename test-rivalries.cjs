const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
const source=fs.readFileSync('dist/dashboard.js','utf8'),nav=source.match(/const nav=(\[.*?\]);document/)[1];
const pages=vm.runInContext(nav,context).map(x=>x[0]);pages.push('GM Office','GM Inbox','Attendance rankings','Power rankings');
vm.runInContext("state=validateCareerData(fresh(defaultTeams().slice(0,6),2));ownerCanManage=()=>true;notice='';",context);

vm.runInContext(`
const baseline=JSON.stringify(state);
const reset=()=>{state=JSON.parse(baseline);activeRivalry=null};
reset();state.teams[1].city=state.teams[0].city;
assert(rivalryDetails(state.teams[0],state.teams[1]).types.some(e=>e.kind==='geography'));
activeRivalry=rivalryMatchup(state.teams[0],state.teams[1]);assert.equal(rivalryHomeAdjustment(),-leagueRules().homeAdvantage/200);activeRivalry=null;
state.teams.forEach(t=>t.city=state.teams[0].city);
for(const [a,b] of state.schedule[0]){const g=play(a,b);assert.equal(g.playByPlay.length,g.boxTimeline.length);for(const [id,score] of [[a,g.sa],[b,g.sb]])assert.equal(g.box.filter(p=>p.team===state.teams[id].abbr).reduce((sum,p)=>sum+p.pts,0),score);}
state.day++;const loaded=validateCareerData(JSON.parse(JSON.stringify(state)));assert.deepEqual(loaded.rivalries,state.rivalries);assert(loaded.history.every(g=>g.rivalry));assert(loaded.history.some(g=>g.playByPlay.some(s=>s.includes('RIVALRY WATCH'))));assert.equal(activeRivalry,null);
reset();const small=state.teams[0],big=state.teams[1];small.marketSize='Small';big.marketSize='Large';coachFor(small).system='Grit & Grind';big.roster.forEach(p=>p.salary=100);assert(rivalryBase(small,big).some(e=>e.kind==='contrast'));
reset();let a=state.teams[0],b=state.teams[1];for(const [t,pick] of [[a,1],[b,2]]){t.roster[0].ovr=95;t.roster[0].bio={...t.roster[0].bio,draftYear:2025,draftRound:1,draftPick:pick};}assert(rivalryBase(a,b).some(e=>e.kind==='draft'));
reset();a=state.teams[0];b=state.teams[1];const star=a.roster[0];star.ovr=95;rivalrySyncPersonnel();a.roster.shift();b.roster.push(star);rivalrySyncPersonnel();const returned=rivalryPair(a,b).events.find(e=>e.kind==='return');assert.equal(returned.remaining,1);assert(rivalryMatchup(a,b).returnGame);assert(!rivalryMatchup(b,a).returnGame);rivalrySyncPersonnel();assert.equal(rivalryPair(a,b).events.filter(e=>e.kind==='return').length,1);
reset();a=state.teams[0];b=state.teams[1];const mentor=a.roster[0],pupil=a.roster.at(-1);mentor.age=35;mentor.personalityTraits=['steady','leader','balanced'];pupil.age=21;pupil.ovr=60;state.rivalries.players=[];rivalrySyncPersonnel();a.roster=a.roster.filter(p=>p.id!==pupil.id);b.roster.push(pupil);pupil.ovr=99;rivalrySyncPersonnel();assert(rivalryPair(a,b).events.some(e=>e.kind==='mentor'));
reset();a=state.teams[0];b=state.teams[1];state.leagueSettings={...leagueRules(),playoffSeriesGames:1};const configBefore=playoffConfig;playoffConfig=()=>({bestOf:1});
for(let n=0;n<3;n++){state.year=2026+n;const g={a:0,b:1,winner:0,sa:101,sb:99,stage:'Championship',playByPlay:[]};state.history=[g];rivalryAfterGame(a,b,g,[],rivalryMatchup(a,b));}
assert(rivalryPair(a,b).events.some(e=>e.kind==='heartbreak'));assert(rivalryDetails(a,b).types.some(e=>e.kind==='founders'));playoffConfig=configBefore;
reset();a=state.teams[0];b=state.teams[1];const buzzer={a:0,b:1,winner:0,sa:101,sb:100,stage:'Championship',playByPlay:['[101–100] Q4 0:00 · '+a.abbr+' · MADE: Star (2 PTS)']};state.history=[buzzer];rivalryAfterGame(a,b,buzzer,[],rivalryMatchup(a,b));assert(rivalryPair(a,b).events.some(e=>e.kind==='heartbreak'));
reset();a=state.teams[0];b=state.teams[1];state.day=seasonLength()-1;rivalryAfterGame(a,b,{winner:0,stage:'Regular season'},[{id:0,gp:20,pct:.2,streak:0},{id:1,gp:20,pct:.8,streak:10}],rivalryMatchup(a,b));assert(rivalryPair(a,b).events.some(e=>e.kind==='spoilsport'));
reset();a=state.teams[0];b=state.teams[1];const victim=a.roster[0];victim.ovr=99;const randomBefore=Math.random;Math.random=()=>0;assert(rivalryFlagrantInjury(victim,b.roster[0],a,b));Math.random=randomBefore;const grudge=rivalryPair(a,b).events.find(e=>e.kind==='grudge');assert.equal(grudge.remaining,4);for(let n=0;n<4;n++){rivalryAfterGame(a,b,{winner:0,stage:'Regular season'},[{id:0,gp:0},{id:1,gp:0}],rivalryMatchup(a,b));}assert.equal(grudge.remaining,0);assert(!rivalryMatchup(a,b).grudge);
state.leagueSettings={...leagueRules(),injuriesEnabled:false};assert(!rivalryFlagrantInjury(a.roster[1],b.roster[0],a,b));
reset();a=state.teams[0];b=state.teams[1];rivalryEvent(a,b,'heartbreak','test','Recorded playoff heartbreak.',{target:a.key,remaining:3});activeRivalry=rivalryMatchup(a,b);assert(rivalryPlayerBonus(a.roster[0])<=5);assert(rivalryPlayerBonus(a.roster[0])>=-2);activeRivalry=null;setFranchiseHistoryPage('rivalries');assert(teamHistoryPage(a).includes('Bad blood'));const invalid=JSON.parse(JSON.stringify(state));invalid.rivalries.pairs[0].heat=101;assert.throws(()=>validateCareerData(invalid),/rivalry/);
`,context);
console.log('PASS: all nine rivalry types, shared crowd, live simulation score/timeline integrity, save/load, bounded modifiers, personnel deduplication, grudge expiry, disabled injuries and history navigation.');
