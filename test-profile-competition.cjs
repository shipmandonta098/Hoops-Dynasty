const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});


vm.runInContext(`
state=validateCareerData(fresh());const ctx=playerContext(team().roster[0].id),p=ctx.p;
const row=(pts,played=true)=>({playerId:p.id,team:team().abbr,played,pts,reb:4,ast:3,mp:30,fgm:pts/2,fga:20,tpm:0,tpa:0,ftm:0,fta:0,orb:1,drb:3,stl:1,blk:0,tov:1});
state.history=[{a:0,b:1,stage:'Regular season',day:1,box:[row(12)]},{a:0,b:1,stage:'Championship',day:2,box:[row(28)]},{a:0,b:1,stage:'Championship',day:3,box:[row(0,false)]},{a:0,b:1,stage:'Exhibition',day:4,box:[row(50)]}];
assert.equal(profileStatsStage,'regular');for(const [stage,points,label] of [['regular',12,'Regular Season'],['playoffs',28,'Playoffs']]){profileStatsStage=stage;assert.equal(selectedProfileGames(p).length,1);assert.equal(selectedProfileGames(p)[0].pts,points);const summary=statsBeforeTable(ctx);assert(summary.includes('<dt>Points</dt><dd>'+points+'</dd>'));assert(summary.includes('<strong class="pp-value">1</strong>'));assert(summary.includes('<span>'+label+'</span>'));for(const view of ['traditional','advanced','per36','highs']){profileStatsView=view;const html=playerStats(ctx);assert(html.includes('id="stats-stage-'+stage+'" aria-pressed="true"'));assert(!html.includes('Regular season and playoffs combined.'))}}
state.history=[];profileStatsStage='playoffs';assert(statsBeforeTable(ctx).includes('No recorded playoffs appearances'));assert.equal(selectedProfileGames(p).length,0);console.log('PASS: both competitions across all four views, filtered summary/chart/log, DNP and exhibition exclusion, empty postseason.');
`,context);
