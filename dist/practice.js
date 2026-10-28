/* In-season practices: teams without a game (and not before a back-to-back) may practice on regular-season days.
   Practice uses the training-mode medical check with a practice-load minute equivalent scaled by intensity. */
const PRACTICE_LEVELS={light:{label:'Light',minutes:12,conditioning:-2},standard:{label:'Standard',minutes:18,conditioning:0},intense:{label:'Intense',minutes:26,conditioning:3}};
// Chance that an eligible team holds practice on an off day, and the practice injury rate relative to game minutes.
const PRACTICE_CHANCE=.5,PRACTICE_INJURY_RISK=.5,PRACTICE_ENERGY=95;
let practiceLastDay=null;
function readPracticeIntensity(value,bad){if(!Object.hasOwn(PRACTICE_LEVELS,value))bad('invalid practice intensity.');return value}
// Coaches set the default: Grit & Grind runs hard practices, Seven Seconds or Less keeps them light.
function practiceIntensity(club){if(club.practiceIntensity)return club.practiceIntensity;const system=club.coach?.system;return system==='Grit & Grind'?'intense':system==='Seven Seconds or Less'?'light':'standard'}
function practiceInjuryScale(){const r=leagueRules();return r.practiceInjuries?PRACTICE_INJURY_RISK*r.practiceInjuryFrequency:0}
const coachingSkillBeforePractice=coachingSkill;coachingSkill=function(club,key){const n=coachingSkillBeforePractice(club,key);return key==='conditioning'?Math.max(1,Math.min(99,n+PRACTICE_LEVELS[practiceIntensity(club)].conditioning)):n};
function teamPlaysOn(id,day){return !!state.schedule[day]?.some(pair=>pair.includes(id))}
function practiceBreakDay(day){const c=state.allStarCalendar;return !!c&&day>=c.breakStart-1&&day<=c.breakEnd-1}
function practiceEligible(club,day){return !expansionPendingSeason(club)&&!teamPlaysOn(club.id,day)&&!(teamPlaysOn(club.id,day+1)&&teamPlaysOn(club.id,day+2))&&!practiceBreakDay(day)}
function runPracticeDay(day){
 const held=[];if(day<0||day>=seasonLength())return held;
 for(const club of state.teams){if(!practiceEligible(club,day)||Math.random()>=PRACTICE_CHANCE)continue;held.push(club.id);if(!practiceInjuryScale())continue;
  const minutes=PRACTICE_LEVELS[practiceIntensity(club)].minutes;for(const p of [...club.roster])if(!injuryDays(p))durabilityMedicalCheck(p,club,minutes,PRACTICE_ENERGY,null,'practice')}
 return held;
}
// ownerDay runs once after each simulated day (state.day already advanced); ownerFinalize re-runs it at season end.
const ownerDayBeforePractice=ownerDay;ownerDay=function(...args){const key=state.year+':'+state.day;if(practiceLastDay!==key){practiceLastDay=key;if(state.champion===null&&state.day<=seasonLength())runPracticeDay(state.day-1)}return ownerDayBeforePractice(...args)};
function practiceEditable(club){return club.id===controlledTeamId()||!!state.commissioner?.enabled}
function setPracticeIntensity(id,value){const club=state.teams.find(t=>t.id===id);if(!club||!practiceEditable(club)||!Object.hasOwn(PRACTICE_LEVELS,value))return;club.practiceIntensity=value;save();render();toast('Practice intensity set to '+PRACTICE_LEVELS[value].label.toLowerCase()+'.')}
function practiceIntensityControl(club){
 const level=practiceIntensity(club),help='Higher intensity adds slight practice injury risk and a small conditioning boost.';
 if(!practiceEditable(club))return '<div class="coach-summary practice-intensity"><span>Practice intensity: '+PRACTICE_LEVELS[level].label+'</span></div>';
 return '<div class="coach-summary practice-intensity"><label>Practice intensity <select onchange="setPracticeIntensity('+club.id+',this.value)">'+Object.entries(PRACTICE_LEVELS).map(([k,v])=>'<option value="'+k+'" '+(k===level?'selected':'')+'>'+v.label+'</option>').join('')+'</select></label><small>'+help+'</small></div>';
}
const coachCardBeforePractice=coachRosterCard;coachRosterCard=function(club){const html=coachCardBeforePractice(club),i=html.lastIndexOf('</section>');return i<0?html:html.slice(0,i)+practiceIntensityControl(club)+html.slice(i)};
