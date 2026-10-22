const assert=require('node:assert/strict');
function candidate(name,s){if(name!=='tendencies.js')return s;
 const edits=[
 ["c.machine.transition('pass',3);", "if(!c.machine.transition('pass',3)){c.recordTurnover('shotClock',handler);return null;}"],
 ["c.machine.transition('shot',early?3:5);", "if(!c.machine.transition('shot',early?3:5)){c.recordTurnover('shotClock',shooter);return null;}"]
 ];for(const [a,b] of edits){assert.equal(s.split(a).length-1,1,a);s=s.replace(a,b)}return s;
}module.exports={candidate};
