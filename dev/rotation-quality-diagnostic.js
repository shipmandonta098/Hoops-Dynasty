// Diagnostic projection only. No result or possession probability uses these values.
function projectedRotationQuality(source){
 const club=copy(source),runtime=createGameRotation(club),rows=new Map(club.roster.map(p=>[p.id,{mp:0,pf:0,ejected:0}])),energy=new Map(club.roster.map(p=>[p.id,0]));
 for(let minute=0;minute<gameMinutes();minute++){
  refreshGameRotation(club,runtime,minute,rows,[],0);
  for(const id of runtime.court)energy.set(id,energy.get(id)+runtime.stamina.get(id));
  accrueRotationMinutes(club,runtime,rows,1);
 }
 const keys=['lay','post','fg','tp','ft','drb','pss','oiq','per','rim','diq','stl','sbl','reb','endu'],result=Object.fromEntries(keys.map(k=>[k,0])),minutes=[];let total=0,ovr=0,energySum=0,bench=0;
 for(const [i,p]of club.roster.entries()){
  const mp=rows.get(p.id).mp;if(!mp)continue;const e=energy.get(p.id)/mp,bonus=moraleBonus(moraleDetails(p,club).score)+teamChemistry(club).modifier,physical=derivedPhysicalAttributes(p),q={...p,attributes:physical};
  for(const k of keys)result[k]+=mp*effectiveAttribute(q,k,(100-e)/30,mp>=30,bonus);
  total+=mp;ovr+=mp*p.ovr;energySum+=mp*e;if(i>=5)bench+=mp;minutes.push({id:p.id,minutes:mp,energy:e});
 }
 for(const k of keys)result[k]/=total||1;
 return {...result,ovr:ovr/(total||1),energy:energySum/(total||1),benchShare:bench/(total||1),coachOff:coachingSkill(club,'offense'),coachDef:coachingSkill(club,'defense'),fit:coachFit(club),tempo:coachFor(club).tempo,minutes};
}
