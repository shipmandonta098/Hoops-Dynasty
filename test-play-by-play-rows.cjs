// Play-by-play styling: scoring rows (the running score changed) vs other rows, two score columns in box-score order
// with the scorer's number bold, the responsible team's logo, and the event text unchanged (timestamp first, only the
// leading running score moved into the columns). Same rows in the completed log and the live feed.
const assert=require('node:assert/strict'),{loadLeague}=require('./dev/load-league.cjs');
const l=loadLeague({seed:12,strictDOM:false});l.setRandomSeed(12);
const run=c=>{const v=l.run(c);return v&&typeof v==='object'?JSON.parse(JSON.stringify(v)):v};
l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='PBP';state=validateCareerData(buildSetupCareer(d));var g=play(0,1);`);
const events=run('g.playByPlay'),visible=run('g.playByPlay.map((e,i)=>watchHiddenDiagnostic(e)?-1:i).filter(i=>i>=0)'),html=run('completedGamePlayLog(g)');
const rows=[...html.matchAll(/<li class="pbp-row (pbp-scoring|pbp-play)"><span class="pbp-logo">([\s\S]*?)<\/span><span class="pbp-text">([\s\S]*?)<\/span>(<span class="pbp-score[^"]*"[^>]*>[^<]*<\/span>)(<span class="pbp-score[^"]*"[^>]*>[^<]*<\/span>)<\/li>/g)];
assert.equal(rows.length,visible.length,'one row per visible event');
const esc=t=>t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const score=e=>{const m=/^\[(\d+)–(\d+)\] /.exec(e);return m?[+m[1],+m[2]]:null};
// Expected scoring rows: each score change, credited to the MADE line that follows with the same score (a crowd
// reaction line written before the made shot already carries the new score), else to the line where it changed.
const credited=new Map();{let prev=[0,0];for(let i=0;i<events.length;i++){const sc=score(events[i]);if(!sc||sc.join()===prev.join())continue;let at=i;
 if(!/ · MADE: /.test(events[i]))for(let j=i+1;j<events.length&&score(events[j])?.join()===sc.join();j++)if(/ · MADE: /.test(events[j])){at=j;break}
 const marker=/^\[\d+–\d+\] (FINAL · |[^·]+ · [A-Z]{2,4} · (Start of|End of) )/.test(events[at]);if(!marker)credited.set(at,{s:sc,p:prev});prev=sc}}
let scoring=0,checkedBold=0;
for(const [k,i] of visible.entries()){const [,cls,logo,text,c0,c1]=rows[k],e=events[i],hit=credited.get(i),changed=!!hit,s=hit?.s,p=hit?.p;
 // Text: exactly the event without its leading "[a–b] " — timestamp first, nothing else changed.
 const expected=e.replace(/^\[\d+–\d+\] /,'');assert.equal(l.run('escapeHTML')(expected),text,'event text unchanged at '+i);assert.match(expected,/^(Q\d|OT\d*|FINAL|\d)/,'timestamp first: '+expected.slice(0,20));
 assert.equal(cls,changed?'pbp-scoring':'pbp-play','row class at '+i+': '+e);
 if(changed){scoring++;assert.equal(c0.match(/>(\d+)</)[1],String(s[0]));assert.equal(c1.match(/>(\d+)</)[1],String(s[1]));
  assert.equal(c0.includes('pbp-scored'),s[0]!==p[0],'team a number bold only when team a scored');assert.equal(c1.includes('pbp-scored'),s[1]!==p[1]);checkedBold++}
 else if(/^(FINAL · |[^·]+ · [A-Z]{2,4} · (Start of|End of) )/.test(expected)){const sc=score(e);assert.match(c0,new RegExp('>'+sc[0]+'</span>$'));assert.match(c1,new RegExp('>'+sc[1]+'</span>$'));assert(!c0.includes('pbp-scored')&&!c1.includes('pbp-scored'),'period marker scores dimmed')}
 else{assert.match(c0,/><\/span>$/);assert.match(c1,/><\/span>$/)}
 // Logo of the team responsible (scorer's team; the fouling team on fouls); period markers have none.
 if(/ · [A-Z]{2,4} · /.test(expected)&&!/ · (Start of|End of) /.test(expected))assert(logo.includes('watch-action-logo'),'team logo at '+i+': '+expected)}
assert(scoring>40&&scoring<visible.length/2,'scoring rows '+scoring+' of '+visible.length);
// Every made shot / made free throw is a scoring row; misses, rebounds, fouls, turnovers are not.
let made=0;for(const [k,i] of visible.entries()){const t=events[i];if(/ · MADE: /.test(t)){made++;assert.equal(rows[k][1],'pbp-scoring','made: '+t)}if(/ · (MISS: |.* REBOUND \(|.* FOUL|.* Turnover)/.test(t)&&!/MADE/.test(t))assert.equal(rows[k][1],'pbp-play','non-scoring: '+t);if(/The home crowd comes alive/.test(t))assert.equal(rows[k][1],'pbp-play','crowd reaction is not the scoring row')}
assert(made>100,'made shots checked: '+made);
// Games kept with period markers only (CPU games): no scoring rows; each marker shows the running score dimmed.
const short=run(`(()=>{const ev=['[0–0] Q1 12:00 · MIL · Jump Ball R. Owens vs. D. Gordon. Tip to A. Palmer.','[23–28] Q1 0:00 · MIL · End of Q1.','[23–28] Q2 12:00 · MIL · Start of Q2.','[57–51] Q2 0:00 · MIL · End of Q2.','[107–96] FINAL · End of game.'];return completedGamePlayLog({...g,playByPlay:ev})})()`);
assert.equal((short.match(/pbp-scoring/g)||[]).length,0,'markers are not scoring plays');assert.equal((short.match(/pbp-scored/g)||[]).length,0);assert.match(short,/End of Q1\.<\/span><span class="pbp-score"[^>]*>23<\/span><span class="pbp-score"[^>]*>28<\/span>/);assert.match(short,/End of game\.<\/span><span class="pbp-score"[^>]*>107</);
// Header columns: box-score order (team a, team b), as in the final score "sa : sb".
assert.match(html,new RegExp('<li class="pbp-head"[^>]*><span class="pbp-logo"></span><span class="pbp-text">Play</span><span class="pbp-score">'+run('state.teams[g.a].abbr')+'</span><span class="pbp-score">'+run('state.teams[g.b].abbr')+'</span></li>'));
// The live feed builds the same rows (shared builder) and the current-play line is marked when it scored.
const src=require('fs').readFileSync('dist/schedule-events.js','utf8');assert.match(src,/const parts=pbpRowParts\(liveWatch\.result,liveWatch\.result\.playByPlay,i\);row\.className=parts\.className;row\.innerHTML=parts\.html/);
assert.match(src,/class="watch-feed pbp-list"[^>]*>\$\{pbpHeaderRow\(g\)\}<\/ol>/);assert.match(src,/watch-current\$\{index>0&&pbpScoring\(g\.playByPlay,index-1\)/);
// Both themes define the two row shades.
const css=require('fs').readFileSync('dist/schedule-ui.css','utf8');assert.match(css,/:root\{--pbp-play-bg:[^;]+;--pbp-score-bg:[^}]+\}/);assert.match(css,/\.league-light\{--pbp-play-bg:[^;]+;--pbp-score-bg:[^}]+\}/);
console.log('Play-by-play rows:',visible.length,'events,',scoring,'scoring rows,',checkedBold,'scorer numbers checked; text unchanged; header in box-score order; live feed shares the builder; both themes.');
