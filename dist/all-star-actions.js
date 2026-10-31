function allStarEventActions(key){
 const complete=state.allStarEvents?.year===state.year&&state.allStarEvents.results.some(e=>e.key===key);
 return `<div class="schedule-watch-actions"><button onclick="runAllStarEvent('${key}',false)">${complete?'View results':'Simulate'}</button><button class="primary" onclick="runAllStarEvent('${key}',true)">${complete?'Watch replay':'Watch live'}</button></div>`;
}
/* Event actions reuse calendar processing and replay committed exhibition results. */
let allStarEventBusy=false,allStarPlayback=null,allStarPlaybackTimer=null;
async function runAllStarEvent(key,watch=false){
 if(allStarEventBusy||allStarBusy||simulationBusy||playoffActionBusy||playoffBatchToken)return;
 const event=allStarEventPlan().find(e=>e.key===key);if(!event)return;
 let result=state.allStarEvents?.year===state.year?state.allStarEvents.results.find(e=>e.key===key):null;
 if(!result&&!gmCanAdvance())return;
 allStarEventBusy=true;
 try{
  closeTitleModal();
  if(!result){
   while(state.day<event.day){
    if(allStarSimulationPaused()){showAllStarWeekend();return;}
    const day=state.day;if(!await sim(1)||state.day===day||simulationStopRequested||!gmCanAdvance())return;
   }
   if(allStarSimulationPaused()){showAllStarWeekend();return;}
   const before=snapshotState();
   try{processAllStarEvents();if(await save()===false){state=before;toast('The event could not be saved. Please try again.');return;}}
   catch(error){state=before;throw error;}
   result=state.allStarEvents?.results.find(e=>e.key===key);
  }
  if(!result){showAllStarWeekend();return;}
  if(watch){
   const lines=result.playByPlay||((key==='game'&&state.allStarVoting?.game?.events)||result.lines);
   allStarPlayback={year:state.year,title:result.title,summary:result.summary,lines:[...lines],index:0,paused:false,speed:1};
   renderAllStarPlayback();const dialog=document.getElementById('profile');dialog.addEventListener('close',()=>{if(!dialog.open)stopAllStarPlayback();},{once:true});scheduleAllStarPlayback();
  }else titleModal(escapeHTML(result.title),'<p>'+escapeHTML(result.summary)+'</p>'+result.lines.map(s=>'<p>'+escapeHTML(s)+'</p>').join('')+'<button onclick="showAllStarWeekend()">Back to All-Star events</button>');
 }catch(error){simulationFailure(error);toast('All-Star event stopped: '+error.message);}
 finally{allStarEventBusy=false;}
}
function stopAllStarPlayback(){clearTimeout(allStarPlaybackTimer);allStarPlaybackTimer=null;allStarPlayback=null;}
function renderAllStarPlayback(){
 const w=allStarPlayback;if(!w)return;const done=w.index>=w.lines.length;
 titleModal(escapeHTML(w.title)+' · Live feed',`<p>Exhibition playback · ${w.index} / ${w.lines.length} updates</p><progress max="${Math.max(1,w.lines.length)}" value="${w.index}" style="width:100%" aria-label="Event playback"></progress><div class="po-panel" aria-live="polite"><p>${escapeHTML(done?w.summary:w.index?w.lines[w.index-1]:'The event is about to begin…')}</p></div><div class="actions"><button onclick="toggleAllStarPlayback()" ${done?'disabled':''}>${w.paused?'Play':'Pause'}</button><label>Speed <select onchange="setAllStarPlaybackSpeed(this.value)">${[.5,1,2,4,8].map(n=>`<option value="${n}" ${w.speed===n?'selected':''}>${n}×</option>`).join('')}</select></label><button onclick="finishAllStarPlayback()" ${done?'disabled':''}>Show final result</button><button onclick="stopAllStarPlayback();showAllStarWeekend()">Back to events</button></div><ol style="max-height:320px;overflow:auto">${w.lines.slice(0,w.index).map(s=>'<li>'+escapeHTML(s)+'</li>').join('')}</ol><p class="muted">Playback controls do not change the saved result.</p>`);
}
function scheduleAllStarPlayback(){clearTimeout(allStarPlaybackTimer);const w=allStarPlayback;if(!w||w.paused||w.index>=w.lines.length)return;allStarPlaybackTimer=setTimeout(()=>{if(allStarPlayback!==w||state.year!==w.year||!document.getElementById('profile')?.open){stopAllStarPlayback();return;}w.index++;renderAllStarPlayback();scheduleAllStarPlayback();},1000/w.speed);}
function toggleAllStarPlayback(){if(!allStarPlayback)return;allStarPlayback.paused=!allStarPlayback.paused;renderAllStarPlayback();scheduleAllStarPlayback();}
function setAllStarPlaybackSpeed(value){if(!allStarPlayback||![.5,1,2,4,8].includes(Number(value)))return;allStarPlayback.speed=Number(value);scheduleAllStarPlayback();}
function finishAllStarPlayback(){if(!allStarPlayback)return;clearTimeout(allStarPlaybackTimer);allStarPlayback.index=allStarPlayback.lines.length;renderAllStarPlayback();}
const closeBeforeAllStarPlayback=closeTitleModal;closeTitleModal=function(){stopAllStarPlayback();return closeBeforeAllStarPlayback();};
