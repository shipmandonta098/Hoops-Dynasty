// Completed results show a read-only log; live playback belongs to Watch live.
function completedGamePlayLog(game){
 const all=game.playByPlay||[],rows=all.map((e,i)=>watchHiddenDiagnostic(e)?'':(p=>'<li class="'+p.className+'">'+p.html+'</li>')(pbpRowParts(game,all,i))).filter(Boolean);
 return '<h2>Completed play-by-play</h2><div class="completed-play-log" style="max-height:65vh;overflow:auto">'+(rows.length?'<ol class="pbp-list">'+pbpHeaderRow(game)+rows.join('')+'</ol>':'<p class="muted">No play-by-play was recorded for this game.</p>')+'</div>';
}
