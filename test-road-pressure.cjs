const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});


vm.runInContext(`
state=validateCareerData(fresh());const away=state.teams[1];for(const p of away.roster){p.age=20;p.moraleAdjustment=-20}
activeGameAtmosphere={fillRate:1,fanEnergy:3,fanSentimentScore:20};const young=createHomeCourt('Regular season',away);for(const p of away.roster){p.age=34;p.moraleAdjustment=20}const veteran=createHomeCourt('Regular season',away);assert(veteran.roadShot<young.roadShot);assert(veteran.roadFoul<young.roadFoul);assert(veteran.roadTurnover<young.roadTurnover);
activeGameAtmosphere={fillRate:.2,fanEnergy:1,fanSentimentScore:-20};const quiet=createHomeCourt('Regular season',away);assert(quiet.roadShot<veteran.roadShot);assert(quiet.strength<veteran.strength);assert.equal(roadTurnoverPenalty(young,0),0);assert(roadTurnoverPenalty(young,1)>0);assert(young.roadShot<=.03);assert(young.roadFoul<=.1);assert.equal(createHomeCourt('Exhibition',away).roadShot,0);leagueRules().homeAdvantage=0;assert.equal(createHomeCourt('Regular season',away).roadTurnover,0);leagueRules().homeAdvantage=.8;activeGameAtmosphere=null;
const attrs=JSON.stringify(away.roster.map(p=>p.attributes));const game=simulateAttributeGame(0,1);assert.equal(activeGameAtmosphere,null);assert.equal(JSON.stringify(away.roster.map(p=>p.attributes)),attrs);assert(game.playByPlay.some(line=>line.includes(Math.round(game.gameAtmosphere.fillRate*100)+'% attendance. Road pressure')));for(const [id,score]of [[0,game.sa],[1,game.sb]])assert.equal(game.box.filter(r=>r.team===state.teams[id].abbr).reduce((n,r)=>n+r.pts,0),score);
console.log('PASS: crowd and sentiment scaling, veteran/focus/chemistry mitigation, bounded penalties, neutral and disabled settings, shared attendance snapshot, temporary ratings and box scores.');
`,context);
