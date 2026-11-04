/* Secondary positions. p.pos stays the main position; p.secondaryPos lists at most one neighboring position the player can
   also cover, worked out from height (relative to the player's league) and ratings (guards who pass and handle → PG, wings with size → SF/PF, bigs with
   range → PF, strong rebounders and rim protectors → C). The calculation draws no random numbers.
   Players get the field in sweeps (load, each sim day, the draft class, offseason rollover); before that, helpers
   work it out on the fly without storing it. Each offseason it is recalculated from the new ratings, so a player can grow into a
   position, unless the commissioner set it by hand (secondaryPosManual).
   Uses: rotation depth ranks main > secondary > other; a defender whose main or secondary position matches the ball
   handler's position is weighted like a same-position defender; team needs count a player at 0.5 toward each
   secondary position. There is no out-of-position performance penalty. */
const POSITIONS=['PG','SG','SF','PF','C'];
const SECONDARY_POSITION_WEIGHT=.5;
// Fit for each position from ratings and height (inches). The height limits below are on the men's scale (a 7'0" center,
// a 6'1"-6'6" shooting guard). A player is measured against his or her own league: heightOnFitScale maps a height to the
// men's scale by where it sits in the gender's spread of position heights (POSITION_HEIGHT_RANGES, biographies.js), so a
// 6'5" WNBA center fits like a 7'0" NBA center and a 5'8" WNBA point guard like a 6'2" NBA point guard.
function positionFit(pos,a,h){const r=k=>a[k]??50,over=(x,limit,per)=>Math.max(0,x-limit)*per,under=(x,limit,per)=>Math.max(0,limit-x)*per;
 switch(pos){
  case 'PG':return r('pss')*.45+r('drb')*.35+r('oiq')*.2-over(h,78,5);
  case 'SG':return r('tp')*.35+r('per')*.25+r('drb')*.2+r('fg')*.2-over(h,80,5)-under(h,74,4);
  case 'SF':return r('per')*.25+r('tp')*.15+r('fg')*.15+r('diq')*.2+r('reb')*.1+r('stl')*.15-under(h,77,5)-over(h,83,5);
  case 'PF':return r('reb')*.3+r('stre')*.2+r('post')*.15+r('sbl')*.15+r('tp')*.2-under(h,80,4)-over(h,86,4);
  case 'C':return r('reb')*.3+r('sbl')*.3+r('rim')*.2+r('stre')*.2-under(h,84,6);
 }return 0}
function positionHeightScale(gender){const mids=Object.values(POSITION_HEIGHT_RANGES[gender==='female'?'female':'male']).map(([lo,hi])=>(lo+hi)/2),mean=mids.reduce((a,b)=>a+b,0)/mids.length;
 return {mean,sd:Math.sqrt(mids.reduce((n,x)=>n+(x-mean)**2,0)/mids.length)}}
function heightOnFitScale(h,gender){if(gender!=='female')return h;const from=positionHeightScale('female'),to=positionHeightScale('male');return to.mean+(h-from.mean)*to.sd/from.sd}
// At most one neighboring position: the best one whose fit is within reach of the main position's fit. Bigs with range get a
// boost toward PF; guards who pass and handle well get a boost toward PG.
const SECONDARY_FIT_MARGIN=4;
function computeSecondaryPositions(p){const a=p.attributes;if(!a||!POSITIONS.includes(p.pos))return null;const h=Number.isFinite(p.bio?.heightInches)?heightOnFitScale(p.bio.heightInches,p.gender):70+Math.round((a.hgt??50)*.18),i=POSITIONS.indexOf(p.pos),own=positionFit(p.pos,a,h);
 return [POSITIONS[i-1],POSITIONS[i+1]].filter(Boolean).map(pos=>{let fit=positionFit(pos,a,h);if(pos==='PF'&&p.pos==='C')fit+=Math.max(0,(a.tp??0)-55)*.4;if(pos==='PG'&&p.pos==='SG')fit+=Math.max(0,((a.pss??0)+(a.drb??0))/2-70)*.4;return {pos,fit}})
  .filter(x=>x.fit>=own-SECONDARY_FIT_MARGIN).sort((x,y)=>y.fit-x.fit||POSITIONS.indexOf(x.pos)-POSITIONS.indexOf(y.pos)).slice(0,1).map(x=>x.pos)}
// The player's secondary positions. Read-only: when the field is missing it is worked out on the fly; the sweeps
// below store it, so views never change the save.
function secondaryPositions(p){if(!p)return [];if(!Array.isArray(p.secondaryPos))return computeSecondaryPositions(p)||[];return p.secondaryPos.filter(x=>x!==p.pos)}
function playerPositions(p){return [p.pos,...secondaryPositions(p)]}
// 2 main, 1 secondary, 0 otherwise (rotation ranking); 1 / 0.5 / 0 for team needs.
function positionRank(p,pos){return p.pos===pos?2:secondaryPositions(p).includes(pos)?1:0}
function positionNeedWeight(p,pos){return p.pos===pos?1:secondaryPositions(p).includes(pos)?SECONDARY_POSITION_WEIGHT:0}
function positionCount(players,pos){return players.reduce((n,p)=>n+positionNeedWeight(p,pos),0)}
function playsPosition(p,pos){return positionRank(p,pos)>0}
// "PG/SG": main position and the first secondary. The profile shows the full list.
function positionLabel(p){const s=secondaryPositions(p);return s.length?p.pos+'/'+s[0]:p.pos}
function positionFullLabel(p){const s=secondaryPositions(p);return s.length?p.pos+' · also '+s.join(', '):p.pos}
function allLeaguePlayers(data=state){return [...data.teams.flatMap(t=>t.roster),...(data.free||[]),...(data.draftRights||[]).map(r=>r.player),...(data.draft?.prospects||[])]}
// Fill in missing secondary positions; recalc=true redoes every player not set by hand (offseason).
function sweepSecondaryPositions(data=state,recalc=false){for(const p of allLeaguePlayers(data)){if(!p||(!recalc||p.secondaryPosManual)&&Array.isArray(p.secondaryPos))continue;const s=computeSecondaryPositions(p);if(s)p.secondaryPos=s}}
// Save checker: at most one secondary position, never the main position. Saves from when players could have two
// keep the first and drop the second.
function readSecondaryPositions(raw,pos,bad){if(!Array.isArray(raw)||raw.length>2||new Set(raw).size!==raw.length||raw.some(x=>!POSITIONS.includes(x)||x===pos))bad('invalid secondary positions.');return raw.slice(0,1)}
// Wiring: old saves get secondary positions on load; new players and draft classes as they appear; every player is
// re-evaluated at the offseason rollover (ratings have changed). League stats show "PG/SG" for current players.
const validateBeforeSecondary=validateCareerData;validateCareerData=function(raw){const out=validateBeforeSecondary(raw);sweepSecondaryPositions(out);return out};
const milestoneBeforeSecondary=seasonMilestoneDay;seasonMilestoneDay=function(...args){const r=milestoneBeforeSecondary(...args);sweepSecondaryPositions();return r};
const ensureDraftBeforeSecondary=ensureDraft;ensureDraft=function(...args){const d=ensureDraftBeforeSecondary(...args);for(const p of d?.prospects||[])if(!Array.isArray(p.secondaryPos)){const s=computeSecondaryPositions(p);if(s)p.secondaryPos=s}return d};
const newSeasonBeforeSecondary=newSeason;newSeason=function(...args){const year=state.year,r=newSeasonBeforeSecondary(...args),after=()=>{if(state.year!==year)sweepSecondaryPositions(state,true)};if(r&&typeof r.then==='function')return r.then(v=>{after();return v});after();return r};
const statsValueBeforeSecondary=statsValue;statsValue=function(r,key){if(key==='pos'&&statsUI.tab!=='history'&&Number.isInteger(r?.id)){const p=[...state.teams.flatMap(t=>t.roster),...state.free].find(p=>p.id===r.id);if(p&&p.pos===r.pos)return positionLabel(p)}return statsValueBeforeSecondary(r,key)};
