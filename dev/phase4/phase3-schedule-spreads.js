// Negative home spread means the home team is favored. This is a game projection,
// not a bookmaker line, and never changes the simulation's outcome probabilities.
function projectedHomeSpread(a,b){const margin=(strength(state.teams[a])-strength(state.teams[b]))*1.2+2.5;return -Math.round(Math.max(-30,Math.min(30,margin))*2)/2}
function scheduleSpread(a,b,result){const stored=Number.isFinite(result?.homeSpread),spread=stored?result.homeSpread:projectedHomeSpread(a,b),label=spread===0?'Pick’em':escapeHTML(state.teams[spread<0?a:b].abbr)+' −'+Math.abs(spread).toFixed(1),note=result?(stored?'Pregame spread':'Current estimate · pregame spread not recorded'):'Projected spread';return `<span class="schedule-spread" title="${note}. Rating-based projection with a 2.5-point home advantage; negative means favored."><small>${note}</small><strong>${label}</strong></span>`}
const playBeforeSpreads=play;
play=function(a,b,stage='Regular season'){const spread=projectedHomeSpread(a,b),game=playBeforeSpreads(a,b,stage);game.homeSpread=spread;return game};
