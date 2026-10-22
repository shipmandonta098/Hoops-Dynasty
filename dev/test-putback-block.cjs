const fs=require('node:fs'),assert=require('node:assert/strict'),cp=require('node:child_process'),{loadLeague}=require('./load-league.cjs'),{candidate}=require('./putback-block-candidate.cjs');
const original=cp.execFileSync('git',['show','73183bb3b14d9b6852e563420a296de6da485057:dist/attributes.js'],{encoding:'utf8'}),changed=process.argv.includes('--production')?fs.readFileSync('dist/attributes.js','utf8'):candidate('attributes.js',original);
const sources=[original,changed],runtimes=sources.map(source=>loadLeague({strictDOM:false,sourceTransform:(n,s)=>n==='attributes.js'?source:s}));
const helper=changed.slice(changed.indexOf(' function immediatePutbackLayupBlocked('),changed.indexOf(' function possessionCore(',changed.indexOf(' function immediatePutbackLayupBlocked(')));
assert(helper.includes('const blockChance='));
const blockExpr=s=>s.slice(s.indexOf(" const blockChance=kind==='inside'"),s.indexOf('if(blocked){dr.blk++;'));
assert.equal(blockExpr(original),blockExpr(changed),'ordinary primary block code is byte-identical');
const results=[];
for(let variant=0;variant<2;variant++){
 const r=runtimes[variant],s=sources[variant];r.run("Math.random=scheduleRandom(61005);state=validateCareerData(fresh(defaultTeams(),82,2026,'male',15));");
 const branch=s.slice(s.indexOf(" if(offense.roster.includes(rebounder)&&"),s.indexOf(' else if(offense.roster.includes(rebounder))'));
 const finish=s.slice(s.indexOf(' function finishRebound('),s.indexOf(' function possession(side)'));
 r.run(`globalThis.controlPut=function(rolls,offensive=false,blockRating=75,skipSelection=false){
 const rebounder=copy(state.teams[0].roster[0]),d=copy(state.teams[1].roster[0]);
 rebounder.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));d.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));d.attributes.sbl=blockRating;
 rebounder.tendencies.putback=skipSelection?0:100;rebounder.tendencies.standingDunk=100;d.tendencies.block=50;
 const side=0,offense={roster:[rebounder]},clubs=[offense,{roster:[d]}],rotation=()=>1,homeCourt=null,rows=new Map([rebounder,d].map(p=>[p.id,{fga:0,fgm:0,pts:0,reb:0,orb:0,drb:0,blk:0}]));
 const dr=rows.get(d.id),scores=[0,0],gameRotations=[{stamina:new Map([[rebounder.id,100]])}],minuteMap=new Map([[rebounder.id,30]]),moraleModifiers=new Map([[rebounder.id,0]]);
 let terminalNextSide=null,transitionTeam=null,extraBoards=1,draws=0,recursive=0;const logs=[],outcomes=[],recursion=[];
 const machine=createPossessionMachine();machine.transition('decision');machine.transition('shot');machine.transition('miss');machine.transition('rebound');
 const y=k=>effectiveAttribute(d,k,0,false,0),trackShot=(shot,made)=>outcomes.push({shot,made}),addScore=(side,n)=>scores[side]+=n,narrate=(side,type,values)=>logs.push({side,type,...values}),log=()=>{};
 const selectBasketballRebound=()=>({offensive,player:offensive?rebounder:d});
 function possessionCore(side){recursive++;recursion.push({side,clock:machine.shotClock,extraBoards});}
 ${helper}
 ${finish}
 const saved=Math.random;Math.random=()=>{const v=rolls[draws++];if(v===undefined)throw Error('Unexpected control RNG call '+draws);return v};
 try {${branch}}
 finally {Math.random=saved;}
 return {rows:[...rows.values()],scores,draws,recursive,recursion,terminalNextSide,transitionTeam,logs,outcomes,phase:machine.phase};
 };
 globalThis.controlPrimary=function(rolls,blockRating=75){const p=copy(state.teams[0].roster[0]),d=copy(state.teams[1].roster[0]);p.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));d.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));d.attributes.sbl=blockRating;d.tendencies.block=50;const kind='inside',shot={blockMultiplier:1},buildMatch={recovery:0},x=k=>effectiveAttribute(p,k,0,true,0),y=k=>effectiveAttribute(d,k,0,false,0);let count=0;const saved=Math.random;Math.random=()=>rolls[count++];try{${blockExpr(s)}return {blocked,blockChance,count}}finally{Math.random=saved}};
 globalThis.blockCurve=function(blockRating){const rebounder=copy(state.teams[0].roster[0]),d=copy(state.teams[1].roster[0]);rebounder.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));d.attributes=Object.fromEntries(ATTRIBUTE_KEYS.map(k=>[k,75]));d.attributes.sbl=blockRating;d.tendencies.block=50;const side=0,gameRotations=[{stamina:new Map([[rebounder.id,100]])}],minuteMap=new Map([[rebounder.id,30]]),moraleModifiers=new Map([[rebounder.id,0]]),y=k=>effectiveAttribute(d,k,0,false,0);
 ${helper}
 const tendencyValue=tendency(d,'block'),conditional=Math.min(.6,Math.max(.005,.025+(y('sbl')+y('hgt')+y('jmp')-effectiveAttribute(rebounder,'stre',0,true,0)-effectiveAttribute(rebounder,'jmp',0,true,0))*.0003)*2*(moraleMatchScore(d)>=90?1.15:1));
 const saved=Math.random;Math.random=scheduleRandom(77331);let blocks=0;try{for(let i=0;i<10000;i++)blocks+=+immediatePutbackLayupBlocked(rebounder,d,side,y)}finally{Math.random=saved;}return{blockRating,tendency:tendencyValue,conditional,theoretical:tendencyValue*conditional,trials:10000,blocks,observed:blocks/10000};};`);
}
const j=(r,c)=>JSON.parse(JSON.stringify(r.run(c))),[a,b]=runtimes;
for(const offensive of [false,true]){const base=j(a,`controlPut([0,.999,0],${offensive})`),test=j(b,`controlPut([0,.999,0,0],${offensive})`);assert.equal(base.rows[1].blk,0);assert.equal(base.rows[0].fgm,1);assert.equal(test.rows[1].blk,1);assert.equal(test.rows[0].fgm,0);assert.equal(test.rows[0].fga,1);assert.equal(test.logs[0].type,'block');
 if(offensive){assert.deepEqual(test.recursion,[{side:0,clock:14,extraBoards:2}]);assert.equal(test.rows[0].orb,1);assert.equal(test.transitionTeam,null)}else{assert.equal(test.rows[1].drb,1);assert.equal(test.transitionTeam,1);assert.equal(test.terminalNextSide,1);assert.equal(test.recursive,0)}
 results.push({name:'matched layup: baseline cannot block; candidate blocks → '+(offensive?'OREB / existing recursion':'DREB / ownership and token'),status:'PASS',baseline:base,candidate:test});}
for(const offensive of [false,true])for(const rolls of [[0,0,0],[0,0,.999,0]]){const x=j(a,`controlPut(${JSON.stringify(rolls)},${offensive})`),y=j(b,`controlPut(${JSON.stringify(rolls)},${offensive})`);assert.deepEqual(x,y);results.push({name:'putback dunk unchanged: '+(rolls.length===3?'blocked':'made')+' / offensive board '+offensive,status:'PASS',result:y})}
for(const rating of [60,75,90])for(const rolls of [[0,0],[.999],[0,.999]])assert.deepEqual(j(a,`controlPrimary(${JSON.stringify(rolls)},${rating})`),j(b,`controlPrimary(${JSON.stringify(rolls)},${rating})`));
results.push({name:'primary layup block formula and decisions: 9 matched controls',status:'PASS'});
assert.deepEqual(j(a,'controlPut([.999],false,75,true)'),j(b,'controlPut([.999],false,75,true)'));results.push({name:'putback selection can decline before any new block roll',status:'PASS'});
for(let seed=1;seed<=100;seed++){const code=`Math.random=scheduleRandom(${seed});selectBasketballRebound(state.teams[0],state.teams[1],(t,p)=>t.roster.indexOf(p)<5,${seed%2===0})`;assert.deepEqual(j(a,code),j(b,code));}results.push({name:'100 matched actual rebound draws, including OREB disabled',status:'PASS'});
const curves=[60,75,90].map(n=>j(b,`blockCurve(${n})`));assert(curves.every((c,i)=>i===0||c.blocks>curves[i-1].blocks));
// No immediate putback branch: a whole normal game + complete postgame state
// must remain identical, proving ordinary shots are not routed through the helper.
for(const r of runtimes)r.run("for(const t of state.teams)for(const p of t.roster)p.tendencies.putback=0;Math.random=scheduleRandom(100049);");
const ga=j(a,'play(0,1)'),gb=j(b,'play(0,1)');assert.deepEqual(ga,gb);assert.equal(a.run('JSON.stringify(state)'),b.run('JSON.stringify(state)'));
results.push({name:'whole game with putback selection disabled: exact result + state parity',status:'PASS'});
const report={result:'PASS',mode:process.argv.includes('--production')?'production':'candidate',controls:results,defensiveDifferentiation:curves};fs.writeFileSync('dev/putback-block-controls'+(process.argv.includes('--production')?'-production':'')+'.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
