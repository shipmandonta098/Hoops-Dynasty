/* Durability is independent of talent; deterministic migration preserves existing skills. */
function generatedDurability(p){let seed=(p.id+17)>>>0;for(const c of p.name)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;const roll=seed%100;return roll<12?35+seed%15:roll<40?50+seed%25:roll<90?75+seed%15:90+seed%10}
function withDurabilityAttributes(a,p){return a.dur===undefined?{...a,dur:generatedDurability(p)}:a}
function durabilityRating(p){return withBasketballAttributes(p).attributes.dur}
function durabilityTier(value){return value>=90?'Iron Man':value>=75?'Reliable':value>=50?'Fragile':'Injury Prone'}
function medicalStamp(){return Math.floor(scheduleDate(state.day+1).getTime()/86400000)}
function readMedicalInfo(raw,bad){if(raw===undefined)return undefined;if(!raw||typeof raw.name!=='string'||!raw.name.length||raw.name.length>80||!['Minor','Moderate','Severe'].includes(raw.severity)||!Number.isInteger(raw.until)||!Number.isInteger(raw.rehabUntil)||raw.until< -100000||raw.until>4000000||raw.rehabUntil<raw.until||raw.rehabUntil>raw.until+30)bad('invalid medical record.');return {name:raw.name,severity:raw.severity,until:raw.until,rehabUntil:raw.rehabUntil}}
function durabilityFatigueMultiplier(p){return 1.2-durabilityRating(p)*.003}
function durabilityRecoveryMultiplier(p){return .8+durabilityRating(p)*.004}
function durabilityInjuryChance(p,minutes,energy,conditioning=50){
 if(!(minutes>0))return 0;
 const fragility=(100-durabilityRating(p))/100,recent=p.medicalInfo&&medicalStamp()>=p.medicalInfo.until&&medicalStamp()<p.medicalInfo.rehabUntil;
 // Per ten floor minutes, then compounded once after the game. All values are probabilities [0,1].
 const interval=(.0003+fragility*fragility*.012+(100-Math.max(0,Math.min(100,energy)))/100*.002)*(1-conditioning/200)*(recent?1.7:1);
 return Math.min(.15,1-Math.pow(1-interval,minutes/10));
}
function durabilityInjuryDetails(p,conditioning,roll=Math.random()){
 const fragility=(100-durabilityRating(p))/100,severe=.001+fragility**3*.45,moderate=.08+fragility*.35;
 const severity=roll<severe?'Severe':roll<severe+moderate?'Moderate':'Minor';
 const names={Minor:['ankle sprain','calf tightness','bruised hip'],Moderate:['hamstring strain','calf strain','ankle sprain'],Severe:['ACL tear','Achilles tear','knee ligament injury']};
 const range=severity==='Severe'?[120,270]:severity==='Moderate'?[7,21]:[1,3];
 const days=Math.max(range[0],Math.round((range[0]+Math.random()*(range[1]-range[0]))*(1-conditioning/500)*(1-durabilityRating(p)/700)));
 return {name:names[severity][Math.floor(Math.random()*3)],severity,days};
}
function durabilityMedicalCheck(p,club,minutes,energy,result,training=false){
 if(injuryDays(p)||club.roster.filter(q=>!injuryDays(q)).length<=leagueRules().courtPlayers)return;
 const conditioning=coachingSkill(club,'conditioning'),chance=durabilityInjuryChance(p,minutes,energy,conditioning)*(training?.25:b2bInjuryMultiplier(p,minutes));
 const roll=Math.random();if(roll>=chance){if(!training&&durabilityRating(p)>=90&&roll<chance+.003&&result&&result.rotationEvents.length<120)result.rotationEvents.push(p.name+' takes an awkward fall, shakes it off and finishes the game. No injury reported.');return;}
 const injury=durabilityInjuryDetails(p,conditioning),until=medicalStamp()+(training?0:1)+injury.days;
 p.medicalInfo={name:injury.name,severity:injury.severity,until,rehabUntil:until+14};delete p.injuredUntil;
 const report=p.name+' ('+club.abbr+'): '+injury.severity.toLowerCase()+' '+injury.name+' after '+(training?'offseason training':'the game')+'; expected recovery '+injury.days+' days.';
 say('MEDICAL REPORT: '+report);if(result&&result.rotationEvents.length<120)result.rotationEvents.push('MEDICAL: '+report);
}
function durabilityAfterGame(club,result,runtime){for(const p of club.roster){const row=result.box.find(r=>r.playerId===p.id);if(row?.mp>0)durabilityMedicalCheck(p,club,row.mp,runtime.stamina.get(p.id),result)}}
function durabilityHealthText(p){const days=injuryDays(p);if(days)return (p.medicalInfo?p.medicalInfo.severity+' '+p.medicalInfo.name:'Non-contact strain')+' · '+days+' days until expected return. Unavailable during recovery.';if(p.medicalInfo&&medicalStamp()<p.medicalInfo.rehabUntil)return 'Cleared to play · Recent injury: '+p.medicalInfo.name+'. Elevated reinjury risk for '+(p.medicalInfo.rehabUntil-medicalStamp())+' more days.';return 'Healthy · Available to play.'}
