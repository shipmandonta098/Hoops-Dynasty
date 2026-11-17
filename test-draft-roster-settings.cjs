const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:1,strictDOM:false}),context=l.context;context.assert=assert;

context.FormData=class{constructor(form){return Object.entries(form)}};
(async()=>{await l.run(`(async()=>{
render=()=>{};save=async()=>true;ownerCanManage=()=>true;toast=()=>{};ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};showResult=()=>{};
state=validateCareerData(fresh(defaultTeams().slice(0,6),2));assert.equal(rosterMinimum(),8);
setupDraft=makeDraft();setupDraft.gmName='Test';const candidate=buildSetupCareer(setupDraft);assert(candidate.teams.every(t=>t.roster.length===14));assert.equal(candidate.leagueSettings.rosterMax,15);validateCareerData(candidate);
state=validateCareerData(fresh(defaultTeams().slice(0,6),2));Object.assign(state.leagueSettings,{draftRounds:5,prospectAgeMin:18,prospectAgeMax:18,lotteryMode:'snake',tradePickSeasons:3});
assert.equal(tradePicks(team()).length,15);state.leagueSettings.tradePickSeasons=0;assert.equal(tradePicks(team()).length,0);state.leagueSettings.tradePickSeasons=3;
let d=ensureDraft();assert.equal(d.rounds,5);assert(d.prospects.every(p=>p.age===18));state=validateCareerData(state);d=state.draft;assert.equal(d.rounds,5);
await sim(seasonLength());await playoffs();await runDraftLottery();d=state.draft;assert.equal(draftOrder(d).length,30);assert.deepEqual(draftOrder(d).slice(6,12),[...d.order].reverse());await autoDraft();assert.equal(d.picks.length,30);assert.equal(d.picks[29].round,5);assert(draftComplete());state=validateCareerData(state);assert.equal(state.draft.picks.length,30);
for(const mode of ['weighted','equal','custom','record','random']){state=validateCareerData(fresh(defaultTeams().slice(0,6),2));state.leagueSettings.lotteryMode=mode;state.leagueSettings.lotterySelections=1;await sim(seasonLength());await playoffs();await runDraftLottery();assert.equal(state.draft.order.length,6);assert.equal(new Set(state.draft.order).size,6);validateCareerData(state);}
assert.throws(()=>parseLotteryChances('0,0'));assert.throws(()=>parseLotteryChances('-1,2'));assert.equal(parseLotteryChances('10,20,0')[1],20);
state=validateCareerData(fresh(defaultTeams().slice(0,6),2));d=ensureDraft();delete d.rounds;delete d.poolSize;state.leagueSettings.draftRounds=5;assert.equal(draftRoundCount(d),2);state=validateCareerData(state);assert.equal(state.draft.rounds,2);
console.log('PASS: roster defaults and legacy saves, multi-round draft and reload, prospect ages, six draft types, snake order, lottery weights, trading horizon.');
})()`);})().catch(e=>{console.error(e);process.exitCode=1});
