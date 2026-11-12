/* Durability is independent of talent; deterministic migration preserves existing skills. */
function generatedDurability(p){let seed=(p.id+17)>>>0;for(const c of p.name)seed=(Math.imul(seed,31)+c.charCodeAt(0))>>>0;const roll=seed%100;return roll<12?35+seed%15:roll<40?50+seed%25:roll<90?75+seed%15:90+seed%10}
function withDurabilityAttributes(a,p){return a.dur===undefined?{...a,dur:generatedDurability(p)}:a}
function durabilityRating(p){return withBasketballAttributes(p).attributes.dur}
function durabilityTier(value){return value>=90?'Iron Man':value>=75?'Reliable':value>=50?'Fragile':'Injury Prone'}
function medicalStamp(){return Math.floor(calendarStampDate(state.day+1).getTime()/86400000)}
function readMedicalInfo(raw,bad){if(raw===undefined)return undefined;if(!raw||typeof raw.name!=='string'||!raw.name.length||raw.name.length>80||!['Minor','Moderate','Severe'].includes(raw.severity)||!Number.isInteger(raw.until)||!Number.isInteger(raw.rehabUntil)||raw.until< -100000||raw.until>4000000||raw.rehabUntil<raw.until||raw.rehabUntil>raw.until+60||raw.context!==undefined&&raw.context!=='practice'||raw.dayToDay!==undefined&&raw.dayToDay!==true||raw.hamperedUntil!==undefined&&(!Number.isInteger(raw.hamperedUntil)||raw.hamperedUntil<raw.until||raw.hamperedUntil>raw.until+10)||raw.restrictUntil!==undefined&&(!Number.isInteger(raw.restrictUntil)||raw.restrictUntil<raw.until||raw.restrictUntil>raw.until+60))bad('invalid medical record.');return {name:raw.name,severity:raw.severity,until:raw.until,rehabUntil:raw.rehabUntil,...(raw.context?{context:raw.context}:{}),...(raw.dayToDay?{dayToDay:true}:{}),...(raw.hamperedUntil!==undefined?{hamperedUntil:raw.hamperedUntil}:{}),...(raw.restrictUntil!==undefined?{restrictUntil:raw.restrictUntil}:{})}}
function durabilityFatigueMultiplier(p){return 1.2-durabilityRating(p)*.003}
function durabilityRecoveryMultiplier(p){return .8+durabilityRating(p)*.004}
function durabilityInjuryChance(p,minutes,energy,conditioning=50){
 if(!(minutes>0))return 0;
 const fragility=(100-durabilityRating(p))/100,recent=p.medicalInfo&&medicalStamp()>=p.medicalInfo.until&&medicalStamp()<p.medicalInfo.rehabUntil;
 // Per ten floor minutes, then compounded once after the game. All values are probabilities [0,1].
 const interval=(.0003+fragility*fragility*.012+(100-Math.max(0,Math.min(100,energy)))/100*.002)*(1-conditioning/200)*(recent?1.7:1);
 return Math.min(.15,1-Math.pow(1-interval,minutes/10))*INJURY_FREQUENCY_SCALE;
}
// Longer recoveries (moderate injuries, and ACL/Achilles tears that now carry over into the next season) and day-to-day
// minors raised player-games missed per team; injuries happen 20% less often so the total stays near the earlier baseline
// (5-season audit: 9.1 before; 10.6 at a 0.92 scale).
const INJURY_FREQUENCY_SCALE=.80;
// [name, fewest days, most days, news phrase, typical days, weight within the severity]. Durations are rolled from a
// PERT distribution (most near the typical value, tails toward both ends). Practice injuries use the same
// table with severity skewed minor. Ranges follow NBA return-to-play data (torn ACL mean about 13 months).
const INJURY_TYPES={
 Minor:[['twisted ankle',1,3,'a twisted ankle',1,1],['back spasms',1,4,'back spasms',2,1],['jammed finger',1,2,'a jammed finger',1,1],['sore knee',1,3,'a sore knee',1,1],['hip contusion',1,3,'a hip contusion',1,1],['calf tightness',1,3,'calf tightness',1,1],['ankle sprain',1,4,'an ankle sprain',2,1]],
 Moderate:[['hamstring strain',7,21,'straining a hamstring',11,20],['sprained wrist',6,16,'spraining a wrist',9,8],['bone bruise',7,21,'suffering a bone bruise',11,12],['groin strain',7,18,'straining a groin',10,14],['calf strain',14,28,'straining a calf',18,16],['high ankle sprain',21,42,'suffering a high ankle sprain',27,14],['MCL sprain',14,42,'spraining an MCL',21,10],['meniscus trim',28,49,'undergoing a meniscus trim',35,8]],
 Severe:[['torn Achilles',300,420,'a torn Achilles',345,12],['torn ACL',270,420,'a torn ACL',390,18],['fractured foot',60,120,'a fractured foot',80,30],['meniscus repair',120,180,'a meniscus repair',145,20],['MCL tear',60,120,'an MCL tear',80,20]]
};
// Minor injuries a player can usually play through (0 days, small performance hit, raised reinjury risk for a few days).
const DAY_TO_DAY_CHANCE={'ankle sprain':.7,'jammed finger':.7,'twisted ankle':.7};
const PRACTICE_SEVERITY={severe:.2,moderate:.4};
function injuryType(name){for(const severity of Object.keys(INJURY_TYPES)){const t=INJURY_TYPES[severity].find(t=>t[0]===name);if(t)return {severity,name:t[0],min:t[1],max:t[2],phrase:t[3],typical:t[4],weight:t[5]}}return null}
// PERT roll (Beta shaped by min / typical / max): most recoveries land near the typical value, with tails toward both
// ends and no pile-up on either bound. Mean = (min + 4·typical + max) / 6.
function gammaSample(k,random){if(k<1)return gammaSample(k+1,random)*Math.pow(random(),1/k);const d=k-1/3,c=1/Math.sqrt(9*d);for(;;){let x,v;do{const u1=random()||1e-12,u2=random();x=Math.sqrt(-2*Math.log(u1))*Math.cos(2*Math.PI*u2);v=1+c*x}while(v<=0);v=v*v*v;const u=random();if(u<1-.0331*x**4||Math.log(u||1e-12)<.5*x*x+d*(1-v+Math.log(v)))return d*v}}
function pertDays(min,mode,max,random=Math.random){if(max<=min)return min;const a=1+4*(mode-min)/(max-min),b=1+4*(max-mode)/(max-min),x=gammaSample(a,random),y=gammaSample(b,random);return min+(max-min)*x/(x+y)}
// Conditioning and durability shift the rolled duration by at most about ±13%; nothing is clamped onto the minimum.
function injuryDurationModifier(p,conditioning){return Math.max(.87,Math.min(1.13,1-(conditioning-60)*.0022-(durabilityRating(p)-70)*.0022))}
// Reinjury window after return: minor 3–5 days, moderate 14, severe 30 (ACL/Achilles 60).
function reinjuryWindow(severity,name){return severity==='Minor'?3+Math.floor(Math.random()*3):severity==='Moderate'?14:['torn ACL','torn Achilles'].includes(name)?60:30}
function durabilityInjuryDetails(p,conditioning,roll=Math.random(),context=null){
 const fragility=(100-durabilityRating(p))/100,practice=context==='practice',severe=(.001+fragility**3*.45)*(practice?PRACTICE_SEVERITY.severe:1),moderate=(.08+fragility*.35)*(practice?PRACTICE_SEVERITY.moderate:1);
 const severity=roll<severe?'Severe':roll<severe+moderate?'Moderate':'Minor',pool=INJURY_TYPES[severity],[name,min,max,,typical]=simWeighted(pool,t=>t[5]);
 if(severity==='Minor'&&context!=='training'&&Math.random()<(DAY_TO_DAY_CHANCE[name]??.35))return {name,severity,days:0,dayToDay:true};
 const days=Math.max(1,Math.round(pertDays(min,typical,max)*injuryDurationModifier(p,conditioning)));
 return {name,severity,days};
}
// In-game injury rate, trimmed so practice injuries keep total games missed near the pre-practice baseline.
const GAME_INJURY_SCALE=1;
function durabilityMedicalCheck(p,club,minutes,energy,result,training=false){
 if(injuryDays(p)||club.roster.filter(q=>!injuryDays(q)).length<=leagueRules().courtPlayers)return;
 const practice=training==='practice',conditioning=coachingSkill(club,'conditioning'),chance=durabilityInjuryChance(p,minutes,energy,conditioning)*(practice?practiceInjuryScale():training?.25:b2bInjuryMultiplier(p,minutes)*GAME_INJURY_SCALE);
 const roll=Math.random();if(roll>=chance){if(!training&&durabilityRating(p)>=90&&roll<chance+.003&&result&&result.rotationEvents.length<120)result.rotationEvents.push(p.name+' takes an awkward fall, shakes it off and finishes the game. No injury reported.');return;}
 const injury=durabilityInjuryDetails(p,conditioning,Math.random(),practice?'practice':training?'training':null);
 if(injury.dayToDay){const now=medicalStamp(),window=reinjuryWindow('Minor');p.medicalInfo={name:injury.name,severity:'Minor',until:now,rehabUntil:now+window,dayToDay:true,hamperedUntil:now+window,...(practice?{context:'practice'}:{})};delete p.injuredUntil;
  const note=p.name+' ('+club.abbr+') is day-to-day with '+(injuryType(injury.name)?.phrase||injury.name)+' and plays through it; slightly limited and at higher reinjury risk for a few days.';if(practice)return say(note);if(result&&result.rotationEvents.length<120)result.rotationEvents.push('MEDICAL: '+note);return}
 const until=medicalStamp()+(training?0:1)+injury.days,severe=injury.severity==='Severe';
 p.medicalInfo={name:injury.name,severity:injury.severity,until,rehabUntil:until+reinjuryWindow(injury.severity,injury.name),...(severe?{restrictUntil:until+INJURY_RESTRICTION_DAYS}:{}),...(practice?{context:'practice'}:{})};delete p.injuredUntil;
 if(severe&&typeof majorInjuryEffects==='function')majorInjuryEffects(p,injury);
 if(practice)return say(practiceInjuryHeadline(p,club,injury));
 const report=p.name+' ('+club.abbr+'): '+injury.severity.toLowerCase()+' '+injury.name+' after '+(training?'offseason training':'the game')+'; expected recovery '+injury.days+' days.';
 say('MEDICAL REPORT: '+report);if(result&&result.rotationEvents.length<120)result.rotationEvents.push('MEDICAL: '+report);
}
function durabilityAfterGame(club,result,runtime){for(const p of club.roster){const row=result.box.find(r=>r.playerId===p.id);if(row?.mp>0)durabilityMedicalCheck(p,club,row.mp,runtime.stamina.get(p.id),result)}}
function durabilityHealthText(p){const days=injuryDays(p);if(days)return (p.medicalInfo?medicalLabel(p):'Non-contact strain')+' · '+days+' days until expected return. Unavailable during recovery.';const m=p.medicalInfo,now=medicalStamp();if(m?.dayToDay&&now<m.rehabUntil)return 'Day-to-day · Playing through '+m.name+'. Slightly limited and at higher reinjury risk for '+(m.rehabUntil-now)+' more day'+(m.rehabUntil-now===1?'':'s')+'.';if(m&&now<m.rehabUntil)return 'Cleared to play · Recent injury: '+m.name+'. Elevated reinjury risk for '+(m.rehabUntil-now)+' more days.'+(injuryMinutesCap(p)<gameMinutes()?' Minutes restriction: about '+injuryMinutesCap(p)+' a game.':'');return 'Healthy · Available to play.'}
function medicalLabel(p){const m=p.medicalInfo;return m?m.severity+' '+m.name+(m.context==='practice'?' (practice)':''):'Injury'}
function practiceInjuryHeadline(p,club,injury){
 const who=p.name+' ('+club.abbr+')',type=injuryType(injury.name),phrase=type?.phrase||injury.name,days=injury.days,weeks=[Math.max(1,Math.floor(days/7)),Math.max(2,Math.ceil(days/7))];
 if(injury.severity==='Minor')return who+' left practice with '+phrase+(days<=3?' (day-to-day).':' (out '+days+' days).');
 if(injury.severity==='Moderate')return who+' will miss '+(weeks[0]===weeks[1]?weeks[0]+' weeks':weeks[0]+'–'+weeks[1]+' weeks')+' after '+phrase+' in practice.';
 const remaining=Math.max(0,seasonLength()-state.day)+60;
 return who+' suffers '+phrase+' in practice and is expected to miss '+(days>=remaining?'the season':'about '+Math.max(2,Math.round(days/30))+' months')+'.';
}

// Minutes restriction after returning from a severe injury: about 18 minutes for the first ten days back, then about 24
// until restrictUntil (about three weeks). Scaled to the league's game length.
const INJURY_RESTRICTION_DAYS=21;
function injuryMinutesCap(p){const m=p.medicalInfo;if(!m?.restrictUntil)return Infinity;const now=medicalStamp();if(now<m.until||now>=m.restrictUntil)return Infinity;const g=typeof gameMinutes==='function'?gameMinutes():48;return Math.round(g*(now-m.until<10?.375:.5))}
// Day-to-day: playing through a minor injury costs a little (applied to effective attributes in injury-recovery.js).
function injuryHampered(p){const m=p.medicalInfo;return !!(m?.dayToDay&&m.hamperedUntil&&medicalStamp()<m.hamperedUntil)}
