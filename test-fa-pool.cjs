// Replacement-level free-agent pools for new leagues; existing saves untouched; CPU offseason
// upgrade bids still reach top free agents when a roster is full (swap with dead-cap release).
// League-wide distribution and one-season unsigned counts: node dev/fa-pool/check.cjs
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:12,strictDOM:false});l.setRandomSeed(12);const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
// 1. Generator shape over many pools: ~85% 58–70, ~15% 71–74, at most one 75+ (75–78) per pool, ages mixed, potential by age.
const g=run(`(()=>{const all=[],per=[];for(let k=0;k<400;k++){const s=replacementFreeAgentSpecs(30);all.push(...s);per.push(s.filter(x=>x.ovr>=75).length)}return {all,per}})()`);
const share=(lo,hi)=>g.all.filter(x=>x.ovr>=lo&&x.ovr<=hi).length/g.all.length;
assert(share(58,70)>.80&&share(58,70)<.90,'58–70 share '+share(58,70));assert(share(71,74)>.10&&share(71,74)<.18,'71–74 share '+share(71,74));
assert.equal(g.all.filter(x=>x.ovr<58||x.ovr>78).length,0);assert(Math.max(...g.per)<=1,'never more than one 75+ per pool');
const withStar=g.per.filter(n=>n).length/g.per.length;assert(withStar>.5&&withStar<.8,'a 75+ player is a common but not guaranteed exception: '+withStar);
assert(g.all.every(x=>x.pot>=x.ovr&&x.pot<=99));assert(g.all.filter(x=>x.age>=32).every(x=>x.pot===x.ovr),'veterans 32+ have no growth');
assert(g.all.filter(x=>x.age<=24).some(x=>x.pot-x.ovr>=10),'some young players can grow');
const young=g.all.filter(x=>x.age<=24).length/g.all.length,vets=g.all.filter(x=>x.age>=30).length/g.all.length;assert(young>.35&&vets>.25,'ages mixed');
// 2. New leagues use it; generated ratings and attributes stay consistent; rosters are unchanged by it.
for(const [gender,year] of [['male',2025],['female',2024],['male',1990]]){const fa=run(`(()=>{const s=fresh(defaultTeams(),2,${year},'${gender}',14);return s.free.map(p=>({ovr:p.ovr,age:p.age,pot:p.pot,attrs:!!p.attributes}))})()`);
 assert.equal(fa.length,30);assert(fa.every(p=>p.ovr>=58&&p.ovr<=78&&p.pot>=p.ovr&&p.attrs),gender+' '+year);assert(fa.filter(p=>p.ovr>=75).length<=1)}
// 3. Existing saves are not regenerated: loading keeps the saved free agents exactly.
run(`state=fresh(defaultTeams(),2,2025,'male',14);state.gmName='Saved';state.free=state.free.map(p=>({...p,ovr:88,pot:90}));`);
const saved=run('JSON.stringify(state.free.map(p=>[p.id,p.ovr,p.pot,p.age]))');assert.equal(run('JSON.stringify(validateCareerData(JSON.parse(JSON.stringify(state))).free.map(p=>[p.id,p.ovr,p.pot,p.age]))'),saved);
// 4. Offseason: a CPU team at the roster maximum bids on a top free agent by naming its weakest player as a swap;
//    signing releases that player under releasePlayer's dead-cap rules and keeps the roster legal.
const r=run(`(()=>{render=()=>{};save=async()=>true;state=fresh(defaultTeams(),2,2025,'male',14);state.gmName='FA';state.day=state.schedule.length;state.champion=0;
 const t=state.teams.find(t=>t.id!==controlledTeamId());while(t.roster.length<rosterMaximum()){const p=player(900000+t.roster.length,t.roster.length,0,'male','initial',null,{ovr:60,age:27,pot:60});p.salary=1;p.contractThrough=state.year+1;t.roster.push(p)}
 state.teams.filter(x=>x!==t).forEach(x=>x.roster.forEach(p=>p.ovr=Math.min(p.ovr,60)));
 const star=player(990001,0,0,'male','initial',null,{ovr:84,age:27,pot:86});star.salary=5;state.free=[star];
 state.freeAgency={year:state.year,phase:'market',round:1,players:[{id:star.id,former:null,rfa:false,demand:5}],offers:[],pending:[],log:[],mle:{}};
 const weakest=[...t.roster].sort((a,b)=>a.ovr-b.ovr||tradePlayerValue(a,t)-tradePlayerValue(b,t)||a.id-b.id)[0],deadBefore=(financeFor(t).dead||[]).length;
 faCPUOffers();const o=state.freeAgency.offers.find(o=>o.team===t.id&&o.id===star.id);if(!o)return {offer:null,check:faOfferCheck(star,t,{id:star.id,team:t.id,salary:5,years:2,minutes:32,route:'cap',swap:weakest.id})};
 const saveOk=(()=>{try{const back=readFreeAgency(JSON.parse(JSON.stringify(state.freeAgency)),m=>{throw Error(m)},state.teams.length,state.year);return back.offers.some(x=>x.swap===o.swap&&x.upgrade===true)}catch(e){return e.message}})();
 const signed=faSign(star,o);return {offer:o,swapIsWeakest:o.swap===weakest.id,saveOk,signed,size:t.roster.length,max:rosterMaximum(),hasStar:t.roster.some(p=>p.id===star.id),weakestFree:state.free.some(p=>p.id===weakest.id),dead:(financeFor(t).dead||[]).length-deadBefore,news:state.news.some(n=>/releases .* to make room for/.test(n))}})()`);
assert(r.offer,'full-roster CPU team bids on a top free agent: '+JSON.stringify(r.check));
assert(r.offer.upgrade&&r.swapIsWeakest);assert.equal(r.saveOk,true,'offer with swap survives save/load');
assert(r.signed&&r.hasStar&&r.weakestFree);assert.equal(r.size,r.max);assert.equal(r.dead,1,'released salary recorded as dead cap');assert(r.news);
// A swap offer cannot free the same roster spot twice, and an offer without a swap at the maximum is refused.
assert.equal(run(`faOfferCheck(state.free[0]||player(990002,0,0,'male','initial',null,{ovr:80,age:27,pot:80}),state.teams.find(t=>t.roster.length>=rosterMaximum()&&t.id!==controlledTeamId()),{id:1,team:0,salary:2,years:2,minutes:20,route:'cap'})`)!=='', true);
assert.throws(()=>run(`readFreeAgency({...JSON.parse(JSON.stringify(state.freeAgency)),offers:[{id:1,team:0,salary:1,years:1,minutes:1,route:'cap',swap:'x'}]},m=>{throw Error(m)},state.teams.length,state.year)`),/contract offer/);
console.log('FA pool: replacement-level generation, potential by age, existing saves untouched, and full-roster CPU upgrade bids with swap release passed.');
