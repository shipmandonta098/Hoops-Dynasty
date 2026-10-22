const {spawn}=require('child_process'),fs=require('fs');
(async()=>{
 for(const [label,seed,variant]of [['phase11hold',103,'dev/phase9/hold-variant.cjs'],['phase11hq',102,'dev/phase11/hold-quick.cjs']]){
  if(fs.existsSync(`dev/balance-audit/${label}-nba-${seed}.json`))continue;
  await new Promise((resolve,reject)=>{const p=spawn(process.execPath,['--max-old-space-size=768','dev/audit-phase8-season.cjs','nba',String(seed),label],{env:{...process.env,HOOPS_VARIANT:variant},stdio:'inherit'});p.on('exit',(code,signal)=>code===0?resolve():reject(Error(`${label} ${seed}: code=${code}, signal=${signal}`)))});
 }
})().catch(e=>{console.error(e);process.exitCode=1});
