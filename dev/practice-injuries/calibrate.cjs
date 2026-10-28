// Injury calibration: simulates full NBA seasons and reports injuries by source, games missed and severity.
// Usage (repo root): node dev/practice-injuries/calibrate.cjs <root> <seasons> <label> [seed]
// <root> is the checkout to measure (e.g. a main worktree for "before"). Writes dev/practice-injuries/<label>-<seed>.json
// Injuries are counted from durabilityMedicalCheck calls that set a new medical record: game (no training flag),
// training camp (training=true) or practice (training='practice'). Games missed = injured roster players at each
// regular-season tip-off.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(process.argv[2]||'.'),seasons=+(process.argv[3]||3),label=process.argv[4]||'run',seed=+(process.argv[5]||2026);
const {loadLeague}=require(path.join(root,'dev/load-league.cjs'));
(async()=>{
 const l=loadLeague({seed,strictDOM:false});l.setRandomSeed(seed);
 l.run(`var d=makeDraft();d.gmName='Injury audit';state=validateCareerData(buildSetupCareer(d));
  globalThis.injuryAudit={};const season=()=>injuryAudit[state.year]??={injuries:{game:0,camp:0,practice:0},severity:{Minor:0,Moderate:0,Severe:0},practiceSeverity:{Minor:0,Moderate:0,Severe:0},gamesMissed:0,teamGames:0,days:0};
  const checkBefore=durabilityMedicalCheck;durabilityMedicalCheck=function(p,club,minutes,energy,result,training=false){const before=p.medicalInfo,out=checkBefore(p,club,minutes,energy,result,training);
   if(p.medicalInfo&&p.medicalInfo!==before){const s=season(),kind=training==='practice'?'practice':training?'camp':'game';s.injuries[kind]++;s.severity[p.medicalInfo.severity]++;if(kind==='practice')s.practiceSeverity[p.medicalInfo.severity]++;s.days+=injuryDays(p)}return out};
  const playBefore=play;play=function(a,b,stage='Regular season'){if(stage==='Regular season'){const s=season();for(const id of [a,b]){s.teamGames++;s.gamesMissed+=state.teams[id].roster.filter(p=>injuryDays(p)>0).length}}return playBefore(a,b,stage)};`);
 const started=Date.now();
 for(let i=0;i<seasons;i++){await l.run(`simulateMultipleSeasonsHeadless(1,{seed:${seed+i},log:false,yieldControl:()=>new Promise(r=>setImmediate(r))})`);console.log('season',i+1,'done',Math.round((Date.now()-started)/1000)+'s')}
 const audit=JSON.parse(l.run('JSON.stringify(injuryAudit)')),teams=l.run('state.teams.length');
 const rows=Object.entries(audit).filter(([,s])=>s.teamGames>0).map(([year,s])=>{const total=s.injuries.game+s.injuries.camp+s.injuries.practice;return {year:+year,total,...s.injuries,practiceShare:total?+(s.injuries.practice/total).toFixed(3):0,severe:s.severity.Severe,gamesMissedPerTeam:+(s.gamesMissed/teams).toFixed(1),practiceSeverity:s.practiceSeverity}});
 const sum=k=>rows.reduce((n,r)=>n+r[k],0),report={label,root,seed,seasons:rows.length,perSeason:{injuries:+(sum('total')/rows.length).toFixed(1),practiceShare:+(sum('practice')/Math.max(1,sum('total'))).toFixed(3),severe:+(sum('severe')/rows.length).toFixed(1),gamesMissedPerTeam:+(sum('gamesMissedPerTeam')/rows.length).toFixed(1)},rows};
 fs.writeFileSync(path.join(__dirname,`${label}-${seed}.json`),JSON.stringify(report,null,1));console.log(JSON.stringify(report.perSeason));
})().catch(e=>{console.error(e);process.exitCode=1});
