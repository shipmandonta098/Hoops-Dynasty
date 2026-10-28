/* Durability is independent of talent; deterministic migration preserves existing skills. */
function generatedDurability(p){let seed=(p.id+17)>>>0;for(const c of p.name)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;const roll=seed%100;return roll<12?35+seed%15:roll<40?50+seed%25:roll<90?75+seed%15:90+seed%10}
function withDurabilityAttributes(a,p){return a.dur===undefined?{...a,dur:generatedDurability(p)}:a}
function durabilityRating(p){return withBasketballAttributes(p).attributes.dur}
function durabilityTier(value){return value>=90?'Iron Man':value>=75?'Reliable':value>=50?'Fragile':'Injury Prone'}
function medicalStamp(){return Math.floor(scheduleDate(state.day+1).getTime()/86400000)}
function readMedicalInfo(raw,bad){if(raw===undefined)return undefined;if(!raw||typeof raw.name!=='string'||!raw.name.length||raw.name.length>80||!['Minor','Moderate','Severe'].includes(raw.severity)||!Number.isInteger(raw.until)||!Number.isInteger(raw.rehabUntil)||raw.until< -100000||raw.until>4000000||raw.rehabUntil<raw.until||raw.rehabUntil>raw.until+30||raw.context!==undefined&&raw.context!=='practice')bad('invalid medical record.');return {name:raw.name,severity:raw.severity,until:raw.until,rehabUntil:raw.rehabUntil,...(raw.context?{context:raw.context}:{})}}
function durabilityFatigueMultiplier(p){return 1.2-durabilityRating(p)*.003}
function durabilityRecoveryMultiplier(p){return .8+durabilityRating(p)*.004}
function durabilityInjuryChance(p,minutes,energy,conditioning=50){
 if(!(minutes>0))return 0;
 const fragility=(100-durabilityRating(p))/100,recent=p.medicalInfo&&medicalStamp()>=p.medicalInfo.until&&medicalStamp()<p.medicalInfo.rehabUntil;
 // Per ten floor minutes, then compounded once after the game. All values are probabilities [0,1].
 const interval=(.0003+fragility*fragility*.012+(100-Math.max(0,Math.min(100,energy)))/100*.002)*(1-conditioning/200)*(recent?1.7:1);
 return Math.min(.15,1-Math.pow(1-interval,minutes/10));
}
// [name, fewest days, most days, news phrase]. Practice injuries use the same table with severity skewed minor.
const INJURY_TYPES={
 Minor:[['twisted ankle',1,3,'a twisted ankle'],['back spasms',1,4,'back spasms'],['jammed finger',1,2,'a jammed finger'],['sore knee',1,3,'a sore knee'],['hip contusion',1,3,'a hip contusion'],['calf tightness',1,3,'calf tightness'],['ankle sprain',1,4,'an ankle sprain']],
 Moderate:[['hamstring strain',7,21,'straining a hamstring'],['sprained wrist',6,16,'spraining a wrist'],['bone bruise',7,21,'suffering a bone bruise'],['groin strain',7,18,'straining a groin'],['calf strain',7,18,'straining a calf'],['high ankle sprain',10,28,'suffering a high ankle sprain']],
 Severe:[['torn Achilles',270,365,'a torn Achilles'],['torn ACL',240,330,'a torn ACL'],['fractured foot',60,120,'a fractured foot'],['torn meniscus',42,90,'a torn meniscus'],['knee ligament injury',120,240,'a knee ligament injury']]
};
const PRACTICE_SEVERITY={severe:.2,moderate:.4};
function injuryType(name){for(const severity of Object.keys(INJURY_TYPES)){const t=INJURY_TYPES[severity].find(t=>t[0]===name);if(t)return {severity,name:t[0],min:t[1],max:t[2],phrase:t[3]}}return null}
function durabilityInjuryDetails(p,conditioning,roll=Math.random(),context=null){
 const fragility=(100-durabilityRating(p))/100,practice=context==='practice',severe=(.001+fragility**3*.45)*(practice?PRACTICE_SEVERITY.severe:1),moderate=(.08+fragility*.35)*(practice?PRACTICE_SEVERITY.moderate:1);
 const severity=roll<severe?'Severe':roll<severe+moderate?'Moderate':'Minor',pool=INJURY_TYPES[severity],[name,min,max]=pool[Math.floor(Math.random()*pool.length)];
 const days=Math.max(min,Math.round((min+Math.random()*(max-min))*(1-conditioning/500)*(1-durabilityRating(p)/700)));
 return {name,severity,days};
}
// In-game injury rate, trimmed so practice injuries keep total games missed near the pre-practice baseline.
const GAME_INJURY_SCALE=1;
function durabilityMedicalCheck(p,club,minutes,energy,result,training=false){
 if(injuryDays(p)||club.roster.filter(q=>!injuryDays(q)).length<=leagueRules().courtPlayers)return;
 const practice=training==='practice',conditioning=coachingSkill(club,'conditioning'),chance=durabilityInjuryChance(p,minutes,energy,conditioning)*(practice?practiceInjuryScale():training?.25:b2bInjuryMultiplier(p,minutes)*GAME_INJURY_SCALE);
 const roll=Math.random();if(roll>=chance){if(!training&&durabilityRating(p)>=90&&roll<chance+.003&&result&&result.rotationEvents.length<120)result.rotationEvents.push(p.name+' takes an awkward fall, shakes it off and finishes the game. No injury reported.');return;}
 const injury=durabilityInjuryDetails(p,conditioning,Math.random(),practice?'practice':null),until=medicalStamp()+(training?0:1)+injury.days;
 p.medicalInfo={name:injury.name,severity:injury.severity,until,rehabUntil:until+14,...(practice?{context:'practice'}:{})};delete p.injuredUntil;
 if(practice)return say(practiceInjuryHeadline(p,club,injury));
 const report=p.name+' ('+club.abbr+'): '+injury.severity.toLowerCase()+' '+injury.name+' after '+(training?'offseason training':'the game')+'; expected recovery '+injury.days+' days.';
 say('MEDICAL REPORT: '+report);if(result&&result.rotationEvents.length<120)result.rotationEvents.push('MEDICAL: '+report);
}
function durabilityAfterGame(club,result,runtime){for(const p of club.roster){const row=result.box.find(r=>r.playerId===p.id);if(row?.mp>0)durabilityMedicalCheck(p,club,row.mp,runtime.stamina.get(p.id),result)}}
function durabilityHealthText(p){const days=injuryDays(p);if(days)return (p.medicalInfo?medicalLabel(p):'Non-contact strain')+' · '+days+' days until expected return. Unavailable during recovery.';if(p.medicalInfo&&medicalStamp()<p.medicalInfo.rehabUntil)return 'Cleared to play · Recent injury: '+p.medicalInfo.name+'. Elevated reinjury risk for '+(p.medicalInfo.rehabUntil-medicalStamp())+' more days.';return 'Healthy · Available to play.'}
function medicalLabel(p){const m=p.medicalInfo;return m?m.severity+' '+m.name+(m.context==='practice'?' (practice)':''):'Injury'}
function practiceInjuryHeadline(p,club,injury){
 const who=p.name+' ('+club.abbr+')',type=injuryType(injury.name),phrase=type?.phrase||injury.name,days=injury.days,weeks=[Math.max(1,Math.floor(days/7)),Math.max(2,Math.ceil(days/7))];
 if(injury.severity==='Minor')return who+' left practice with '+phrase+(days<=3?' (day-to-day).':' (out '+days+' days).');
 if(injury.severity==='Moderate')return who+' will miss '+(weeks[0]===weeks[1]?weeks[0]+' weeks':weeks[0]+'–'+weeks[1]+' weeks')+' after '+phrase+' in practice.';
 const remaining=Math.max(0,seasonLength()-state.day)+60;
 return who+' suffers '+phrase+' in practice and is expected to miss '+(days>=remaining?'the season':'about '+Math.max(2,Math.round(days/30))+' months')+'.';
}
