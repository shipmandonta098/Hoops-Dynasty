const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
state=fresh(defaultTeams().slice(0,6),2);render=()=>{};save=async()=>true;ownerCanManage=()=>true;closeTitleModal=()=>{};
const p=state.free[0];team().roster.forEach(p=>p.salary=1);const quote=freeAgentQuote(p);
assert(roster(true).includes('negotiateFreeAgent('));
let markup='';titleModal=(title,body)=>{markup=title+body};negotiateFreeAgent(p.id);assert(markup.includes('Annual salary'));assert(markup.includes('Seasons'));
assert(inSeasonOfferError(p,quote-0.1,2).includes('declined'));assert(inSeasonOfferError(p,salaryCap(),2).includes('cap'));assert.equal(inSeasonOfferError(p,quote,2),'');
await submitInSeasonOffer({preventDefault(){},target:{salary:quote,years:2}},p.id);
assert(team().roster.some(q=>q.id===p.id));assert(!state.free.some(q=>q.id===p.id));assert.equal(p.contractThrough,state.year+1);assert.equal(p.salary,quote);
const next=state.free[0],before=team().roster.length;save=async()=>false;
await submitInSeasonOffer({preventDefault(){},target:{salary:freeAgentQuote(next),years:1}},next.id);
assert.equal(team().roster.length,before);assert(state.free.some(q=>q.id===next.id));assert.equal(faBusy,false);
})()`,context);console.log('Negotiation form, rejection, cap enforcement, signing and save rollback passed.');})().catch(e=>{console.error(e);process.exitCode=1});
