const {spawn}=require('child_process');
const jobs=[['phase11hold',105,'dev/phase9/hold-variant.cjs'],...[103,104,105].map(s=>['phase11hq',s,'dev/phase11/hold-quick.cjs'])];
Promise.all(jobs.map(([label,seed,variant])=>new Promise((resolve,reject)=>{
 const p=spawn(process.execPath,['dev/audit-phase8-season.cjs','nba',String(seed),label],{env:{...process.env,HOOPS_VARIANT:variant},stdio:'inherit'});p.on('exit',c=>c!==0?reject(Error(label+seed)):resolve());
}))).catch(e=>{console.error(e);process.exitCode=1});
