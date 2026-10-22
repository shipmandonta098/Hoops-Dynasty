const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const element={style:{},classList:{add(){},remove(){},toggle(){}},addEventListener(){},querySelectorAll(){return []},setAttribute(){},removeAttribute(){},showModal(){},close(){},innerHTML:''};
const context={console,Math:Object.create(Math),setTimeout,clearTimeout,localStorage:{getItem(){return null}},document:{getElementById(){return element},addEventListener(){},querySelectorAll(){return []},documentElement:element,body:element},window:{addEventListener(){},scrollTo(){}},assert};vm.createContext(context);
for(const [,script] of fs.readFileSync('dist/index.html','utf8').matchAll(/<script src="([^"]+)"/g))vm.runInContext(fs.readFileSync('dist/'+script,'utf8').replace('careerReady=initializeCareers();',''),context,{filename:script});

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await vm.runInContext(`(async()=>{
render=()=>{};save=async()=>true;toast=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};showResult=()=>{};
state=validateCareerData(fresh(defaultTeams().slice(0,6),2));
assert.equal(LEAGUE_SETTING_GROUPS.length,14);
for(const [name,fields] of LEAGUE_SETTING_GROUPS){assert(settingsView().includes('<summary>'+name));for(const [key] of fields)assert(settingsView().includes('name="rule_'+key+'"'))}
const fullLeague=state;state=validateCareerData(fresh(defaultTeams(),2));assert.equal(playoffField().length,16);state.leagueSettings.playoffFormat='top4';assert.equal(playoffField().length,4);state=fullLeague;
const v={leagueName:'Rules League',gmName:'Test GM',theme:'dark',gender:'mixed',cap:150,format:2,rule_playbackSpeed:'0.25',rule_injuryFrequency:'0',rule_allStarEnabled:'false',rule_standingsGrouping:'division',rule_pickAndRollRate:'0',rule_capInflation:'5',rule_rookieYears:'4',rule_rookieSalary:'1.5',rule_maxContractYears:'1',rule_lotteryMode:'record'};
await saveGameSettings({preventDefault(){},target:v});assert.equal(state.leagueSettings.playbackSpeed,.25);assert.equal(state.leagueSettings.allStarEnabled,false);
const rules=JSON.stringify(state.leagueSettings);state=validateCareerData(copy(state));assert.equal(JSON.stringify(state.leagueSettings),rules);
const old=copy(state);delete old.leagueSettings;assert.equal(validateCareerData(old).leagueSettings.injuryFrequency,1);
for(const invalid of [{playbackSpeed:3},{injuryFrequency:-1},{capInflation:Infinity},{allStarEnabled:'false'},{maxContractYears:1.5},{unknown:1}])assert.throws(()=>readLeagueSettings(invalid));
assert.throws(()=>readLeagueSettingsForm({rule_allStarEnabled:'invalid'}));
const playerA=team().roster[0];assert.equal(durabilityInjuryChance(playerA,40,20,50),0);
state.leagueSettings.injuryFrequency=2;assert.equal(durabilityInjuryChance(playerA,40,20,50),2*injuryChanceBeforeRules(playerA,40,20,50));
const random=Math.random;Math.random=()=>.5;const originalDays=injuryDetailsBeforeRules(playerA,50,.2).days;state.leagueSettings.injuryDuration=2;assert.equal(durabilityInjuryDetails(playerA,50,.2).days,originalDays*2);Math.random=random;
state.leagueSettings.taxMultiplier=0;assert.equal(financeTax(220,financeFor()),0);state.leagueSettings.taxMultiplier=2;assert.equal(financeTax(220,financeFor()),2*taxBeforeRules(220,financeFor()));
const f=financeFor(),costs=f.season.costs;state.leagueSettings.operatingCosts=2;financePost(f,'operations',3,true);financePost(f,'payroll',3,true);assert.equal(f.season.costs,costs+9);
const contractProbe=state.free[0];state.freeAgency={year:state.year,phase:'market',players:[{id:contractProbe.id,former:null,demand:2}],pending:[],offers:[],mle:{}};assert(faOfferCheck(contractProbe,team(),{salary:2,years:2,minutes:12,route:'minimum'}).includes('1–1'));assert.throws(()=>readLeagueSettingsForm({rule_maxContractYears:'4'}));delete state.freeAgency;
state.leagueSettings.driveTendency=0;assert.equal(tendency(playerA,'drive'),0);
state.leagueSettings.salaryDemand=2;assert.equal(freeAgentQuote(playerA),Math.round(quoteBeforeRules(playerA)*20)/10);
state.teams[0].w=1;assert.throws(()=>readLeagueSettingsForm({rule_playoffFormat:'top4'}));assert.equal(readLeagueSettingsForm({rule_playbackSpeed:'0.5'}).playbackSpeed,.5);
state.leagueSettings.injuryFrequency=0;state.leagueSettings.developmentRate=0;state.leagueSettings.shootingRate=1.1;state.leagueSettings.shootingFouls=.5;
sim(seasonLength());assert(state.history.length>0);assert(state.history.every(g=>!g.playByPlay.some(e=>e.includes('Pick-and-roll'))));assert.equal(state.allStarReport?.length||0,0);
await playoffs();await runDraftLottery();assert(state.draft.order.length===6);assert.throws(()=>readLeagueSettingsForm({rule_lotteryMode:'equal'}));
const prospect=state.draft.prospects[0];draftPickInternal(prospect.id);assert.equal(prospect.salary,9);assert.equal(prospect.contractThrough,state.year+4);assert.throws(()=>readLeagueSettingsForm({rule_rookieYears:'2'}));await autoDraft(false);
const year=state.year,cap=salaryCap();newSeason();assert.equal(state.year,year);assert.equal(salaryCap(),cap);
// A completed market allows the real season rollover; retain every roster for a focused aging check.
state.freeAgency={year,phase:'complete',players:[],offers:[],pending:[],mle:{},log:[],round:1};
const ratings=new Map(state.teams.flatMap(t=>t.roster.map(p=>[p.id,{ovr:p.ovr,age:p.age,attributes:JSON.stringify(p.attributes)}])));
newSeason();assert.equal(state.year,year+1);assert.equal(salaryCap(),157.5);for(const t of state.teams)for(const p of t.roster){const before=ratings.get(p.id);assert.equal(p.ovr,before.ovr);assert.equal(p.age,before.age+1);assert.equal(JSON.stringify(p.attributes),before.attributes)}
const capAfter=salaryCap();newSeason();assert.equal(salaryCap(),capAfter);
state=validateCareerData(copy(state));assert.equal(state.leagueSettings.rookieYears,4);
})()`,context);console.log('League settings: 14 groups, save migration, validation, locks, financial/injury effects, tendencies, draft contracts, game simulation, frozen development and annual cap rollover passed.');})().catch(e=>{console.error(e);process.exitCode=1});
