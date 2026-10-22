const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={focus(){},style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=validateCareerData(fresh());renderPlayerProfile=()=>{};
const p=team().roster[0],ctx={p,club:team()},g={playerId:p.id,team:team().abbr,played:true,mp:24,pts:16,reb:8,ast:4,fgm:6,fga:12,tpm:2,tpa:4,ftm:2,fta:2,stl:2,blk:1,tov:2,orb:2,drb:6,pf:3};
let row=aggregateProfileStats(p,[g],g.team);
assert.equal(profileStatCell(row,'pts','per36'),'24.0');assert.equal(profileStatCell(row,'reb','per36'),'12.0');assert.equal(profileStatCell(row,'mp','per36'),'24.0');assert.equal(profileStatCell(row,'fgpct','per36'),'.500');
row=aggregateProfileStats(p,[g,{...g,mp:12,pts:8}],g.team);assert.equal(profileStatCell(row,'pts','per36'),'24.0');
for(const mp of [0,undefined]){row=aggregateProfileStats(p,[{...g,mp}],g.team);assert.equal(profileStatCell(row,'pts','per36'),'—')}
row=aggregateProfileStats(p,[g,{...g,mp:undefined}],g.team);assert.equal(profileStatCell(row,'pts','per36'),'—');
state.history=[{a:0,b:1,day:1,stage:'Regular season',box:[g]},{a:0,b:1,day:2,stage:'Playoffs',box:[{...g,team:state.teams[1].abbr,mp:12,pts:12}]}];
selectProfileStats('view','per36');let html=playerStats(ctx);assert(html.includes('Per 36 Minutes'));assert(!html.includes('SCORING BY GAME'));assert(html.includes('TOT'));assert(html.includes('36.0'));assert.equal((html.match(/<table>/g)||[]).length,1);
selectProfileStats('stage','regular');html=playerStats(ctx);assert(html.includes('24.0'));assert(!html.includes('TOT'));selectProfileStats('stage','playoffs');html=playerStats(ctx);assert(html.includes('36.0'));assert(!html.includes('TOT'));
selectProfileStats('view','advanced');html=playerStats(ctx);assert(html.includes('True shooting percentage'));assert(!html.includes('single-game season high'));
selectProfileStats('view','highs');html=playerStats(ctx);assert(html.includes('showProfileHighGame('));assert(!html.includes('True shooting percentage'));
selectProfileStats('view','traditional');selectProfileStats('mode','totals');html=playerStats(ctx);assert(html.includes('Traditional · Totals'));assert(html.includes('id="stats-mode"'));selectProfileStats('view','per36');html=playerStats(ctx);assert(!html.includes('id="stats-mode"'));assert.equal(profileStatsMode,'totals');
assert.equal(new Set(PROFILE_PER36_COLUMNS.map(c=>c[0])).size,PROFILE_PER36_COLUMNS.length);
console.log('PASS: per-36 weighting, unchanged percentages, zero/missing minutes, competition and team splits, single selected table, preserved traditional totals and clickable game highs.');
`,context);
