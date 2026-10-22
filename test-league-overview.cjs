const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

vm.runInContext(`
const a={gp:1,pts:120,fgm:50,fga:100,tpm:10,tpa:30,ftm:10,fta:12,orb:10,drb:30,reb:40,ast:25,tov:10,stl:4,blk:3,pf:10,poss:100,defPoss:100,mp:48};const b={...a,pts:40,fgm:10,fga:10,poss:80,defPoss:80};
const r=leagueAggregate([a,b]);assert.equal(r.games,1);assert.equal(r.teamGames,2);assert.equal(r.pts,160);assert.equal(r.fgp,60/110);assert.equal(r.pace,90);assert.equal(r.ortg,160/180*100);
assert.equal(leagueAggregate([a,{...b,fgm:null}]).fgp,null);assert.equal(leagueAggregate([]).games,0);assert.equal(leagueAggregate([]).pts,null);
state=fresh(defaultTeams().slice(0,4),2);render=()=>{};assert(leagueOverviewView().includes('No recorded games'));leagueOverviewChange('competition','preseason');assert(leagueOverviewView().includes('Preseason games coming soon'));
state.teamStatsArchive=[{year:2025,rows:{regular:{all:[a,b]},playoffs:{all:[]}}}];leagueOverviewChange('season','2025');leagueOverviewChange('competition','regular');const before=JSON.stringify(state);assert(leagueOverviewView().includes('54.5%'));assert.equal(JSON.stringify(state),before);
`,context);console.log('League totals, weighted shooting, per-game denominators, pace, missing data and archived filters passed.');
