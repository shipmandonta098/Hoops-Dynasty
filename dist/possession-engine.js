/* Behavior selects actions; active-player capabilities resolve outcomes.
   These are rating-based lineup effects, not fitted RAPM estimates. */
const POSSESSION_TRANSITIONS={start:['decision'],decision:['foul','decision','pass','drive','post','shot','turnover'],pass:['decision','shot','turnover'],drive:['shot','turnover'],post:['shot','turnover'],shot:['foul','made','miss','block','turnover'],foul:['decision','end','freeThrow','shot','turnover'],freeThrow:['decision','freeThrow','rebound','end'],made:['end'],miss:['foul','rebound'],block:['foul','rebound'],rebound:['decision','shot','pass','end'],turnover:['end'],end:[]};
function createPossessionMachine(context={}){return {phase:'start',shotClock:possessionEnvironment().shotClock,initialShotClock:possessionEnvironment().shotClock,context,trace:['start'],transition(next,seconds=0){if(!POSSESSION_TRANSITIONS[this.phase]?.includes(next))throw Error('Invalid possession transition: '+this.phase+' → '+next);if(this.context.advance)this.context.advance(seconds,next);this.shotClock=Math.max(0,this.shotClock-seconds);this.phase=next;this.trace.push(next);return this.shotClock>0},finish(){if(this.context.liveClock&&this.context.remaining()<=0){this.phase='end';this.trace.push('periodEnd');}else if(this.phase!=='end')this.transition('end')}}}
const PBP_TEMPLATES={
 pass:['{player} passes to {target}.','{player} moves the ball to {target}.'],
 turnover:['{player} loses control of the ball.','{player} turns it over off the dribble.'],
 steal:['{defender} strips {player} of the ball.','{defender} takes the ball away from {player}.'],
 made:['{player} makes the {shot}.','{player} finds {player_possessive} rhythm and connects on the {shot}.'],
 miss:['{player} misses the {shot}.','The {shot} is off target for {player}.'],
 block:["{defender} blocks {player}'s {shot}.","{defender} rejects {player}'s {shot}."],
 rebound:['{player} collects the {kind} rebound.','{player} secures the {kind} board.'],
 foul:['{player} draws a shooting foul on {defender}.','{defender} fouls {player} on the shot.'],
 freeMade:['{player} makes a free throw.','{player} converts at the foul line.'],
 freeMiss:['{player} misses a free throw.','{player} leaves a free throw short.'],
 clock:['Shot-clock violation on {player}. Possession changes hands.'],
 timeout:['{coach} calls timeout to stop the run and adjust the defense.']
};
function pbpNarrative(type,values,variation=0){const templates=PBP_TEMPLATES[type];if(!templates)throw Error('Unknown play-by-play event');return templates[Math.abs(variation)%templates.length].replace(/\{(\w+)\}/g,(_,key)=>String(values[key]??(key==='player_possessive'?(values.pronouns?.possessive||'their'):'')))}
function activeLineupEffects(offense,defense,active){const avg=(club,key)=>{const unit=club.roster.filter(p=>active(club,p));return unit.reduce((n,p)=>n+p.attributes[key]+(hasTrait(p,'smart')&&['oiq','diq'].includes(key)?5:0),0)/Math.max(1,unit.length)},clamp=(n,min,max)=>Math.max(min,Math.min(max,n));return {archetypes:archetypeLineupEffects(offense.roster.filter(p=>active(offense,p))),shot:clamp((avg(offense,'tp')-65)*.0003+(avg(offense,'pss')-avg(defense,'diq'))*.0003,-.035,.035),turnover:clamp((avg(defense,'diq')-avg(offense,'pss'))*.00035,-.025,.025)}}
