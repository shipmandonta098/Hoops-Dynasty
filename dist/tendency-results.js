// Completed results show a read-only log; live playback belongs to Watch live.
function completedGamePlayLog(game){
 const events=(game.playByPlay||[]).filter(e=>!watchHiddenDiagnostic(e));
 return '<h2>Completed play-by-play</h2><div class="completed-play-log" style="max-height:65vh;overflow:auto">'+(events.length?'<ol>'+events.map(e=>'<li style="padding:8px 0">'+watchActionMarkup(game,e,e)+'</li>').join('')+'</ol>':'<p class="muted">No play-by-play was recorded for this game.</p>')+'</div>';
}
