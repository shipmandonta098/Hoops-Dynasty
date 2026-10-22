const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});
vm.runInContext(`
state=fresh(defaultTeams().slice(0,4),2);render=()=>{};
state.teams.forEach(t=>coachFor(t));const before=JSON.stringify(state);
for(const key of ['ovr','pot','age','demand'])for(const direction of [1,-1]){faSortUI={key,direction};const rows=faMarketRows(state.free);assert(rows.every((r,i)=>!i||(r[key]-rows[i-1][key])*direction>=0))}
assert.equal(JSON.stringify(state),before);
state.freeAgency={year:state.year,phase:'market',players:state.free.map(p=>({id:p.id,former:null,rfa:false,demand:10})),offers:[{id:state.free[0].id,team:0,salary:10,years:2,minutes:24},{id:state.free[1].id,team:0,salary:8,years:4,minutes:20}],pending:[],mle:{},log:[]};
faSortUI={key:'contract',direction:-1};assert.equal(faMarketRows(state.free)[0].contract,32);faSortUI.direction=1;assert.equal(faMarketRows(state.free)[0].contract,20);assert.equal(faMarketRows(state.free).at(-1).contract,null);
faSortUI={key:'interest',direction:-1};assert(faMarketRows(state.free).every(r=>Number.isFinite(r.interest)));assert(freeAgencyView().includes('Sort by'));assert(freeAgencyView().includes('Withdraw'));
`,context);console.log('PASS: ascending/descending stats, contract totals, nulls last, interest, read-only sorting and market actions');
