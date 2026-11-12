/* Injury recovery: long-term effects of severe injuries, playing through minor ones, and post-injury retirement risk.
   Durations, ranges, day-to-day rolls and reinjury windows live in durability.js. */

// Torn ACL / Achilles: permanent athletic loss (speed and jumping; the engine has no separate quickness rating, so
// speed carries it), larger for older players, and a chance of never getting back to the same level. Overall follows
// the attributes the same way commissioner edits do (average change of the 19 skill ratings), and potential keeps its
// headroom. The injury is recorded in p.majorInjury for retirement odds and the profile.
const MAJOR_INJURY_EFFECTS={'torn ACL':{spd:[2,5],jmp:[2,6],decline:.15},'torn Achilles':{spd:[3,6],jmp:[4,8],decline:.28}};
function majorInjuryAgeFactor(age){return age<25?.6:age<28?.85:age<31?1.15:age<34?1.5:1.9}
function majorInjuryEffects(p,injury,random=Math.random){
 const e=MAJOR_INJURY_EFFECTS[injury.name];if(!e||!p.attributes)return null;withBasketballAttributes(p);
 const age=p.age??27,f=majorInjuryAgeFactor(age),roll=([lo,hi])=>Math.round((lo+random()*(hi-lo))*f),before={ovr:p.ovr,pot:p.pot,spd:p.attributes.spd,jmp:p.attributes.jmp};
 const hits={spd:roll(e.spd),jmp:roll(e.jmp)};for(const [k,n] of Object.entries(hits))p.attributes[k]=ratingLimit(p.attributes[k]-n);
 const skill=ATTRIBUTE_KEYS.filter(k=>k!=='hgt'&&k!=='dur'),athleticDrop=Math.round((before.spd-p.attributes.spd+before.jmp-p.attributes.jmp)/skill.length);
 // Never the same: chance rises with age; costs overall and every skill rating (development applies the change).
 const neverSame=random()<Math.min(.6,e.decline+Math.max(0,age-28)*.03),decline=neverSame?Math.round((3+random()*4)*Math.min(1.6,f)):0;
 if(decline&&typeof developAttributes==='function'){const keep={spd:p.attributes.spd,jmp:p.attributes.jmp};developAttributes(p,-decline);Object.assign(p.attributes,keep)}
 p.ovr=Math.max(30,p.ovr-athleticDrop-decline);p.pot=Math.max(p.ovr,Math.min(p.pot,before.pot-athleticDrop-decline));
 p.majorInjury={name:injury.name,year:state.year,age,days:injury.days,spd:-hits.spd,jmp:-hits.jmp,ovr:p.ovr-before.ovr,neverSame};
 if(typeof ensurePlayerArchetype==='function')ensurePlayerArchetype(p,state.year,true);
 return p.majorInjury;
}

// Playing through a minor injury: about 4% off effective ratings while hampered (day-to-day window).
const injuryEffectiveBefore=effectiveAttribute;
effectiveAttribute=function(p,...rest){const v=injuryEffectiveBefore(p,...rest);return injuryHampered(p)?v*.96:v};

// Retirement: within a season of a torn ACL/Achilles, players 30 and older are more likely to retire (more with age and
// when they never got back to their level).
const injuryRetireBefore=lifecycleRetireChance;
lifecycleRetireChance=function(p,season){const base=injuryRetireBefore(p,season),m=p.majorInjury;if(!m||p.age<30||state.year-m.year>1||base>=1)return base;return Math.min(.98,base*(1.5+(m.neverSame?.5:0))+.04+Math.max(0,p.age-32)*.02)};

// Saves keep the major-injury record (validated).
function readMajorInjury(raw,bad){if(raw===undefined)return undefined;const int=(n,lo,hi)=>Number.isInteger(n)&&n>=lo&&n<=hi;if(!raw||!Object.hasOwn(MAJOR_INJURY_EFFECTS,raw.name)||!int(raw.year,0,10000)||!int(raw.age,10,80)||!int(raw.days,0,1000)||!int(raw.spd,-40,0)||!int(raw.jmp,-40,0)||!int(raw.ovr,-60,0)||typeof raw.neverSame!=='boolean')bad('invalid major injury record.');return {name:raw.name,year:raw.year,age:raw.age,days:raw.days,spd:raw.spd,jmp:raw.jmp,ovr:raw.ovr,neverSame:raw.neverSame}}
const injuryValidateBefore=validateCareerData;
validateCareerData=function(raw){const out=injuryValidateBefore(raw),bad=m=>{throw Error('Invalid save: '+m)},all=s=>[...(s.teams||[]).flatMap(t=>t.roster||[]),...(s.free||[]),...(s.draftRights||[]).map(r=>r.player),...(s.draft?.prospects||[])].filter(Boolean);
 const records=new Map(all(raw||{}).filter(p=>p.majorInjury!==undefined).map(p=>[p.id,readMajorInjury(p.majorInjury,bad)]));for(const p of all(out))if(records.has(p.id))p.majorInjury=records.get(p.id);return out};
