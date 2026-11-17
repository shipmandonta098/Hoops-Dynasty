const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:1,strictDOM:false}),context=l.context;context.assert=assert;

(async()=>{await l.run(`(async()=>{
state=validateCareerData(fresh(defaultTeams().slice(0,6),1));render=()=>{};save=async()=>true;showResult=()=>{};ownerCanManage=()=>true;ownerTrack=()=>{};ownerDay=()=>{};ownerFinalize=()=>{};
const d=ensureDraft();assert.equal(d.prospects.length,40);assert(draftView().includes('Finish the playoffs'));await runDraftLottery();assert.equal(d.order.length,0);
const oldYear=state.year;newSeason();assert.equal(state.year,oldYear);
await sim(seasonLength());await playoffs();assert.notEqual(state.champion,null);assert.equal(seasonPhaseLabel(),'Draft Lottery');
await runDraftLottery();assert.equal(d.order.length,6);assert.equal(new Set(d.order).size,6);const locked=JSON.stringify(d.order);await runDraftLottery();assert.equal(JSON.stringify(d.order),locked);
state=validateCareerData(copy(state));assert.equal(JSON.stringify(state.draft.order),locked);
await autoDraft(true);assert.equal(draftOrder(state.draft)[state.draft.picks.length],0);const p=state.draft.prospects[0];await selectDraftPlayer(p.id);assert(team().roster.some(x=>x.id===p.id));assert.equal(team().roster.find(x=>x.id===p.id).bio.draftTeam,team().abbr);
state=validateCareerData(copy(state));await autoDraft(false);assert(draftComplete());assert.equal(new Set(state.draft.picks.map(x=>x.id)).size,12);assert.equal(state.draft.prospects.length,28);state=validateCareerData(copy(state));assert(draftComplete());
state.freeAgency={year:state.year,phase:'complete',round:1,players:[],offers:[],pending:[],mle:{},log:[]};newSeason();assert.equal(state.year,oldYear+1);assert.equal(state.draft,null);assert.equal(state.draftHistory.length,1);state=validateCareerData(copy(state));ensureDraft();assert.equal(state.draft.picks.length,0);
assert(draftView().includes('YOUR NEXT PICK'));draftReport(state.draft.prospects[0].id);assert(document.getElementById('profile').innerHTML.includes('SCOUTING REPORT'));
// Failed storage must not retain a lottery or pick mutation.
await sim(seasonLength());await playoffs();const before=copy(state);save=async()=>false;await runDraftLottery();assert.deepEqual(copy(state),before);assert.equal(state.draft.order.length,0);
})()`);console.log('Draft sequence, unique picks, persistence, rookie biographies, rollover and rollback passed.');})().catch(e=>{console.error(e);process.exitCode=1});
