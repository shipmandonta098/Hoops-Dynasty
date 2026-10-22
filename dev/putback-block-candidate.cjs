const assert=require('node:assert/strict');
function candidate(name,s){
 if(name!=='attributes.js')return s;
 const a="const denied=putbackDunk&&Math.random()<tendency(d,'block')*.08;";
 assert.equal(s.split(a).length-1,1);
 s=s.replace(a,"const denied=putbackDunk?Math.random()<tendency(d,'block')*.08:immediatePutbackLayupBlocked(rebounder,d,side,y);");
 const anchor=' function possessionCore(side)';assert.equal(s.split(anchor).length-1,1);
 return s.replace(anchor,` // Immediate layup putbacks use the primary inside-shot block calculation.
 // Keep the existing defender and use the rebounder's effective physical ratings.
 // A plain putback has block multiplier 1; inside-shot recovery is always zero.
 function immediatePutbackLayupBlocked(rebounder,d,side,y){
 const progress=(100-gameRotations[side].stamina.get(rebounder.id))/30;
 const finish=k=>effectiveAttribute(rebounder,k,progress,minuteMap.get(rebounder.id)>=30,moraleModifiers.get(rebounder.id));
 const blockChance=Math.max(.005,.025+(y('sbl')+y('hgt')+y('jmp')-finish('stre')-finish('jmp'))*.0003);
 return Math.random()<tendency(d,'block')&&Math.random()<Math.min(.6,blockChance*2*(moraleMatchScore(d)>=90?1.15:1));
 }
${anchor}`);
}
module.exports={candidate};
