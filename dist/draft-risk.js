/* Rookie development uncertainty. Uses the shared RNG for career events and persisted,
 * bounded lifecycle counters. Probabilities below are design targets, not measured NBA rates. */
function rookieRiskClamp(n,lo=0,hi=100){return Math.max(lo,Math.min(hi,n))}
function initializeDraftRisk(p){
 if(p.draftRisk)return p.draftRisk;
 // Stable private trait stream, like existing personality/durability generation.
 // Opening a scouting screen must not consume the basketball/transaction RNG.
 let seed=(Math.imul(p.id+17,2654435761)+p.ovr*97+p.pot*31)>>>0;
 const roll=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296},draw=(a,b)=>a+Math.floor(roll()*(b-a+1));
 const volatility=draw(1,100),workEthic=hasTrait(p,'gym')?draw(80,100):hasTrait(p,'lazy')?draw(1,35):draw(35,85);
 const scoutedPotential=p.pot,actualPotential=Math.max(p.ovr,Math.min(99,scoutedPotential+Math.round((roll()-.6)*volatility*.4)));
 return p.draftRisk={volatility,workEthic,injuryProneness:Math.round(rookieRiskClamp((100-durabilityRating(p))*1.5)),scoutedPotential,actualPotential,pick:0,entered:false,seasons:0,lastReview:0,lastConditioning:0,event:null,events:[],caps:null};
}
function rookieEnvironment(p,club){
 const games=club.w+club.l,losing=games>=10&&club.w/games<.3?25:0;
 const crowded=club.roster.some(q=>q.id!==p.id&&q.pos===p.pos&&q.ovr>=85)?20:0;
 const coaching=(coachingSkill(club,'offense')+coachingSkill(club,'defense'))/2;
 return rookieRiskClamp((100-coaching)*.45+(100-teamChemistry(club).score)*.35+losing+crowded);
}
function rookieBustScore(p,club){const r=p.draftRisk;return r.volatility*.4+rookieEnvironment(p,club)*.3+r.injuryProneness*.3}
function rookieRiskNews(p,club,text){const r=p.draftRisk;r.events.push({year:state.year,text});r.events=r.events.slice(-6);addNewsItem({category:'Draft',headline:p.name+': '+text,teams:club?[club.id]:[]})}
function rookieBustEvent(p,club,type){
 const r=p.draftRisk;if(!r||r.event)return false;r.event=type;
 if(type==='injury'){
  r.actualPotential=Math.max(55,Math.round(r.actualPotential*.8));p.ovr=Math.min(p.ovr,r.actualPotential);
  for(const k of ['spd','jmp','endu'])p.attributes[k]=ratingLimit(Math.round(p.attributes[k]*.8));
  rookieRiskNews(p,club,'A severe '+p.medicalInfo.name+' has reduced the rookie’s long-term ceiling. Recovery may not restore the same explosiveness.');
 }else if(type==='conditioning'){
  r.actualPotential=Math.max(p.ovr,r.actualPotential-8);
  rookieRiskNews(p,club,'Coaches are concerned about poor conditioning and effort. Development expectations have been revised downward.');
 }else{
  r.actualPotential=p.ovr;
  rookieRiskNews(p,club,'Scouting reassessment: executives believe this prospect has reached a hard ceiling, below the original projection.');
 }
 p.pot=r.actualPotential;r.caps={...p.attributes};
 if(type!=='ceiling')for(const k of ATTRIBUTE_KEYS)r.caps[k]=Math.min(99,r.caps[k]+Math.max(0,r.actualPotential-p.ovr));
 return true;
}
function rookieEnterLeague(p,club){
 const r=p.draftRisk;if(!r||!r.pick||r.entered)return;r.entered=true;
 // A high score flags real risk immediately, without fabricating an injury.
 if(rookieBustScore(p,club)>75)rookieBustEvent(p,club,r.workEthic<20?'conditioning':'ceiling');
}
function reviewDraftRiskSeason(){
 for(const club of state.teams)for(const p of club.roster){
  const r=p.draftRisk;if(!r||!r.entered||r.seasons>=2||r.lastReview===state.year)continue;
  const rows=state.history.filter(g=>g.stage==='Regular season').flatMap(g=>g.box.filter(x=>x.playerId===p.id&&x.mp>0));
  if(!rows.length)continue; // Unsigned, stashed, or entirely injured seasons are not low-minute failures.
  r.lastReview=state.year;r.seasons++;
  const mpg=rows.reduce((n,x)=>n+x.mp,0)/rows.length;
  if(rows.length>=10&&mpg<12&&!r.event){r.actualPotential=Math.max(p.ovr,r.actualPotential-2);rookieRiskNews(p,club,'Limited playing time has stalled development: the long-term ceiling slipped by two points.');}
  if(!r.event){
   const target=r.pick<=3?.125:r.pick<=10?.30:.20;
   const hazard=1-Math.sqrt(1-target),score=rookieBustScore(p,club);
   const chance=rookieRiskClamp(hazard*(.5+score/100)*(1+(50-r.workEthic)/150),.01,.4);
   if(Math.random()<chance)rookieBustEvent(p,club,r.workEthic<20?'conditioning':'ceiling');
   // Late picks more commonly settle as reserves; this is not a bust event.
   else if(r.pick>10&&r.seasons===2&&p.ovr<78&&Math.random()<.55){r.actualPotential=Math.max(p.ovr,Math.min(r.actualPotential,77));p.pot=r.actualPotential;rookieRiskNews(p,club,'The development outlook now projects a reserve role rather than a starting ceiling.');}
  }
 }
}
const draftRiskEnsureBefore=ensureDraft;ensureDraft=function(){const d=draftRiskEnsureBefore();for(const p of d.prospects)initializeDraftRisk(p);return d};
const draftRiskPickBefore=draftPickInternal;draftPickInternal=function(id){const d=ensureDraft(),p=d.prospects.find(p=>p.id===id),pick=d.picks.length+1;const ok=draftRiskPickBefore(id);if(ok&&p)p.draftRisk.pick=pick;return ok};
const draftRiskPlayBefore=play;play=function(a,b,stage='Regular season'){for(const club of [state.teams[a],state.teams[b]])for(const p of club.roster)rookieEnterLeague(p,club);return draftRiskPlayBefore(a,b,stage)};
const draftRiskMedicalBefore=durabilityMedicalCheck;durabilityMedicalCheck=function(p,club,...args){const before=p.medicalInfo;const result=draftRiskMedicalBefore(p,club,...args),r=p.draftRisk;if(r?.entered&&r.seasons<2&&r.injuryProneness>80&&p.medicalInfo!==before&&p.medicalInfo?.severity==='Severe')rookieBustEvent(p,club,'injury');return result};
const draftRiskInjuryBefore=durabilityInjuryChance;durabilityInjuryChance=function(p,...args){const chance=draftRiskInjuryBefore(p,...args),r=p.draftRisk;return Math.min(.15,chance*(r?.entered&&r.seasons<2?1+r.injuryProneness/200:1))};
const draftRiskDevelopmentBefore=traitDevelopment;traitDevelopment=function(p,club,base){
 let delta=draftRiskDevelopmentBefore(p,club,base);const r=p.draftRisk;if(!r)return delta;
 if(r.event==='conditioning'&&r.lastReview===state.year-1&&r.lastConditioning!==state.year){r.lastConditioning=state.year;delta=-rand(1,3);rookieRiskNews(p,club,'Reported to training camp out of shape; core skills declined from poor conditioning.');}
 else if(delta>0&&r.seasons<=2&&r.workEthic<50&&Math.random()>(r.workEthic+25)/75)delta=0;
 return Math.min(delta,Math.max(0,r.actualPotential-p.ovr));
};
const draftRiskAttributesBefore=developAttributes;developAttributes=function(p,delta){draftRiskAttributesBefore(p,delta);const r=p.draftRisk;if(!r)return;p.ovr=Math.min(p.ovr,r.actualPotential);if(r.caps)for(const k of ATTRIBUTE_KEYS)p.attributes[k]=Math.min(p.attributes[k],r.caps[k]);};
const draftRiskScoutingBefore=financeScoutedPotential;financeScoutedPotential=function(p){const r=p.draftRisk;if(!r||r.event)return draftRiskScoutingBefore(p);const accuracy=coachingSkill(team(),'scouting')/100;return {estimate:Math.round(r.scoutedPotential*(1-accuracy)+r.actualPotential*accuracy),range:Math.max(1,Math.round((1-accuracy)*r.volatility/3))}};
const draftRiskScoreBefore=draftScore;draftScore=function(p,club){if(!p.draftRisk)return draftRiskScoreBefore(p,club);const r=p.draftRisk,accuracy=coachingSkill(club,'scouting')/100;return draftRiskScoreBefore({...p,pot:Math.round(r.scoutedPotential*(1-accuracy)+r.actualPotential*accuracy)},club)};
const draftRiskProfileBefore=playerDevelopment;playerDevelopment=function(ctx){const r=ctx.p.draftRisk;return draftRiskProfileBefore(ctx)+(r?playerCard('DRAFT DEVELOPMENT OUTLOOK',`<p>${r.event?'Development setback: '+escapeHTML({injury:'Injury tragedy',ceiling:'Hard ceiling',conditioning:'Conditioning concerns'}[r.event]):'Potential is a scouting estimate, not a guarantee. Coaching, opportunity, health and work ethic influence development.'}</p>${r.events.map(e=>'<p>'+e.year+' · '+escapeHTML(e.text)+'</p>').join('')}`):'')};
function readDraftRisk(raw,bad){
 if(raw===undefined)return undefined;
 if(!raw||typeof raw!=='object')bad('invalid draft risk');
 for(const k of ['volatility','workEthic','injuryProneness','scoutedPotential','actualPotential'])if(!Number.isInteger(raw[k])||raw[k]<0||raw[k]>100)bad('invalid draft risk '+k);
 for(const [k,max] of [['pick',180],['seasons',2],['lastReview',10000],['lastConditioning',10000]])if(!Number.isInteger(raw[k])||raw[k]<0||raw[k]>max)bad('invalid draft risk '+k);
 if(typeof raw.entered!=='boolean'||![null,'injury','ceiling','conditioning'].includes(raw.event)||!Array.isArray(raw.events)||raw.events.length>6)bad('invalid draft risk lifecycle');
 if(raw.events.some(e=>!e||!Number.isInteger(e.year)||e.year<1900||e.year>10000||typeof e.text!=='string'||e.text.length>600))bad('invalid draft risk history');
 if(raw.caps!==null&&(!raw.caps||ATTRIBUTE_KEYS.some(k=>!Number.isInteger(raw.caps[k])||raw.caps[k]<1||raw.caps[k]>99)))bad('invalid draft risk caps');
 if(raw.actualPotential<1||raw.actualPotential>99||raw.scoutedPotential<1||raw.scoutedPotential>99)bad('invalid draft potential');
 return Object.fromEntries(['volatility','workEthic','injuryProneness','scoutedPotential','actualPotential','pick','entered','seasons','lastReview','lastConditioning','event','events','caps'].map(k=>[k,structuredClone(raw[k])]));
}
