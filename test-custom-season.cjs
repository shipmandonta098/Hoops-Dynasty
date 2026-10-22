const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;toast=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};showResult=()=>{};
state=validateCareerData(fresh(defaultTeams(),2));
const rules={...leagueRules(),seasonGames:82,divisionGames:16,conferenceGames:36,seasonStart:'10-01',seasonEnd:'04-15'};
const calendar=customSeasonSchedule(state.teams,state.year,rules);assert(validateCustomSeason(calendar,state.teams,rules,state.year));
for(const t of state.teams){const home=calendar.flat().filter(p=>p[0]===t.id).length;assert.equal(home,41)}
assert.throws(()=>customSeasonSchedule(state.teams,state.year,{...rules,seasonEnd:'10-03'}));assert.throws(()=>customSeasonSchedule(state.teams,state.year,{...rules,divisionGames:80}));assert.throws(()=>readLeagueSettings({...rules,seasonStart:'02-30'}));
const form={leagueName:state.leagueName,gmName:state.gmName,theme:'dark',gender:'male',cap:150,format:82,rule_seasonGames:'82',rule_divisionGames:'16',rule_conferenceGames:'36',rule_seasonStart:state.year+'-10-01',rule_seasonEnd:(state.year+1)+'-04-15'};
await saveGameSettings({preventDefault(){},target:form});assert.equal(state.scheduleFormat,'custom');assert.equal(scheduleDate(1).toISOString().slice(5,10),'10-01');assert.equal(scheduleDate(seasonLength()).toISOString().slice(5,10),'04-15');state=validateCareerData(copy(state));assert.equal(state.scheduleFormat,'custom');
const persisted=JSON.stringify(state.schedule);save=async()=>false;form.rule_seasonEnd=(state.year+1)+'-04-20';await saveGameSettings({preventDefault(){},target:form});assert.equal(JSON.stringify(state.schedule),persisted);save=async()=>true;
sim(1);assert.throws(()=>readLeagueSettingsForm({rule_seasonGames:'80'}));state=validateCareerData(copy(state));assert.equal(state.leagueSettings.seasonGames,82);
// A smaller two-conference league exercises full best-of-three series with two top-seed byes.
state=validateCareerData(fresh(defaultTeams().slice(0,6),2));state.teams.forEach((t,i)=>{t.conference=i<3?'East':'West';t.divisionId=i<3?'east':'west'});state.leagueSettings={...leagueRules(),seasonGames:6,divisionGames:2,conferenceGames:0,seasonStart:'11-01',seasonEnd:'11-20',playoffFormat:'eight',firstRoundByes:2,seriesGames:3,splitPlayoffs:true};state.scheduleFormat='custom';regenerateSeasonCalendar();assert(validateCustomSeason(state.schedule,state.teams,leagueRules(),state.year));
assert.equal(playoffField().length,6);assert.equal(usesConferencePlayoffs(),true);assert.equal(playoffOpeningPairs().filter(p=>p.includes(null)).length,2);sim(seasonLength());
let slots=playoffSeriesSlots(),slot=slots.find(s=>!s.complete);assert.equal(slots.filter(s=>s.bye).length,2);await simulatePlayoffGame(...slot.nextPair);assert.equal(state.champion,null);assert.equal(playoffGames().length,1);state=validateCareerData(copy(state));slot=playoffSeriesSlots().find(s=>!s.complete);assert.equal(slot.games.length,1);assert.equal(slot.gameNumber,2);assert.equal(slot.nextPair[0],slot.pair[1]);
await playoffs();assert.notEqual(state.champion,null);assert(playoffSeriesSlots().every(s=>s.complete));assert(playoffSeriesSlots().filter(s=>!s.bye).every(s=>Math.max(...s.wins)===2));assert(playoffGames().length>=10&&playoffGames().length<=15);const games=playoffGames().length;await playoffs();assert.equal(playoffGames().length,games);state=validateCareerData(copy(state));assert.equal(playoffConfig().bestOf,3);assert.equal(playoffConfig().byes,2);assert(playoffsView().includes('Best of 3'));assert(postseasonSchedulePanel().includes('BYE')||!playoffConfig().sides.some(s=>s.teams[0]===0));
const saved=copy(state);delete state.playoffConfig;state.history=[];state.champion=null;state.leagueSettings.splitPlayoffs=false;assert.equal(usesConferencePlayoffs(),false);assert.equal(playoffField().length,6);assert.equal(playoffOpeningPairs().filter(p=>p.includes(null)).length,2);
state.leagueSettings.firstRoundByes=1;assert.throws(()=>validatePlayoffRules(leagueRules(),state.teams));
// Reloading pre-update postseason games keeps their original single-elimination structure.
state=saved;delete state.playoffConfig;state.leagueSettings.seriesGames=1;assert.equal(playoffConfig().bestOf,1);
// Rebuild the same custom date window next year through the full offseason flow.
state=saved;await runDraftLottery();await autoDraft(false);state.freeAgency={year:state.year,phase:'complete',players:[],offers:[],pending:[],mle:{},log:[],round:1};const oldYear=state.year;newSeason();assert.equal(state.year,oldYear+1);assert.equal(state.scheduleFormat,'custom');assert.equal(state.playoffConfig,undefined);assert(validateCustomSeason(state.schedule,state.teams,leagueRules(),state.year));state=validateCareerData(copy(state));
// Fast deterministic games cover every supported series length without simulating thousands of possessions.
const realPlay=play;play=(a,b,stage)=>{const g={a,b,sa:100,sb:90,winner:a,stage,day:state.day+1,box:[]};state.history.unshift(g);return g};finalizeRegularAwards=()=>{};
for(const bestOf of [1,3,5,7])for(const split of [false,true])for(const byes of [0,2,4]){
 state=fresh(defaultTeams(),2);state.day=seasonLength();state.leagueSettings={...readLeagueSettings(undefined,state),seriesGames:bestOf,firstRoundByes:byes,splitPlayoffs:split};
 const first=playoffSeriesSlots().find(s=>!s.complete);save=async()=>false;const before=JSON.stringify(state);await simulatePlayoffGame(...first.nextPair);assert.equal(JSON.stringify(state),before);save=async()=>true;
 await playoffs();const played=playoffSeriesSlots().filter(s=>!s.bye);assert.equal(played.length,15-byes);assert(played.every(s=>s.games.length===bestOf));assert.equal(playoffGames().length,(15-byes)*bestOf);assert.equal(playoffSeriesSlots().filter(s=>s.bye).length,byes);assert.equal(playoffConfig().split,split);
}
state=fresh(defaultTeams().slice(0,6),2);state.teams.forEach((t,i)=>{t.conference=i===0?'Tiny':'Large'});state.leagueSettings={...readLeagueSettings(undefined,state),playoffFormat:'top4',splitPlayoffs:true};assert.equal(usesConferencePlayoffs(),false);
play=realPlay;
console.log('PASS: exact 82-game matchup quotas, balanced home/away, dates, invalid combinations, rollback, legacy save loading, conference split, byes, series wins/home court, reload and championship completion.');
})()`,context);})().catch(e=>{console.error(e);process.exitCode=1});
