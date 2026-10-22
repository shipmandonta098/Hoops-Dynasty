/* Altitude v1: bounded simulation estimates, not measured physiological coefficients.
   Location, not franchise identity, controls effects. Sources/provenance: altitude-data.js. */
let altitudeMatch=null;
function altitudeClamp(n,a,b){return Math.max(a,Math.min(b,n))}
function altitudeKey(s){return String(s||'').toLowerCase().replace(/[.,]/g,'').trim()}
function altitudeVenue(t,year=state.year){
 const city=altitudeKey(t.arenaCity||t.city),alias=ALTITUDE_CITY_ALIASES[city]||city;
 const historical=(!t.arenaName||t.arenaName===t.city+' Arena')?ALTITUDE_HISTORICAL_VENUES.find(v=>v.city===alias&&v.team===altitudeKey(t.name)&&year>=v.from&&year<=v.to):null;
 const arenaName=historical?.arena||t.arenaName||t.city+' Arena';
 const manual=t.elevationFt!==null&&t.elevationFt!==undefined;
 const arena=ALTITUDE_ARENAS.find(v=>v.cities.includes(alias)&&v.names.includes(altitudeKey(arenaName))&&year>=v.from&&year<=v.to);
 const ft=manual?t.elevationFt:arena?.feet??ALTITUDE_CITIES[alias]??null;
 return {city:t.arenaCity||t.city,arena:arenaName,feet:ft,quality:manual?'User assigned':arena?'Arena location estimate':ft===null?'Unknown — no altitude effect':'Approximate city elevation',source:manual?'User assigned':historical?.source||arena?.source||ALTITUDE_SOURCES.cities};
}
function altitudeTravel(club,venue,day=state.day){
 const home=altitudeVenue(club),records=(club.altitudeVisits||[]).filter(v=>v.year===state.year&&v.day<day&&day-v.day<=14).sort((a,b)=>a.day-b.day);
 let acclimated=home.feet??0,previous=null,roadGames=0;
 for(const visit of records){
  const gap=previous?visit.day-previous.day:1;
  // Only infer stays between close games at similar elevation. Long gaps imply returning home.
  if(gap>4){acclimated=home.feet??0;roadGames=0}
  const days=previous&&gap<=4&&Math.abs(previous.feet-visit.feet)<=1000?gap:0.5;
  acclimated+=(visit.feet-acclimated)*(1-Math.exp(-days/5));
  roadGames=visit.away?roadGames+1:0;previous=visit;
 }
 const gap=previous?day-previous.day:Infinity;
 const days=previous&&gap<=4&&Math.abs(previous.feet-(venue.feet??0))<=1000?Math.max(.25,gap-.25):.25;
 if(gap>4)acclimated=home.feet??0;
 const priorElevation=acclimated;
 acclimated+=((venue.feet??0)-acclimated)*(1-Math.exp(-days/5));
 return {homeFeet:home.feet,priorElevation,acclimatedFeet:acclimated,estimatedDays:days,roadGames,previousCity:previous?.city||home.city,policy:'Estimated itinerary: short similar-elevation road stops continue; gaps over four days return home.'};
}
function altitudeEnvironment(a,b,stage='Regular season',day=state.day){
 const venue=altitudeVenue(state.teams[a]),travel=altitudeTravel(state.teams[b],venue,day),neutral=/all.star|rising|exhibition|neutral/i.test(stage),strength=leagueRules().altitudeStrength??1;
 const difference=venue.feet===null||travel.homeFeet===null?0:Math.max(0,venue.feet-travel.acclimatedFeet);
 const excess=Math.max(0,difference-1500),exposure=neutral?0:Math.min(.12,excess/1000*.016)*strength;
 return {version:1,year:state.year,day,homeId:a,awayId:b,venue,travel,exposure,neutral,impact:exposure<.005?'Negligible':exposure<.025?'Low':exposure<.05?'Moderate':exposure<.09?'High':'Extreme',acclimatization:difference<1000?'High':travel.estimatedDays>=2?'Moderate':'Low'};
}
function altitudePlayerLoad(p,club,runtime){
 if(!altitudeMatch||club.id!==altitudeMatch.awayId||!altitudeMatch.exposure)return 0;
 const endu=p.attributes.endu,conditioning=coachingSkill(club,'conditioning'),energy=runtime.stamina.get(p.id)??100;
 const tolerance=.7+(100-endu)/200+(100-conditioning)/400;
 // Existing rest/injury engines own their penalties. Here they only modestly modulate the new cost.
 const workload=Math.max(0,100-energy)/500+(p.workload?.minutes||0)/600;
 const rehab=p.medicalInfo?.rehabUntil>medicalStamp() ? .05 : 0;
 return Math.min(.18,altitudeMatch.exposure*(tolerance+workload+rehab));
}
function altitudeDrain(p,club,runtime){return 1+altitudePlayerLoad(p,club,runtime)}
function altitudeRecovery(p,club,runtime){return 1-altitudePlayerLoad(p,club,runtime)*.5}
function altitudeRotationPenalty(p,club,runtime,clutch){
 const load=altitudePlayerLoad(p,club,runtime),energy=runtime.stamina.get(p.id)??100;
 return load*Math.max(0,80-energy)*coachingSkill(club,'rotation')/20*(clutch?.3:1);
}
function altitudeTimeout(clubs,runtimes){
 clubs.forEach((club,i)=>{const rt=runtimes[i];for(const p of club.roster)rt.stamina.set(p.id,Math.min(rt.initialEnergy.get(p.id),rt.stamina.get(p.id)+2*altitudeRecovery(p,club,rt)))});
}
function altitudeFatigueNote(clubs,runtimes,log){
 if(!altitudeMatch?.exposure||altitudeMatch.noted)return;
 const rt=runtimes[1],tired=[...rt.court].filter(id=>rt.stamina.get(id)<65);
 if(tired.length>=3){altitudeMatch.noted=true;log(1,clubs[1].city+' has '+tired.length+' players on court below 65% stamina; the higher elevation is adding to their fatigue.',true)}
}
function altitudePanel(env){
 if(!env)return '';
 return '<details class="panel note"><summary>Venue & altitude · '+escapeHTML(env.impact)+' impact</summary><p>'+escapeHTML(env.venue.arena)+' · '+escapeHTML(env.venue.city)+'<br>Elevation: '+(env.venue.feet===null?'Unknown':Math.round(env.venue.feet).toLocaleString()+' ft')+' · '+escapeHTML(env.venue.quality)+'</p><p>Visiting team acclimatization: '+escapeHTML(env.acclimatization)+' · Estimated exposure at similar elevation: '+env.travel.estimatedDays.toFixed(1)+' days. Previous stop: '+escapeHTML(env.travel.previousCity)+'.</p><p>Altitude adds a small stamina cost; shooting changes only through fatigue. Travel stays and impact bands are simulation estimates. Configure strength in League Settings; edit venue location/elevation in Team management.</p></details>';
}
function altitudeEditorFields(t){return `<label>Arena city<input name="arenaCity" onchange="this.form.elements.elevationFt.value=''" maxlength="60" value="${escapeHTML(t.arenaCity||'')}" placeholder="Use team city"><small>Actual venue location; leave blank to follow team city.</small></label><label>Elevation override (feet)<input name="elevationFt" type="number" min="-1500" max="15000" step="1" value="${t.elevationFt??''}" placeholder="Automatic city / arena estimate"><small>Blank uses location lookup. Set custom venues here.</small></label>`}
function altitudeEditedTeam(t,v){
 const changed=v.city!==undefined&&v.city.trim()!==t.city;
 const next={...t,arenaCity:v.arenaCity!==undefined?String(v.arenaCity).trim():changed?'':t.arenaCity||'',elevationFt:v.elevationFt!==undefined?(v.elevationFt===''?null:Number(v.elevationFt)):changed?null:t.elevationFt??null};
 return next;
}
const altitudeBrandBefore=readTeamBrand;
readTeamBrand=function(t,bad){const out=altitudeBrandBefore(t,bad);if(t.arenaCity!==undefined){if(typeof t.arenaCity!=='string'||t.arenaCity.length>60)bad('Invalid arena city');out.arenaCity=t.arenaCity.trim()}if(t.elevationFt!==undefined){if(t.elevationFt!==null&&(!Number.isInteger(t.elevationFt)||t.elevationFt< -1500||t.elevationFt>15000))bad('Elevation must be a whole number between -1,500 and 15,000 feet.');out.elevationFt=t.elevationFt}if(t.altitudeVisits!==undefined){if(!Array.isArray(t.altitudeVisits)||t.altitudeVisits.length>20)bad('Invalid altitude itinerary');out.altitudeVisits=t.altitudeVisits.map(v=>{if(!v||!Number.isInteger(v.year)||!Number.isInteger(v.day)||v.day<0||v.day>10000||!Number.isFinite(v.feet)||v.feet< -1500||v.feet>15000||typeof v.city!=='string'||v.city.length>60||typeof v.away!=='boolean')bad('Invalid altitude visit');return {year:v.year,day:v.day,feet:v.feet,city:v.city,away:v.away}})}return out};
const altitudeSimBefore=simulateAttributeGame;
simulateAttributeGame=function(a,b,stage='Regular season',...args){
 const previous=altitudeMatch,env=altitudeEnvironment(a,b,stage);altitudeMatch={...env};
 try{const result=altitudeSimBefore(a,b,stage,...args);result.altitude=env;
  if(!env.neutral&&env.venue.feet!==null)for(const id of [a,b]){const t=state.teams[id];t.altitudeVisits=[...(t.altitudeVisits||[]).filter(v=>v.year===state.year&&v.day!==state.day&&state.day-v.day<=14),{year:state.year,day:state.day,feet:env.venue.feet,city:env.venue.city,away:id===b}].slice(-20)}
  return result;
 }finally{altitudeMatch=previous}
};
function readAltitudeResult(v,bad){
 if(!v||v.version!==1||!Number.isInteger(v.year)||!Number.isInteger(v.day)||!Number.isInteger(v.homeId)||!Number.isInteger(v.awayId)||!Number.isFinite(v.exposure)||v.exposure<0||v.exposure>.24||typeof v.neutral!=='boolean'||!['Negligible','Low','Moderate','High','Extreme'].includes(v.impact)||!['Low','Moderate','High'].includes(v.acclimatization))bad('Invalid altitude snapshot');
 const venue=v.venue,travel=v.travel;
 if(!venue||!travel)bad('Missing altitude venue or travel');
 for(const k of ['city','arena','quality','source'])if(typeof venue[k]!=='string'||venue[k].length>500)bad('Invalid altitude venue');
 if(venue.feet!==null&&(!Number.isFinite(venue.feet)||venue.feet< -1500||venue.feet>15000))bad('Invalid venue elevation');
 for(const k of ['priorElevation','acclimatedFeet','estimatedDays','roadGames'])if(!Number.isFinite(travel[k])||Math.abs(travel[k])>20000)bad('Invalid acclimatization');
 if(travel.homeFeet!==null&&(!Number.isFinite(travel.homeFeet)||travel.homeFeet< -1500||travel.homeFeet>15000))bad('Invalid home elevation');
 for(const k of ['previousCity','policy'])if(typeof travel[k]!=='string'||travel[k].length>500)bad('Invalid itinerary');
 return {version:1,year:v.year,day:v.day,homeId:v.homeId,awayId:v.awayId,exposure:v.exposure,neutral:v.neutral,impact:v.impact,acclimatization:v.acclimatization,venue:{city:venue.city,arena:venue.arena,feet:venue.feet,quality:venue.quality,source:venue.source},travel:{homeFeet:travel.homeFeet,priorElevation:travel.priorElevation,acclimatedFeet:travel.acclimatedFeet,estimatedDays:travel.estimatedDays,roadGames:travel.roadGames,previousCity:travel.previousCity,policy:travel.policy}};
}
