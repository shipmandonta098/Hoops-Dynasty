const fs=require('node:fs'),path=require('node:path');const {loadLeague}=require('./load-league.cjs');
(async()=>{
 const seasons=Number(process.argv[2]||1),seed=Number(process.argv[3]||2026),output=process.argv[4]||`dev/benchmark-${seasons}.json`,realm=loadLeague({seed});
 realm.setRandomSeed(seed);
 realm.run("const draft=makeDraft();draft.gmName='Benchmark GM';state=validateCareerData(buildSetupCareer(draft));");
 let lastProgress=0;const controller=new AbortController();process.once('SIGINT',()=>controller.abort());realm.context.options={seed,signal:controller.signal,onProgress:p=>{if(performance.now()-lastProgress>15000){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output+'.progress.json',JSON.stringify(p));lastProgress=performance.now();}},memory:()=>process.memoryUsage().heapUsed,yieldControl:()=>new Promise(resolve=>setImmediate(resolve))};
 const report=await realm.run('simulateMultipleSeasonsHeadless('+seasons+',options)');
 report.environment={node:process.version,teams:30,regularGamesPerTeam:82,rosterMinimum:14,rosterMaximum:15,memoryUnit:'bytes',memoryMetric:'Node heapUsed; peak sampled at safe boundaries',fixture:'fresh default league; existing engine and default rules',includesSetupTime:false,newCareerSetup:true};
 fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
 console.log('Report: '+output);if(report.errors.length)console.log(JSON.stringify(report.errors.map(e=>({phase:e.phase,season:e.season,day:e.day,error:e.error.split('\n')[0],issueCount:e.issues.length,firstIssues:e.issues.slice(0,5)})),null,2));
 process.exitCode=report.status==='completed'?0:1;
})().catch(e=>{console.error(e);process.exitCode=1});
