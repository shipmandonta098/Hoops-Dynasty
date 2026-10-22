const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;ownerTrack=()=>{};ownerFinalize=()=>{};finalizeRegularAwards=()=>{};
play=(a,b,stage)=>{const g={a,b,sa:100,sb:90,winner:a,stage,day:state.day+1,box:[]};state.history.unshift(g);return g};
assert.equal(LEAGUE_SETTING_DEFAULTS.seriesGames,7);
for(const size of [4,8,16])for(const split of [false,true])for(const byes of [0,2]){
 state=fresh(defaultTeams(),2);state.day=seasonLength();state.leagueSettings={...readLeagueSettings(undefined,state),playoffFormat:({4:'top4',8:'eight',16:'sixteen'})[size],splitPlayoffs:split,firstRoundByes:byes,seriesFirstGames:1,seriesQuarterGames:3,seriesSemiGames:5,seriesFinalGames:7};
 assert.equal(leagueSettingLock(LEAGUE_SETTING_FIELDS.find(f=>f[0]==='seriesFinalGames')),'');
 const config=createPlayoffConfig();assert.deepEqual(readPlayoffConfig(config,state),config);
 const legacy=copy(config);delete legacy.roundGames;assert(Object.values(readPlayoffConfig(legacy,state).roundGames).every(n=>n===7));
 assert.throws(()=>readPlayoffConfig({...config,roundGames:{Championship:2}},state));
 let rounds=0;while(state.champion===null){
 const current=playoffSeriesSlots().find(s=>!s.complete).round;
 if(rounds===0){const slot=playoffSeriesSlots().find(s=>!s.complete);await simulatePlayoffGame(...slot.nextPair);}
 const active=playoffSeriesSlots().find(s=>!s.complete)?.round;
 if(active===undefined)break;
 const pending=simulatePlayoffRound();assert(playoffBatchToken);assert.equal(await simulatePlayoffRound(),undefined);await pending;
 assert(!playoffBatchToken);assert(playoffSeriesSlots().filter(s=>s.round===active).every(s=>s.complete));assert(playoffSeriesSlots().filter(s=>s.round>active).every(s=>s.games.length===0));
 assert(++rounds<=4);
 }assert.notEqual(state.champion,null);
 for(const s of playoffSeriesSlots().filter(s=>!s.bye)){const expected=({'First round':1,'Conference semifinal':3,'Conference final':5,'Semifinal':5,'Championship':7})[s.stage];assert.equal(s.bestOf,expected);assert.equal(s.games.length,expected);assert.equal(Math.max(...s.wins),Math.ceil(expected/2));}
 assert(leagueSettingLock(LEAGUE_SETTING_FIELDS.find(f=>f[0]==='seriesFinalGames')));
 state.playoffConfig=readPlayoffConfig(copy(state.playoffConfig),state);assert(playoffSeriesSlots().every(s=>s.complete));
 assert(playoffsView().includes('Custom series by round'));assert(playoffBracket().includes('Best of 7'));
 const count=state.history.length;await playoffs();assert.equal(state.history.length,count);
}
state=fresh(defaultTeams().slice(0,6),2);assert.equal(createPlayoffConfig().bestOf,7);assert(Object.values(createPlayoffConfig().roundGames).every(n=>n===7));
state.leagueSettings.seriesGames=3;assert(Object.values(createPlayoffConfig().roundGames).every(n=>n===3));
console.log('PASS: round-only advance, partial series, duplicate-click guard, next-round boundary; best-of-seven default, per-round 1/3/5/7, 4/8/16-team brackets, split conferences, byes, clinching, persistence, legacy snapshots, validation and settings locks.');
})()`,context)})().catch(e=>{console.error(e);process.exitCode=1});
