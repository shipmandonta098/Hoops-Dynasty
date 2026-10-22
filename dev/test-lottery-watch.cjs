const assert=require('node:assert/strict');const {loadLeague}=require('./load-league.cjs');
(async()=>{const x=loadLeague({strictDOM:false});x.context.assert=assert;await x.run(`(async()=>{
state=fresh(defaultTeams().slice(0,6),2);state.day=seasonLength();state.champion=0;ownerCanManage=()=>true;ownerPlayoffClub=t=>t.id<2;save=async()=>true;render=()=>{};editorModal=()=>{};
const baseline=copy(state);await runDraftLottery();const order=JSON.stringify(state.draft.order);await watchDraftLottery();assert.equal(lotteryWatch.revealed,0);revealLotteryPick();assert.equal(lotteryWatch.revealed,1);revealLotteryPick(true);assert.equal(lotteryWatch.revealed,6);assert.equal(JSON.stringify(state.draft.order),order);await watchDraftLottery();assert.equal(JSON.stringify(state.draft.order),order);
state=copy(baseline);save=async()=>false;lotteryWatch=null;await watchDraftLottery();assert.equal(state.draft?.order?.length||0,0);assert.equal(lotteryWatch,null);
})()`);console.log('PASS: reveal, show all, replay without reroll, save failure rollback');})().catch(e=>{console.error(e);process.exitCode=1});
