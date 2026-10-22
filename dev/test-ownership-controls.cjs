const fs=require('node:fs'),assert=require('node:assert/strict'),vm=require('node:vm'),{candidate}=require('./ownership-candidate.cjs');
const original=process.argv.includes('--production')?fs.readFileSync('dist/attributes.js','utf8'):require('node:child_process').execFileSync('git',['show','cf8e0533593be4920ee22042f205a7480db86795:dist/attributes.js'],{encoding:'utf8'});
const source=process.argv.includes('--production')?original:candidate('attributes.js',original);
// Run actual terminal-event hooks and the actual dispatcher in a deterministic
// closure harness. Random basketball decisions are scripted, not rebalanced.
function section(start,end){return source.slice(source.indexOf(start),source.indexOf(end,source.indexOf(start)))}
const ft=section('function freeThrows(','\n function eject('),board=section('function finishRebound(','\n function possession('),to=section('function recordTurnover(','\n function shortName('),minute=section('function runMinute(','\n let overtime=');
const madeHook=source.match(/terminalNextSide=1-side;machine.transition\('made'\);/)[0];
const crossHook=source.match(/if\(bonus\)\{if\(guiltySide===side\)crossSideBonus=true;freeThrows\(1-guiltySide,recipient,2\);return\}/)[0];
const returnHook=source.match(/return crossSideBonus\?terminalNextSide:null;/)[0];
const tests=[];
function scenario(name,{ftRolls=[0,0],rebounds=[],follow='made',guilty=0,technical=false,retain=false,expect=0,expectedCores=0}){
 const c={assert,ftRolls:[...ftRolls],rebounds:[...rebounds],follow,guilty,technical,retain,expect,expectedCores};vm.createContext(c);
 vm.runInContext(`
 let terminalNextSide=null,crossSideBonus=false,transitionTeam=null,extraBoards=0;
 const clubs=[{abbr:'A',roster:[]},{abbr:'B',roster:[]}],p={id:1,name:'FT Shooter',attributes:{ft:75}},rows=new Map([[1,{fta:0,ftm:0,pts:0,reb:0,orb:0,drb:0,tov:0,pf:0,stl:0}]]),rotationEvents=[],gameRotations=[{},{}],teamTurnoverEvents=[];
 let loggedEvents=0,coreCalls=0;const scores=[0,0],phases=[];
 const machine={shotClock:7,transition(x){phases.push(x)}},homeCourt={},rotation=()=>1;
 const markOutcome=()=>{},log=()=>{},shortName=p=>p.name,addScore=(s,n)=>scores[s]+=n,reboundNarrative=()=>'',homeCourtEvent=()=>{},turnoverText=()=>'',replaceDisqualified=()=>{},recordRotationFoul=()=>{},leagueRules=()=>({foulLimit:6});
 const homeCourtProbability=x=>x,leagueProbability=x=>x;Math.random=()=>ftRolls.shift()??0;
 const selectBasketballRebound=()=>({offensive:rebounds.shift(),player:p});
 ${ft}\n${board}\n${to}
 function possessionCore(side){coreCalls++;assert.equal(machine.shotClock,14);assert.equal(extraBoards,coreCalls);
  if(follow==='made'){addScore(side,2);${madeHook}}
  else if(follow==='DREB')finishRebound(side);
  else if(follow==='steal')recordTurnover(side,'lostBall',p,p);
  else if(follow==='uncredited')recordTurnover(side,'badPassOut',p);
  else if(follow==='shotClock')recordTurnover(side,'shotClock',p);
  else if(follow==='foulFT')freeThrows(side,p,2);
 }
 function root(side){if(technical||retain){terminalNextSide=1-side;freeThrows(1-side,p,2,technical,retain);}
 else {const guiltySide=guilty,recipient=p,bonus=true;function subtree(){${crossHook}}subtree();}
 ${returnHook}}
 const override=root(0),next=override??1;
 assert.equal(next,expect);assert.equal(coreCalls,expectedCores);
 if(technical||retain)assert.equal(terminalNextSide,1,'retained FT must not overwrite ownership');
 globalThis.result={override,next,coreCalls,extraBoards,transitionTeam,phases,score:scores};
 `,c);
 tests.push({name,status:'PASS',...JSON.parse(JSON.stringify(c.result))});
}
scenario('opponent final ordinary FT made',{expect:0});
scenario('opponent final FT miss + DREB',{ftRolls:[0,.99],rebounds:[false],expect:0});
for(const follow of ['made','DREB','steal','uncredited','shotClock','foulFT'])scenario('opponent final FT miss + OREB → '+follow,{ftRolls:[0,.99,0,0],rebounds:[true,false],follow,expect:0,expectedCores:1});
scenario('same-side ordinary FT made',{guilty:1,expect:1});
scenario('same-side ordinary FT miss + DREB',{guilty:1,ftRolls:[0,.99],rebounds:[false],expect:1});
scenario('technical FT retains existing owner',{technical:true,retain:true,ftRolls:[0,.99],expect:1});
scenario('nontechnical retained FT preserves existing owner',{retain:true,ftRolls:[0,.99],expect:1});
scenario('made technical FT preserves existing owner',{technical:true,retain:true,expect:1});
scenario('made nontechnical retained FT preserves existing owner',{retain:true,expect:1});
// Exercise the unmodified scheduling/time arithmetic with both first/second-slot
// overrides, continuation across minutes, then the explicit period boundary.
for(const first of [0,1]){
 const c={assert,first};vm.createContext(c);
 vm.runInContext(`let dispatchSide=null,transitionTeam=null,firstSide=first,openingTip={},tipReceiver=null,clockWindow=null,elapsedSeconds=0,atPeriodEnd=false,gameProgress=0;
 const rows=new Map(),rotationEvents=[],clubs=[{},{}],gameRotations=[{court:[]},{court:[]}],scores=[0,0],slots=[];let overrides=[first,null,null,1-first,null,null];
 const restQuarter=()=>{},gameBoundary=m=>m%12===0,log=()=>{},simulationClock=()=>({period:'Q'}),gameMinutes=()=>48,refreshGameRotation=()=>{},accrueRotationMinutes=()=>{};
 function possession(side){slots.push({side,...clockWindow});return overrides.shift()??null;}
 ${minute}
 runMinute(0,2);runMinute(1,1);const beforeBoundary=slots.map(x=>x.side);runMinute(12,1);
 assert.deepEqual(beforeBoundary,[first,first,1-first,first,1-first,first]);
 assert.equal(slots[6].side,first);assert.equal(slots.length,8);
 assert.deepEqual(slots.map(x=>[x.start,x.end]),[[0,15],[15,30],[30,45],[45,60],[60,90],[90,120],[720,750],[750,780]]);
 globalThis.result=slots;`,c);
 tests.push({name:'dispatcher reanchor / period reset, opening side '+first,status:'PASS',slots:JSON.parse(JSON.stringify(c.result))});
}
fs.writeFileSync('dev/ownership-controls.json',JSON.stringify(tests,null,2));console.log(JSON.stringify({tests:tests.length,result:'PASS',testsDetail:tests},null,2));
