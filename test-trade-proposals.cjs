const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:'',scrollTop:0};
let seed=4451;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
const context={console,Math:math,setTimeout,clearTimeout,localStorage:{getItem(){return null},setItem(){}},document:{getElementById(){return element},querySelector(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

vm.runInContext(`
state=validateCareerData(fresh(defaultTeams().slice(0,6),2,2026,'male',14));render=()=>{};ownerCanManage=()=>true;
for(const t of state.teams)for(const p of t.roster){p.ovr=75;p.pot=80;p.age=27;p.salary=5;p.contractThrough=state.year+1;p.tradeWait=0;}
const a=team(),b=state.teams[1],p=a.roster[0],q=b.roster[0];
// Hard-rule rejection must happen before any asset valuation.
const valueBefore=tradePlayerValue;tradePlayerValue=()=>{throw Error('Should not value illegal trade')};p.tradeWait=1;assert(!tradeProposalAssessment(a,b,[p],[q]).accepted);tradePlayerValue=valueBefore;p.tradeWait=0;
const human=tradeSideAssessment(b,[q],[p],[],[],0,{human:true}),cpu=tradeSideAssessment(b,[q],[p],[],[],0,{human:false});assert.equal(human.threshold,1.15);assert.equal(cpu.threshold,1.05);assert(human.required>cpu.required);
const reb={...b,w:0,l:20},win={...b,w:20,l:0};assert.equal(tradeMindset(reb),'Rebuilding');assert.equal(tradeMindset(win),'Win-Now');assert.equal(tradeMindset(b),'Neutral');
const young={...q,age:21,pot:94,ovr:76},old={...q,age:34,pot:76,ovr:76};assert(tradePlayerValue(young,reb)>tradePlayerValue(old,reb));const star={...q,ovr:91,pot:92,age:32,salary:65,contractThrough:state.year+3};assert(tradePlayerValue(star,win)>tradePlayerValue(star,reb));
const blank={...b,roster:b.roster.filter(p=>p.pos!=='C')},crowded={...b,roster:[...b.roster,...[1,2,3].map(i=>({...q,id:9000+i,pos:'C',ovr:85}))]},center={...q,id:99999,pos:'C',ovr:80};assert(tradePlayerValue(center,blank)>tradePlayerValue(center,crowded));
state.draft={year:state.year,order:state.teams.map(t=>t.id),picks:[]};const top={year:state.year,origin:0,round:1},late={year:state.year,origin:5,round:1};assert(tradePickProjection(top).locked);assert(tradePickValue(top,b)>tradePickValue(late,b)*3);assert(tradePickValue({...top,year:state.year+3},b)<tradePickValue({...top,year:state.year+1},b));state.draft=null;
const bundle=tradeSideAssessment(b,[{...q,ovr:95,pot:95}],[1,2,3,4].map(i=>({...p,id:9990+i,ovr:80,pot:80})));assert(bundle.packagePenalty>0);assert(!bundle.accepted);
// Counteroffer must genuinely bridge the buffer and satisfy pick rules.
let close;for(let rating=70;rating<=80;rating++){p.ovr=rating;const r=tradeProposalAssessment(a,b,[p],[q],0,[],[],{suggest:true});if(r.suggestedPick){close=r;break}}assert(close);assert(tradeProposalAssessment(a,b,[p],[q],0,[close.suggestedPick],[],{human:true}).accepted);p.ovr=75;
const now=medicalStamp();lockTradedPlayer(p);assert.equal(p.tradeLockedUntil,now+30);assert.equal(tradeLockDays(p),30);assert(tradeLegality(a,b,[p],[q]).some(x=>x.includes('30 calendar days')));const imported=validateCareerData(copy(state));assert.equal(imported.teams[0].roster.find(x=>x.id===p.id).tradeLockedUntil,now+30);state.day=29;assert.equal(tradeLockDays(p),1);state.day=30;assert.equal(tradeLockDays(p),0);state.day=0;state.year++;assert.equal(tradeLockDays(p),0);state.year--;
const broken=copy(state);broken.teams[0].roster[0].tradeLockedUntil='tomorrow';assert.throws(()=>validateCareerData(broken),/calendar trade lock/);delete p.tradeLockedUntil;
// Historical calendars must not treat an absent lock as January 1, 1970.
const modernYear=state.year;state.year=1960;assert.equal(tradeLockDays(p),0);assert.equal(tradeRestrictionText(p),'');lockTradedPlayer(p);assert.equal(tradeLockDays(p),30);assert(p.tradeLockedUntil<0);state.day=30;assert.equal(tradeLockDays(p),0);state.day=0;state.year=modernYear;delete p.tradeLockedUntil;
// Salary constraints include existing dead money and provide specific feedback.
const cap=leagueRules().salaryCapType;leagueRules().salaryCapType='hard';financeFor(b).dead.push({id:987,name:'Waived',salary:200,through:state.year});const invalid=tradeProposalAssessment(a,b,[p],[q]);assert(!invalid.accepted);assert(invalid.feedback.includes('finance department'));leagueRules().salaryCapType=cap;
`,context);
console.log('PASS: legality-first evaluation, human/AI buffers, mindset/age/fit/contract values, projected slots and future discount, bundle penalty, verified sweeteners, 30-day lock/expiry/rollover/persistence, salary feedback.');
