// Injury audit: simulates N full seasons (regular season, playoffs, offseason) headlessly and records every injury
// (type, severity, days, day-to-day, age, ratings at the time and one season later), player-games missed per team per
// regular season, and retirements of players who had a major injury.
// Usage: node dev/injury-audit.cjs [seasons=5] [seed=2026] [out=dev/audits/injury-realism/run.json]
const fs=require('node:fs'),path=require('node:path'),{loadLeague}=require('./load-league.cjs');
const [seasons='5',seed='2026',out='dev/audits/injury-realism/run.json']=process.argv.slice(2);
(async()=>{const l=loadLeague({seed:+seed,strictDOM:false});l.setRandomSeed(+seed);
 l.run(`render=()=>{};toast=()=>{};var d=makeDraft();d.gmName='Injury audit';state=validateCareerData(buildSetupCareer(d));
 var IA={injuries:[],missed:[],retired:[]},iaSeason=1;
 // Every new medical record (game, practice or offseason training): before/after snapshot of the player.
 var iaCheck=durabilityMedicalCheck;durabilityMedicalCheck=function(p,club,...rest){const before=p.medicalInfo,ratings={ovr:p.ovr,spd:p.attributes?.spd,jmp:p.attributes?.jmp};const r=iaCheck(p,club,...rest);
  if(p.medicalInfo&&p.medicalInfo!==before){const m=p.medicalInfo;IA.injuries.push({id:p.id,season:iaSeason,year:state.year,day:state.day,phase:state.champion!==null||state.day>=state.schedule.length?'offseason/playoffs':'regular',name:m.name,severity:m.severity,days:m.until-medicalStamp()-(rest[3]?0:1),dayToDay:!!m.dayToDay,context:m.context||(rest[3]?'training':'game'),age:p.age,dur:p.attributes?.dur,before:ratings,after:{ovr:p.ovr,spd:p.attributes?.spd,jmp:p.attributes?.jmp},rehab:m.rehabUntil-m.until,restrict:m.restrictUntil?m.restrictUntil-m.until:0})}return r};
 // Player-games missed: injured rostered players on each team for every regular-season game.
 var iaPlay=play;play=function(a,b,stage,...rest){if(stage==='Regular season'||stage===undefined)for(const id of [a,b]){const t=state.teams[id];IA.missed.push({year:state.year,team:id,out:t.roster.filter(p=>injuryDays(p)>0).length})}return iaPlay(a,b,stage,...rest)};`);
 l.context.options={seed:+seed,log:false,yieldControl:()=>new Promise(r=>setImmediate(r))};
 const snapshot=()=>JSON.parse(l.run(`JSON.stringify(Object.fromEntries([...state.teams.flatMap(t=>t.roster),...state.free].map(p=>[p.id,{ovr:p.ovr,spd:p.attributes?.spd,jmp:p.attributes?.jmp,age:p.age,...(p.majorInjury?{majorInjury:p.majorInjury}:{})}])))`));
 const seasonsOut=[];let prev=snapshot();
 for(let s=1;s<=+seasons;s++){l.run('iaSeason='+s);const t=Date.now(),before=new Set(JSON.parse(l.run('JSON.stringify([...state.teams.flatMap(t=>t.roster),...state.free].map(p=>p.id))')));
  const report=await l.run('simulateMultipleSeasonsHeadless(1,options)');const now=snapshot(),gone=[...before].filter(id=>!now[id]);
  seasonsOut.push({season:s,status:report.status,errors:report.errors.map(e=>String(e.error).slice(0,200)),seconds:(Date.now()-t)/1000,gone,ratingsBefore:prev,ratingsAfter:now});prev=now;
  console.log('season',s,report.status,Math.round((Date.now()-t)/1000)+'s');
  fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify({seed:+seed,seasons:seasonsOut,...JSON.parse(l.run('JSON.stringify(IA)'))}));
  if(report.status!=='completed')break}
})().catch(e=>{console.error(e);process.exit(1)});
