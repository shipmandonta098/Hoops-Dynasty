/* Presentation only: reveal the existing, committed first-round order. */
let lotteryWatch=null,lotteryWatchBusy=false;
async function watchDraftLottery(){
 if(lotteryWatchBusy)return;
 if(!draftReady()||state.expansion?.active||!ownerCanManage())return runDraftLottery();
 lotteryWatchBusy=true;
 try{
  if(!ensureDraft().order.length)await runDraftLottery();
  const d=state.draft;if(!d?.order.length)return;
  lotteryWatch={year:state.year,order:[...d.order],revealed:0};
  renderLotteryWatch();
 }finally{lotteryWatchBusy=false}
}
function revealLotteryPick(all=false){
 if(!lotteryWatch||lotteryWatch.year!==state.year)return;
 lotteryWatch.revealed=all?lotteryWatch.order.length:Math.min(lotteryWatch.order.length,lotteryWatch.revealed+1);
 renderLotteryWatch();
}
function renderLotteryWatch(){
 const w=lotteryWatch;if(!w)return;
 const count=w.order.length,done=w.revealed===count,index=count-w.revealed;
 const club=w.revealed?state.teams.find(t=>t.id===w.order[index]):null;
 editorModal(`${w.year} Draft Lottery`, `<section aria-label="Lottery reveal"><p class="muted">The first-round order is locked. Reveal the teams from the final pick to No. 1.</p><div class="po-panel" aria-live="polite" aria-atomic="true">${club?`<div class="eyebrow">PICK #${index+1}</div><div class="po-stat-team">${teamLogo(club)}<h2>${escapeHTML(club.city+' '+club.name)}</h2></div>${index===0?'<p>The first overall pick is decided.</p>':''}`:'<h2>Who gets the first pick?</h2><p>Start the reveal when you’re ready.</p>'}</div><p>${w.revealed} of ${count} picks revealed</p><div class="actions">${done?'<button class="primary" onclick="closeTitleModal()">Continue to draft</button>':'<button class="primary" onclick="revealLotteryPick()">Reveal next pick</button><button onclick="revealLotteryPick(true)">Show all results</button>'}<button onclick="closeTitleModal()">Close</button></div>${w.revealed?`<ol start="${index+1}">${w.order.slice(index).map(id=>{const t=state.teams.find(t=>t.id===id);return `<li>${escapeHTML(t.city+' '+t.name)}</li>`}).join('')}</ol>`:''}</section>`);
}
