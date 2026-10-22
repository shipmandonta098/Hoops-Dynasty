// Focused, single-season verification. No production changes or alternative engine.
const fs=require('node:fs'),path=require('node:path');
const mode=process.argv[2]||'small';
if(!['before','small','full'].includes(mode))throw Error('Use before, small, or full only.');
const root=mode==='before'?path.resolve(process.argv[3]):path.resolve(__dirname,'..');
const output=path.join(__dirname,`verification-aging-${mode}.json`);
if(mode==='full'){
 const gate=JSON.parse(fs.readFileSync(path.join(__dirname,'verification-aging-small.json')));
 if(gate.status!=='completed'||gate.verification.agingFailures||gate.verification.otherIntegrityFailures)throw Error('Small-league integrity gate must pass first.');
}
const {loadLeague}=require(path.join(root,'dev/load-league.cjs'));
(async()=>{
 const realm=loadLeague({seed:2026});
 if(mode==='full')realm.setRandomSeed(2026);
 realm.run(`const setup=makeDraft();setup.gmName='Benchmark GM';${mode==='full'?'':"setup.teams=setup.teams.slice(0,6);setup.meetings=2;"}state=validateCareerData(buildSetupCareer(setup));`);
 const startPlayers=realm.run('fastAllPlayers().length');
 // Observe existing functions; no additional RNG draws or state mutations.
 realm.run(`globalThis.ageAudit={rows:[],classes:{},beforeRollover:null,afterRollover:null,champion:null};
 const auditDraftBefore=ensureDraft;ensureDraft=function(){const d=auditDraftBefore();ageAudit.classes[d.year]??=d.prospects.map(p=>p.id);return d;};
 const auditTraceBefore=traceSeasonAging;traceSeasonAging=function(){const trace=auditTraceBefore(),finish=trace.finish;ageAudit.beforeRollover=fastAllPlayers().length;ageAudit.champion={id:state.champion,name:state.teams[state.champion].city+' '+state.teams[state.champion].name};return {...trace,finish(){const rows=finish();ageAudit.rows=[...rows.values()];ageAudit.afterRollover=fastAllPlayers().length;return rows;}};};`);
 let last=0;realm.context.auditOptions={seed:2026,log:false,yieldControl:()=>new Promise(resolve=>setImmediate(resolve)),onProgress:p=>{if(performance.now()-last>15000){fs.writeFileSync(output+'.progress.json',JSON.stringify(p));last=performance.now();}}};
 const report=await realm.run('simulateMultipleSeasonsHeadless(1,auditOptions)');
 const audit=JSON.parse(realm.run('JSON.stringify(ageAudit)'));
 // Independent DOB oracle: UTC birthday comparison at the documented season reference.
 const oracle=row=>{const dob=new Date(row.birthdate+'T00:00:00Z'),reference=new Date(Date.UTC(row.newSeason,9,1));const anniversary=new Date(Date.UTC(row.newSeason,dob.getUTCMonth(),dob.getUTCDate()));return reference.getUTCFullYear()-dob.getUTCFullYear()-(anniversary>reference?1:0);};
 const issues=report.errors.flatMap(e=>e.issues||[]),byId=new Map();
 for(const issue of issues.filter(x=>x.system==='Aging')){const row=byId.get(issue.playerId)||{...issue,reasons:[]};row.reasons.push(issue.problem);byId.set(issue.playerId,row);}
 for(const row of audit.rows){const expected=oracle(row);if(row.afterAge!==expected){const failure=byId.get(row.playerId)||{...row,reasons:[]};failure.reasons.push(`Independent DOB oracle expected ${expected} on ${row.newSeason}-10-01; actual ${row.afterAge}`);byId.set(row.playerId,failure);}}
 const currentIds=new Set(realm.run('fastAllPlayers().map(p=>p.id)'));
 const draftedIds=realm.run('(state.draftHistory||[]).find(x=>x.year===2026)?.picks.map(p=>p.id)||[]');
 report.verification={sourceMode:mode==='before'?'pre-fix production with current diagnostics':'current published production',playersAtSeasonStart:startPlayers,playersBeforeRollover:audit.beforeRollover,playersAfterRollover:audit.afterRollover,playersChecked:audit.rows.length,playersCorrect:audit.rows.filter(r=>r.afterAge===oracle(r)&&r.agingApplications===1).length,agingFailures:byId.size,agingValidatorFindings:issues.filter(x=>x.system==='Aging').length,otherIntegrityFailures:issues.filter(x=>x.system!=='Aging').length,independentDOBOracleFailures:audit.rows.filter(r=>r.afterAge!==oracle(r)).length,retirements:audit.rows.filter(r=>r.afterStatus==='retired').length,generatedProspectsBySeason:Object.fromEntries(Object.entries(audit.classes).map(([y,ids])=>[y,ids.length])),draftedRookies:draftedIds.length,draftedRookiesRetained:draftedIds.filter(id=>currentIds.has(id)).length,champion:audit.champion,firstTenFailures:[...byId.values()].slice(0,10),allAgingRows:audit.rows};
 if(report.status==='completed'&&byId.size)report.status='failed';
 fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 const v=report.verification;
 console.log(v.agingFailures?'AGING VALIDATION FAILED':'AGING VALIDATION PASSED');
 console.log(JSON.stringify({mode,games:report.gamesSimulated,runtimeSeconds:report.runtimeMs/1000,playersAtSeasonStart:startPlayers,playersBefore:v.playersBeforeRollover,playersAfter:v.playersAfterRollover,totalPlayersChecked:v.playersChecked,totalFailures:v.agingFailures,validatorFindings:v.agingValidatorFindings,otherIntegrityFailures:v.otherIntegrityFailures,playersCorrect:v.playersCorrect,retirements:v.retirements,generatedProspectsBySeason:v.generatedProspectsBySeason,draftedRookies:v.draftedRookies,draftedRookiesRetained:v.draftedRookiesRetained,champion:v.champion,integrity:report.status},null,2));
 v.firstTenFailures.forEach((r,i)=>console.log(`\nFailure #${i+1}\nPlayer ID: ${r.playerId}\nPlayer name: ${r.playerName}\nDOB: ${r.birthdate}\nStored age before: ${r.beforeAge}\nStored age after: ${r.afterAge}\nExpected age: ${r.expectedAge}\nLeague date before: ${r.previousLeagueDate}\nLeague date after: ${r.currentLeagueDate}\nSeason before: ${r.previousSeason}\nSeason after: ${r.newSeason}\nPlayer status: ${r.beforeStatus} → ${r.afterStatus}\nAging touched: ${r.agingTouched}\nAging applications: ${r.agingApplications}\nReason validation failed: ${r.reasons.join('; ')}`));
 if(report.errors.some(e=>!e.issues?.length))console.log(report.errors);
 console.log('Report: '+output);
 process.exitCode=report.status==='completed'?0:1;
})().catch(e=>{console.error(e);process.exitCode=1});
