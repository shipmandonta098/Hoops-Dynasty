/* Generation profiles are game-balance defaults, not limits on individual ability. */
const LEAGUE_GENDERS=['male','female','mixed'];
function generatedGender(mode,id){return mode==='mixed'?(id%2?'female':'male'):mode==='female'?'female':'male'}
function playerPronouns(p){return p.gender==='female'?{subject:'she',object:'her',possessive:'her'}:{subject:'he',object:'him',possessive:'his'}}
function genderOptions(value){return LEAGUE_GENDERS.map(g=>'<option value="'+g+'" '+(g===value?'selected':'')+'>'+g[0].toUpperCase()+g.slice(1)+'</option>').join('')}
function setLeagueGender(value){if(!LEAGUE_GENDERS.includes(value))return;state.leagueGender=value;save();render();toast('Gender setting updated for future recruits.')}
function leagueGenderSettings(){return '<section class="panel"><div class="panelhead"><h2>League settings</h2></div><div class="note"><label>Player gender <select aria-label="League player gender" onchange="setLeagueGender(this.value)">'+genderOptions(state.leagueGender||'male')+'</select></label><p class="muted">Applies to future recruits. Existing players and results stay unchanged.</p></div></section>'}
function genderAttributes(p,a){if(p.gender!=='female')return a;for(const [k,delta] of Object.entries({dnk:-45,jmp:-10,stre:-8,sbl:-8,pss:4,ft:3,lay:3}))a[k]=ratingLimit(a[k]+delta);if(p.id%47===0&&a.hgt>=75){a.dnk=Math.max(a.dnk,80);a.jmp=Math.max(a.jmp,88)}return a}
function genderTendency(p,key,value){if(p.gender!=='female')return value;if(['standingDunk','drivingDunk','alleyOop'].includes(key))return Math.min(5,Math.round(value*.04));return Math.max(0,Math.min(100,value+({passing:6,drivingLayup:8,floater:6,runningFloater:6,block:-12}[key]||0)))}
function femaleDunkMultiplier(p){if(p.gender!=='female')return 1;const a=p.attributes||generatedAttributes(p);return a.jmp>=85&&a.dnk>=75&&a.hgt>=75?.04:0}

function genderMatchupSize(p,d){if((p.gender||'male')===(d.gender||'male'))return 0;return p.gender==='female'?-18:18}
